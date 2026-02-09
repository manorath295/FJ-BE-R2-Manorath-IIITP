import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { categoriesAPI } from "../services/api";

export default function AddCategoryModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "EXPENSE",
    color: "#00F0FF",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await categoriesAPI.create(formData);
      onSuccess();
      onClose();
      setFormData({ name: "", type: "EXPENSE", color: "#00F0FF" });
    } catch (err) {
      console.error("Error creating category:", err);
      setError(err.response?.data?.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
            Add Category
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-[var(--error)] p-3 rounded mb-4">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Category Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
              placeholder="e.g., Groceries, Salary"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-16 h-10 rounded border border-[var(--border-primary)] cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none mono"
                placeholder="#00F0FF"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-bold py-2 px-4 rounded uppercase tracking-wider hover:border-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-bold py-2 px-4 rounded uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
