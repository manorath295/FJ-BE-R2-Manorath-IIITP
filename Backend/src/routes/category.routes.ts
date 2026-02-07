import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as categoryController from "../controllers/category.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", categoryController.getCategories);
router.post("/", categoryController.createCategory);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

export { router as default };
