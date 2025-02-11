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
          $sum: [
            "$passengers.adults",
            "$passengers.teens",
            "$passengers.children",
            "$passengers.infants"
          ]
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
  getFavoriteTours: (
    tourIds: mongoose.Types.ObjectId[],
    page: number,
    limit: number
  ): PipelineStage[] => [
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
        as: "destination"
      }
    },
    {
      $unwind: {
        path: "$destination",
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
              location: "$destination.destination",
              title: "$name",
              rating: "$averageRating",
              reviewCount: "$totalRatings",
              price: "$price.adult",
              duration: 1,
              imgUrl: "$images",
              tourId: 1,
              destinationId: 1
            }
          }
        ],
        totalCount: [{ $count: "count" }]
      }
    }
  ]
};

export default userAggregations;
