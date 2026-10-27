import { Router } from "express";
import { createDirectoryController } from "../controllers/directoryController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

export const createDirectoryRoutes = (kind) => {
  const router = Router();
  const controller = createDirectoryController(kind);

  router.use(authenticate, authorize("admin", "superadmin"));
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", authorize("superadmin"), controller.remove);

  return router;
};
