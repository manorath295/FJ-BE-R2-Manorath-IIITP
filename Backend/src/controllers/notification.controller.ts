import { Request, Response } from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
} from "../services/notification.service.js";
import { successResponse, errorResponse } from "../utils/response.util.js";

/**
 * Get all notifications for the authenticated user
 * GET /api/notifications
 */
export async function getNotifications(req: Request, res: Response) {
  const userId = req.userId!;
  const { unreadOnly, limit } = req.query;

  const notifications = await getUserNotifications(userId, {
    unreadOnly: unreadOnly === "true",
    limit: limit ? parseInt(limit as string) : undefined,
  });

  res.json(
    successResponse(notifications, "Notifications fetched successfully"),
  );
}

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export async function getUnreadNotificationCount(req: Request, res: Response) {
  const userId = req.userId!;
  const count = await getUnreadCount(userId);

  res.json(successResponse({ count }, "Unread count fetched"));
}

/**
 * Mark a specific notification as read
 * PATCH /api/notifications/:id/read
 */
export async function markAsRead(req: Request, res: Response) {
  const userId = req.userId!;
  const { id } = req.params as { id: string };

  const success = await markNotificationAsRead(id, userId);

  if (!success) {
    return res.status(404).json(errorResponse("Notification not found"));
  }

  res.json(successResponse(null, "Notification marked as read"));
}

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export async function markAllAsRead(req: Request, res: Response) {
  const userId = req.userId!;
  const count = await markAllNotificationsAsRead(userId);

  res.json(successResponse({ count }, `${count} notifications marked as read`));
}
