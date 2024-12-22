import { Request, Response } from "express";
import { bookReservedTour, cancelBookedTour, getBooking, getReservedDetails, getTour, getTours, reserveTour, searchSuggestions } from "../services/tourServices";
import responseHandler from "../handlers/responseHandler";
import asyncWrapper from "../asyncWrapper";
import { TourListingSchemaType } from "../validators/tourValidators";

export const search = asyncWrapper(async (req: Request, res: Response) => {
  const searchText = req.query.searchText as string;
  const locations = await searchSuggestions(searchText);
  responseHandler.ok(res, locations);
});

export const tours = asyncWrapper(
  async (req: Request<{}, {}, {}, TourListingSchemaType>, res: Response) => {
    const tours = await getTours(req.query);
    responseHandler.ok(res, tours);
  }
);

export const tour = asyncWrapper(async (req: Request, res: Response) => {
  const tour = await getTour(req.params.tourId);
  responseHandler.ok(res, tour);
});

export const reserve = asyncWrapper(async (req: Request, res: Response) => {
  const reserveId = await reserveTour(req.body, res.locals.email);
  responseHandler.ok(res, { reserveId });
});

export const reservedDetails = asyncWrapper(async (req: Request, res: Response) => {
  const reserved = await getReservedDetails(req.params.reserveId, res.locals.email)
  responseHandler.ok(res, reserved)
})

export const allBookings = asyncWrapper(async(req: Request, res: Response) => {
  responseHandler.ok(res, {})
})

export const bookedTour = asyncWrapper(async(req: Request, res: Response) => {
  const booking = await getBooking(req.params.bookingId, res.locals.email)
  responseHandler.ok(res, booking)
})

export const bookTour = asyncWrapper(async (req: Request, res: Response) => {
  const {clientSecret, bookingId } = await bookReservedTour(req.body, req.params.reserveId, res.locals.email)
  responseHandler.ok(res, { clientSecret, bookingId })
})

export const cancelBooking = asyncWrapper(async (req: Request, res: Response) => {
  await cancelBookedTour(req.params.bookingId, res.locals.email)
  responseHandler.ok(res, {status: "canceled"})
})
