import { Request, Response } from "express";
import {
  bookReservedTour,
  cancelBookedTour,
  deleteTourReview,
  getBooking,
  getReservedDetails,
  getSingleTourAvailability,
  getTopPopularTours,
  getTopTrendingTours,
  getTour,
  getTourReview,
  getTours,
  getToursByCategory,
  reserveTour,
  searchSuggestions,
  tourReview,
  updateTourReview
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
  const { data } = verifyToken(req.signedCookies["accessToken"]);
  const tours = await getTours(Object(req.query), data?.id);
  responseHandler.ok(res, tours);
});

export const toursByCategory = asyncWrapper(async (req: Request, res: Response) => {
  const { data } = verifyToken(req.signedCookies["accessToken"]);
  const category = req.params.category;
  const limit = typeof req.query.limit === "number" ? req.query.limit : 10;
  const tours = await getToursByCategory(Object(req.query), category, limit, data?.id);
  responseHandler.ok(res, tours);
});

export const tour = asyncWrapper(async (req: Request, res: Response) => {
  const { data } = verifyToken(req.signedCookies["accessToken"]);
  const tour = await getTour(req.params.tourId, data?.id);
  responseHandler.ok(res, tour);
});

export const reserve = asyncWrapper(async (req: Request, res: Response) => {
  const reserveId = await reserveTour(req.body, res.locals.id);
  responseHandler.ok(res, { reserveId });
});

export const reservedDetails = asyncWrapper(async (req: Request, res: Response) => {
  const reserved = await getReservedDetails(req.params.reserveId, res.locals.id);
  responseHandler.ok(res, reserved);
});

export const bookedTour = asyncWrapper(async (req: Request, res: Response) => {
  const booking = await getBooking(req.params.bookingId, res.locals.id);
  responseHandler.ok(res, booking);
});

export const bookTour = asyncWrapper(async (req: Request, res: Response) => {
  const { clientSecret, bookingId } = await bookReservedTour(req.body, req.params.reserveId, res.locals.id);
  responseHandler.ok(res, { clientSecret, bookingId });
});

export const cancelBooking = asyncWrapper(async (req: Request, res: Response) => {
  await cancelBookedTour(req.params.bookingId, res.locals.id);
  responseHandler.ok(res, { status: "canceled" });
});

export const reviewTour = asyncWrapper(async (req: Request, res: Response) => {
  await tourReview(req.body, req.params.tourId, res.locals.id);
  responseHandler.ok(res, { message: "success" });
});

export const updateReview = asyncWrapper(async (req: Request, res: Response) => {
  await updateTourReview(req.body, req.params.tourId, res.locals.id);
  responseHandler.ok(res, { message: "success" });
});

export const getReview = asyncWrapper(async (req: Request, res: Response) => {
  const limit = typeof req.query.limit === "number" ? req.query.limit : 10;
  const { data } = verifyToken(req.signedCookies["accessToken"]);
  const reviews = await getTourReview(req.params.tourId, limit, data?.id);
  responseHandler.ok(res, reviews);
});

export const deleteReview = asyncWrapper(async (req: Request, res: Response) => {
  await deleteTourReview(req.params.tourId, res.locals.id);
  responseHandler.ok(res, { message: "success" });
});

export const getPopularTours = asyncWrapper(async (req: Request, res: Response) => {
  const limit = typeof req.query.limit === "number" ? req.query.limit : 8;
  const tours = await getTopPopularTours(limit);
  responseHandler.ok(res, tours);
});

export const getTrendingTours = asyncWrapper(async (req: Request, res: Response) => {
  const limit = typeof req.query.limit === "number" ? req.query.limit : 10;
  const tours = await getTopTrendingTours(limit);
  responseHandler.ok(res, tours);
});

export const getTourAvailability = asyncWrapper(async (req: Request, res: Response) => {
  const tourId = req.params.tourId;
  const availability = await getSingleTourAvailability(tourId);
  responseHandler.ok(res, availability);
});
