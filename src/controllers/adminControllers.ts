import { Request, Response } from "express";
import responseHandler from "../handlers/responseHandler";
import { createTour, getPublishedTours } from "../services/adminServices";
import asyncWrapper from "../asyncWrapper";

export const addTour = asyncWrapper(async (req: Request, res: Response) => {
  const publisherId = await createTour(req.body);
  responseHandler.created(res, { publisherId });
});

export const getTours = asyncWrapper(async (req: Request, res: Response) => {
  const page = typeof req.query.page === "number" ? req.query.page : 1;
  const response = await getPublishedTours(page);
  responseHandler.ok(res, response);
});
