import { z } from "zod";

// Category type enum
export const CategoryTypeEnum = z.enum(["INCOME", "EXPENSE"]);

// Create category schema
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
  type: CategoryTypeEnum,
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex code (e.g., #EF4444)")
    .optional(),
});

// Update category schema
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .optional(),
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex code (e.g., #EF4444)")
    .optional(),
});

// Type exports for TypeScript
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
