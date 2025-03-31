import mongoose, { PipelineStage } from "mongoose";
import { BookingStatusSchemaType } from "../validators/userValidators";

const userAggregations = {
  userBookings: (
    userId: mongoose.Types.ObjectId,
    page: number,
    status: BookingStatusSchemaType["status"],
    limit: number
  ): PipelineStage[] => [
    {
      $match: {
        userId,
        bookingStatus: status === "pending" ? "init" : status === "confirmed" ? "success" : status
      }
    },
    {
      $lookup: {
        from: "tours",
        localField: "tourId",
        foreignField: "tourId",
        as: "tourDetails"
      }
    },
    {
      $unwind: "$tourDetails"
    },
    {
      $project: {
        _id: 0,
        price: {
          $arrayElemAt: ["$transaction.history.amount", -1] // Get the latest transaction amount
        },
        duration: "$tourDetails.duration",
        startDate: 1,
        tour: {
          name: "$tourDetails.name",
          imgUrl: { $arrayElemAt: ["$tourDetails.images", 0] }
        },
        passengers: {
          $sum: ["$passengers.adults", "$passengers.teens", "$passengers.children", "$passengers.infants"]
        },
        bookingId: 1,
        bookedDate: "$createdAt",
        status: {
          $cond: [
            { $eq: ["$bookingStatus", "success"] },
            "Confirmed",
            { $cond: [{ $eq: ["$bookingStatus", "init"] }, "Pending", "Canceled"] }
          ]
        }
      }
    },
    {
      $sort: { bookedDate: -1 }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    }
  ],
  getFavoriteTours: (tourIds: mongoose.Types.ObjectId[], page: number, limit: number): PipelineStage[] => [
    {
      $match: {
        _id: { $in: tourIds },
        markAsDeleted: false
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "destinations",
        localField: "destinationId",
        foreignField: "destinationId",
        as: "cityDetails"
      }
    },
    {
      $unwind: {
        path: "$cityDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "destinations",
        localField: "cityDetails.parentDestinationId",
        foreignField: "destinationId",
        as: "stateDetails"
      }
    },
    {
      $unwind: {
        path: "$stateDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "destinations",
        localField: "stateDetails.parentDestinationId",
        foreignField: "destinationId",
        as: "countryDetails"
      }
    },
    {
      $unwind: {
        path: "$countryDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $facet: {
        tours: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              title: "$name",
              rating: "$averageRating",
              reviewCount: "$totalRatings",
              price: "$price.adult",
              duration: 1,
              images: "$images",
              tourId: 1,
              city: {
                id: "$cityDetails.destinationId",
                name: "$cityDetails.destination"
              },
              state: {
                id: "$stateDetails.destinationId",
                name: "$stateDetails.destination"
              },
              country: {
                id: "$countryDetails.destinationId",
                name: "$countryDetails.destination"
              }
            }
          }
        ],
        totalCount: [{ $count: "count" }]
      }
    }
  ],
  getFavoriteToursIds: (email: string) => [
    {
      $match: { email, isVerified: true }
    },
    {
      $lookup: {
        from: "tours",
        localField: "favorites",
        foreignField: "_id",
        as: "favoriteTours"
      }
    },
    {
      $project: {
        _id: 0,
        favoriteTourIds: {
          $map: {
            input: "$favoriteTours",
            as: "fav",
            in: "$$fav.tourId"
          }
        }
      }
    },
    {
      $unwind: "$favoriteTourIds"
    },
    {
      $group: {
        _id: null,
        tourIds: { $push: "$favoriteTourIds" }
      }
    },
    {
      $project: {
        _id: 0,
        tourIds: 1
      }
    }
  ]
};

export default userAggregations;
