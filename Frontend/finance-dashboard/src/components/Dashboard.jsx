import { useState, useEffect } from "react";
import { transactionsAPI, budgetsAPI } from "../services/api";
import { calculateTotal } from "../utils/helpers";
import FinancialOverview from "./FinancialOverview";
import IncomeExpenseChart from "./IncomeExpenseChart";
import BudgetGrid from "./BudgetGrid";
import TransactionList from "./TransactionList";
import AddTransactionModal from "./AddTransactionModal";
import AddCategoryModal from "./AddCategoryModal";
import AddBudgetModal from "./AddBudgetModal";
import BankImportModal from "./BankImportModal";
import {
  Loader2,
  AlertCircle,
  Plus,
  DollarSign,
  Tag,
  Target,
  FileUp,
} from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);

  // Modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch transactions and budgets in parallel
      const [transactionsRes, budgetsRes] = await Promise.all([
        transactionsAPI.getAll(),
        budgetsAPI.getAll(),
      ]);

      setTransactions(transactionsRes.data.data || []);
      setBudgets(budgetsRes.data.data || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalIncome = calculateTotal(transactions, "INCOME");
  const totalExpenses = calculateTotal(transactions, "EXPENSE");
  const balance = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-cyan)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] mono">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-[var(--bg-card)] border-2 border-[var(--error)] p-8 rounded-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-[var(--error)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-4">
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="w-full bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-bold py-2 px-4 rounded hover:opacity-80 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: "var(--accent-cyan)" }}
            >
              FINANCE TRACKER
            </h1>
            <p className="text-[var(--text-secondary)] mono text-sm">
              Real-time financial overview and analytics
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-sm font-bold uppercase hover:border-[var(--accent-cyan)] transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/reports"
              className="px-4 py-2 bg-[var(--accent-purple)] text-white rounded text-sm font-bold uppercase hover:opacity-80 transition-opacity"
            >
              Reports
            </a>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="flex gap-4 items-center text-sm">
          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-primary)] px-4 py-2 rounded-lg">
            <span className="text-[var(--accent-cyan)] text-lg">📊</span>
            <span className="text-[var(--text-secondary)]">
              Track Income & Expenses
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-primary)] px-4 py-2 rounded-lg">
            <span className="text-[var(--accent-green)] text-lg">🎯</span>
            <span className="text-[var(--text-secondary)]">Manage Budgets</span>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-cyan)] px-4 py-2 rounded-lg relative">
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-[var(--bg-primary)] text-[8px] font-black px-1.5 py-0.5 rounded-full">
              NEW
            </div>
            <span className="text-lg">🤖</span>
            <span className="text-white font-semibold">
              AI-Powered Chat & PDF Import
            </span>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="space-y-6">
        {/* Financial Overview */}
        <FinancialOverview
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          balance={balance}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeExpenseChart transactions={transactions} />
          <BudgetGrid
            budgets={budgets}
            transactions={transactions}
            onUpdate={fetchDashboardData}
          />
        </div>

        {/* Transactions List */}
        <TransactionList
          transactions={transactions}
          onUpdate={fetchDashboardData}
        />
      </div>

      {/* Action Toolbar - Bottom Center */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] rounded-2xl shadow-2xl p-4 flex gap-3">
          <button
            onClick={() => setShowTransactionModal(true)}
            className="flex flex-col items-center gap-1 bg-[var(--accent-cyan)] text-[var(--bg-primary)] px-5 py-3 rounded-xl font-bold hover:opacity-80 transition-all hover:scale-105 min-w-[140px]"
            title="Record a new income or expense transaction"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span className="text-sm font-extrabold">Add Transaction</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">
              Record income/expense
            </span>
          </button>

          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex flex-col items-center gap-1 bg-[var(--accent-purple)] text-white px-5 py-3 rounded-xl font-bold hover:opacity-80 transition-all hover:scale-105 min-w-[140px]"
            title="Create and manage transaction categories"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              <span className="text-sm font-extrabold">Category</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">
              Organize transactions
            </span>
          </button>

          <button
            onClick={() => setShowBudgetModal(true)}
            className="flex flex-col items-center gap-1 bg-[var(--accent-green)] text-[var(--bg-primary)] px-5 py-3 rounded-xl font-bold hover:opacity-80 transition-all hover:scale-105 min-w-[140px]"
            title="Set monthly spending limits and track budget usage"
          >
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span className="text-sm font-extrabold">Budget</span>
            </div>
            <span className="text-[10px] opacity-80 font-normal">
              Set spending limits
            </span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex flex-col items-center gap-1 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-cyan)] text-white px-5 py-3 rounded-xl font-bold hover:opacity-80 transition-all hover:scale-105 min-w-[140px] relative"
            title="AI-powered PDF bank statement import and extraction"
          >
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-[var(--bg-primary)] text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
              AI-POWERED
            </div>
            <div className="flex items-center gap-2">
              <FileUp className="w-5 h-5" />
              <span className="text-sm font-extrabold">Import PDF</span>
            </div>
            <span className="text-[10px] opacity-90 font-normal">
              AI extracts transactions
            </span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <BankImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchDashboardData}
      />
      <AddTransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSuccess={fetchDashboardData}
      />

      <AddCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={fetchDashboardData}
      />

      <AddBudgetModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
