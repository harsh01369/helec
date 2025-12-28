// packages/backend/src/routes/chat.routes.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma.js"; // ← shared instance
import { generateResponse } from "../services/llm.service.js";

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.post("/message", async (request, reply) => {
    try {
      // 1. Validate input with detailed error messages
      const schema = z.object({
        content: z
          .string()
          .min(1, "Message cannot be empty")
          .max(2000, "Message is too long (maximum 2000 characters)")
          .trim(),
        conversationId: z
          .string()
          .uuid("Invalid conversation ID format")
          .optional(),
      });

      const { content, conversationId } = schema.parse(request.body);

      let targetConversationId = conversationId;

      // 2. Create new conversation if none provided
      if (!targetConversationId) {
        const newConv = await prisma.conversation.create({
          data: {}, // ← can add title/userId/metadata later
        });
        targetConversationId = newConv.id;
      }

      // 3. Save user message
      const userMessage = await prisma.message.create({
        data: {
          conversationId: targetConversationId,
          content,
          senderType: "user",
        },
        // include: { conversation: true },  // optional - you already have it
      });

      // 4. Generate AI response (real LLM call)
      const aiResponse = await generateResponse(
        content,
        targetConversationId, // ← pass conversationId
        10 // max 10 previous messages as context
      );

      if (!aiResponse || aiResponse.trim().length < 5) {
        // ← improved empty check
        throw new Error("Invalid or empty response from AI");
      }

      // 5. Save assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          conversationId: targetConversationId,
          content: aiResponse,
          senderType: "assistant",
        },
      });

      // 6. Return clean, consistent response
      return reply.status(201).send({
        status: "success",
        conversationId: targetConversationId,
        messages: [userMessage, assistantMessage], // always array - easier for frontend
      });
    } catch (error: any) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        return reply.status(400).send({
          status: "error",
          message: firstError.message,
          field: firstError.path[0],
        });
      }

      fastify.log.error("Chat message processing failed:", error);

      return reply.status(500).send({
        status: "error",
        message: "Failed to process your message. Please try again.",
        ...(process.env.NODE_ENV === "development" && {
          errorDetails: String(error),
        }),
      });
    }
  });

  // Your bonus GET endpoint is already perfect — no change needed
  fastify.get("/conversation/:id", async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return reply
        .status(404)
        .send({ status: "error", message: "Conversation not found" });
    }

    return {
      status: "success",
      data: conversation,
    };
  });
}
