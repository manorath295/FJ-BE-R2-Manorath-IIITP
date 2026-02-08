import { z } from "zod";

export const TransactionTypeEnum = z.enum(["INCOME", "EXPENSE"]);
export const RecurringFrequencyEnum = z.enum([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
]);

export const createTransactionSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID").optional(),
  amount: z.preprocess(
    (a) => parseFloat(a as string),
    z
      .number()
      .multipleOf(0.01, "Amount must have at most 2 decimal places")
      .min(-9999999999.99, "Amount too small")
      .max(9999999999.99, "Amount too large"),
  ),
  type: TransactionTypeEnum,
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long"),
  date: z.string().datetime("Invalid date format"),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters (e.g., USD)")
    .optional(),
  isRecurring: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional(),
  ),
  recurringFrequency: RecurringFrequencyEnum.optional(),
});

export const updateTransactionSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID").optional(),
  amount: z
    .number()
    .multipleOf(0.01, "Amount must have at most 2 decimal places")
    .min(-9999999999.99, "Amount too small")
    .max(9999999999.99, "Amount too large")
    .optional(),
  type: TransactionTypeEnum.optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long")
    .optional(),
  date: z.string().datetime("Invalid date format").optional(),
  currency: z.string().length(3, "Currency must be 3 characters").optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: RecurringFrequencyEnum.optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
