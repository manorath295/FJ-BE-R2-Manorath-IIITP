import { useState, useEffect } from "react";
import { settingsAPI } from "../services/api";
import {
  X,
  Mail,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
} from "lucide-react";
import { signOut } from "../lib/auth-client";
import { useNavigate } from "react-router-dom";
import "./SettingsModal.css";

export default function SettingsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log("Fetching settings...");
      const response = await settingsAPI.get();
      console.log("Settings response:", response);

      // The data is in response.data, not response.data.data
      const data = response.data?.data || response.data;
      console.log("Parsed data:", data);

      if (data && data.notificationEmail !== undefined) {
        setEmail(data.notificationEmail || data.email || "");
        setOriginalEmail(data.notificationEmail || data.email || "");
        console.log("Settings loaded successfully");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Settings fetch error:", error);
      console.error("Error response:", error.response);
      setMessage({
        type: "error",
        text:
          error.response?.status === 401
            ? "Please log in again to access settings."
            : "Failed to load settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setSaving(true);
      setMessage(null);
      await settingsAPI.updateEmail(email);
      setOriginalEmail(email);
      setMessage({
        type: "success",
        text: "Notification email updated successfully!",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update email.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!email) return;

    try {
      setSendingTest(true);
      setMessage(null);
      await settingsAPI.sendTestEmail(email);
      setMessage({
        type: "success",
        text: `Test email sent to ${email}! Check your inbox.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to send test email.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
      onClose();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Notifications Settings</h2>
          <button onClick={onClose} className="settings-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          {loading ? (
            <div className="settings-loading">
              <Loader2 className="animate-spin" size={32} />
              <p>Loading settings...</p>
            </div>
          ) : (
            <>
              {message && (
                <div className={`settings-message ${message.type}`}>
                  {message.type === "success" ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="settings-section">
                <div className="settings-section-header">
                  <Mail size={20} className="text-[var(--accent-purple)]" />
                  <h3>Email Notifications</h3>
                </div>

                <p className="settings-description">
                  Receive alerts when you exceed your budget limits.
                </p>

                <form onSubmit={handleSave} className="settings-form">
                  <label htmlFor="notification-email">Send alerts to:</label>
                  <div className="settings-input-group">
                    <input
                      id="notification-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="settings-input"
                    />
                  </div>

                  <div className="settings-actions flex justify-between items-center w-full">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-red-500 hover:text-red-700 font-bold flex items-center gap-2 transition-colors px-4 py-2 hover:bg-red-50 rounded"
                    >
                      <LogOut size={18} />
                      Log Out
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSendTest}
                        disabled={sendingTest || !email}
                        className="settings-btn settings-btn-secondary"
                      >
                        {sendingTest ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Test
                          </>
                        )}
                      </button>

                      <button
                        type="submit"
                        disabled={saving || !email || email === originalEmail}
                        className="settings-btn settings-btn-primary"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
