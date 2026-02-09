import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as transactionController from "../controllers/transaction.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "../validators/transaction.validator.js";

import { upload } from "../middleware/upload.js";

const router = Router();
router.use(requireAuth);

router.get("/", transactionController.getTransactions);
router.get("/:id", transactionController.getTransaction);
router.post(
  "/",
  upload.single("receipt"),
  validate(createTransactionSchema),
  transactionController.createTransaction,
);
router.put(
  "/:id",
  upload.single("receipt"),
  validate(updateTransactionSchema),
  transactionController.updateTransaction,
);
router.delete("/:id", transactionController.deleteTransaction);

// Analyze receipt with AI (no validation schema needed as it's just an analysis)
router.post(
  "/analyze",
  upload.single("receipt"),
  transactionController.analyzeReceipt,
);

export { router as default };
