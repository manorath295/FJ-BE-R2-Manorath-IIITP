import { z } from "zod";

export const BudgetPeriodEnum = z.enum(["WEEKLY", "MONTHLY", "YEARLY"]);

export const createBudgetSchema = z
  .object({
    categoryId: z.string().uuid("Category ID must be a valid UUID"),
    amount: z.number().positive("Amount must be a positive number"),
    period: BudgetPeriodEnum,
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export const updateBudgetSchema = z
  .object({
    amount: z.number().positive("Amount must be a positive number").optional(),
    period: BudgetPeriodEnum.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
