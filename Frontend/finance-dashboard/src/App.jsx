import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Reports from "./components/Reports";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatbotModal from "./components/ChatbotModal";
import "./index.css";
import "./App.css";

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Floating Chatbot Button */}
      <button
        className="chatbot-fab"
        onClick={() => setIsChatbotOpen(true)}
        title="Open AI Financial Assistant"
      ></button>

      {/* Chatbot Modal */}
      <ChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </BrowserRouter>
  );
}

export default App;
