import { errorMessage } from "../handlers/errorHandler";
import Tour from "../models/tourModel";
import { generateToudId } from "../utils/generateId";
import { TourSchema } from "../utils/validators";
import { ObjectId } from "mongodb";

export const searchSuggestions = async (searchText: string) => {
    const regex = new RegExp(searchText, "i")
    const result = await Tour.aggregate(
      [
        {
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
            _id: null,
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
        },
        {
          $project: {
            states: {
              $cond: {
                if: { $gt: [{ $size: "$states" }, 0] },
                then: { $slice: ["$states", 5] },
                else: "$$REMOVE"
              }
            },
            cities: {
              $cond: {
                if: { $gt: [{ $size: "$cities" }, 0] },
                then: {
                  $slice: [
                    "$cities",
                    { $subtract: [5, { $size: "$states" }] }
                  ]
                },
                else: "$$REMOVE"
              }
            },
            countries: {
              $cond: {
                if: { $gt: [{ $size: "$countries" }, 0] },
                then: {
                  $slice: [
                    "$countries",
                    { $subtract: [5, { $add: [{ $size: "$states" }, { $size: "$cities" }] }] }
                  ]
                },
                else: "$$REMOVE"
              }
            }
          }
        }
      ]
      
    )

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
