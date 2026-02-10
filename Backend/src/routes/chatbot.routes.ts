import { Router } from "express";
import * as chatbotController from "../controllers/chatbot.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.use(requireAuth);
router.post("/query", chatbotController.handleChatQuery);
router.get(
  "/history/:conversationId",
  chatbotController.getConversationHistory,
);
router.delete(
  "/history/:conversationId",
  chatbotController.clearConversationHistory,
);

export default router;
