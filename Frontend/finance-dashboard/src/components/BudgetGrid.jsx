import {
  formatCurrency,
  calculateBudgetProgress,
  getStatusColor,
} from "../utils/helpers";
import { Target, Trash2 } from "lucide-react";
import { budgetsAPI } from "../services/api";
import { useState } from "react";

export default function BudgetGrid({ budgets, transactions, onUpdate }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    setDeleting(id);
    try {
      await budgetsAPI.delete(id);
      onUpdate();
    } catch (err) {
      console.error("Error deleting budget:", err);
      alert("Failed to delete budget");
    } finally {
      setDeleting(null);
    }
  };

  // Calculate spent amount for each budget
  const budgetsWithProgress = budgets.map((budget) => {
    const spent = transactions
      .filter((t) => t.categoryId === budget.categoryId && t.type === "EXPENSE")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const limit = parseFloat(budget.amount);
    const percentage = calculateBudgetProgress(spent, limit);

    return {
      ...budget,
      spent,
      limit,
      percentage,
      remaining: limit - spent,
    };
  });

  if (budgetsWithProgress.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
          Budget Tracking
        </h2>
        <p className="text-[var(--text-muted)] text-center py-8">
          No budgets created yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg card-hover">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-[var(--accent-purple)]" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Budget Tracking
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetsWithProgress.map((budget) => (
          <div
            key={budget.id}
            className={`bg-[var(--bg-tertiary)] p-4 rounded border relative ${
              budget.percentage >= 100
                ? "border-[var(--error)] shadow-lg shadow-red-500/20"
                : "border-[var(--border-primary)]"
            }`}
          >
            {/* Budget Exceeded Warning */}
            {budget.percentage >= 100 && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[var(--error)] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                ⚠ Over Budget
              </div>
            )}

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(budget.id)}
              disabled={deleting === budget.id}
              className="absolute top-2 right-2 p-1.5 rounded bg-red-500/10 text-[var(--error)] hover:bg-red-500/20 transition-colors disabled:opacity-50"
              title="Delete Budget"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Category Name */}
            <div className="flex items-center justify-between mb-2 pr-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                {budget.category.name}
              </h3>
              <span className="text-xs text-[var(--text-muted)]">
                {budget.period}
              </span>
            </div>

            {/* Amount */}
            <div className="flex items-baseline gap-2 mb-3">
              <span
                className="text-2xl font-bold mono"
                style={{ color: getStatusColor(budget.percentage) }}
              >
                {formatCurrency(budget.spent)}
              </span>
              <span className="text-sm text-[var(--text-muted)] mono">
                / {formatCurrency(budget.limit)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(budget.percentage, 100)}%`,
                  backgroundColor: getStatusColor(budget.percentage),
                }}
              />
            </div>

            {/* Percentage */}
            <div className="flex items-center justify-between">
              <span
                className="text-xs mono"
                style={{ color: getStatusColor(budget.percentage) }}
              >
                {budget.percentage.toFixed(1)}%
              </span>
              <span className="text-xs text-[var(--text-muted)] mono">
                {budget.remaining >= 0 ? "Remaining" : "Over"}:{" "}
                {formatCurrency(Math.abs(budget.remaining))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
