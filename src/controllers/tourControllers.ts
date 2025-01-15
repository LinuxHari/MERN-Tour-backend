import { Request, Response } from "express";
import {
  addTourToFavorites,
  bookReservedTour,
  cancelBookedTour,
  getBooking,
  getFavoriteTours,
  getReservedDetails,
  getTour,
  getTourReview,
  getTours,
  reserveTour,
  searchSuggestions,
  tourReview
} from "../services/tourServices";
import responseHandler from "../handlers/responseHandler";
import asyncWrapper from "../asyncWrapper";
import { TourListingSchemaType } from "../validators/tourValidators";

export const search = asyncWrapper(async (req: Request, res: Response) => {
  const searchText = req.query.searchText as string;
  const locations = await searchSuggestions(searchText);
  responseHandler.ok(res, locations);
});

export const tours = asyncWrapper(async (req: Request, res: Response) => {
  const tours = await getTours(Object(req.query));
  responseHandler.ok(res, tours);
});

export const tour = asyncWrapper(async (req: Request, res: Response) => {
  const tour = await getTour(req.params.tourId);
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

// export const allBookings = asyncWrapper(async(req: Request, res: Response) => {
//   responseHandler.ok(res, {})
// })

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
  responseHandler.ok(res, { status: "canceled" });
});

export const reviewTour = asyncWrapper(async (req: Request, res: Response) => {
  await tourReview(req.body, req.params.tourId, res.locals.email);
  responseHandler.ok(res, {});
});

export const getReview = asyncWrapper(async (req: Request, res: Response) => {
  const reviews = await getTourReview(req.params.tourId);
  responseHandler.ok(res, reviews);
});

export const addToFavorite = asyncWrapper(async (req: Request, res: Response) => {
  await addTourToFavorites(req.body.tourId, res.locals.email, req.ip);
  responseHandler.ok(res, { message: "Added to favoirites" });
});

export const getUserFavoriteTours = asyncWrapper(async (req: Request, res: Response) => {
  const page = typeof req.query.page === "number" ? req.query.page : 1;
  const favoriteTours = await getFavoriteTours(res.locals.email, page, req.ip);
  responseHandler.ok(res, favoriteTours);
});
