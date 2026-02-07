import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    req.userId = session.user.id;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
}
