import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import prisma from "../lib/db.js";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";

// ============================================================================
// TOOL SCHEMAS
// ============================================================================

const searchTransactionsSchema = z.object({
  type: z
    .enum(["INCOME", "EXPENSE", "ALL"])
    .optional()
    .describe("Filter by transaction type"),
  categoryName: z
    .string()
    .optional()
    .describe("Filter by category name (case-insensitive)"),
  dateFrom: z.string().optional().describe("Start date in YYYY-MM-DD format"),
  dateTo: z.string().optional().describe("End date in YYYY-MM-DD format"),
  minAmount: z.number().optional().describe("Minimum transaction amount"),
  maxAmount: z.number().optional().describe("Maximum transaction amount"),
  description: z
    .string()
    .optional()
    .describe("Search in transaction description (case-insensitive)"),
  limit: z.number().default(50).describe("Maximum number of results to return"),
});

const spendingSummarySchema = z.object({
  dateFrom: z.string().optional().describe("Start date in YYYY-MM-DD format"),
  dateTo: z.string().optional().describe("End date in YYYY-MM-DD format"),
  groupBy: z
    .enum(["category", "day", "week", "month"])
    .default("category")
    .describe("How to group the summary"),
});

const incomeSummarySchema = z.object({
  dateFrom: z.string().optional().describe("Start date in YYYY-MM-DD format"),
  dateTo: z.string().optional().describe("End date in YYYY-MM-DD format"),
  groupBy: z
    .enum(["category", "day", "week", "month"])
    .default("category")
    .describe("How to group the summary"),
});

const categoryBreakdownSchema = z.object({
  type: z
    .enum(["INCOME", "EXPENSE"])
    .describe("Type of transactions to analyze"),
  dateFrom: z.string().optional().describe("Start date in YYYY-MM-DD format"),
  dateTo: z.string().optional().describe("End date in YYYY-MM-DD format"),
});

const budgetStatusSchema = z.object({
  categoryName: z
    .string()
    .optional()
    .describe(
      "Specific category to check (optional, returns all if not specified)",
    ),
});

function parseDateRange(
  dateFrom?: string,
  dateTo?: string,
): { from?: Date; to?: Date } {
  const now = new Date();
  let from: Date | undefined;
  let to: Date | undefined;

  // Handle relative dates
  if (dateFrom === "last_week") {
    from = startOfWeek(subDays(now, 7));
    to = endOfWeek(subDays(now, 7));
  } else if (dateFrom === "this_week") {
    from = startOfWeek(now);
    to = endOfWeek(now);
  } else if (dateFrom === "last_month") {
    from = startOfMonth(subMonths(now, 1));
    to = endOfMonth(subMonths(now, 1));
  } else if (dateFrom === "this_month") {
    from = startOfMonth(now);
    to = endOfMonth(now);
  } else if (dateFrom === "this_year") {
    from = startOfYear(now);
    to = endOfYear(now);
  } else if (dateFrom === "last_year") {
    from = startOfYear(subYears(now, 1));
    to = endOfYear(subYears(now, 1));
  } else {
    // Parse as ISO date strings
    if (dateFrom) from = new Date(dateFrom);
    if (dateTo) to = new Date(dateTo);
  }

  return { from, to };
}

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

const searchTransactionsTool = tool(
  async (input, config) => {
    const userId = config?.configurable?.userId as string;
    if (!userId) throw new Error("User ID is required");

    const {
      type,
      categoryName,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      description,
      limit,
    } = input;
    const dateRange = parseDateRange(dateFrom, dateTo);

    // Build Prisma query
    const where: any = { userId };

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (categoryName) {
      where.category = {
        name: {
          contains: categoryName,
          mode: "insensitive",
        },
      };
    }

    if (dateRange.from || dateRange.to) {
      where.date = {};
      if (dateRange.from) where.date.gte = dateRange.from;
      if (dateRange.to) where.date.lte = dateRange.to;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }

    if (description) {
      where.description = {
        contains: description,
        mode: "insensitive",
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return JSON.stringify({
      count: transactions.length,
      transactions: transactions.map((t: any) => ({
        date: t.date.toISOString().split("T")[0],
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        category: t.category?.name || "Uncategorized",
        currency: t.currency,
      })),
    });
  },
  {
    name: "search_transactions",
    description:
      "Search and filter transactions by type, category, date range, amount, or description. Use this to find specific transactions or answer questions about purchases, income, or expenses.",
    schema: searchTransactionsSchema,
  },
);

const getSpendingSummaryTool = tool(
  async (input, config) => {
    const userId = config?.configurable?.userId as string;
    if (!userId) throw new Error("User ID is required");

    const { dateFrom, dateTo, groupBy } = input;
    const dateRange = parseDateRange(dateFrom, dateTo);

    const where: any = {
      userId,
      type: "EXPENSE",
    };

    if (dateRange.from || dateRange.to) {
      where.date = {};
      if (dateRange.from) where.date.gte = dateRange.from;
      if (dateRange.to) where.date.lte = dateRange.to;
    }

    if (groupBy === "category") {
      const summary = await prisma.transaction.groupBy({
        by: ["categoryId"],
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      });

      // Fetch category names
      const categoryIds = summary
        .map((s: any) => s.categoryId)
        .filter(Boolean) as string[];
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      });

      const categoryMap = new Map(categories.map((c: any) => [c.id, c.name]));

      return JSON.stringify({
        totalSpending: summary.reduce(
          (acc: number, s: any) => acc + Number(s._sum.amount || 0),
          0,
        ),
        breakdown: summary.map((s: any) => ({
          category: s.categoryId
            ? categoryMap.get(s.categoryId) || "Unknown"
            : "Uncategorized",
          amount: Number(s._sum.amount || 0),
          count: s._count,
        })),
      });
    } else {
      // For time-based grouping, just return total for now
      const total = await prisma.transaction.aggregate({
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      });

      return JSON.stringify({
        totalSpending: Number(total._sum.amount || 0),
        transactionCount: total._count,
      });
    }
  },
  {
    name: "get_spending_summary",
    description:
      "Get aggregated spending summary grouped by category or time period. Use this to answer questions about total spending, spending by category, or spending trends.",
    schema: spendingSummarySchema,
  },
);

const getIncomeSummaryTool = tool(
  async (input, config) => {
    const userId = config?.configurable?.userId as string;
    if (!userId) throw new Error("User ID is required");

    const { dateFrom, dateTo, groupBy } = input;
    const dateRange = parseDateRange(dateFrom, dateTo);

    const where: any = {
      userId,
      type: "INCOME",
    };

    if (dateRange.from || dateRange.to) {
      where.date = {};
      if (dateRange.from) where.date.gte = dateRange.from;
      if (dateRange.to) where.date.lte = dateRange.to;
    }

    if (groupBy === "category") {
      const summary = await prisma.transaction.groupBy({
        by: ["categoryId"],
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      });

      // Fetch category names
      const categoryIds = summary
        .map((s: any) => s.categoryId)
        .filter(Boolean) as string[];
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      });

      const categoryMap = new Map(categories.map((c: any) => [c.id, c.name]));

      return JSON.stringify({
        totalIncome: summary.reduce(
          (acc: number, s: any) => acc + Number(s._sum.amount || 0),
          0,
        ),
        breakdown: summary.map((s: any) => ({
          category: s.categoryId
            ? categoryMap.get(s.categoryId) || "Unknown"
            : "Uncategorized",
          amount: Number(s._sum.amount || 0),
          count: s._count,
        })),
      });
    } else {
      // For time-based grouping, just return total for now
      const total = await prisma.transaction.aggregate({
        where,
        _sum: {
          amount: true,
        },
        _count: true,
      });

      return JSON.stringify({
        totalIncome: Number(total._sum.amount || 0),
        transactionCount: total._count,
      });
    }
  },
  {
    name: "get_income_summary",
    description:
      "Get aggregated income summary grouped by category or time period. Use this to answer questions about total income, income sources, or income trends.",
    schema: incomeSummarySchema,
  },
);

const getCategoryBreakdownTool = tool(
  async (input, config) => {
    const userId = config?.configurable?.userId as string;
    if (!userId) throw new Error("User ID is required");

    const { type, dateFrom, dateTo } = input;
    const dateRange = parseDateRange(dateFrom, dateTo);

    const where: any = {
      userId,
      type,
    };

    if (dateRange.from || dateRange.to) {
      where.date = {};
      if (dateRange.from) where.date.gte = dateRange.from;
      if (dateRange.to) where.date.lte = dateRange.to;
    }

    const summary = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Fetch category names
    const categoryIds = summary
      .map((s: any) => s.categoryId)
      .filter(Boolean) as string[];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c: any) => [c.id, c.name]));

    const breakdown = summary.map((s: any) => ({
      category: s.categoryId
        ? categoryMap.get(s.categoryId) || "Unknown"
        : "Uncategorized",
      amount: Number(s._sum.amount || 0),
      count: s._count,
    }));

    // Sort by amount descending
    breakdown.sort((a: any, b: any) => b.amount - a.amount);

    const total = breakdown.reduce((acc: number, b: any) => acc + b.amount, 0);

    return JSON.stringify({
      type,
      total,
      breakdown: breakdown.map((b: any) => ({
        ...b,
        percentage: total > 0 ? ((b.amount / total) * 100).toFixed(1) : "0.0",
      })),
    });
  },
  {
    name: "get_category_breakdown",
    description:
      "Get detailed breakdown of income or expenses by category with percentages. Use this to answer questions about spending/income distribution or top categories.",
    schema: categoryBreakdownSchema,
  },
);

const getBudgetStatusTool = tool(
  async (input, config) => {
    const userId = config?.configurable?.userId as string;
    if (!userId) throw new Error("User ID is required");

    const { categoryName } = input;

    // Get active budgets
    const now = new Date();
    const where: any = {
      userId,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (categoryName) {
      where.category = {
        name: {
          contains: categoryName,
          mode: "insensitive",
        },
      };
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate spending for each budget
    const budgetStatus = await Promise.all(
      budgets.map(async (budget: any) => {
        const spending = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: "EXPENSE",
            date: {
              gte: budget.startDate,
              lte: budget.endDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const spent = Number(spending._sum.amount || 0);
        const budgetAmount = Number(budget.amount);
        const remaining = budgetAmount - spent;
        const percentageUsed =
          budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

        return {
          category: budget.category.name,
          budget: budgetAmount,
          spent,
          remaining,
          percentageUsed: percentageUsed.toFixed(1),
          status:
            percentageUsed >= 100
              ? "exceeded"
              : percentageUsed >= budget.alertThreshold
                ? "warning"
                : "ok",
          period: budget.period,
        };
      }),
    );

    return JSON.stringify({
      budgets: budgetStatus,
    });
  },
  {
    name: "get_budget_status",
    description:
      "Check budget status for categories, showing how much has been spent vs. budget limits. Use this to answer questions about budget usage, remaining budget, or budget alerts.",
    schema: budgetStatusSchema,
  },
);


// CHATBOT AGENT

const tools = [
  searchTransactionsTool,
  getSpendingSummaryTool,
  getIncomeSummaryTool,
  getCategoryBreakdownTool,
  getBudgetStatusTool,
];

/**
 * Process a user query and return AI-generated response
 */
export async function processChatQuery(
  userId: string,
  query: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
) {
  console.log("🤖 [CHATBOT] Processing query:", query);
  console.log("🤖 [CHATBOT] User ID:", userId);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.3,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const modelWithTools = model.bindTools(tools);

  const systemPrompt = `You are a helpful financial assistant for a personal finance tracker app. 
You help users understand their income, expenses, budgets, and spending patterns.

When answering questions:
1. Use the available tools to fetch accurate data from the user's financial records
2. Provide clear, concise, and friendly responses
3. Format numbers as currency (e.g., $123.45)
4. When showing dates, use readable formats (e.g., "January 15, 2026")
5. Highlight important insights (e.g., budget warnings, unusual spending)
6. If you need to search for transactions, use appropriate date ranges based on the user's question
7. For relative dates like "last week" or "this month", use the appropriate date range parameters

Available tools:
- search_transactions: Find specific transactions
- get_spending_summary: Get spending totals and breakdowns
- get_income_summary: Get income totals and breakdowns
- get_category_breakdown: Analyze spending/income by category
- get_budget_status: Check budget usage and alerts

Current date: ${new Date().toISOString().split("T")[0]}`;

  // Build messages array
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: query },
  ];

  try {
    // First LLM call - decide which tools to use
    const response = await modelWithTools.invoke(messages, {
      configurable: { userId },
    });

    console.log("🤖 [CHATBOT] Initial response:", response);

    // Check if tools were called
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log("🤖 [CHATBOT] Tools called:", response.tool_calls.length);

      // Execute tool calls
      const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall: any) => {
          console.log(
            "🔧 [TOOL] Calling:",
            toolCall.name,
            "with args:",
            toolCall.args,
          );

          const tool = tools.find((t) => t.name === toolCall.name);
          if (!tool) {
            throw new Error(`Tool ${toolCall.name} not found`);
          }

          const result = await (tool as any).invoke(toolCall.args, {
            configurable: { userId },
          });

          console.log("🔧 [TOOL] Result:", result);

          return {
            tool_call_id: toolCall.id,
            role: "tool",
            name: toolCall.name,
            content: result,
          };
        }),
      );

      // Second LLM call - generate final response with tool results
      const finalMessages = [...messages, response, ...toolResults];

      const finalResponse = await model.invoke(finalMessages);

      console.log("✅ [CHATBOT] Final response:", finalResponse.content);

      return {
        response: finalResponse.content as string,
        toolsUsed: response.tool_calls.map((tc: any) => tc.name),
      };
    } else {
      // No tools needed, return direct response
      console.log("✅ [CHATBOT] Direct response (no tools)");
      return {
        response: response.content as string,
        toolsUsed: [],
      };
    }
  } catch (error) {
    console.error("❌ [CHATBOT] Error:", error);
    throw new Error("Failed to process chat query");
  }
}
