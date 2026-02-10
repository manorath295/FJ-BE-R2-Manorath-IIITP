import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as categoryController from "../controllers/category.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";

const router = Router();
router.use(requireAuth);
router.get("/", categoryController.getCategories);

router.post(
  "/",
  validate(createCategorySchema),
  categoryController.createCategory,
);

router.put(
  "/:id",
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

// DELETE /api/categories/:id - Delete category
router.delete("/:id", categoryController.deleteCategory);

export { router as default };
