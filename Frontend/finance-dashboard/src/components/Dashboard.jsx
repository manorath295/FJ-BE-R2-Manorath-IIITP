import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { transactionsAPI, budgetsAPI } from "../services/api";
import { signOut } from "../lib/auth-client";
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
  Settings,
  LogOut,
} from "lucide-react";
import SettingsModal from "./SettingsModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
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
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Sticky Header with Action Toolbar */}
      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-primary)] px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-6">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--accent-cyan)" }}
              >
                FINANCE TRACKER
              </h1>
              <p className="text-[var(--text-secondary)] text-xs">
                Real-time financial overview
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-2">
              <a
                href="/dashboard"
                className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-xs font-bold uppercase hover:border-[var(--accent-cyan)] transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/reports"
                className="px-3 py-1.5 bg-[var(--accent-purple)] text-white rounded text-xs font-bold uppercase hover:opacity-80 transition-opacity"
              >
                Reports
              </a>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all"
              title="Settings"
            >
              <Settings size={20} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>

            <button
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] px-4 py-2 rounded-lg font-bold text-sm hover:opacity-80 transition-all"
              title="Record a new income or expense transaction"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Add Transaction</span>
            </button>

            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 bg-[var(--accent-purple)] text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-80 transition-all"
              title="Create and manage transaction categories"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden md:inline">Category</span>
            </button>

            <button
              onClick={() => setShowBudgetModal(true)}
              className="flex items-center gap-2 bg-[var(--accent-green)] text-[var(--bg-primary)] px-4 py-2 rounded-lg font-bold text-sm hover:opacity-80 transition-all"
              title="Set monthly spending limits and track budget usage"
            >
              <Target className="w-4 h-4" />
              <span className="hidden md:inline">Budget</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-cyan)] text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-80 transition-all relative"
              title="AI-powered PDF bank statement import and extraction"
            >
              <FileUp className="w-4 h-4" />
              <span className="hidden md:inline">Import PDF</span>
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-[var(--bg-primary)] text-[8px] font-black px-1.5 py-0.5 rounded-full">
                AI
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with padding */}
      <main className="p-6 space-y-6">
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
      </main>

      {/* Modals */}
      {showImportModal && (
        <BankImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={fetchDashboardData}
        />
      )}

      {showTransactionModal && (
        <AddTransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSuccess={fetchDashboardData}
        />
      )}

      {showCategoryModal && (
        <AddCategoryModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={fetchDashboardData}
        />
      )}

      {showBudgetModal && (
        <AddBudgetModal
          isOpen={showBudgetModal}
          onClose={() => setShowBudgetModal(false)}
          onSuccess={fetchDashboardData}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}
