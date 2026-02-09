import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import prisma from "../lib/db.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { sendEmail, isEmailConfigured } from "../utils/email.util.js";

const router = Router();
router.use(requireAuth);

/**
 * Get user settings
 * GET /api/settings
 */
router.get("/", async (req, res) => {
  const userId = req.userId!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      notificationEmail: true,
      defaultCurrency: true,
    },
  });

  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }

  res.json(
    successResponse({
      email: user.email,
      notificationEmail: user.notificationEmail || user.email,
      defaultCurrency: user.defaultCurrency,
      emailConfigured: isEmailConfigured(),
    }),
  );
});

/**
 * Update notification email
 * PATCH /api/settings/notification-email
 */
router.patch("/notification-email", async (req, res) => {
  const userId = req.userId!;
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json(errorResponse("Email is required"));
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json(errorResponse("Invalid email format"));
  }

  await prisma.user.update({
    where: { id: userId },
    data: { notificationEmail: email },
  });

  res.json(
    successResponse({ notificationEmail: email }, "Notification email updated"),
  );
});

/**
 * Send test email to verify configuration
 * POST /api/settings/test-email
 */
router.post("/test-email", async (req, res) => {
  const userId = req.userId!;
  const { email } = req.body;

  if (!isEmailConfigured()) {
    return res
      .status(400)
      .json(errorResponse("Email is not configured on the server"));
  }

  // Get user's notification email or use provided email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, notificationEmail: true, name: true },
  });

  if (!user) {
    return res.status(404).json(errorResponse("User not found"));
  }

  const targetEmail = email || user.notificationEmail || user.email;

  // Send test email
  const success = await sendEmail({
    to: targetEmail,
    subject: "🧪 Test Email from Finance Tracker",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">✅ Email Configuration Working!</h2>
        <p>Hi ${user.name || "User"},</p>
        <p>This is a test email from your Finance Tracker app.</p>
        <p>If you received this, your email notifications are set up correctly!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Finance Tracker - Your Personal Finance Assistant</p>
      </div>
    `,
    text: `Test Email from Finance Tracker\n\nHi ${user.name || "User"},\nThis is a test email. If you received this, your email notifications are working!\n\n- Finance Tracker`,
  });

  if (success) {
    res.json(
      successResponse({ sentTo: targetEmail }, "Test email sent successfully"),
    );
  } else {
    res.status(500).json(errorResponse("Failed to send test email"));
  }
});

export { router as default };
