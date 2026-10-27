import { Router } from "express";
import {
  getStudentAttendance,
  recordStudentAttendance,
  updateStudentAttendance,
  deleteStudentAttendance,
} from "../controllers/studentAttendanceController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", recordStudentAttendance);
router.get("/", authenticate, authorize("admin", "superadmin"), getStudentAttendance);
router.put("/:id", authenticate, authorize("superadmin"), updateStudentAttendance);
router.delete("/:id", authenticate, authorize("superadmin"), deleteStudentAttendance);

export default router;
