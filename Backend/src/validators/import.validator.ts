import { z } from "zod";

export const confirmImportSchema = z.object({
  transactions: z.array(
    z.object({
      date: z.string().datetime("Invalid date format"),
      description: z.string().min(1, "Description is required").max(500),
      amount: z.number(),
      type: z.enum(["INCOME", "EXPENSE"]),
      categoryId: z.string().uuid("Invalid category ID").optional(),
    }),
  ),
});

export type ConfirmImportInput = z.infer<typeof confirmImportSchema>;
