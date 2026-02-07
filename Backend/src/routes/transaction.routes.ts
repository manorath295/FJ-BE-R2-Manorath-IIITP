import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as transactionController from "../controllers/transaction.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "../validators/transaction.validator.js";

const router = Router();
router.use(requireAuth);

router.get("/", transactionController.getTransactions);
router.get("/:id", transactionController.getTransaction);
router.post(
  "/",
  validate(createTransactionSchema),
  transactionController.createTransaction,
);
router.put(
  "/:id",
  validate(updateTransactionSchema),
  transactionController.updateTransaction,
);
router.delete("/:id", transactionController.deleteTransaction);

export { router as default };
