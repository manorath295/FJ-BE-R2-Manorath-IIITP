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
    setError("");
    setLoading(true);

    try {
      const formDataInstance = new FormData();
      formDataInstance.append("amount", parseFloat(formData.amount));
      formDataInstance.append("currency", formData.currency);
      formDataInstance.append("type", formData.type);
      formDataInstance.append("categoryId", formData.categoryId);
      formDataInstance.append("description", formData.description);
      formDataInstance.append("date", new Date(formData.date).toISOString());
      if (formData.isRecurring) {
        formDataInstance.append("isRecurring", formData.isRecurring);
        formDataInstance.append(
          "recurringFrequency",
          formData.recurringFrequency,
        );
      }
      if (formData.receipt) {
        formDataInstance.append("receipt", formData.receipt);
      }

      await transactionsAPI.create(formDataInstance);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        amount: "",
        currency: "USD",
        type: "EXPENSE",
        categoryId: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        isRecurring: false,
        recurringFrequency: "MONTHLY",
        receipt: null,
      });
    } catch (err) {
      console.error("Error adding transaction:", err);
      setError(err.response?.data?.error || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type,
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] border-2 border-[var(--accent-cyan)]/30 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-green)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Add Transaction
                </h2>
                <p className="text-xs text-white/70">
                  Record a new income or expense
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Row */}
            <div className="flex gap-4">
              {/* Currency */}
              <div className="w-24">
                <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Curr
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-2 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
                >
                  {["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CNY"].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Amount */}
              <div className="flex-1">
                <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="w-1/3">
                <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
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
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Category
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    categoryId: e.target.value,
                  })
                }
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
              >
                <option value="">Select Category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {filteredCategories.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  No {formData.type.toLowerCase()} categories yet
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
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
                placeholder="e.g. Monthly Rent"
              />
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

            {/* Receipt Upload */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Receipt (Optional)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    receipt: e.target.files[0],
                  })
                }
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-cyan)] file:text-[var(--bg-primary)] hover:file:bg-opacity-80"
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
    </div>
  );
}
