import { Request, Response } from "express";
import * as transactionService from "../services/transaction.service.js";
import { successResponse } from "../utils/response.util.js";

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
  console.log("Currency:", currency);

  const receiptUrl = req.file ? req.file.path : undefined;

  if (receiptUrl) {
    console.log("✅ File uploaded to Cloudinary successfully:", receiptUrl);
  } else {
    console.log("⚠️ No file uploaded with this transaction.");
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

  const transaction = await transactionService.updateTransaction(id, userId, {
    categoryId,
    amount,
    type,
    description,
    date: date ? new Date(date) : undefined,
    currency,
    isRecurring,
    recurringFrequency,
  });

  res.json(successResponse(transaction, "Transaction updated"));
}

export async function deleteTransaction(req: Request, res: Response) {
  const userId = req.userId!;
  const id = req.params.id as string;

  const result = await transactionService.deleteTransaction(id, userId);
  res.json(successResponse(result));
}
