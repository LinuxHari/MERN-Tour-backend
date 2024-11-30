import { Router } from "express";
import adminRoutes from "./adminRoutes";
import tourRoutes from "./tourRoutes";
import userRoutes from "./userRoutes";
import webhookRoutes from "./webhookRoutes"

const router = Router();

router.use("/admin", adminRoutes);
router.use("/tour", tourRoutes);
router.use("/user", userRoutes);
router.use("/webhook", webhookRoutes)

export default router;
