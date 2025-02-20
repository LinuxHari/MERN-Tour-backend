import { Request, Response } from "express";
import {
  bookReservedTour,
  cancelBookedTour,
  getBooking,
  getReservedDetails,
  getTour,
  getTourReview,
  getTours,
  reserveTour,
  searchSuggestions,
  tourReview
} from "../services/tourService";
import responseHandler from "../handlers/responseHandler";
import asyncWrapper from "../asyncWrapper";
import { verifyToken } from "../utils/authTokenManager";

export const search = asyncWrapper(async (req: Request, res: Response) => {
  const searchText = req.query.searchText as string;
  const locations = await searchSuggestions(searchText);
  responseHandler.ok(res, locations);
});

export const tours = asyncWrapper(async (req: Request, res: Response) => {
  const { data } = verifyToken(req.signedCookies["authToken"]);
  const tours = await getTours(Object(req.query), data?.email);
  responseHandler.ok(res, tours);
});

export const tour = asyncWrapper(async (req: Request, res: Response) => {
  const { data } = verifyToken(req.signedCookies["authToken"]);
  const tour = await getTour(req.params.tourId, data?.email);
  responseHandler.ok(res, tour);
});

export const reserve = asyncWrapper(async (req: Request, res: Response) => {
  const reserveId = await reserveTour(req.body, res.locals.email);
  responseHandler.ok(res, { reserveId });
});

export const reservedDetails = asyncWrapper(async (req: Request, res: Response) => {
  const reserved = await getReservedDetails(req.params.reserveId, res.locals.email);
  responseHandler.ok(res, reserved);
});

export const bookedTour = asyncWrapper(async (req: Request, res: Response) => {
  const booking = await getBooking(req.params.bookingId, res.locals.email);
  responseHandler.ok(res, booking);
});

export const bookTour = asyncWrapper(async (req: Request, res: Response) => {
  const { clientSecret, bookingId } = await bookReservedTour(
    req.body,
    req.params.reserveId,
    res.locals.email
  );
  responseHandler.ok(res, { clientSecret, bookingId });
});

export const cancelBooking = asyncWrapper(async (req: Request, res: Response) => {
  await cancelBookedTour(req.params.bookingId, res.locals.email);
  responseHandler.ok(res, { status: "Canceled" });
});

export const reviewTour = asyncWrapper(async (req: Request, res: Response) => {
  await tourReview(req.body, req.params.tourId, res.locals.email);
  responseHandler.ok(res, {});
});

export const getReview = asyncWrapper(async (req: Request, res: Response) => {
  const reviews = await getTourReview(req.params.tourId);
  responseHandler.ok(res, reviews);
});
