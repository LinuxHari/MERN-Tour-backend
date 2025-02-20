import { PipelineStage, Types } from "mongoose";
import { SORTTYPES } from "../config/tourConfig";

const destinationPipe = [
  {
    $lookup: {
      from: "destinations",
      localField: "destinationId",
      foreignField: "destinationId",
      as: "cityDetails"
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
    $lookup: {
      from: "destinations",
      localField: "stateDetails.parentDestinationId",
      foreignField: "destinationId",
      as: "countryDetails"
    }
  },
  {
    $addFields: {
      destination: {
        $concat: [
          { $arrayElemAt: ["$cityDetails.destination", 0] },
          ", ",
          { $arrayElemAt: ["$stateDetails.destination", 0] },
          ", ",
          { $arrayElemAt: ["$countryDetails.destination", 0] }
        ]
      }
    }
  }
];

const tourAggregations = {
  destinationQuery: (destinationId: string) => [
    {
      $match: {
        $or: [{ destinationId: destinationId }, { parentDestinationId: destinationId }]
      }
    },
    {
      $graphLookup: {
        from: "destinations",
        startWith: "$destinationId",
        connectFromField: "destinationId",
        connectToField: "parentDestinationId",
        as: "descendantDestinations"
      }
    },
    {
      $project: {
        destinationIds: {
          $cond: [
            { $eq: ["$destinationType", "City"] },
            ["$destinationId"],
            {
              $map: {
                input: "$descendantDestinations",
                as: "city",
                in: "$$city.destinationId"
              }
            }
          ]
        }
      }
    }
  ],
  getTours: (
    cityDestinationIds: string[],
    minAge: number,
    page: number,
    filters: boolean,
    adults: number,
    teens?: number,
    children?: number,
    infants?: number,
    rating?: number,
    minPrice?: number,
    maxPrice?: number,
    tourTypes?: string[],
    specials?: string[],
    languages?: string[],
    sortType?: (typeof SORTTYPES)[number]
  ) => {
    const matchStage: Record<string, any> = {
      destinationId: { $in: cityDestinationIds },
      minAge: { $lte: minAge }
    };

    if (rating) matchStage.averageRating = { $gte: rating };
    if (languages && languages.length > 0) matchStage.languages = { $in: languages };
    if (specials && specials.includes("Free Cancellation")) matchStage.freeCancellation = true;
    if (tourTypes && tourTypes.length > 0) {
      matchStage.category = { $in: tourTypes };
    }

    const addFieldsStage = {
      $addFields: {
        calculatedPrice: {
          $add: [
            { $multiply: ["$price.adult", adults] },
            { $multiply: [{ $ifNull: ["$price.teens", 0] }, teens || 0] },
            { $multiply: [{ $ifNull: ["$price.children", 0] }, children || 0] },
            { $multiply: [{ $ifNull: ["$price.infants", 0] }, infants || 0] }
          ]
        }
      }
    };

    const priceFilterStage: Record<string, any> = {};
    if (minPrice) priceFilterStage.calculatedPrice = { $gte: minPrice };
    if (maxPrice) {
      priceFilterStage.calculatedPrice = priceFilterStage.calculatedPrice
        ? { ...priceFilterStage.calculatedPrice, $lte: maxPrice }
        : { $lte: maxPrice };
    }

    const facetStage: { paginatedResults: any[]; totalCount: any[]; filters?: any[] } = {
      paginatedResults: [
        { $match: matchStage },
        addFieldsStage,
        { $match: priceFilterStage },
        ...destinationPipe,
        {
          $project: {
            _id: 0,
            destination: 1,
            name: 1,
            description: 1,
            price: 1,
            duration: 1,
            freeCancellation: 1,
            images: 1,
            tourId: 1,
            totalRatings: 1,
            averageRating: 1
          }
        },
        { $skip: (page - 1) * 10 },
        { $limit: 10 }
      ],
      totalCount: [
        { $match: matchStage },
        addFieldsStage,
        { $match: priceFilterStage },
        { $count: "total" }
      ]
    };

    if (sortType) {
      let sortStage: Record<string, any> = {};
      switch (sortType) {
        case "PLH":
          sortStage = { calculatedPrice: 1 };
          break;
        case "PHL":
          sortStage = { calculatedPrice: -1 };
          break;
        case "RLH":
          sortStage = { averageRating: 1 };
          break;
        case "RHL":
          sortStage = { averageRating: -1 };
          break;
        default:
          break;
      }
      if (Object.keys(sortStage).length > 0) {
        facetStage.paginatedResults.splice(2, 0, { $sort: sortStage });
      }
    }

    if (filters) {
      facetStage.filters = [
        {
          $group: {
            _id: null,
            tourTypes: { $addToSet: "$category" },
            specials: {
              $addToSet: {
                $cond: [{ $eq: ["$freeCancellation", true] }, "Free Cancellation", null]
              }
            },
            languages: { $addToSet: "$languages" }
          }
        },
        {
          $project: {
            _id: 0,
            tourTypes: 1,
            specials: { $setDifference: ["$specials", [null]] },
            languages: {
              $reduce: {
                input: "$languages",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] }
              }
            }
          }
        }
      ];
    }

    const aggregationPipeline = [
      { $facet: facetStage },
      {
        $project: {
          tours: "$paginatedResults",
          totalCount: { $arrayElemAt: ["$totalCount.total", 0] },
          filters: filters ? "$filters" : undefined
        }
      }
    ];

    return aggregationPipeline;
  },
  getTour: (tourId: string, email?: string) => {
    return [
      { $match: { tourId } },
      ...destinationPipe,
      ...(email
        ? [
            {
              $lookup: {
                from: "users",
                let: { userEmail: email },
                pipeline: [
                  { $match: { $expr: { $eq: ["$email", "$$userEmail"] } } },
                  { $project: { _id: 1 } }
                ],
                as: "userInfo"
              }
            },
            {
              $set: {
                userId: { $arrayElemAt: ["$userInfo._id", 0] }
              }
            },
            {
              $lookup: {
                from: "bookings",
                let: { tourId: "$tourId", userId: "$userId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$tourId", "$$tourId"] },
                          { $eq: ["$userId", "$$userId"] },
                          { $eq: ["$bookingStatus", "success"] }
                        ]
                      }
                    }
                  },
                  { $limit: 1 }
                ],
                as: "userBooking"
              }
            },
            {
              $addFields: {
                canReview: {
                  $cond: {
                    if: { $gt: [{ $size: { $ifNull: ["$userBooking", []] } }, 0] },
                    then: true,
                    else: "$$REMOVE"
                  }
                }
              }
            }
          ]
        : [
            {
              $addFields: { canReview: false }
            }
          ]),
      {
        $project: {
          destination: 1,
          tourId: 1,
          name: 1,
          description: 1,
          languages: 1,
          itinerary: 1,
          duration: 1,
          capacity: 1,
          minAge: 1,
          images: 1,
          highlights: 1,
          faq: 1,
          included: 1,
          price: 1,
          totalRatings: 1,
          averageRating: 1,
          canReview: 1
        }
      }
    ];
  },
  getReviews: (tourId: Types.ObjectId) =>
    [
      {
        $match: { tourId }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $unwind: {
          path: "$userInfo"
        }
      },
      {
        $addFields: {
          userName: { $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"] },
          individualRating: {
            $avg: [
              "$ratings.Location",
              "$ratings.Amenities",
              "$ratings.Food",
              "$ratings.Room",
              "$ratings.Price"
            ]
          },
          profile: "$userInfo.profile" // Add profile from userModel
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      },
      {
        $group: {
          _id: null,
          overallRating: {
            $avg: {
              $avg: [
                "$ratings.Location",
                "$ratings.Amenities",
                "$ratings.Food",
                "$ratings.Room",
                "$ratings.Price"
              ]
            }
          },
          location: { $avg: "$ratings.Location" },
          food: { $avg: "$ratings.Food" },
          price: { $avg: "$ratings.Price" },
          rooms: { $avg: "$ratings.Room" },
          amenities: { $avg: "$ratings.Amenities" },
          totalCount: { $sum: 1 },
          userReviews: {
            $push: {
              name: "$userName",
              profile: "$profile",
              postedAt: "$createdAt",
              overallRating: "$individualRating",
              title: "$title",
              comment: "$comment"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          overallRating: 1,
          location: 1,
          food: 1,
          price: 1,
          rooms: 1,
          amenities: 1,
          totalCount: 1,
          userReviews: 1
        }
      }
    ] as PipelineStage[],

  getTourReviews: (tourId: Types.ObjectId): PipelineStage[] => [
    { $match: { tourId: tourId } },
    {
      $group: {
        _id: "$tourId",
        totalRatings: { $sum: 1 },
        averageRating: {
          $avg: {
            $divide: [
              {
                $sum: [
                  "$ratings.Location",
                  "$ratings.Amenities",
                  "$ratings.Food",
                  "$ratings.Room",
                  "$ratings.Price"
                ]
              },
              5
            ]
          }
        }
      }
    }
  ],
  getPublishedTours: (limit: number, page: number): PipelineStage[] => [
    {
      $match: {
        markAsDeleted: { $ne: true }
      }
    },
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
      $project: {
        _id: 0,
        markAsDeleted: 0,
        recurringEndDate: 0,
        submissionStatus: 0,
        publisherId: 0,
        destinationId: 0,
        "cityDetails._id": 0,
        "stateDetails._id": 0,
        "countryDetails._id": 0,
        "cityDetails.parentDestinationId": 0,
        "stateDetails.parentDestinationId": 0
      }
    },
    {
      $addFields: {
        country: {
          name: "$countryDetails.destination",
          id: "$countryDetails.destinationId"
        },
        state: {
          name: "$stateDetails.destination",
          id: "$stateDetails.destinationId"
        },
        city: {
          name: "$cityDetails.destination",
          id: "$cityDetails.destinationId"
        }
      }
    },
    {
      $project: {
        cityDetails: 0,
        stateDetails: 0,
        countryDetails: 0
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    }
  ]
};

export default tourAggregations;
