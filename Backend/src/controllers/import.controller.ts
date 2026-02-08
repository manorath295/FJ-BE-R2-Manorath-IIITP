import { Request, Response } from "express";
import * as bankImportService from "../services/bank-import.service";
import { successResponse } from "../utils/response.util";

/**
 * Preview imported transactions from bank statement
 * POST /api/import/preview
 */
export async function previewImport(req: Request, res: Response) {
  try {
    const userId = req.userId!;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Please upload a PDF or CSV file.",
      });
    }

    // Process the statement
    const result = await bankImportService.processStatement(
      file.buffer,
      file.mimetype,
      userId,
    );

    res.json(successResponse(result, "Transactions extracted successfully"));
  } catch (error: any) {
    console.error("Import preview error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process bank statement",
    });
  }
}

/**
 * Confirm and save imported transactions
 * POST /api/import/confirm
 */
export async function confirmImport(req: Request, res: Response) {
  try {
    const userId = req.userId!;
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. Transactions array is required.",
      });
    }

    // Save transactions
    const result = await bankImportService.saveTransactions(
      transactions,
      userId,
    );

    res.json(
      successResponse(
        { count: result.count },
        `Successfully imported ${result.count} transactions`,
      ),
    );
  } catch (error: any) {
    console.error("Import confirm error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to save transactions",
    });
  }
}
