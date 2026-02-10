import { Request, Response } from "express";
import * as chatbotService from "../services/chatbot.service.js";
import { successResponse } from "../utils/response.util.js";


const conversations = new Map<
  string,
  Array<{ role: string; content: string }>
>();

export async function handleChatQuery(req: Request, res: Response) {
  const userId = req.userId!;
  const { query, conversationId } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({
      success: false,
      message: "Query is required and must be a string",
    });
  }

  try {
    // Get or create conversation history
    const convId = conversationId || `conv_${userId}_${Date.now()}`;
    const history = conversations.get(convId) || [];

    console.log("💬 [CHATBOT CONTROLLER] Processing query:", query);
    console.log("💬 [CHATBOT CONTROLLER] Conversation ID:", convId);
    console.log("💬 [CHATBOT CONTROLLER] History length:", history.length);

    // Process query
    const result = await chatbotService.processChatQuery(
      userId,
      query,
      history,
    );

    // Update conversation history
    history.push({ role: "user", content: query });
    history.push({ role: "assistant", content: result.response });

    // Keep only last 10 messages (5 exchanges) to avoid context overflow
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    conversations.set(convId, history);

    res.json(
      successResponse(
        {
          response: result.response,
          conversationId: convId,
          toolsUsed: result.toolsUsed,
        },
        "Query processed successfully",
      ),
    );
  } catch (error) {
    console.error("❌ [CHATBOT CONTROLLER] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process chat query",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function clearConversationHistory(req: Request, res: Response) {
  const conversationId = req.params.conversationId as string;

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      message: "Conversation ID is required",
    });
  }

  conversations.delete(conversationId);

  res.json(
    successResponse(
      { conversationId },
      "Conversation history cleared successfully",
    ),
  );
}

export async function getConversationHistory(req: Request, res: Response) {
  const conversationId = req.params.conversationId as string;

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      message: "Conversation ID is required",
    });
  }

  const history = conversations.get(conversationId) || [];

  res.json(
    successResponse({
      conversationId,
      history,
    }),
  );
}
