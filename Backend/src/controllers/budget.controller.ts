import { Request, Response } from "express";
import * as budgetService from "../services/budget.service.js";
import { successResponse } from "../utils/response.util.js";

export async function getBudgets(req: Request, res: Response) {
  const userId = req.userId!;
  const budgets = await budgetService.getUserBudgets(userId);
  res.json(successResponse(budgets));
}
export async function createBudget(req: Request, res: Response) {
  const userId = req.userId!;
  const { categoryId, amount, period, startDate, endDate } = req.body;

  if (!categoryId || !amount || !period) {
    return res.status(400).json({
      success: false,
      message: "Category, amount, and period are required",
    });
  }

  const budget = await budgetService.createBudget(userId, {
    categoryId,
    amount: parseFloat(amount),
    period,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  res.status(201).json(successResponse(budget, "Budget created"));
}

export async function updateBudget(req: Request, res: Response) {
  const userId = req.userId!;
  const id = req.params.id as string;
  const { amount, period, startDate, endDate } = req.body;

  const budget = await budgetService.updateBudget(id, userId, {
    amount: amount ? parseFloat(amount) : undefined,
    period,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  res.json(successResponse(budget, "Budget updated"));
}

/**
 * Delete budget
 */
export async function deleteBudget(req: Request, res: Response) {
  const userId = req.userId!;
  const id = req.params.id as string;

  const result = await budgetService.deleteBudget(id, userId);
  res.json(successResponse(result));
}
