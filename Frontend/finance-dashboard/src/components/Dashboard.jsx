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
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: "var(--accent-cyan)" }}
            >
              FINANCE TRACKER
            </h1>
            <p className="text-[var(--text-secondary)] mono">
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button
          onClick={() => setShowImportModal(true)}
          className="bg-[var(--accent-purple)] text-white p-4 rounded-full shadow-lg hover:opacity-80 transition-opacity"
          title="Import Bank Statement"
        >
          <FileUp className="w-6 h-6" />
        </button>
        <button
          onClick={() => setShowTransactionModal(true)}
          className="bg-[var(--accent-cyan)] text-[var(--bg-primary)] p-4 rounded-full shadow-lg hover:opacity-80 transition-opacity"
          title="Add Transaction"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="bg-[var(--accent-purple)] text-white p-4 rounded-full shadow-lg hover:opacity-80 transition-opacity"
          title="Add Category"
        >
          <Tag className="w-6 h-6" />
        </button>
        <button
          onClick={() => setShowBudgetModal(true)}
          className="bg-[var(--accent-green)] text-[var(--bg-primary)] p-4 rounded-full shadow-lg hover:opacity-80 transition-opacity"
          title="Add Budget"
        >
          <Target className="w-6 h-6" />
        </button>
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
