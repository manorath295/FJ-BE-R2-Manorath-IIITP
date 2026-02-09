import { Request, Response } from "express";
import * as transactionService from "../services/transaction.service.js";
import { successResponse } from "../utils/response.util.js";
import { checkBudgetAfterTransaction } from "../services/notification.service.js";

export async function getTransactions(req: Request, res: Response) {
  const userId = req.userId!;
  const transactions = await transactionService.getUserTransactions(userId);
  res.json(successResponse(transactions));
}

export async function getTransaction(req: Request, res: Response) {
  const userId = req.userId!;
  const id = req.params.id as string;

  const transaction = await transactionService.getTransactionById(id, userId);

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: "Transaction not found",
    });
  }

  res.json(successResponse(transaction));
}

export async function createTransaction(req: Request, res: Response) {
  const userId = req.userId!;
  const {
    categoryId,
    amount,
    type,
    description,
    date,
    currency,
    isRecurring,
    recurringFrequency,
  } = req.body;

  console.log("Create Transaction Request Received");
  console.log("File:", req.file);
  console.log("Body:", req.body);

  let receiptUrl: string | undefined;

  // With CloudinaryStorage middleware, req.file.path IS the Cloudinary URL
  if (req.file) {
    receiptUrl = req.file.path;
    console.log("✅ File uploaded to Cloudinary via middleware!");
    console.log("🔗 Cloudinary URL:", receiptUrl);
  }

  // Zod middleware (validate.middleware) already validated and sanitized Types
  // So we can use req.body directly after validation
  const transaction = await transactionService.createTransaction(userId, {
    categoryId,
    amount, // Zod has already coerced this to number
    type,
    description,
    date: new Date(date), // Date string still needs to be converted to Date object for Prisma
    currency,
    isRecurring,
    recurringFrequency,
    receiptUrl,
  });

  // Check budget alerts for expense transactions with a category
  if (type === "EXPENSE" && categoryId) {
    // Run budget check in background (don't await to avoid slowing down response)
    checkBudgetAfterTransaction(userId, categoryId).catch((err) => {
      console.error("Budget check failed:", err);
    });
  }

  res.status(201).json(successResponse(transaction, "Transaction created"));
}

export async function updateTransaction(req: Request, res: Response) {
  const userId = req.userId!;
  const id = req.params.id as string;
  const {
    categoryId,
    amount,
    type,
    description,
    date,
    currency,
    isRecurring,
    recurringFrequency,
  } = req.body;

  console.log("Update Transaction Request Received");
  console.log("File:", req.file);
  console.log("Transaction ID:", id);

  let receiptUrl: string | undefined;

  // With CloudinaryStorage middleware, req.file.path IS the Cloudinary URL
  if (req.file) {
    receiptUrl = req.file.path;
    console.log("✅ File uploaded to Cloudinary via middleware!");
    console.log("🔗 Cloudinary URL:", receiptUrl);
  }

  const transaction = await transactionService.updateTransaction(id, userId, {
    categoryId,
    amount,
    type,
    description,
    date: date ? new Date(date) : undefined,
    currency,
    isRecurring,
    recurringFrequency,
    receiptUrl,
  });

  // Check budget alerts if it's an expense and has a category
  if (transaction.type === "EXPENSE" && transaction.categoryId) {
    checkBudgetAfterTransaction(userId, transaction.categoryId).catch((err) => {
      console.error("Budget check failed:", err);
    });
  }

  res.json(successResponse(transaction, "Transaction updated"));
}

export async function deleteTransaction(req: Request, res: Response) {
  const userId = req.userId!;
  const id = req.params.id as string;

  const result = await transactionService.deleteTransaction(id, userId);
  res.json(successResponse(result));
}

export async function analyzeReceipt(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No receipt image uploaded",
      });
    }

    // req.file.path is the Cloudinary URL thanks to the middleware
    const imageUrl = req.file.path;
    console.log("🔍 [ANALYZE] analyzing receipt:", imageUrl);

    const { analyzeReceipt } = await import("../services/ai.service.js");
    const analysis = await analyzeReceipt(imageUrl);

    // Return analysis + the uploaded image URL so frontend can display it
    res.json(
      successResponse(
        {
          ...analysis,
          receiptUrl: imageUrl,
        },
        "Receipt analyzed successfully",
      ),
    );
  } catch (error: any) {
    console.error("❌ [ANALYZE] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze receipt",
    });
  }
}
