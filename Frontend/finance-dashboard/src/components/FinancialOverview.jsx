import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
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
    <div className="glass-strong p-8 rounded-2xl border border-[var(--border-primary)] card-hover shadow-xl">
      {/* Main Balance */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] rounded-xl">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-secondary)]">
            Total Balance
          </h2>
        </div>
        <div className="flex items-baseline gap-4 mb-2">
          <h1
            className="text-6xl font-bold mono animate-count"
            style={{
              color: isPositive ? "var(--accent-cyan)" : "var(--accent-pink)",
            }}
          >
            {formatCurrency(balance)}
          </h1>
          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
              isPositive ? "bg-green-500/10" : "bg-red-500/10"
            }`}
          >
            {isPositive ? (
              <>
                <ArrowUpRight className="w-5 h-5 text-[var(--success)]" />
                <span className="text-sm font-bold text-[var(--success)]">
                  Positive
                </span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-5 h-5 text-[var(--error)]" />
                <span className="text-sm font-bold text-[var(--error)]">
                  Deficit
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(savingsRate, 100)}%` }}
            ></div>
          </div>
          <span className="text-sm font-bold text-[var(--accent-purple)]">
            {savingsRate.toFixed(1)}%
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-1">Savings Rate</p>
      </div>

      {/* Income, Expenses, Savings Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Income */}
        <div className="glass p-5 rounded-xl border border-[var(--border-primary)] hover:border-[var(--success)] transition-all duration-300 group">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
              <TrendingUp className="w-4 h-4 text-[var(--success)]" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">
              Income
            </p>
          </div>
          <p className="text-2xl font-bold mono text-[var(--success)]">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Expenses */}
        <div className="glass p-5 rounded-xl border border-[var(--border-primary)] hover:border-[var(--error)] transition-all duration-300 group">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
              <TrendingDown className="w-4 h-4 text-[var(--error)]" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">
              Expenses
            </p>
          </div>
          <p className="text-2xl font-bold mono text-[var(--error)]">
            {formatCurrency(totalExpenses)}
          </p>
        </div>

        {/* Savings */}
        <div className="glass p-5 rounded-xl border border-[var(--border-primary)] hover:border-[var(--accent-purple)] transition-all duration-300 group">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <PiggyBank className="w-4 h-4 text-[var(--accent-purple)]" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">
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
