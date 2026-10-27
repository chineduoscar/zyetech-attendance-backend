import { Router } from "express";
import {
  deleteStudent,
  getStudent,
  getStudents,
  registerStudent,
  updateStudent,
} from "../controllers/studentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", registerStudent);
router.get("/", authenticate, authorize("admin", "superadmin"), getStudents);
router.get("/:id", authenticate, authorize("admin", "superadmin"), getStudent);
router.put("/:id", authenticate, authorize("superadmin"), updateStudent);
router.delete("/:id", authenticate, authorize("superadmin"), deleteStudent);

export default router;
