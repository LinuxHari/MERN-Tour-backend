import Tour from "../models/tourModel";
import { generateToudId } from "../utils/generateId";
import { TourSchema } from "../utils/validators";
import { ObjectId } from "mongodb";

export const createTour = async (tourData: TourSchema) => {
  const newTour = {
    ...tourData,
    markAsDeleted: false,
    tourId: generateToudId(),
    images: [""],
    duration: tourData.itinerary.length,
    submissionStatus: "approved",
    recurringEndDate: new Date(),
    publisher: new ObjectId(),
  };

  await Tour.create(newTour);
};

export const updateTour = async (tourId: string, tourData: TourSchema) => {
  const existingTour = await Tour.findOne({ tourId });

  if (!existingTour) {
    throw new Error("Not found");
  }

  const updatedTour = {
    ...tourData,
    duration: tourData.itinerary.length,
    submissionStatus: existingTour.submissionStatus,
    recurringEndDate: existingTour.recurringEndDate,
    publisher: existingTour.publisher,
  };

  await Tour.updateOne({ tourId }, updatedTour, { runValidators: true });
};
