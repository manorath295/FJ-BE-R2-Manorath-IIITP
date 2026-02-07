import { useState, useEffect } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { transactionsAPI, categoriesAPI } from "../services/api";

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    type: "EXPENSE",
    description: "",
    date: new Date().toISOString().split("T")[0],
    currency: "USD",
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
      setCategories(response.data.data || []);
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
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
        categoryId: formData.categoryId || undefined,
      };

      await transactionsAPI.create(payload);
      onSuccess();
      onClose();
      setFormData({
        categoryId: "",
        amount: "",
        type: "EXPENSE",
        description: "",
        date: new Date().toISOString().split("T")[0],
        currency: "USD",
      });
    } catch (err) {
      console.error("Error creating transaction:", err);
      setError(err.response?.data?.message || "Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  // Filter categories by type
  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
            Add Transaction
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
          {/* Type */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: "INCOME", categoryId: "" })
                }
                className={`py-2 px-4 rounded font-bold uppercase tracking-wider transition-all ${
                  formData.type === "INCOME"
                    ? "bg-[var(--success)] text-[var(--bg-primary)]"
                    : "bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)]"
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: "EXPENSE", categoryId: "" })
                }
                className={`py-2 px-4 rounded font-bold uppercase tracking-wider transition-all ${
                  formData.type === "EXPENSE"
                    ? "bg-[var(--error)] text-[var(--bg-primary)]"
                    : "bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)]"
                }`}
              >
                Expense
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Amount
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

          {/* Description */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Description
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
              placeholder="e.g., Monthly salary, Grocery shopping"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Category (Optional)
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
            >
              <option value="">No Category</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {filteredCategories.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                No {formData.type.toLowerCase()} categories yet
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
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
              disabled={loading}
              className="flex-1 bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-bold py-2 px-4 rounded uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
