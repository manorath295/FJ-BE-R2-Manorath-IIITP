import { Router } from "express";
import * as chatbotController from "../controllers/chatbot.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// All chatbot routes require authentication
router.use(requireAuth);

// POST /api/chatbot/query - Send a chat query
router.post("/query", chatbotController.handleChatQuery);

// GET /api/chatbot/history/:conversationId - Get conversation history
router.get(
  "/history/:conversationId",
  chatbotController.getConversationHistory,
);

// DELETE /api/chatbot/history/:conversationId - Clear conversation history
router.delete(
  "/history/:conversationId",
  chatbotController.clearConversationHistory,
);

export default router;
