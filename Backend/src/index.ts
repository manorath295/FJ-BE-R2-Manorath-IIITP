import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import categoryRoutes from "./routes/category.routes.js";
import budgetRoutes from "./routes/budget.route.js";
import transactionRoutes from "./routes/transaction.routes.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS middleware - Fix for Better Auth
app.use((req, res, next) => {
  // Allow frontend origin
  const origin = req.headers.origin || "http://localhost:5173";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie",
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
app.use("/api/auth", toNodeHandler(auth));

// Category routes
app.use("/api/categories", categoryRoutes);

// Budget routes
app.use("/api/budgets", budgetRoutes);

// Transaction routes
app.use("/api/transactions", transactionRoutes);

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Finance Tracker API");
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`\n📍 Auth Endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/sign-up/email`);
  console.log(`   POST http://localhost:${PORT}/api/auth/sign-in/email`);
  console.log(`   POST http://localhost:${PORT}/api/auth/sign-out`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/get-session`);
  console.log(`\n📁 Category Endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/api/categories`);
  console.log(`   POST   http://localhost:${PORT}/api/categories`);
  console.log(`   PUT    http://localhost:${PORT}/api/categories/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/categories/:id`);
  console.log(`\n💰 Budget Endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/api/budgets`);
  console.log(`   POST   http://localhost:${PORT}/api/budgets`);
  console.log(`   PUT    http://localhost:${PORT}/api/budgets/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/budgets/:id`);
  console.log(`\n💸 Transaction Endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/api/transactions`);
  console.log(`   GET    http://localhost:${PORT}/api/transactions/:id`);
  console.log(`   POST   http://localhost:${PORT}/api/transactions`);
  console.log(`   PUT    http://localhost:${PORT}/api/transactions/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/transactions/:id`);
  console.log(`\n📝 Test:`);
  console.log(`   GET  http://localhost:${PORT}/api/test (protected)`);
});

export default app;
