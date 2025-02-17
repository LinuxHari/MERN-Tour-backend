import { Router, raw } from "express";
import { stripeWebhook } from "../controllers/webhookController";

const router = Router();

router.post("/stripe", raw({ type: "application/json" }), stripeWebhook);

export default router;
