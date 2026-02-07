import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../lib/auth-client";
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Navigate to dashboard after successful signup
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: "var(--accent-cyan)" }}
          >
            FINANCE TRACKER
          </h1>
          <p className="text-[var(--text-secondary)] mono">
            Create your account
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-8 rounded-lg">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-6 h-6 text-[var(--accent-cyan)]" />
            <h2 className="text-xl font-bold uppercase tracking-wider">
              Sign Up
            </h2>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-[var(--error)] p-4 rounded mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-10 py-3 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-10 py-3 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-10 py-3 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Minimum 8 characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-bold py-3 px-4 rounded uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[var(--accent-cyan)] hover:underline font-bold"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
