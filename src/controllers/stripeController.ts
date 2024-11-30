import { Request, Response } from "express";
import asyncWrapper from "../asyncWrapper";
import { stripeValidate } from "../services/stripeService";
import responseHandler from "../handlers/responseHandler";

export const stripeWebhook = asyncWrapper((req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const data = req.body;
  const event = stripeValidate({data, signature})
  switch (event.type) {
    case "payment_intent.amount_capturable_updated":
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
    default: 
        responseHandler.ok(res, {message: "success"})
  }
});
