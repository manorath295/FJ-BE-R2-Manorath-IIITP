import nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email options interface
interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Budget alert data interface
interface BudgetAlertData {
  userName: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentUsed: number;
  currency: string;
  period: string;
}

// Create transporter singleton
let transporter: Transporter | null = null;

/**
 * Get or create email transporter
 */
function getTransporter(): Transporter {
  if (!transporter) {
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASSWORD || "",
      },
    };

    transporter = nodemailer.createTransport(config);
    console.log("📧 Email transporter initialized");
  }
  return transporter;
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
}

/**
 * Send a generic email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn("⚠️ Email not configured. Skipping email send.");
    return false;
  }

  try {
    const transport = getTransporter();
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const result = await transport.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`✅ Email sent to ${options.to}: ${result.messageId}`);
    return true;
  } catch (error: any) {
    console.error("❌ Failed to send email:", error.message);
    return false;
  }
}

/**
 * Send budget alert email (80% threshold)
 */
export async function sendBudgetAlertEmail(
  userEmail: string,
  data: BudgetAlertData,
): Promise<boolean> {
  const subject = `⚠️ Budget Alert: ${data.categoryName} at ${data.percentUsed.toFixed(0)}%`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .alert-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .progress-container { background: #e0e0e0; border-radius: 10px; height: 20px; margin: 20px 0; overflow: hidden; }
        .progress-bar { background: linear-gradient(90deg, #ff9800, #f57c00); height: 100%; border-radius: 10px; transition: width 0.3s; }
        .stats { display: flex; justify-content: space-between; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px; flex: 1; margin: 0 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #333; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Budget Alert</h1>
        </div>
        <div class="content">
          <p>Hi ${data.userName},</p>
          
          <div class="alert-box">
            <strong>Heads up!</strong> You've used <strong>${data.percentUsed.toFixed(1)}%</strong> of your 
            <strong>${data.categoryName}</strong> budget for this ${data.period.toLowerCase()}.
          </div>

          <div class="progress-container">
            <div class="progress-bar" style="width: ${Math.min(data.percentUsed, 100)}%"></div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="stat-value">${data.currency}${data.spentAmount.toFixed(2)}</div>
              <div class="stat-label">Spent</div>
            </div>
            <div class="stat">
              <div class="stat-value">${data.currency}${data.budgetAmount.toFixed(2)}</div>
              <div class="stat-label">Budget</div>
            </div>
            <div class="stat">
              <div class="stat-value">${data.currency}${(data.budgetAmount - data.spentAmount).toFixed(2)}</div>
              <div class="stat-label">Remaining</div>
            </div>
          </div>

          <p>Consider reviewing your spending to stay within your budget.</p>
        </div>
        <div class="footer">
          Finance Tracker - Your Personal Finance Assistant
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Budget Alert: ${data.categoryName}

Hi ${data.userName},

You've used ${data.percentUsed.toFixed(1)}% of your ${data.categoryName} budget.

Spent: ${data.currency}${data.spentAmount.toFixed(2)}
Budget: ${data.currency}${data.budgetAmount.toFixed(2)}
Remaining: ${data.currency}${(data.budgetAmount - data.spentAmount).toFixed(2)}

Consider reviewing your spending to stay within your budget.

- Finance Tracker
  `;

  return sendEmail({
    to: userEmail,
    subject,
    text,
    html,
  });
}

/**
 * Send budget exceeded email (100%+ threshold)
 */
export async function sendBudgetExceededEmail(
  userEmail: string,
  data: BudgetAlertData,
): Promise<boolean> {
  const overAmount = data.spentAmount - data.budgetAmount;
  const subject = `🚨 Budget Exceeded: ${data.categoryName} is ${data.percentUsed.toFixed(0)}% over!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f44336 0%, #c62828 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .alert-box { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .progress-container { background: #e0e0e0; border-radius: 10px; height: 20px; margin: 20px 0; overflow: hidden; position: relative; }
        .progress-bar { background: linear-gradient(90deg, #f44336, #c62828); height: 100%; border-radius: 10px; }
        .over-indicator { position: absolute; left: 100%; top: -5px; background: #c62828; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; transform: translateX(-50%); }
        .stats { display: flex; justify-content: space-between; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px; flex: 1; margin: 0 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #333; }
        .stat-value.danger { color: #f44336; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Budget Exceeded</h1>
        </div>
        <div class="content">
          <p>Hi ${data.userName},</p>
          
          <div class="alert-box">
            <strong>Alert!</strong> You've exceeded your <strong>${data.categoryName}</strong> budget by 
            <strong>${data.currency}${overAmount.toFixed(2)}</strong> (${data.percentUsed.toFixed(1)}% of budget used).
          </div>

          <div class="progress-container">
            <div class="progress-bar" style="width: 100%"></div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="stat-value danger">${data.currency}${data.spentAmount.toFixed(2)}</div>
              <div class="stat-label">Spent</div>
            </div>
            <div class="stat">
              <div class="stat-value">${data.currency}${data.budgetAmount.toFixed(2)}</div>
              <div class="stat-label">Budget</div>
            </div>
            <div class="stat">
              <div class="stat-value danger">-${data.currency}${overAmount.toFixed(2)}</div>
              <div class="stat-label">Over Budget</div>
            </div>
          </div>

          <p>Please review your spending and consider adjusting your budget or reducing expenses in this category.</p>
        </div>
        <div class="footer">
          Finance Tracker - Your Personal Finance Assistant
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Budget Exceeded: ${data.categoryName}

Hi ${data.userName},

ALERT! You've exceeded your ${data.categoryName} budget!

Spent: ${data.currency}${data.spentAmount.toFixed(2)}
Budget: ${data.currency}${data.budgetAmount.toFixed(2)}
Over by: ${data.currency}${overAmount.toFixed(2)}

Please review your spending and consider adjusting your budget.

- Finance Tracker
  `;

  return sendEmail({
    to: userEmail,
    subject,
    text,
    html,
  });
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn("⚠️ Email not configured");
    return false;
  }

  try {
    const transport = getTransporter();
    await transport.verify();
    console.log("✅ Email configuration verified");
    return true;
  } catch (error: any) {
    console.error("❌ Email verification failed:", error.message);
    return false;
  }
}
