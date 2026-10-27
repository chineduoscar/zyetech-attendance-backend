import { Router } from "express";
import { getAttendanceAnalytics } from "../controllers/analyticsController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  getAttendanceAnalytics,
);

export default router;
