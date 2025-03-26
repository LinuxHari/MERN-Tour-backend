import { Router, raw } from "express";
import { stripeWebhook, upstashWebhook } from "../controllers/webhookController";

const router = Router();

router.post("/stripe", raw({ type: "application/json" }), stripeWebhook);
router.post("/upstash", raw({ type: "application/json" }), upstashWebhook);

export default router;
