import prisma from "../lib/db.js";

type BudgetPeriod = "WEEKLY" | "MONTHLY" | "YEARLY";

export async function getUserBudgets(userId: string) {
  return await prisma.budget.findMany({
    where: { userId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}


export async function createBudget(
  userId: string,
  data: {
    categoryId: string;
    amount: number;
    period: BudgetPeriod;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const existing = await prisma.budget.findFirst({
    where: {
      userId,
      categoryId: data.categoryId,
      period: data.period,
    },
  });

  if (existing) {
    throw new Error("Budget already exists for this category and period");
  }
  const category = await prisma.category.findFirst({
    where: {
      id: data.categoryId,
      userId,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return await prisma.budget.create({
    data: {
      userId,
      categoryId: data.categoryId,
      amount: data.amount,
      period: data.period,
      startDate: data.startDate || startOfMonth,
      endDate: data.endDate || endOfMonth,
    },
    include: {
      category: true,
    },
  });
}

export async function updateBudget(
  budgetId: string,
  userId: string,
  data: Partial<{
    amount: number;
    period: BudgetPeriod;
    startDate: Date;
    endDate: Date;
  }>,
) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  });

  if (!budget) {
    throw new Error("Budget not found");
  }

  return await prisma.budget.update({
    where: { id: budgetId },
    data,
    include: {
      category: true,
    },
  });
}
export async function deleteBudget(budgetId: string, userId: string) {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  });

  if (!budget) {
    throw new Error("Budget not found");
  }

  await prisma.budget.delete({
    where: { id: budgetId },
  });

  return { message: "Budget deleted successfully" };
}
