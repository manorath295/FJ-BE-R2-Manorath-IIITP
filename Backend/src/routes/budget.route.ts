import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as budgetController from "../controllers/budget.controller.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/budgets - Get all budgets
router.get("/", budgetController.getBudgets);

// POST /api/budgets - Create budget
router.post("/", budgetController.createBudget);

// PUT /api/budgets/:id - Update budget
router.put("/:id", budgetController.updateBudget);

// DELETE /api/budgets/:id - Delete budget
router.delete("/:id", budgetController.deleteBudget);

export { router as default };
