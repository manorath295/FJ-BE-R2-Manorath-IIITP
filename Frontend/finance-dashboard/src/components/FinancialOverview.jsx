import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PiggyBank,
} from "lucide-react";
import { formatCurrency } from "../utils/helpers";

export default function FinancialOverview({
  totalIncome,
  totalExpenses,
  balance,
}) {
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  const isPositive = balance >= 0;

  return (
    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg card-hover">
      {/* Main Balance */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Total Balance
          </h2>
        </div>
        <div className="flex items-baseline gap-3">
          <h1
            className="text-5xl font-bold mono animate-count"
            style={{
              color: isPositive ? "var(--accent-cyan)" : "var(--accent-pink)",
            }}
          >
            {formatCurrency(balance)}
          </h1>
          {isPositive ? (
            <TrendingUp className="w-8 h-8 text-[var(--success)]" />
          ) : (
            <TrendingDown className="w-8 h-8 text-[var(--error)]" />
          )}
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          {savingsRate.toFixed(1)}% savings rate
        </p>
      </div>

      {/* Income, Expenses, Savings Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-[var(--bg-tertiary)] p-4 rounded border border-[var(--border-primary)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[var(--success)]" />
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Income
            </p>
          </div>
          <p className="text-2xl font-bold mono text-[var(--success)]">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Expenses */}
        <div className="bg-[var(--bg-tertiary)] p-4 rounded border border-[var(--border-primary)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-[var(--error)]" />
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Expenses
            </p>
          </div>
          <p className="text-2xl font-bold mono text-[var(--error)]">
            {formatCurrency(totalExpenses)}
          </p>
        </div>

        {/* Savings */}
        <div className="bg-[var(--bg-tertiary)] p-4 rounded border border-[var(--border-primary)]">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4 text-[var(--accent-purple)]" />
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Saved
            </p>
          </div>
          <p className="text-2xl font-bold mono text-[var(--accent-purple)]">
            {formatCurrency(balance)}
          </p>
        </div>
      </div>
    </div>
  );
}
