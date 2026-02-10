import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as notificationController from "../controllers/notification.controller.js";

const router = Router();
router.use(requireAuth);


router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadNotificationCount);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

export { router as default };
