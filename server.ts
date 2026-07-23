import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";

// Safe initialization of Prisma to prevent crashes in preview if DB URL is missing
const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ====================================================
  // TITAN BACKEND WIRING SKELETON (AUTO-GENERATED)
  // Developer: Just plug in your controllers/API keys here.
  // ====================================================

  // Health Check
  app.get("/api/health", async (req, res) => {
    let dbStatus = "disconnected";
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch (e) {
      dbStatus = "error (check DATABASE_URL)";
    }
    res.json({ status: "ok", version: "1.0", environment: process.env.NODE_ENV || "development", dbStatus });
  });

  // --- AUTHENTICATION ENGINE ---
  app.post("/api/auth/login", async (req, res) => {
    try {
      // MOCK: Replace with real password compare
      const { email } = req.body;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) user = await prisma.user.create({ data: { email, name: "Simeon" } });
      res.json({ success: true, token: "mock_jwt_token", user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Database not connected" });
    }
  });

  // --- APP BUILDER ENGINE ---
  app.post("/api/builder/generate", async (req, res) => {
    try {
      const { prompt, accessCode } = req.body;
      const project = await prisma.appProject.create({
        data: {
          name: prompt.substring(0, 50) || "New App",
          ownerId: "system", // Should be user ID from auth
          status: accessCode === 'simeonjrpictures123' ? 'DEPLOYED_OFFLINE' : 'DRAFT'
        }
      });
      res.json({ success: true, message: "App generation started.", data: project });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Database not connected" });
    }
  });

  // --- PRIVATE PAYMENT ENGINE (GODMODE) ---
  app.get("/api/payments/analytics", async (req, res) => {
    try {
      const payments = await prisma.payment.aggregate({ _sum: { amount: true } });
      const activeSubs = await prisma.subscription.count({ where: { status: "ACTIVE" } });
      res.json({ mrr: payments._sum.amount || 0, active_subscriptions: activeSubs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Database not connected" });
    }
  });

  // --- PRIVATE TASK ENGINE (GODMODE) ---
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await prisma.task.findMany();
      res.json({ tasks });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Database not connected" });
    }
  });
  
  app.post("/api/tasks/create", async (req, res) => {
    try {
      const { title, description, payout } = req.body;
      const task = await prisma.task.create({
        data: { title, description, payout, status: "TODO" }
      });
      res.json({ success: true, task });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Database not connected" });
    }
  });

  // --- WORKFORCE & NYSC ENGINE ---
  app.post("/api/workforce/apply", async (req, res) => {
    // Logic for NYSC application
    res.json({ success: true });
  });

  app.get("/api/workforce/tasks", async (req, res) => {
    try {
      const availableTasks = await prisma.task.findMany({ where: { status: "TODO" } });
      res.json({ tasks: availableTasks });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Database not connected" });
    }
  });

  // ====================================================
  // FRONTEND SERVING
  // ====================================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
