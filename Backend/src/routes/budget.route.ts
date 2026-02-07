import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as budgetController from "../controllers/budget.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createBudgetSchema,
  updateBudgetSchema,
} from "../validators/budget.validator.js";

const router = Router();
router.use(requireAuth);

router.get("/", budgetController.getBudgets);

router.post("/", validate(createBudgetSchema), budgetController.createBudget);
router.put("/:id", validate(updateBudgetSchema), budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

export { router as default };
