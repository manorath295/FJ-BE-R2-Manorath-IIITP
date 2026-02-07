import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function IncomeExpenseChart({ transactions }) {
  // Group transactions by month
  const monthlyData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!acc[monthKey]) {
      acc[monthKey] = { income: 0, expenses: 0 };
    }

    const amount = parseFloat(transaction.amount);
    if (transaction.type === "INCOME") {
      acc[monthKey].income += amount;
    } else {
      acc[monthKey].expenses += Math.abs(amount);
    }

    return acc;
  }, {});

  // Sort by month and get last 6 months
  const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
  const labels = sortedMonths.map((month) => {
    const [year, monthNum] = month.split("-");
    return new Date(year, monthNum - 1).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  });

  const data = {
    labels,
    datasets: [
      {
        label: "Income",
        data: sortedMonths.map((month) => monthlyData[month].income),
        borderColor: "#00FF88",
        backgroundColor: "rgba(0, 255, 136, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: "#00FF88",
        pointBorderColor: "#0A0E27",
        pointBorderWidth: 2,
      },
      {
        label: "Expenses",
        data: sortedMonths.map((month) => monthlyData[month].expenses),
        borderColor: "#FF006E",
        backgroundColor: "rgba(255, 0, 110, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: "#FF006E",
        pointBorderColor: "#0A0E27",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#A0AEC0",
          font: {
            family: "JetBrains Mono, monospace",
            size: 12,
            weight: "bold",
          },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "#1A2238",
        titleColor: "#FFFFFF",
        bodyColor: "#A0AEC0",
        borderColor: "#2D3748",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#2D3748",
          drawBorder: false,
        },
        ticks: {
          color: "#A0AEC0",
          font: {
            family: "JetBrains Mono, monospace",
          },
          callback: function (value) {
            return "$" + value.toLocaleString();
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#A0AEC0",
          font: {
            family: "JetBrains Mono, monospace",
          },
        },
      },
    },
  };

  return (
    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-primary)] p-6 rounded-lg card-hover">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
        Income vs Expenses
      </h2>
      <div style={{ height: "300px" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
