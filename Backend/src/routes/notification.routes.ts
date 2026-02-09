import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as notificationController from "../controllers/notification.controller.js";

const router = Router();
router.use(requireAuth);

// Get all notifications
router.get("/", notificationController.getNotifications);

// Get unread count
router.get("/unread-count", notificationController.getUnreadNotificationCount);

// Mark specific notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark all notifications as read
router.patch("/read-all", notificationController.markAllAsRead);

export { router as default };
