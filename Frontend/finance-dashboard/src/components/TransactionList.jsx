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
  const [showAll, setShowAll] = useState(false);

  // Sort by date (newest first) and optionally limit to 10
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, showAll ? transactions.length : 10);

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Recent Transactions ({transactions.length} total)
        </h2>
        {transactions.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm font-bold uppercase text-[var(--accent-cyan)] hover:text-[var(--accent-purple)] bg-[var(--accent-cyan)]/10 hover:bg-[var(--accent-cyan)]/20 rounded-lg transition-all"
          >
            {showAll ? "Show Less" : `View All (${transactions.length})`}
          </button>
        )}
      </div>

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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(transaction.receiptUrl, "_blank");
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-[var(--accent-cyan)]/10 hover:bg-[var(--accent-cyan)]/20 rounded transition-colors"
                            title="View Receipt"
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
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span className="text-xs text-[var(--accent-cyan)] font-semibold">
                              View
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Just open the file directly - browser handles download
                              // PDFs will open in browser's PDF viewer (user can save from there)
                              // Images will open in new tab (user can right-click save)
                              window.open(transaction.receiptUrl, "_blank");
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
                              className="text-[var(--text-muted)] w-3 h-3"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <path d="M7 10l5 5 5-5"></path>
                              <path d="M12 15V3"></path>
                            </svg>
                            <span className="text-xs text-[var(--text-muted)]">
                              Download
                            </span>
                          </button>
                        </div>
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
