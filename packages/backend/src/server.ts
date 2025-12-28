// packages/backend/src/server.ts
import { PrismaClient } from "@prisma/client";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server as SocketServer } from "socket.io";

import { config } from "./config/env.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { generateResponse } from "./services/llm.service.js";

const prisma = new PrismaClient({
  log: config.isDev ? ["query", "info", "warn", "error"] : ["error"],
});

const server = Fastify({
  logger: config.isDev,
});

server.setErrorHandler((error, request, reply) => {
  server.log.error(error);

  reply.status(500).send({
    status: "error",
    message: config.isDev && error instanceof Error ? error.message : "Internal Server Error",
    ...(config.isDev && error instanceof Error && { stack: error.stack }),
  });
});

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
  } catch (error: any) {
    server.log.error({ error }, "Database connection failed");
    return {
      status: "error",
      database: "connection failed",
      message: "Could not connect to database",
      error: config.isDev ? String(error) : undefined,
    };
  }
});

server.register(
  async (fastify) => {
    await fastify.register(chatRoutes);
  },
  { prefix: "/api/chat" }
);

const io = new SocketServer(server.server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io/",
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on("connection", (socket) => {
  socket.on("join_conversation", (conversationId: string) => {
    if (!conversationId || typeof conversationId !== "string") {
      socket.emit("error", { message: "Invalid or missing conversation ID" });
      return;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      socket.emit("error", { message: "Conversation ID must be a valid UUID" });
      return;
    }

    socket.join(`conversation:${conversationId}`);

    io.to(`conversation:${conversationId}`).emit("user_joined", {
      userId: socket.id,
      message: "Someone joined the conversation",
    });
  });

  socket.on("send_message", async (data: any) => {
    let content = data?.content;
    let conversationId = data?.conversationId;

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
      return;
    }

    if (!conversationId) {
      socket.emit("error", { message: "Missing conversationId" });
      return;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      socket.emit("error", {
        message: "Invalid conversationId format (must be UUID)",
      });
      return;
    }

    try {
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
    } catch (error) {
      console.error("[Socket.IO] Error:", error);
      socket.emit("error", {
        message: "Server error processing message",
        details: error instanceof Error ? error.message : "Unknown",
      });
    }
  });

  socket.on("typing", () => {
    const rooms = Array.from(socket.rooms);
    const conversationRoom = rooms.find((r) => r.startsWith("conversation:"));
    if (conversationRoom) {
      socket
        .to(conversationRoom)
        .emit("typing", { isTyping: true, userId: socket.id });
    }
  });

  socket.on("disconnect", () => {});
});

server.decorate("io", io);

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

const start = async () => {
  try {
    await server.register(cors, {
      origin: true,
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
