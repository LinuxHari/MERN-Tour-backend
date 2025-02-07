import { Router } from "express";
import adminRoutes from "./adminRoutes";
import tourRoutes from "./tourRoutes";
import userRoutes from "./userRoutes";
import verifyAuthToken from "../middlewares/verifyAuthToken";
import verifyAdmin from "../middlewares/verifyAdmin";

const router = Router();

router.use("/admin", verifyAuthToken, verifyAdmin, adminRoutes);
router.use("/tour", tourRoutes);
router.use("/user", userRoutes);

export default router;
