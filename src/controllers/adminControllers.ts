import { Request, Response } from "express";
import responseHandler from "../handlers/responseHandler";
import { createTour } from "../services/tourService";

export const addTour = async (req: Request, res: Response) => {
  try {
    await createTour(req.body)
    responseHandler.created(res, { message: "Tour added successfully" });
  } catch (e) {
    responseHandler.error(res);
  }
};
