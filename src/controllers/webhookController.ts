import { Request, Response } from "express";
import asyncWrapper from "../asyncWrapper";
import {
  stripeAuthorized,
  stripeFailed,
  stripeSuccess,
  stripeValidate,
} from "../services/stripeService";
import responseHandler from "../handlers/responseHandler";

export const stripeWebhook = asyncWrapper((req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const data = req.body;
  const event = stripeValidate({ data, signature });
  switch (event.type) {
    case "payment_intent.amount_capturable_updated":
      stripeAuthorized(event.data.object.metadata.bookingId);
      break;
    case "payment_intent.succeeded":
      stripeSuccess({
        amountCharged: event.data.object.amount_received,
        bookingId: event.data.object.metadata.bookingId,
        userId: event.data.object.metadata.userId,
      });
      break;
    case "payment_intent.payment_failed":
      stripeFailed(event.data.object.metadata.bookingId);
      break;
    default:
      return responseHandler.ok(res, { message: "success" });
  }
});
