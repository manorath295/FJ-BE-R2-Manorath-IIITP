import { Request, Response } from "express";
import * as categoryService from "../services/category.service.js";
import { successResponse } from "../utils/response.util.js";

export async function getCategories(req: Request, res: Response) {
  try {
    const userId = req.userId!;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const categories = await categoryService.getUserCategories(userId);
    if (!categories) {
      return res.status(404).json({
        success: false,
        message: "Categories not found",
      });
    }
    res.json(successResponse(categories));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const userId = req.userId!;
    const { name, type, icon, color } = req.body;

    // Zod middleware already validated the request body
    const category = await categoryService.createCategory(userId, {
      name,
      type,
      icon,
      color,
    });

    res.status(201).json(successResponse(category, "Category created"));
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error,
    });
  }
}
export async function updateCategory(req: Request, res: Response) {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    const { name, icon, color } = req.body;

    const category = await categoryService.updateCategory(id, userId, {
      name,
      icon,
      color,
    });

    res.json(successResponse(category, "Category updated"));
  } catch (error) {
    console.log("Error while updating the categorty");
    res.status(500).json({
      success: false,
      message: "Failed to update",
    });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const result = await categoryService.deleteCategory(id, userId);
    res.json(successResponse(result));
  } catch (error) {
    console.log("Error while deleting the categorty");
    res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
}
