import { useState, useEffect } from "react";
import { transactionsAPI } from "../services/api";
import { formatCurrency, formatDate } from "../utils/helpers";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchTransactions();
  }, [dateRange]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await transactionsAPI.getAll();
      const allTransactions = response.data.data || [];

      // Filter by date range
      const filtered = allTransactions.filter((t) => {
        const transDate = new Date(t.date);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return transDate >= start && transDate <= end;
      });

      setTransactions(filtered);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Category breakdown
  const categoryData = {};
  transactions.forEach((t) => {
    if (t.type === "EXPENSE" && t.category) {
      const catName = t.category.name;
      categoryData[catName] =
        (categoryData[catName] || 0) + parseFloat(t.amount);
    }
  });

  // Pie chart data
  const pieChartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          "#00F0FF",
          "#FF006E",
          "#8B5CF6",
          "#00FF88",
          "#FFB800",
          "#FF6B6B",
          "#4ECDC4",
          "#95E1D3",
          "#F38181",
          "#AA96DA",
        ],
        borderColor: "#0A0E27",
        borderWidth: 2,
      },
    ],
  };

  // Quick filter functions
  const setQuickFilter = (filter) => {
    const today = new Date();
    let start, end;

    switch (filter) {
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case "lastMonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "last3Months":
        start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        end = today;
        break;
      case "thisYear":
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      default:
        return;
    }

    setDateRange({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const rows = transactions.map((t) => [
      formatDate(t.date),
      t.description,
      t.category?.name || "Uncategorized",
      t.type,
      t.amount,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 240, 255);
    doc.text("FINANCE TRACKER - REPORT", 14, 20);

    // Date Range
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Period: ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`,
      14,
      28,
    );

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Summary", 14, 40);

    const summaryData = [
      ["Total Income", formatCurrency(totalIncome)],
      ["Total Expenses", formatCurrency(totalExpenses)],
      ["Net Savings", formatCurrency(netSavings)],
      ["Savings Rate", `${savingsRate.toFixed(1)}%`],
    ];

    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [0, 240, 255], textColor: [10, 14, 39] },
    });

    // Category Breakdown
    if (Object.keys(categoryData).length > 0) {
      doc.text("Category Breakdown", 14, doc.lastAutoTable.finalY + 15);

      const categoryRows = Object.entries(categoryData).map(([cat, amount]) => [
        cat,
        formatCurrency(amount),
        `${((amount / totalExpenses) * 100).toFixed(1)}%`,
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Category", "Amount", "% of Total"]],
        body: categoryRows,
        theme: "striped",
        headStyles: { fillColor: [139, 92, 246] },
      });
    }

    // Transactions
    doc.text("Transactions", 14, doc.lastAutoTable.finalY + 15);

    const transactionRows = transactions
      .slice(0, 20)
      .map((t) => [
        formatDate(t.date),
        t.description,
        t.category?.name || "-",
        t.type,
        formatCurrency(parseFloat(t.amount)),
      ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Date", "Description", "Category", "Type", "Amount"]],
      body: transactionRows,
      theme: "grid",
    });

    doc.save(
      `financial-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`,
    );
  };

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
              FINANCIAL REPORTS
            </h1>
            <p className="text-[var(--text-secondary)] mono">
              Generate and export detailed financial reports
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="px-4 py-2 bg-[var(--accent-purple)] text-white rounded text-sm font-bold uppercase hover:opacity-80 transition-opacity"
            >
              Dashboard
            </a>
            <a
              href="/reports"
              className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-sm font-bold uppercase hover:border-[var(--accent-cyan)] transition-colors"
            >
              Reports
            </a>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date Range */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-4 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setQuickFilter("thisMonth")}
              className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-sm font-bold uppercase hover:border-[var(--accent-cyan)] transition-colors"
            >
              This Month
            </button>
            <button
              onClick={() => setQuickFilter("lastMonth")}
              className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-sm font-bold uppercase hover:border-[var(--accent-cyan)] transition-colors"
            >
              Last Month
            </button>
            <button
              onClick={() => setQuickFilter("last3Months")}
              className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-sm font-bold uppercase hover:border-[var(--accent-cyan)] transition-colors"
            >
              Last 3 Months
            </button>
            <button
              onClick={() => setQuickFilter("thisYear")}
              className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded text-sm font-bold uppercase hover:border-[var(--accent-cyan)] transition-colors"
            >
              This Year
            </button>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--border-primary)]">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-pink)] text-white rounded font-bold uppercase hover:opacity-80 transition-opacity"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-purple)] text-white rounded font-bold uppercase hover:opacity-80 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[var(--success)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Total Income
            </h3>
          </div>
          <p className="text-3xl font-bold mono text-[var(--success)]">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[var(--error)] rotate-180" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Total Expenses
            </h3>
          </div>
          <p className="text-3xl font-bold mono text-[var(--error)]">
            {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Net Savings
            </h3>
          </div>
          <p
            className={`text-3xl font-bold mono ${netSavings >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}
          >
            {formatCurrency(netSavings)}
          </p>
        </div>

        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[var(--accent-purple)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Savings Rate
            </h3>
          </div>
          <p className="text-3xl font-bold mono text-[var(--accent-purple)]">
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryData).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              Expense by Category
            </h2>
            <div className="max-w-md mx-auto">
              <Pie
                data={pieChartData}
                options={{
                  plugins: {
                    legend: {
                      labels: { color: "#E2E8F0" },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Category Table */}
          <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              Category Breakdown
            </h2>
            <div className="space-y-2">
              {Object.entries(categoryData)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded"
                  >
                    <span className="font-medium">{category}</span>
                    <div className="text-right">
                      <p className="font-bold mono text-[var(--error)]">
                        {formatCurrency(amount)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {((amount / totalExpenses) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* No Data */}
      {transactions.length === 0 && !loading && (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-12 rounded-lg text-center">
          <FileText className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)] text-lg">
            No transactions found for the selected period
          </p>
        </div>
      )}
    </div>
  );
}
