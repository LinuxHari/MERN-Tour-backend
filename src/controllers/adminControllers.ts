import { Request, Response } from "express";
import responseHandler from "../handlers/responseHandler";
import { createTour } from "../services/tourService";
import asyncWrapper from "../asyncWrapper";

export const addTour = asyncWrapper(async (req: Request, res: Response) => {
  await createTour(req.body)
  responseHandler.created(res, { message: "Tour added successfully" });
})
