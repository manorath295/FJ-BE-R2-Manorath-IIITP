import { useState, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { budgetsAPI, categoriesAPI } from "../services/api";

export default function AddBudgetModal({ isOpen, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    period: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      // Only show expense categories for budgets
      const expenseCategories = (response.data.data || []).filter(
        (cat) => cat.type === "EXPENSE",
      );
      setCategories(expenseCategories);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        period: formData.period,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
      };

      await budgetsAPI.create(payload);
      onSuccess();
      onClose();
      setFormData({
        categoryId: "",
        amount: "",
        period: "MONTHLY",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
    } catch (err) {
      console.error("Error creating budget:", err);
      setError(err.response?.data?.message || "Failed to create budget");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
            Add Budget
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
          {/* Category */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Category
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                No expense categories yet. Create one first!
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Budget Limit
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none mono text-lg"
              placeholder="0.00"
            />
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Period
            </label>
            <select
              value={formData.period}
              onChange={(e) =>
                setFormData({ ...formData, period: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Start Date
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
            />
          </div>

          {/* End Date (Optional) */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
            />
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
              disabled={loading || categories.length === 0}
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
