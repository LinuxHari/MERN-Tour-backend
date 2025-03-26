import { Request, Response } from "express";
import asyncWrapper from "../asyncWrapper";
import { stripeAuthorized, stripeFailed, stripeSuccess, stripeValidate } from "../services/stripeService";
import responseHandler from "../handlers/responseHandler";
import { upstashValidate } from "../services/upstashService";
import { upstashPublishData } from "../type";
import { BadRequestError, NotFoundError } from "../handlers/errorHandler";
import Availability from "../models/availabilityModel";
import Reserved from "../models/reserveModel";
import Booking from "../models/bookingModel";

export const stripeWebhook = asyncWrapper(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const data = req.body;
  const event = stripeValidate({ data, signature });
  switch (event.type) {
    case "payment_intent.amount_capturable_updated":
      await stripeAuthorized(event.data.object.metadata.bookingId);
      break;
    case "payment_intent.succeeded":
      await stripeSuccess({
        amountCharged: event.data.object.amount_received / 100,
        bookingId: event.data.object.metadata.bookingId,
        userId: event.data.object.metadata.userId,
        data: event.data.object
      });
      break;
    case "payment_intent.payment_failed":
      await stripeFailed(event.data.object.metadata.bookingId, event.data.object);
      break;
    default:
      return responseHandler.ok(res, { message: "success" });
  }
  return responseHandler.ok(res, { message: "success" });
});

export const upstashWebhook = asyncWrapper(async (req: Request, res: Response) => {
  // const signature = req.headers["upstash-signature"] as string;
  // const isValidData = await upstashValidate({ signature, body: req.body });
  // if (!isValidData) {
  //   throw new BadRequestError(`Invalid signature from upstash ${signature}`);
  // }

  const { eventType, reserveId } = JSON.parse(req.body) as upstashPublishData["body"];
  switch (eventType) {
    case "reserve":
      const reservedTour = await Reserved.findOne(
        { reserveId: reserveId },
        { startDate: 1, passengers: 1, tourId: 1 }
      ).lean();
      if (!reservedTour) throw new NotFoundError(`Invalid reserve id ${reserveId} recieved in upstash webhook`);
      const bookedTour = await Booking.findOne({ reserveId: reservedTour._id });
      if (!bookedTour) {
        reservedTour.startDate?.setUTCHours(0, 0, 0, 0);

        const availabilityDetails = await Availability.findOne({
          tourId: reservedTour.tourId,
          date: {
            $gte: reservedTour.startDate,
            $lt: new Date((reservedTour.startDate?.getTime() || 0) + 24 * 60 * 60 * 1000)
          }
        });
        if (!availabilityDetails)
          throw new BadRequestError(
            `Availability information is missing for reserved tour ${reservedTour.tourId} ${reservedTour.startDate?.toString()}`
          );
        const totalPassengers =
          reservedTour.passengers.adults +
          (reservedTour.passengers?.teens || 0) +
          (reservedTour.passengers?.children || 0) +
          (reservedTour.passengers?.infants || 0);

        availabilityDetails.availableSeats = availabilityDetails.availableSeats + totalPassengers;
        await availabilityDetails.save();
      }
      return responseHandler.ok(res, { message: "success" });
    default:
      throw new BadRequestError(`Invalid upstash event ${reserveId}`);
  }
});
