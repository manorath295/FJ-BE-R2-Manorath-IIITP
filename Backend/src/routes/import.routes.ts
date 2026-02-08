import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import * as importController from "../controllers/import.controller";
import { confirmImportSchema } from "../validators/import.validator";

const router = Router();

// Configure multer for memory storage (we'll process the buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "text/csv", "application/csv"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and CSV files are allowed."));
    }
  },
});

// Preview imported transactions
router.post(
  "/preview",
  requireAuth,
  upload.single("statement"),
  importController.previewImport,
);

// Confirm and save transactions
router.post(
  "/confirm",
  requireAuth,
  validate(confirmImportSchema),
  importController.confirmImport,
);

export default router;
