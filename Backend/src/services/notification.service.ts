import prisma from "../lib/db.js";
import {
  sendBudgetAlertEmail,
  sendBudgetExceededEmail,
  isEmailConfigured,
} from "../utils/email.util.js";


type NotificationType =
  | "BUDGET_ALERT"
  | "BUDGET_EXCEEDED"
  | "WEEKLY_SUMMARY"
  | "MONTHLY_REPORT"
  | "ANOMALY_DETECTED";

/**
 * Check budget status for a specific category after a transaction
 * Returns true if an alert was triggered
 */
export async function checkBudgetAfterTransaction(
  userId: string,
  categoryId: string,
): Promise<{ alertSent: boolean; type?: string }> {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, notificationEmail: true },
  });

  if (!user) {
    return { alertSent: false };
  }

  // Get budget for this category
  const now = new Date();
  const budget = await prisma.budget.findFirst({
    where: {
      userId,
      categoryId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      category: true,
    },
  });

  if (!budget) {
    return { alertSent: false };
  }

  // Calculate total spent in this category for the budget period
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      categoryId,
      type: "EXPENSE",
      date: {
        gte: budget.startDate,
        lte: budget.endDate,
      },
    },
    select: {
      amount: true,
    },
  });

  const totalSpent = transactions.reduce(
    (sum: number, t: any) => sum + parseFloat(t.amount.toString()),
    0,
  );
  const budgetAmount = parseFloat(budget.amount.toString());
  const percentUsed = (totalSpent / budgetAmount) * 100;
  const alertThreshold = budget.alertThreshold || 80;

  console.log(
    `📊 Budget check: ${budget.category.name} - ${percentUsed.toFixed(1)}% used (threshold: ${alertThreshold}%)`,
  );

  // Check if we should send an alert
  let alertType: NotificationType | null = null;
  let alertTitle = "";
  let alertMessage = "";

  if (percentUsed >= 100) {
    // Budget exceeded
    alertType = "BUDGET_EXCEEDED";
    alertTitle = `Budget Exceeded: ${budget.category.name}`;
    alertMessage = `You've exceeded your ${budget.category.name} budget! Spent: $${totalSpent.toFixed(2)} / Budget: $${budgetAmount.toFixed(2)} (${percentUsed.toFixed(1)}%)`;
  } else if (percentUsed >= alertThreshold) {
    // Budget warning
    alertType = "BUDGET_ALERT";
    alertTitle = `Budget Alert: ${budget.category.name}`;
    alertMessage = `You've used ${percentUsed.toFixed(1)}% of your ${budget.category.name} budget. Spent: $${totalSpent.toFixed(2)} / Budget: $${budgetAmount.toFixed(2)}`;
  }

  if (!alertType) {
    return { alertSent: false };
  }

  // Check if we already sent this notification today (avoid spam)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingNotification = await prisma.notification.findFirst({
    where: {
      userId,
      type: alertType,
      createdAt: { gte: today },
      message: { contains: budget.category.name },
    },
  });

  if (existingNotification) {
    console.log(
      `⏭️ Notification already sent today for ${budget.category.name}`,
    );
    return { alertSent: false };
  }

  // Create notification in database
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: alertType,
      title: alertTitle,
      message: alertMessage,
      sentAt: new Date(),
    },
  });

  console.log(`📝 Created notification: ${notification.id}`);

  // Send email if configured
  if (isEmailConfigured()) {
    const targetEmail = user.notificationEmail || user.email;
    const emailData = {
      userName: user.name || "User",
      categoryName: budget.category.name,
      budgetAmount,
      spentAmount: totalSpent,
      percentUsed,
      currency: budget.currency || "$",
      period: budget.period,
    };

    if (alertType === "BUDGET_EXCEEDED") {
      await sendBudgetExceededEmail(targetEmail, emailData);
    } else {
      await sendBudgetAlertEmail(targetEmail, emailData);
    }
  }

  return { alertSent: true, type: alertType };
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {},
) {
  const { unreadOnly = false, limit = 50 } = options;

  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return false;
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return result.count;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Delete old notifications (older than 30 days)
 */
export async function cleanupOldNotifications(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      isRead: true,
    },
  });

  return result.count;
}
