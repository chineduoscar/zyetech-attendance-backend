import { Router } from "express";
import {
  deleteStaff,
  getStaff,
  getStaffMember,
  registerStaff,
  updateStaff,
} from "../controllers/staffController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", registerStaff);
router.get("/", authenticate, authorize("admin", "superadmin"), getStaff);
router.get("/:id", authenticate, authorize("admin", "superadmin"), getStaffMember);
router.put("/:id", authenticate, authorize("superadmin"), updateStaff);
router.delete("/:id", authenticate, authorize("superadmin"), deleteStaff);

export default router;
