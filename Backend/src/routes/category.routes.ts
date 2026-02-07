import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as categoryController from "../controllers/category.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/categories - Get all categories
router.get("/", categoryController.getCategories);

// POST /api/categories - Create category (with validation)
router.post(
  "/",
  validate(createCategorySchema),
  categoryController.createCategory,
);

// PUT /api/categories/:id - Update category (with validation)
router.put(
  "/:id",
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

// DELETE /api/categories/:id - Delete category
router.delete("/:id", categoryController.deleteCategory);

export { router as default };
