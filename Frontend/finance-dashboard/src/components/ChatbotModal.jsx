import { useState, useRef, useEffect } from "react";
import {
  sendChatQuery,
  clearConversationHistory,
} from "../services/chatbot.service";
import "./ChatbotModal.css";

const EXAMPLE_QUERIES = [
  "What did I spend last week?",
  "Show me my income this month",
  "How much did I spend on groceries?",
  "Am I over budget on any category?",
  "What are my top 3 spending categories?",
];

export default function ChatbotModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (query = inputValue) => {
    if (!query.trim() || isLoading) return;

    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await sendChatQuery(query, conversationId);

      if (response.success) {
        const aiMessage = {
          role: "assistant",
          content: response.data.response,
          toolsUsed: response.data.toolsUsed || [],
        };
        setMessages((prev) => [...prev, aiMessage]);
        setConversationId(response.data.conversationId);
      } else {
        throw new Error(response.message || "Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (conversationId) {
      try {
        await clearConversationHistory(conversationId);
      } catch (error) {
        console.error("Error clearing history:", error);
      }
    }
    setMessages([]);
    setConversationId(null);
  };

  const handleExampleClick = (query) => {
    handleSendMessage(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <div className="chatbot-icon">💬</div>
            <div>
              <h3>Financial Assistant</h3>
              <p>Ask me about your income and expenses</p>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button
              className="chatbot-clear-btn"
              onClick={handleClearHistory}
              title="Clear conversation"
            >
              🗑️
            </button>
            <button className="chatbot-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.length === 0 && (
            <div className="chatbot-welcome">
              <div className="chatbot-welcome-icon">🤖</div>
              <h4>Welcome! How can I help you today?</h4>
              <p>
                Try asking me about your transactions, budgets, or spending
                patterns.
              </p>

              <div className="chatbot-examples">
                <p className="chatbot-examples-title">Example questions:</p>
                {EXAMPLE_QUERIES.map((query, index) => (
                  <button
                    key={index}
                    className="chatbot-example-btn"
                    onClick={() => handleExampleClick(query)}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`chatbot-message ${message.role === "user" ? "user" : "assistant"} ${
                message.isError ? "error" : ""
              }`}
            >
              <div className="chatbot-message-avatar">
                {message.role === "user" ? "👤" : "🤖"}
              </div>
              <div className="chatbot-message-content">
                <p>{message.content}</p>
                {message.toolsUsed && message.toolsUsed.length > 0 && (
                  <div className="chatbot-tools-used">
                    <small>Tools used: {message.toolsUsed.join(", ")}</small>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chatbot-message assistant">
              <div className="chatbot-message-avatar">🤖</div>
              <div className="chatbot-message-content">
                <div className="chatbot-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input-container">
          <textarea
            className="chatbot-input"
            placeholder="Ask me anything about your finances..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
            disabled={isLoading}
          />
          <button
            className="chatbot-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
          >
            <span>➤</span>
          </button>
        </div>
      </div>
    </div>
  );
}
