import mongoose, { PipelineStage } from "mongoose";

const bookingAggregations = {
  userBookings: (userId: mongoose.Types.ObjectId, page: number, limit: number): PipelineStage[] => [
    {
      $match: {
        userId
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
        price: "$tourDetails.price",
        duration: "$tourDetails.duration",
        startDate: 1,
        tourName: "$tourDetails.name",
        tourId: 1,
        bookingId: 1,
        imgURL: { $arrayElemAt: ["$tourDetails.images", 0] },
        bookedDate: "$createdAt",
        status: "$bookingStatus"
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
  ]
};

export default bookingAggregations;
