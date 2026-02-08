import api from "./api";

/**
 * Send a chat query to the AI chatbot
 */
export const sendChatQuery = async (query, conversationId = null) => {
  try {
    const response = await api.post("/chatbot/query", {
      query,
      conversationId,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending chat query:", error);
    throw error;
  }
};

/**
 * Get conversation history
 */
export const getConversationHistory = async (conversationId) => {
  try {
    const response = await api.get(`/chatbot/history/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting conversation history:", error);
    throw error;
  }
};

/**
 * Clear conversation history
 */
export const clearConversationHistory = async (conversationId) => {
  try {
    const response = await api.delete(`/chatbot/history/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error("Error clearing conversation history:", error);
    throw error;
  }
};
