import { Request, Response } from "express";
import responseHandler from "../handlers/responseHandler";
import {
  createTour,
  deletePublishedTour,
  getPublishedTours,
  getAllStats,
  updatePublishedTour,
  getPublishedTour,
  getTotalBookings,
  cancelBookedTour
} from "../services/adminService";
import asyncWrapper from "../asyncWrapper";

export const addTour = asyncWrapper(async (req: Request, res: Response) => {
  const publisherId = await createTour(req.body);
  responseHandler.created(res, { publisherId });
});

export const getTours = asyncWrapper(async (req: Request, res: Response) => {
  const page = typeof req.query.page === "number" ? req.query.page : 1;
  const limit = typeof req.query.limit === "number" ? req.query.limit : 12;
  const tourName = req.query.tourName as string;
  const tours = await getPublishedTours(page, tourName, limit);
  responseHandler.ok(res, tours);
});

export const getTour = asyncWrapper(async (req: Request, res: Response) => {
  const tourId = req.params.tourId as string;
  const tour = await getPublishedTour(tourId);
  responseHandler.ok(res, tour);
});

export const updateTour = asyncWrapper(async (req: Request, res: Response) => {
  await updatePublishedTour(req.body, req.params.tourId);
  responseHandler.ok(res, { message: "Success" });
});

export const deleteTour = asyncWrapper(async (req: Request, res: Response) => {
  await deletePublishedTour(req.params.tourId);
  responseHandler.ok(res, { message: "Success" });
});

export const getStats = asyncWrapper(async (_: Request, res: Response) => {
  const revenue = await getAllStats();
  responseHandler.ok(res, revenue);
});

export const getBookings = asyncWrapper(async (req: Request, res: Response) => {
  const limit = typeof req.query.limit === "number" ? req.query.limit : 10;
  const page = typeof req.query.page === "number" ? req.query.page : 1;
  const status = req.query.status as string;
  const bookingId = req.query.bookingId as string;
  const revenue = await getTotalBookings(page, status, limit, bookingId);
  responseHandler.ok(res, revenue);
});

export const cancelBooking = asyncWrapper(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId as string;
  await cancelBookedTour(bookingId);
  responseHandler.ok(res, { mesage: "success" });
});
