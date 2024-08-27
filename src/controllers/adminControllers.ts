import { NextFunction, Request, Response } from "express";
import responseHandler from "../handlers/responseHandler";
import { createTour } from "../services/tourService";

export const addTour = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await createTour(req.body)
    responseHandler.created(res, { message: "Tour added successfully" });
  } catch (err) {
    next(err);
  }
};
