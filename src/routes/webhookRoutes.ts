import { Router } from "express";
import { stripeWebhook } from "../controllers/stripeController";

const router = Router();

router.post("/stripe", stripeWebhook)

export default router