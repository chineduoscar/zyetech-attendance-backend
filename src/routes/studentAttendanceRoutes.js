import { Router } from "express";
import {
  getStudentAttendance,
  recordStudentAttendance,
  signOutStudentAttendance,
  updateStudentAttendance,
  deleteStudentAttendance,
} from "../controllers/studentAttendanceController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/sign-in", recordStudentAttendance);
router.post("/", (_req, res) =>
  res.status(410).json({
    success: false,
    message: "This student attendance link is no longer available.",
    data: null,
  }),
);
router.post("/sign-out", signOutStudentAttendance);
router.get(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  getStudentAttendance,
);
router.put(
  "/:id",
  authenticate,
  authorize("superadmin"),
  updateStudentAttendance,
);
router.delete(
  "/:id",
  authenticate,
  authorize("superadmin"),
  deleteStudentAttendance,
);

export default router;
