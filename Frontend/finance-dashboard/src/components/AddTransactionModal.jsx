import { useState, useEffect, useRef } from "react";
import { X, Plus, Loader2, Scan } from "lucide-react";
import { transactionsAPI, categoriesAPI } from "../services/api";
import AddCategoryModal from "./AddCategoryModal";

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
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const scanInputRef = useRef(null);

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

  const handleScanFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("receipt", file);

      const response = await transactionsAPI.analyze(formData);
      const data = response.data.data;

      console.log("Analyzed Receipt:", data);

      // Auto-fill form
      setFormData((prev) => ({
        ...prev,
        amount: data.amount || prev.amount,
        date: data.date || prev.date,
        description: data.description || data.merchantName || prev.description,
        currency: data.currency || prev.currency,
        receipt: file, // Attach the file so it gets uploaded with the transaction
      }));

      // Try to match category
      if (data.category && categories.length > 0) {
        // Simple case-insensitive match
        const matchedCategory = categories.find(
          (c) => c.name.toLowerCase() === data.category.toLowerCase(),
        );
        if (matchedCategory) {
          setFormData((prev) => ({ ...prev, categoryId: matchedCategory.id }));
        }
      }
    } catch (err) {
      console.error("Error scanning receipt:", err);
      setError("Failed to analyze receipt. Please enter details manually.");
    } finally {
      setScanning(false);
      // Clear input so same file can be selected again if needed
      if (scanInputRef.current) scanInputRef.current.value = "";
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

          {/* Scan Receipt Button */}
          <div className="mb-6">
            <input
              type="file"
              ref={scanInputRef}
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleScanFileChange}
            />
            <button
              type="button"
              onClick={() => scanInputRef.current?.click()}
              disabled={scanning}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Receipt...
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  ✨ Scan Receipt to Auto-Fill
                </>
              )}
            </button>
            <p className="text-center text-xs text-[var(--text-muted)] mt-2">
              Upload a receipt to automatically fill amount, date, and
              description
            </p>
          </div>

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
              <div className="flex gap-2">
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryId: e.target.value,
                    })
                  }
                  className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-3 hover:bg-[var(--accent-cyan)] hover:text-white transition-colors"
                  title="Create New Category"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
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

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          fetchCategories();
          setIsCategoryModalOpen(false);
        }}
      />
    </div>
  );
}
