// packages/backend/src/socket.ts
import { FastifyInstance } from "fastify";
import { Server as SocketServer, Socket } from "socket.io";
import prisma from "./lib/prisma.js";
import { generateResponse } from "./services/llm.service.js";

// We'll use this to associate socket with conversation
interface ExtendedSocket extends Socket {
  conversationId?: string;
}

export function setupSocket(fastify: FastifyInstance) {
  // Attach Socket.IO to Fastify server
  const io = new SocketServer(fastify.server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"], // allow frontend origins
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: ExtendedSocket) => {
    console.log(`New client connected: ${socket.id}`);

    // Client joins a conversation room
    socket.on("join_conversation", (conversationId: string) => {
      if (!conversationId) return;

      socket.conversationId = conversationId;
      socket.join(`conversation:${conversationId}`);

      console.log(`User ${socket.id} joined conversation ${conversationId}`);
      io.to(`conversation:${conversationId}`).emit("user_joined", {
        userId: socket.id,
      });
    });

    // Handle new message from client
    socket.on(
      "send_message",
      async (data: { content: string; conversationId: string }) => {
        const { content, conversationId } = data;

        if (!conversationId || !content) return;

        try {
          // Save user message
          const userMessage = await prisma.message.create({
            data: {
              conversationId,
              content,
              senderType: "user",
            },
          });

          // Broadcast to everyone in the room (including sender)
          io.to(`conversation:${conversationId}`).emit("new_message", {
            ...userMessage,
            senderType: "user",
          });

          // Simulate typing...
          io.to(`conversation:${conversationId}`).emit("typing", {
            isTyping: true,
          });

          // Generate AI response (with memory!)
          const aiResponse = await generateResponse(
            content,
            conversationId,
            10
          );

          // Small delay to simulate thinking
          await new Promise((resolve) => setTimeout(resolve, 800));

          // Stop typing
          io.to(`conversation:${conversationId}`).emit("typing", {
            isTyping: false,
          });

          // Save & broadcast AI message
          const assistantMessage = await prisma.message.create({
            data: {
              conversationId,
              content: aiResponse,
              senderType: "assistant",
            },
          });

          io.to(`conversation:${conversationId}`).emit("new_message", {
            ...assistantMessage,
            senderType: "assistant",
          });
        } catch (error) {
          console.error("Socket message error:", error);
          socket.emit("error", { message: "Failed to process message" });
        }
      }
    );

    // Typing indicator from user
    socket.on("typing", () => {
      if (socket.conversationId) {
        socket
          .to(`conversation:${socket.conversationId}`)
          .emit("typing", { isTyping: true, userId: socket.id });
      }
    });

    socket.on("stop_typing", () => {
      if (socket.conversationId) {
        socket
          .to(`conversation:${socket.conversationId}`)
          .emit("typing", { isTyping: false, userId: socket.id });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (socket.conversationId) {
        io.to(`conversation:${socket.conversationId}`).emit("user_left", {
          userId: socket.id,
        });
      }
    });
  });

  // Make io available in Fastify if needed later
  fastify.decorate("io", io);

  return io;
}
