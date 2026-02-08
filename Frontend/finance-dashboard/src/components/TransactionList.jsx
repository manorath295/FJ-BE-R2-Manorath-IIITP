import { formatCurrency, formatDate } from "../utils/helpers";
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Tag,
  Edit2,
  Trash2,
} from "lucide-react";
import { transactionsAPI } from "../services/api";
import { useState } from "react";
import EditTransactionModal from "./EditTransactionModal";

export default function TransactionList({ transactions, onUpdate }) {
  const [deleting, setDeleting] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Sort by date (newest first) and limit to 10
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    setDeleting(id);
    try {
      await transactionsAPI.delete(id);
      onUpdate();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Failed to delete transaction");
    } finally {
      setDeleting(null);
    }
  };

  if (recentTransactions.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Recent Transactions
        </h2>
        <p className="text-[var(--text-muted)] text-center py-8">
          No transactions yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg card-hover">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
        Recent Transactions
      </h2>

      <div className="space-y-2">
        {recentTransactions.map((transaction) => {
          const isIncome = transaction.type === "INCOME";
          const amount = parseFloat(transaction.amount);
          const isNegative = amount < 0;

          return (
            <div
              key={transaction.id}
              className="bg-[var(--bg-tertiary)] p-4 rounded border border-[var(--border-primary)] hover:border-[var(--accent-cyan)] transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left Side: Icon + Description */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2 rounded flex-shrink-0 ${isIncome ? "bg-green-500/10" : "bg-red-500/10"}`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-5 h-5 text-[var(--success)]" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-[var(--error)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {transaction.category && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[var(--text-muted)]" />
                          <span className="text-xs text-[var(--text-muted)]">
                            {transaction.category.name}
                          </span>
                        </div>
                      )}
                      {transaction.receiptUrl && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const response = await fetch(
                                transaction.receiptUrl,
                              );
                              if (!response.ok)
                                throw new Error("Download failed");
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              // Extract filename from URL or use default
                              const filename =
                                transaction.receiptUrl.split("/").pop() ||
                                "receipt.pdf";
                              a.download = filename;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (err) {
                              console.error("Download error:", err);
                              alert(
                                "Could not download file. Opening in new tab instead.",
                              );
                              window.open(transaction.receiptUrl, "_blank");
                            }
                          }}
                          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                          title="Download Receipt"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[var(--accent-cyan)] w-3 h-3"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <path d="M7 10l5 5 5-5"></path>
                            <path d="M12 15V3"></path>
                          </svg>
                          <span className="text-xs text-[var(--accent-cyan)] underline">
                            Receipt
                          </span>
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                        <span className="text-xs text-[var(--text-muted)] mono">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount + Actions */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className="text-lg font-bold mono whitespace-nowrap"
                      style={{
                        color: isNegative
                          ? "var(--accent-yellow)"
                          : isIncome
                            ? "var(--success)"
                            : "var(--error)",
                      }}
                    >
                      {isIncome ? "+" : ""}
                      {formatCurrency(amount, transaction.currency || "USD")}
                    </p>
                    {isNegative && (
                      <span className="text-xs text-[var(--accent-yellow)]">
                        Refund
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="p-2 rounded bg-blue-500/10 text-[var(--accent-cyan)] hover:bg-blue-500/20 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      disabled={deleting === transaction.id}
                      className="p-2 rounded bg-red-500/10 text-[var(--error)] hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSuccess={() => {
          setEditingTransaction(null);
          onUpdate();
        }}
        transaction={editingTransaction}
      />
    </div>
  );
}
