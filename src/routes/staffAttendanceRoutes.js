import { Router } from "express";
import {
  getStaffAttendance,
  recordStaffAttendance,
  updateStaffAttendance,
  deleteStaffAttendance,
} from "../controllers/staffAttendanceController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", recordStaffAttendance);
router.get("/", authenticate, authorize("admin", "superadmin"), getStaffAttendance);
router.put("/:id", authenticate, authorize("superadmin"), updateStaffAttendance);
router.delete("/:id", authenticate, authorize("superadmin"), deleteStaffAttendance);

export default router;
