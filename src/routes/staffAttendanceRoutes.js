import { Router } from "express";
import {
  getStaffAttendance,
  recordStaffAttendance,
  signOutStaffAttendance,
  updateStaffAttendance,
  deleteStaffAttendance,
} from "../controllers/staffAttendanceController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", recordStaffAttendance);
router.post("/sign-out", signOutStaffAttendance);
router.get("/", authenticate, authorize("admin", "superadmin"), getStaffAttendance);
router.put("/:id", authenticate, authorize("superadmin"), updateStaffAttendance);
router.delete("/:id", authenticate, authorize("superadmin"), deleteStaffAttendance);

export default router;
