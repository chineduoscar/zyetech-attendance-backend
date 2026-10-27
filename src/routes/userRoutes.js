import { Router } from "express";
import {
  getUsers,
  updateUserApproval,
  updateUserRole,
} from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, authorize("admin", "superadmin"), getUsers);
router.patch(
  "/:id/approval",
  authenticate,
  authorize("superadmin"),
  updateUserApproval,
);
router.patch(
  "/:id/role",
  authenticate,
  authorize("superadmin"),
  updateUserRole,
);

export default router;
