// packages/backend/src/server.ts
import { PrismaClient } from "@prisma/client";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server as SocketServer } from "socket.io";

import { config } from "./config/env.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { generateResponse } from "./services/llm.service.js"; // your AI function

// Initialize Prisma client (shared instance)
const prisma = new PrismaClient({
  log: config.isDev ? ["query", "info", "warn", "error"] : ["error"],
});

// Create Fastify server instance
const server = Fastify({
  logger: config.isDev,
});

// Global error handler
server.setErrorHandler((error, request, reply) => {
  server.log.error(error);

  reply.status(500).send({
    status: "error",
    message: config.isDev ? error.message : "Internal Server Error",
    ...(config.isDev && { stack: error.stack }),
  });
});

// ── Health check endpoints ──
server.get("/health", async () => ({
  status: "ok",
  environment: config.nodeEnv,
  timestamp: new Date().toISOString(),
  message: "HELEC backend is alive! 🚀",
}));

server.get("/", async () => ({
  app: "HELEC",
  version: "0.1.0-dev",
  description: "Helpful E-commerce Live Engine for Customers",
  endpoints: {
    health: "/health",
    dbHealth: "/health/db",
    chat: {
      createMessage: "POST /api/chat/message",
      getConversation: "GET /api/chat/conversation/:id",
    },
  },
}));

server.get("/health/db", async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
      message: "Database connection successful",
    };
  } catch (error) {
    server.log.error("Database connection failed:", error);
    return {
      status: "error",
      database: "connection failed",
      message: "Could not connect to database",
      error: config.isDev ? String(error) : undefined,
    };
  }
});

// ── Register REST chat routes ──
server.register(
  async (fastify) => {
    await fastify.register(chatRoutes);
  },
  { prefix: "/api/chat" }
);

// ── Attach Socket.IO ──
const io = new SocketServer(server.server, {
  cors: {
    origin: "*", // ← Development only! Change to specific domains later
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io/",
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Socket.IO real-time logic
io.on("connection", (socket) => {
  console.log(`[Socket.IO] New client connected: ${socket.id}`);

  // 1. Client joins a conversation room
  socket.on("join_conversation", (conversationId: string) => {
    if (!conversationId || typeof conversationId !== "string") {
      socket.emit("error", { message: "Invalid or missing conversation ID" });
      return;
    }

    // Basic UUID format check (optional but helpful)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      socket.emit("error", { message: "Conversation ID must be a valid UUID" });
      return;
    }

    socket.join(`conversation:${conversationId}`);
    console.log(
      `[Socket.IO] Client ${socket.id} joined conversation ${conversationId}`
    );

    // Optional: Notify room
    io.to(`conversation:${conversationId}`).emit("user_joined", {
      userId: socket.id,
      message: "Someone joined the conversation",
    });
  });

  // 2. Handle real-time message sending
  socket.on("send_message", async (data: any) => {
    // Log the EXACT raw data received (this will show us the problem)
    console.log(
      "[DEBUG] Raw send_message data received:",
      JSON.stringify(data, null, 2)
    );

    // Extract safely (handle common tester quirks)
    let content = data?.content;
    let conversationId = data?.conversationId;

    // If tester sends array or string — try to parse
    if (Array.isArray(data) && data.length > 0) {
      content = data[0]?.content;
      conversationId = data[0]?.conversationId;
    } else if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        content = parsed.content;
        conversationId = parsed.conversationId;
      } catch {}
    }

    content = typeof content === "string" ? content.trim() : "";
    conversationId =
      typeof conversationId === "string" ? conversationId.trim() : "";

    if (!content) {
      socket.emit("error", { message: "Missing or empty content" });
      console.log("[DEBUG] Rejected: missing/empty content after parsing");
      return;
    }

    if (!conversationId) {
      socket.emit("error", { message: "Missing conversationId" });
      console.log("[DEBUG] Rejected: missing conversationId");
      return;
    }

    // UUID check
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      socket.emit("error", {
        message: "Invalid conversationId format (must be UUID)",
      });
      console.log("[DEBUG] Rejected: invalid UUID");
      return;
    }

    try {
      console.log(
        "[DEBUG] Processing valid message for conversation:",
        conversationId
      );

      const userMessage = await prisma.message.create({
        data: {
          conversationId,
          content,
          senderType: "user",
        },
      });

      io.to(`conversation:${conversationId}`).emit("new_message", {
        id: userMessage.id,
        conversationId,
        content: userMessage.content,
        senderType: "user",
        createdAt: userMessage.createdAt.toISOString(),
      });

      io.to(`conversation:${conversationId}`).emit("typing", {
        isTyping: true,
      });

      const aiResponse = await generateResponse(content, conversationId);

      io.to(`conversation:${conversationId}`).emit("typing", {
        isTyping: false,
      });

      const assistantMessage = await prisma.message.create({
        data: {
          conversationId,
          content: aiResponse,
          senderType: "assistant",
        },
      });

      io.to(`conversation:${conversationId}`).emit("new_message", {
        id: assistantMessage.id,
        conversationId,
        content: assistantMessage.content,
        senderType: "assistant",
        createdAt: assistantMessage.createdAt.toISOString(),
      });

      console.log("[DEBUG] Message processed successfully");
    } catch (error) {
      console.error("[Socket.IO] Error:", error);
      socket.emit("error", {
        message: "Server error processing message",
        details: error instanceof Error ? error.message : "Unknown",
      });
    }
  });

  // 3. User typing indicator
  socket.on("typing", () => {
    const rooms = Array.from(socket.rooms);
    const conversationRoom = rooms.find((r) => r.startsWith("conversation:"));
    if (conversationRoom) {
      socket
        .to(conversationRoom)
        .emit("typing", { isTyping: true, userId: socket.id });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Make io available if needed elsewhere
server.decorate("io", io);

// ── Graceful shutdown ──
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  try {
    await prisma.$disconnect();
    console.log("Prisma disconnected");

    await server.close();
    console.log("Server closed");

    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Start the server
const start = async () => {
  try {
    // Register CORS plugin before starting the server
    await server.register(cors, {
      origin: true, // Allow all origins in development
      credentials: true,
    });

    await server.listen({
      port: config.port,
      host: "0.0.0.0",
    });

    console.log(`Server listening on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log("\nAvailable endpoints:");
    console.log("  GET  http://localhost:3000/");
    console.log("  GET  http://localhost:3000/health");
    console.log("  GET  http://localhost:3000/health/db");
    console.log("  POST http://localhost:3000/api/chat/message");
    console.log("  GET  http://localhost:3000/api/chat/conversation/:id");
    console.log("\nSocket.IO ready at ws://localhost:3000/socket.io/");
    console.log("Ready to accept requests! 🚀");
  } catch (err) {
    server.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

start();
