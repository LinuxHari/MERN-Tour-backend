import { errorMessage } from "../handlers/errorHandler";
import Tour from "../models/tourModel";
import { generateToudId } from "../utils/generateId";
import { TourSchema } from "../utils/validators";
import { ObjectId } from "mongodb";

export const searchSuggestions = async (searchText: string) => {
    const regex = new RegExp(searchText, "i")
    const result = await Tour.aggregate([{
      $match: {
        $or: [
          { city: regex },
          { state: regex },
          { country: regex }
        ]
      }
    },
    {
      $group: {
        _id: null, // Id is mandatory while grouping
        states: {
          $addToSet: { 
            $cond: [{ $regexMatch: { input: "$state", regex } }, "$state", null]
          }
        },
        cities: {
          $addToSet: { 
            $cond: [{ $regexMatch: { input: "$city", regex } }, "$city", null]
          }
        },
        countries: {
          $addToSet: { 
            $cond: [{ $regexMatch: { input: "$country", regex } }, "$country", null]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        states: {
          $filter: {
            input: "$states",
            as: "state",
            cond: { $ne: ["$$state", null] }
          }
        },
        cities: {
          $filter: {
            input: "$cities",
            as: "city",
            cond: { $ne: ["$$city", null] }
          }
        },
        countries: {
          $filter: {
            input: "$countries",
            as: "country",
            cond: { $ne: ["$$country", null] }
          }
        }
      }
    }])

    const [locations] = result;
    const fallbackValue = { states: [], cities: [], countries: [] }

    return locations || fallbackValue
}

export const createTour = async (tourData: TourSchema) => {
  const newTour = {
    ...tourData,
    markAsDeleted: false,
    tourId: generateToudId(),
    duration: tourData.itinerary.length,
    submissionStatus: "Approved",
    recurringEndDate: new Date(),
    publisher: new ObjectId(),
  };

  await Tour.create(newTour);
};

export const updateTour = async (tourId: string, tourData: TourSchema) => {
  const existingTour = await Tour.findOne({ tourId });

  if (!existingTour) {
    throw new Error(errorMessage.notFound);
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
