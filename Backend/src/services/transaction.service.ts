import prisma from "../lib/db.js";

type TransactionType = "INCOME" | "EXPENSE";
type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export async function getUserTransactions(userId: string) {
  return await prisma.transaction.findMany({
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
    orderBy: { date: "desc" },
  });
}

export async function getTransactionById(
  transactionId: string,
  userId: string,
) {
  return await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    include: {
      category: true,
    },
  });
}

export async function createTransaction(
  userId: string,
  data: {
    categoryId?: string;
    amount: number;
    type: TransactionType;
    description: string;
    date: Date;
    currency?: string;
    isRecurring?: boolean;
    recurringFrequency?: RecurringFrequency;
    receiptUrl?: string;
  },
) {
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId },
    });

    if (!category) {
      throw new Error("Category not found");
    }
  }

  return await prisma.transaction.create({
    data: {
      userId,
      ...data,
    },
    include: {
      category: true,
    },
  });
}

export async function updateTransaction(
  transactionId: string,
  userId: string,
  data: Partial<{
    categoryId: string;
    amount: number;
    type: TransactionType;
    description: string;
    date: Date;
    currency: string;
    isRecurring: boolean;
    recurringFrequency: RecurringFrequency;
    receiptUrl: string;
  }>,
) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId },
    });

    if (!category) {
      throw new Error("Category not found");
    }
  }

  return await prisma.transaction.update({
    where: { id: transactionId },
    data,
    include: {
      category: true,
    },
  });
}

export async function deleteTransaction(transactionId: string, userId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  await prisma.transaction.delete({
    where: { id: transactionId },
  });

  return { message: "Transaction deleted successfully" };
}
