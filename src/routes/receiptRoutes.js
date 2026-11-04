import { Router } from "express";
import {
  createReceipt,
  deleteReceipt,
  getReceipts,
} from "../controllers/receiptController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate, authorize("admin", "superadmin"));
router.get("/", getReceipts);
router.post("/", createReceipt);
router.delete("/:id", authorize("superadmin"), deleteReceipt);

export default router;
