import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import {auth} from "./src/lib/auth.js"
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Finance Tracker API",
    timestamp: new Date().toISOString(),
  });
});

// Better Auth - handles signup, login, logout, sessions automatically
app.all("/api/auth/*", toNodeHandler(auth));

// Test protected route
app.get("/api/test", async (req, res) => {
  const session = await auth.api.getSession({
    headers: req.headers as any,
  });

  if (!session) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  res.json({
    success: true,
    message: "Authenticated!",
    user: session.user,
  });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Finance Tracker API");
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`\n📍 Auth Endpoints (Better Auth):`);
  console.log(`   POST http://localhost:${PORT}/api/auth/sign-up/email`);
  console.log(`   POST http://localhost:${PORT}/api/auth/sign-in/email`);
  console.log(`   POST http://localhost:${PORT}/api/auth/sign-out`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/get-session`);
});

export default app;
