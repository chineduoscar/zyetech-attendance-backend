import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./src/routes/authRoutes.js";
import analyticsRoutes from "./src/routes/analyticsRoutes.js";
import studentAttendanceRoutes from "./src/routes/studentAttendanceRoutes.js";
import staffAttendanceRoutes from "./src/routes/staffAttendanceRoutes.js";
import receiptRoutes from "./src/routes/receiptRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import studentRoutes from "./src/routes/studentRoutes.js";
import staffRoutes from "./src/routes/staffRoutes.js";
import { swaggerSpec } from "./src/config/swagger.js";
import { initDatabase, pool } from "./src/config/db.js";
import { protectCookieRequests } from "./src/middleware/csrfMiddleware.js";
import { errorLogger, requestLogger } from "./src/middleware/requestLogger.js";
import { logger } from "./src/utils/logger.js";

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(requestLogger);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
  }),
);
app.use(protectCookieRequests);
app.use(express.json({ limit: "12mb" }));
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/student-attendance", studentAttendanceRoutes);
app.use("/api/staff-attendance", staffAttendanceRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/receipts", receiptRoutes);
app.use(errorLogger);

const start = async () => {
  if (!process.env.DATABASE_URL) {
    logger.error(
      "server.configuration_error",
      new Error("DATABASE_URL is required to start the server."),
    );
    process.exitCode = 1;
    return;
  }

  try {
    await pool.query("SELECT 1");
    await initDatabase();
    logger.info("database.connected");

    app.listen(PORT, () => {
      logger.info("server.started", { port: PORT });
    });
  } catch (error) {
    logger.error("server.startup_failed", error);
    await pool.end();
    process.exitCode = 1;
  }
};

start();
