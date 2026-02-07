// Format currency
export const formatCurrency = (amount, currency = "USD") => {
  const num = parseFloat(amount);
  if (isNaN(num)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

// Format percentage
export const formatPercentage = (value) => {
  return `${Math.round(value)}%`;
};

// Calculate total from transactions
export const calculateTotal = (transactions, type) => {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
};

// Group transactions by category
export const groupByCategory = (transactions) => {
  return transactions.reduce((acc, transaction) => {
    const categoryName = transaction.category?.name || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = {
        name: categoryName,
        total: 0,
        count: 0,
        color: transaction.category?.color || "#6B7280",
      };
    }
    acc[categoryName].total += parseFloat(transaction.amount);
    acc[categoryName].count += 1;
    return acc;
  }, {});
};

// Calculate budget progress
export const calculateBudgetProgress = (spent, limit) => {
  if (limit === 0) return 0;
  return Math.min((spent / limit) * 100, 100);
};

// Get status color based on percentage
export const getStatusColor = (percentage) => {
  if (percentage >= 100) return "var(--error)";
  if (percentage >= 80) return "var(--warning)";
  return "var(--success)";
};
