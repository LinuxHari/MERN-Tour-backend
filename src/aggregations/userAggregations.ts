import mongoose, { PipelineStage } from "mongoose";
import { BookingStatusSchemaType } from "../validators/userValidators";
import { CURRENCY_CODES } from "../config/otherConfig";

const userAggregations = {
  userBookings: (
    userId: mongoose.Types.ObjectId,
    page: number,
    status: BookingStatusSchemaType["status"],
    limit: number,
    bookingId?: string
  ): PipelineStage[] => {
    const currencyBranches = Object.entries(CURRENCY_CODES).map(([currency, symbol]) => ({
      case: { $eq: ["$latestCurrency", currency] },
      then: { $literal: symbol }
    }));

    const matchStage: PipelineStage.Match = {
      $match: {
        userId,
        bookingStatus: status === "pending" ? "init" : status === "confirmed" ? "success" : status
      }
    };

    if (bookingId) {
      matchStage.$match.bookingId = { $regex: bookingId, $options: "i" };
    }

    return [
      matchStage,
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
        $addFields: {
          latestCurrency: { $arrayElemAt: ["$transaction.history.currency", -1] }
        }
      },
      {
        $project: {
          _id: 0,
          amount: {
            $arrayElemAt: ["$transaction.history.amount", -1]
          },
          currency: "$latestCurrency",
          currencyCode: {
            $switch: {
              branches: currencyBranches,
              default: { $literal: "" }
            }
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
              { $cond: [{ $eq: ["$bookingStatus", "pending"] }, "Pending", "Canceled"] }
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
    ];
  },
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
  ],
  getUserStats: (currentDate: Date, monthsArray: Date[], userId: mongoose.Types.ObjectId): PipelineStage[] => [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        bookingStatus: "success"
      }
    },
    {
      $lookup: {
        from: "tours",
        localField: "tourId",
        foreignField: "tourId",
        as: "tourInfo"
      }
    },

    {
      $unwind: {
        path: "$tourInfo",
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $lookup: {
        from: "destinations",
        let: { destId: "$tourInfo.destinationId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$destinationId", "$$destId"] }, { $eq: ["$destinationType", "City"] }]
              }
            }
          }
        ],
        as: "destination"
      }
    },
    {
      $facet: {
        totalBookings: [{ $count: "count" }],

        upcomingTrips: [
          {
            $match: {
              startDate: { $gt: currentDate }
            }
          },
          { $count: "count" }
        ],

        totalDestinations: [
          {
            $match: {
              "destination.0": { $exists: true }
            }
          },
          {
            $group: {
              _id: "$destination.destinationId",
              name: { $first: "$destination.destination" }
            }
          },
          {
            $count: "count"
          }
        ],

        totalDays: [
          {
            $project: {
              daysDifference: {
                $ceil: {
                  $divide: [{ $subtract: ["$endDate", "$startDate"] }, 1000 * 60 * 60 * 24]
                }
              }
            }
          },
          {
            $group: {
              _id: null,
              totalDays: { $sum: "$daysDifference" }
            }
          }
        ],

        monthlyData: [
          {
            $project: {
              startDate: 1,
              endDate: 1,
              monthRanges: monthsArray.map((monthStart, i) => {
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);

                return {
                  monthIndex: i,
                  monthStart,
                  monthEnd
                };
              })
            }
          },
          { $unwind: "$monthRanges" },
          {
            $project: {
              monthIndex: "$monthRanges.monthIndex",
              daysInMonth: {
                $cond: {
                  if: {
                    $or: [
                      {
                        $and: [
                          { $gte: ["$startDate", "$monthRanges.monthStart"] },
                          { $lt: ["$startDate", "$monthRanges.monthEnd"] }
                        ]
                      },
                      {
                        $and: [
                          { $gte: ["$endDate", "$monthRanges.monthStart"] },
                          { $lt: ["$endDate", "$monthRanges.monthEnd"] }
                        ]
                      },
                      {
                        $and: [
                          { $lt: ["$startDate", "$monthRanges.monthStart"] },
                          { $gt: ["$endDate", "$monthRanges.monthEnd"] }
                        ]
                      }
                    ]
                  },
                  then: {
                    $let: {
                      vars: {
                        effectiveStart: {
                          $cond: {
                            if: { $lt: ["$startDate", "$monthRanges.monthStart"] },
                            then: "$monthRanges.monthStart",
                            else: "$startDate"
                          }
                        },
                        effectiveEnd: {
                          $cond: {
                            if: { $gt: ["$endDate", "$monthRanges.monthEnd"] },
                            then: "$monthRanges.monthEnd",
                            else: "$endDate"
                          }
                        }
                      },
                      in: {
                        $ceil: {
                          $divide: [{ $subtract: ["$$effectiveEnd", "$$effectiveStart"] }, 1000 * 60 * 60 * 24]
                        }
                      }
                    }
                  },
                  else: 0
                }
              }
            }
          },
          {
            $group: {
              _id: "$monthIndex",
              days: { $sum: "$daysInMonth" }
            }
          },
          {
            $sort: { _id: 1 }
          }
        ]
      }
    },
    {
      $project: {
        totalBookings: { $ifNull: [{ $arrayElemAt: ["$totalBookings.count", 0] }, 0] },
        upcomingTrips: { $ifNull: [{ $arrayElemAt: ["$upcomingTrips.count", 0] }, 0] },
        totalDestinations: { $ifNull: [{ $arrayElemAt: ["$totalDestinations.count", 0] }, 0] },
        totalDays: { $ifNull: [{ $arrayElemAt: ["$totalDays.totalDays", 0] }, 0] },
        monthlyData: "$monthlyData"
      }
    }
  ]
};

export default userAggregations;
