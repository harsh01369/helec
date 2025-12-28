// packages/backend/src/routes/chat.routes.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { generateResponse } from "../services/llm.service.js";

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.post("/message", async (request, reply) => {
    try {
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

      if (!targetConversationId) {
        const newConv = await prisma.conversation.create({
          data: {},
        });
        targetConversationId = newConv.id;
      }

      const userMessage = await prisma.message.create({
        data: {
          conversationId: targetConversationId,
          content,
          senderType: "user",
        },
      });

      const aiResponse = await generateResponse(
        content,
        targetConversationId,
        10
      );

      if (!aiResponse || aiResponse.trim().length < 5) {
        throw new Error("Invalid or empty response from AI");
      }

      const assistantMessage = await prisma.message.create({
        data: {
          conversationId: targetConversationId,
          content: aiResponse,
          senderType: "assistant",
        },
      });

      return reply.status(201).send({
        status: "success",
        conversationId: targetConversationId,
        messages: [userMessage, assistantMessage],
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        return reply.status(400).send({
          status: "error",
          message: firstError.message,
          field: firstError.path[0],
        });
      }

      fastify.log.error({ error }, "Chat message processing failed");

      return reply.status(500).send({
        status: "error",
        message: "Failed to process your message. Please try again.",
        ...(process.env.NODE_ENV === "development" && {
          errorDetails: String(error),
        }),
      });
    }
  });

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
