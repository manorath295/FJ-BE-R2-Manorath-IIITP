import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import * as importController from "../controllers/import.controller.js";
import { confirmImportSchema } from "../validators/import.validator.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "text/csv",
      "application/csv",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: PDF, CSV, JPEG, PNG, WEBP."));
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

router.post(
  "/confirm",
  requireAuth,
  validate(confirmImportSchema),
  importController.confirmImport,
);

export default router;
