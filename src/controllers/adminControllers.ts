import { Request, Response } from "express";
import responseHandler from "../handlers/responseHandler";
import {
  createTour,
  deletePublishedTour,
  getPublishedTours,
  getAllStats,
  updatePublishedTour,
  getPublishedTour
} from "../services/adminService";
import asyncWrapper from "../asyncWrapper";

export const addTour = asyncWrapper(async (req: Request, res: Response) => {
  const publisherId = await createTour(req.body);
  responseHandler.created(res, { publisherId });
});

export const getTours = asyncWrapper(async (req: Request, res: Response) => {
  const page = typeof req.query.page === "number" ? req.query.page : 1;
  const tourName = req.query.tourName as string;
  const tours = await getPublishedTours(page, tourName);
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

export const getStats = asyncWrapper(async (req: Request, res: Response) => {
  const revenue = await getAllStats();
  responseHandler.ok(res, revenue);
});
