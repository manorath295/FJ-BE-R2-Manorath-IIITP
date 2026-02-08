import { useState } from "react";
import { X, Upload, Loader2, Check, AlertCircle } from "lucide-react";
import { importAPI, categoriesAPI } from "../services/api";

export default function BankImportModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState("upload"); // upload, processing, review
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editedTransactions, setEditedTransactions] = useState([]);
  const [creatingCategoryFor, setCreatingCategoryFor] = useState(null); // {index, type}
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    setStep("processing");

    try {
      // Fetch categories for dropdown
      const catResponse = await categoriesAPI.getAll();
      setCategories(catResponse.data.data || []);

      // Preview import
      const response = await importAPI.preview(file);
      const data = response.data.data;

      setPreview(data);
      setEditedTransactions(
        data.transactions.map((t) => ({
          ...t,
          categoryId: t.suggestedCategoryId || "",
        })),
      );
      setStep("review");
    } catch (err) {
      console.error("Import error:", err);
      setError(err.response?.data?.error || "Failed to process file");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (index, categoryId) => {
    if (categoryId === "CREATE_NEW") {
      // Show inline category creation
      setCreatingCategoryFor({ index, type: editedTransactions[index].type });
      setNewCategoryName("");
      return;
    }

    const updated = [...editedTransactions];
    updated[index].categoryId = categoryId;
    setEditedTransactions(updated);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !creatingCategoryFor) return;

    try {
      const response = await categoriesAPI.create({
        name: newCategoryName.trim(),
        type: creatingCategoryFor.type,
      });

      const newCategory = response.data.data;

      // Add to categories list
      setCategories([...categories, newCategory]);

      // Assign to transaction
      const updated = [...editedTransactions];
      updated[creatingCategoryFor.index].categoryId = newCategory.id;
      setEditedTransactions(updated);

      // Reset
      setCreatingCategoryFor(null);
      setNewCategoryName("");
    } catch (err) {
      console.error("Create category error:", err);
      setError(err.response?.data?.error || "Failed to create category");
    }
  };

  const handleDescriptionChange = (index, description) => {
    const updated = [...editedTransactions];
    updated[index].description = description;
    setEditedTransactions(updated);
  };

  const handleDateChange = (index, date) => {
    const updated = [...editedTransactions];
    updated[index].date = date;
    setEditedTransactions(updated);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      const transactionsToImport = editedTransactions
        .filter((t) => !t.isDuplicate) // Skip duplicates
        .map((t) => ({
          date: new Date(t.date).toISOString(),
          description: t.description,
          amount: t.amount,
          type: t.type,
          categoryId: t.categoryId || undefined,
        }));

      await importAPI.confirm(transactionsToImport);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Confirm error:", err);
      setError(err.response?.data?.error || "Failed to import transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setEditedTransactions([]);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] rounded-lg w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <X className="w-6 h-6" />
        </button>

        <h2
          className="text-2xl font-bold mb-6"
          style={{ color: "var(--accent-cyan)" }}
        >
          🤖 AI BANK STATEMENT IMPORT
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[var(--border-primary)] rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--accent-cyan)]" />
              <p className="text-[var(--text-primary)] mb-2">
                Upload your bank statement
              </p>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Supports PDF and CSV files (max 10MB)
              </p>
              <input
                type="file"
                accept=".pdf,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-[var(--accent-cyan)] text-[var(--bg-primary)] px-6 py-2 rounded font-bold cursor-pointer hover:opacity-80 transition-opacity"
              >
                Choose File
              </label>
              {file && (
                <p className="text-sm text-[var(--text-secondary)] mt-4">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-bold py-3 px-4 rounded uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Process with AI
            </button>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[var(--accent-cyan)] animate-spin" />
            <p className="text-[var(--text-primary)] text-lg mb-2">
              AI is analyzing your statement...
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Extracting transactions and categorizing
            </p>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && preview && (
          <div className="space-y-4">
            <div className="bg-[var(--bg-tertiary)] p-4 rounded border border-[var(--border-primary)]">
              <h3 className="font-bold text-[var(--text-primary)] mb-2">
                Import Summary
              </h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[var(--text-muted)]">Total</p>
                  <p className="text-[var(--text-primary)] font-bold">
                    {preview.summary.total}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)]">Categorized</p>
                  <p className="text-green-500 font-bold">
                    {preview.summary.categorized}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)]">Uncategorized</p>
                  <p className="text-yellow-500 font-bold">
                    {preview.summary.uncategorized}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)]">Duplicates</p>
                  <p className="text-red-500 font-bold">
                    {preview.summary.duplicates}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500 text-blue-400 p-3 rounded mb-4 text-sm">
              <p className="font-bold mb-1">💡 Review & Edit Transactions</p>
              <p>
                • <span className="text-green-400">Green amounts (+)</span> =
                Income | <span className="text-red-400">Red amounts (-)</span> =
                Expenses
              </p>
              <p>
                • Click any field (date, description, category) to edit before
                importing
              </p>
              <p>• Transactions marked as duplicates will be skipped</p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-[var(--text-secondary)]">
                      Date
                    </th>
                    <th className="p-2 text-left text-[var(--text-secondary)]">
                      Description
                    </th>
                    <th className="p-2 text-right text-[var(--text-secondary)]">
                      Amount
                    </th>
                    <th className="p-2 text-left text-[var(--text-secondary)]">
                      Category
                    </th>
                    <th className="p-2 text-center text-[var(--text-secondary)]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {editedTransactions.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      className={`border-b border-[var(--border-primary)] ${
                        transaction.isDuplicate ? "opacity-50" : ""
                      }`}
                    >
                      <td className="p-2">
                        <input
                          type="date"
                          value={transaction.date.split("T")[0]}
                          onChange={(e) =>
                            handleDateChange(index, e.target.value)
                          }
                          disabled={transaction.isDuplicate}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-2 py-1 text-[var(--text-primary)] text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={transaction.description}
                          onChange={(e) =>
                            handleDescriptionChange(index, e.target.value)
                          }
                          disabled={transaction.isDuplicate}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-2 py-1 text-[var(--text-primary)] text-xs"
                          placeholder="Transaction description"
                        />
                      </td>
                      <td
                        className={`p-2 text-right font-mono ${
                          transaction.type === "INCOME"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {transaction.type === "INCOME" ? "+" : ""}$
                        {Math.abs(transaction.amount).toFixed(2)}
                      </td>
                      <td className="p-2">
                        {creatingCategoryFor?.index === index ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) =>
                                setNewCategoryName(e.target.value)
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter") handleCreateCategory();
                              }}
                              placeholder="Category name..."
                              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--accent-cyan)] rounded px-2 py-1 text-[var(--text-primary)] text-xs"
                              autoFocus
                            />
                            <button
                              onClick={handleCreateCategory}
                              className="bg-[var(--accent-cyan)] text-[var(--bg-primary)] px-2 py-1 rounded text-xs font-bold hover:opacity-80"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setCreatingCategoryFor(null);
                                setNewCategoryName("");
                              }}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold hover:opacity-80"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <select
                            value={transaction.categoryId}
                            onChange={(e) =>
                              handleCategoryChange(index, e.target.value)
                            }
                            disabled={transaction.isDuplicate}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-2 py-1 text-[var(--text-primary)] text-xs"
                          >
                            <option value="">Uncategorized</option>
                            {categories
                              .filter((cat) => cat.type === transaction.type)
                              .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            <option
                              value="CREATE_NEW"
                              className="text-[var(--accent-cyan)] font-bold"
                            >
                              + Create New Category
                            </option>
                          </select>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {transaction.isDuplicate ? (
                          <span className="text-xs text-red-500 flex items-center justify-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Duplicate
                          </span>
                        ) : transaction.confidence === "high" ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-xs text-yellow-500">⚠️</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-bold py-2 px-4 rounded uppercase tracking-wider hover:border-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-bold py-2 px-4 rounded uppercase tracking-wider hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import{" "}
                    {editedTransactions.filter((t) => !t.isDuplicate).length}{" "}
                    Transactions
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
