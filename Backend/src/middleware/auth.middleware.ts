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
    console.log("[AUTH] Checking session for:", req.path);
    console.log("[AUTH] Headers:", JSON.stringify(req.headers.cookie));

    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    console.log("[AUTH] Session result:", session ? "Found" : "Not found");

    if (!session || !session.user) {
      console.log("[AUTH] No valid session found");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    console.log("[AUTH] User authenticated:", session.user.email);
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
