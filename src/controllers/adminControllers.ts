import { Request, Response } from "express";
import Tour, { TourModel } from "../models/tourModel";
import responseHandler from "../handlers/responseHandler";
import { ObjectId } from "mongodb";
import { TourSchema } from "../utils/validators";
import {Types} from "mongoose"

export const addTour = async (req: Request<{}, {}, TourSchema>, res: Response) => {
  try {
    const newTour: TourModel = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      highlights: req.body.highlights,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      price: req.body.price,
      itinerary: req.body.itinerary as Types.DocumentArray<typeof req.body.itinerary[number]>, // [number] is to get type from [type]
      languages: req.body.languages,
      minAge: req.body.minAge,
      freeCancellation: req.body.freeCancellation,
      faq: req.body.faq as Types.DocumentArray<typeof req.body.faq[number]>,
      markAsDeleted: false,
      images: [""],
      duration: 3,
      submissionStatus: "approved",
      recurringEndDate: new Date(),
      publisher: new ObjectId
    }
    
    await Tour.create(newTour)

    responseHandler.created(res, { message: "Tour added successfully" });
  } catch (e) {
    responseHandler.error(res);
  }
};
