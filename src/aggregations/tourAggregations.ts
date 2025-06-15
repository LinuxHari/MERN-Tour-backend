import mongoose, { PipelineStage, Types } from "mongoose";
import { ToursParams, ToursByCategoryParams } from "./type";

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
  getTours: ({
    cityDestinationIds,
    minAge,
    page,
    filters,
    adults,
    teens,
    children,
    infants,
    rating,
    minPrice,
    maxPrice,
    tourTypes,
    specials,
    languages,
    sortType,
    startDate,
    duration,
    limit
  }: ToursParams): PipelineStage[] => {
    const matchStage: Record<string, any> = {
      destinationId: { $in: cityDestinationIds },
      minAge: { $lte: minAge },
      duration: { $lte: duration }
    };

    if (rating) matchStage.averageRating = { $gte: rating };
    if (languages?.length) matchStage.languages = { $in: languages };
    if (specials?.includes("Free Cancellation")) matchStage.freeCancellation = true;
    if (tourTypes?.length) matchStage.category = { $in: tourTypes };

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
    if (maxPrice) priceFilterStage.calculatedPrice = { ...(priceFilterStage.calculatedPrice || {}), $lte: maxPrice };

    const baseToursPipeline: PipelineStage[] = [{ $match: matchStage }, addFieldsStage];

    if (minPrice || maxPrice) baseToursPipeline.push({ $match: priceFilterStage });

    if (sortType) {
      const sortOptions: Record<string, any> = {
        PLH: { calculatedPrice: 1 },
        PHL: { calculatedPrice: -1 },
        RLH: { averageRating: 1 },
        RHL: { averageRating: -1 }
      };
      if (sortOptions[sortType]) baseToursPipeline.push({ $sort: sortOptions[sortType] });
    }
    const formattedDate = new Date(startDate);
    formattedDate.setUTCHours(0, 0, 0, 0);

    baseToursPipeline.push(
      {
        $lookup: {
          from: "availabilities",
          let: { tourId: "$tourId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$tourId", "$$tourId"] },
                    { $eq: [{ $dateTrunc: { date: "$date", unit: "day" } }, formattedDate] },
                    { $gt: ["$availableSeats", 0] }
                  ]
                }
              }
            },
            { $project: { availableSeats: 1, _id: 0 } }
          ],
          as: "availabilityInfo"
        }
      },
      {
        $addFields: {
          isAvailable: { $gt: [{ $size: "$availabilityInfo" }, 0] },
          availableSeats: {
            $cond: {
              if: { $gt: [{ $size: "$availabilityInfo" }, 0] },
              then: { $arrayElemAt: ["$availabilityInfo.availableSeats", 0] },
              else: 0
            }
          }
        }
      },
      { $match: { isAvailable: true } }
    );

    const toursPipeline = [...baseToursPipeline, ...destinationPipe];

    const finalProjectStage: PipelineStage = {
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
        // ...(startDate ? { availableSeats: 1 } : {})
      }
    };

    const paginatedResultsPipeline = [
      ...toursPipeline,
      finalProjectStage,
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    const totalCountPipeline = [...baseToursPipeline, { $count: "total" }];

    let filtersPipeline: PipelineStage[] = [];
    if (filters) {
      filtersPipeline = [
        { $match: matchStage },
        ...destinationPipe,
        {
          $group: {
            _id: null,
            tourTypes: { $addToSet: "$category" },
            freeCancellation: { $addToSet: "$freeCancellation" },
            allLanguages: { $push: "$languages" }
          }
        },
        {
          $project: {
            _id: 0,
            tourTypes: 1,
            specials: {
              $cond: [{ $in: [true, "$freeCancellation"] }, ["Free Cancellation"], []]
            },
            languages: {
              $reduce: {
                input: "$allLanguages",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] }
              }
            }
          }
        }
      ];
    }

    const facetStage: Record<string, any> = {
      paginatedResults: paginatedResultsPipeline,
      totalCount: totalCountPipeline
    };
    if (filters) facetStage.filters = filtersPipeline;

    return [
      { $facet: facetStage },
      {
        $project: {
          tours: "$paginatedResults",
          totalCount: { $arrayElemAt: ["$totalCount.total", 0] },
          filters: filters ? { $arrayElemAt: ["$filters", 0] } : undefined
        }
      }
    ];
  },
  getToursByCategory: ({
    category,
    page,
    filters,
    rating,
    minPrice,
    maxPrice,
    specials,
    languages,
    sortType,
    limit
  }: ToursByCategoryParams) => {
    const matchStage: Record<string, any> = {
      category
    };

    if (rating) matchStage.averageRating = { $gte: rating };
    if (languages?.length) matchStage.languages = { $in: languages };
    if (specials?.includes("Free Cancellation")) matchStage.freeCancellation = true;

    if (minPrice !== undefined || maxPrice !== undefined) {
      matchStage["price.adult"] = {};
      if (minPrice !== undefined) matchStage["price.adult"]["$gte"] = minPrice;
      if (maxPrice !== undefined) matchStage["price.adult"]["$lte"] = maxPrice;
      if (Object.keys(matchStage["price.adult"]).length === 0) delete matchStage["price.adult"];
    }

    let sortStage: Record<string, number> = {};
    switch (sortType) {
      case "PLH":
        sortStage = { "price.adult": 1 };
        break;
      case "PHL":
        sortStage = { "price.adult": -1 };
        break;
      case "RLH":
        sortStage = { averageRating: 1 };
        break;
      case "RHL":
        sortStage = { averageRating: -1 };
        break;
    }

    const baseToursPipeline: any[] = [{ $match: matchStage }];

    baseToursPipeline.push(
      {
        $lookup: {
          from: "destinations",
          localField: "destinationId",
          foreignField: "destinationId",
          as: "destinationDetails"
        }
      },
      { $addFields: { destinationData: { $arrayElemAt: ["$destinationDetails", 0] } } },
      {
        $lookup: {
          from: "destinations",
          localField: "destinationData.parentDestinationId",
          foreignField: "destinationId",
          as: "stateDetails"
        }
      },
      { $addFields: { stateData: { $arrayElemAt: ["$stateDetails", 0] } } },
      {
        $lookup: {
          from: "destinations",
          localField: "stateData.parentDestinationId",
          foreignField: "destinationId",
          as: "countryDetails"
        }
      },
      { $addFields: { countryData: { $arrayElemAt: ["$countryDetails", 0] } } },
      {
        $addFields: {
          destination: {
            $concat: [
              { $ifNull: ["$destinationData.destination", ""] },
              ", ",
              { $ifNull: ["$stateData.destination", ""] },
              ", ",
              { $ifNull: ["$countryData.destination", ""] }
            ]
          }
        }
      }
    );

    const finalProjectStage = {
      $project: {
        _id: 0,
        name: 1,
        description: 1,
        price: 1,
        duration: 1,
        freeCancellation: 1,
        images: 1,
        tourId: 1,
        totalRatings: 1,
        averageRating: 1,
        destination: 1,
        languages: 1
      }
    };

    const paginatedResultsPipeline = [
      ...baseToursPipeline,
      finalProjectStage,
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    const totalCountPipeline = [...baseToursPipeline, { $count: "total" }];

    let filtersPipeline: any[] = [];
    if (filters) {
      filtersPipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            specials: {
              $addToSet: {
                $cond: [{ $eq: ["$freeCancellation", true] }, "Free Cancellation", null]
              }
            },
            allLanguages: { $push: "$languages" }
          }
        },
        {
          $project: {
            _id: 0,
            specials: { $setDifference: ["$specials", [null]] },
            languages: {
              $reduce: {
                input: "$allLanguages",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] }
              }
            }
          }
        }
      ];
    }

    const facetStage: Record<string, any> = {
      paginatedResults: paginatedResultsPipeline,
      totalCount: totalCountPipeline
    };
    if (filters) facetStage.filters = filtersPipeline;

    return [
      { $facet: facetStage },
      {
        $project: {
          tours: "$paginatedResults",
          totalCount: { $arrayElemAt: ["$totalCount.total", 0] },
          filters: filters ? { $arrayElemAt: ["$filters", 0] } : undefined
        }
      }
    ];
  },
  getTour: (tourId: string, userId?: string) => {
    return [
      { $match: { tourId } },
      ...destinationPipe,
      ...(userId
        ? [
            {
              $lookup: {
                from: "bookings",
                let: { tourId: "$tourId", userId: new mongoose.Types.ObjectId(userId) },
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
          _id: 0,
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
  getReviews: (tourId: Types.ObjectId, limit: number, userId?: string, page: number = 1) => {
    const needUserReview = page === 1 && userId !== undefined;
    const effectiveLimit = needUserReview ? limit - 1 : limit;
    const skip = page > 1 ? (page - 1) * limit : 0;

    const pipeline: PipelineStage[] = [
      {
        $facet: {
          allStats: [
            { $match: { tourId } },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userInfo"
              }
            },
            { $unwind: { path: "$userInfo" } },
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
                totalCount: { $sum: 1 }
              }
            }
          ],
          userReview: needUserReview
            ? [
                { $match: { tourId } },
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                {
                  $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userInfo"
                  }
                },
                { $unwind: { path: "$userInfo" } },
                { $limit: 1 },
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
                    isUserReview: true
                  }
                },
                {
                  $project: {
                    _id: 0,
                    name: "$userName",
                    profile: "$profile",
                    postedAt: "$createdAt",
                    overallRating: "$individualRating",
                    title: "$title",
                    comment: "$comment",
                    isUserReview: 1,
                    ratings: "$ratings"
                  }
                }
              ]
            : [],
          otherReviews: [
            { $match: { tourId } },
            ...(needUserReview ? [{ $match: { userId: { $ne: new mongoose.Types.ObjectId(userId) } } }] : []), // Changed to match userId directly
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userInfo"
              }
            },
            { $unwind: { path: "$userInfo" } },
            {
              $addFields: {
                userName: { $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"] },
                individualRating: {
                  $avg: ["$ratings.Location", "$ratings.Amenities", "$ratings.Food", "$ratings.Room", "$ratings.Price"]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: effectiveLimit },
            {
              $project: {
                _id: 0,
                name: "$userName",
                profile: "$profile",
                postedAt: "$createdAt",
                overallRating: "$individualRating",
                title: "$title",
                comment: "$comment"
              }
            }
          ]
        }
      },
      {
        $match: {
          $expr: {
            $gt: [{ $arrayElemAt: ["$allStats.totalCount", 0] }, 0]
          }
        }
      },
      {
        $project: {
          overallRating: {
            $round: [{ $arrayElemAt: ["$allStats.overallRating", 0] }, 1]
          },
          location: { $arrayElemAt: ["$allStats.location", 0] },
          food: { $arrayElemAt: ["$allStats.food", 0] },
          price: { $arrayElemAt: ["$allStats.price", 0] },
          rooms: { $arrayElemAt: ["$allStats.rooms", 0] },
          amenities: { $arrayElemAt: ["$allStats.amenities", 0] },
          totalCount: { $arrayElemAt: ["$allStats.totalCount", 0] },
          userReviews: {
            $cond: {
              if: { $and: [needUserReview, { $gt: [{ $size: "$userReview" }, 0] }] },
              then: { $concatArrays: ["$userReview", "$otherReviews"] },
              else: "$otherReviews"
            }
          }
        }
      }
    ];

    return pipeline;
  },
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
                $sum: ["$ratings.Location", "$ratings.Amenities", "$ratings.Food", "$ratings.Room", "$ratings.Price"]
              },
              5
            ]
          }
        }
      }
    }
  ],
  getPublishedTours: (limit: number, page: number, tourName: string): PipelineStage[] => {
    const matchStage: PipelineStage.Match = {
      $match: {
        markAsDeleted: { $ne: true }
      }
    };

    if (tourName) {
      matchStage.$match.name = { $regex: tourName, $options: "i" };
    }

    return [
      matchStage,
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
        $lookup: {
          from: "availabilities",
          localField: "tourId",
          foreignField: "tourId",
          as: "availability"
        }
      },
      {
        $addFields: {
          availableDates: {
            $map: {
              input: {
                $filter: {
                  input: "$availability",
                  as: "av",
                  cond: {
                    $gte: [
                      "$$av.date",
                      {
                        $dateAdd: {
                          startDate: {
                            $dateFromParts: {
                              year: { $year: new Date() },
                              month: { $month: new Date() },
                              day: { $dayOfMonth: new Date() },
                              hour: 0,
                              minute: 0,
                              second: 0,
                              millisecond: 0
                            }
                          },
                          unit: "day",
                          amount: 3
                        }
                      }
                    ]
                  }
                }
              },
              as: "av",
              in: "$$av.date"
            }
          }
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
          availability: 0,
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
    ];
  },
  getPublishedTour: (tourId: string): PipelineStage[] => {
    return [
      {
        $match: {
          tourId,
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
        $lookup: {
          from: "availabilities",
          localField: "tourId",
          foreignField: "tourId",
          as: "availability"
        }
      },
      {
        $addFields: {
          availableDates: {
            $map: {
              input: {
                $filter: {
                  input: "$availability",
                  as: "av",
                  cond: {
                    $gte: [
                      "$$av.date",
                      {
                        $dateAdd: {
                          startDate: {
                            $dateFromParts: {
                              year: { $year: new Date() },
                              month: { $month: new Date() },
                              day: { $dayOfMonth: new Date() },
                              hour: 0,
                              minute: 0,
                              second: 0,
                              millisecond: 0
                            }
                          },
                          unit: "day",
                          amount: 3
                        }
                      }
                    ]
                  }
                }
              },
              as: "av",
              in: "$$av.date"
            }
          }
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
          availability: 0,
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
      }
    ];
  },
  getPopularTours: (limit: number): PipelineStage[] => [
    {
      $match: {
        markAsDeleted: false
        // submissionStatus: "APPROVED"
      }
    },
    {
      $lookup: {
        from: "destinations",
        localField: "destinationId",
        foreignField: "destinationId",
        as: "destinationInfo"
      }
    },
    {
      $unwind: {
        path: "$destinationInfo",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "destinations",
        localField: "destinationInfo.parentDestinationId",
        foreignField: "destinationId",
        as: "parentDestination"
      }
    },
    {
      $unwind: {
        path: "$parentDestination",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "destinations",
        localField: "parentDestination.parentDestinationId",
        foreignField: "destinationId",
        as: "countryDestination"
      }
    },
    {
      $unwind: {
        path: "$countryDestination",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 0,
        tourId: 1,
        title: "$name",
        images: 1,
        rating: { $ifNull: ["$averageRating", 0] },
        reviewCount: { $ifNull: ["$totalRatings", 0] },
        duration: 1,
        price: "$price.adult",
        createdAt: 1,
        destination: "$destinationId",
        location: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ["$destinationInfo.destination", ""] },
                {
                  $cond: {
                    if: { $gt: [{ $strLenCP: "$parentDestination.destination" }, 0] },
                    then: ", ",
                    else: ""
                  }
                },
                { $ifNull: ["$parentDestination.destination", ""] },
                {
                  $cond: {
                    if: { $gt: [{ $strLenCP: "$countryDestination.destination" }, 0] },
                    then: ", ",
                    else: ""
                  }
                },
                { $ifNull: ["$countryDestination.destination", ""] }
              ]
            }
          }
        }
      }
    },
    {
      $sort: {
        rating: -1,
        reviewCount: -1,
        createdAt: -1
      }
    },
    {
      $limit: limit
    }
  ],
  getTrendingTours: (limit: number): PipelineStage[] => [
    {
      $group: {
        _id: "$tourId",
        bookingCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "tours",
        localField: "_id",
        foreignField: "tourId",
        as: "tourDetails"
      }
    },
    {
      $unwind: "$tourDetails"
    },
    {
      $lookup: {
        from: "destinations",
        localField: "tourDetails.destinationId",
        foreignField: "destinationId",
        as: "destinationInfo"
      }
    },
    {
      $unwind: { path: "$destinationInfo", preserveNullAndEmptyArrays: true }
    },
    {
      $lookup: {
        from: "destinations",
        localField: "destinationInfo.parentDestinationId",
        foreignField: "destinationId",
        as: "parentDestination"
      }
    },
    {
      $unwind: { path: "$parentDestination", preserveNullAndEmptyArrays: true }
    },
    {
      $lookup: {
        from: "destinations",
        localField: "parentDestination.parentDestinationId",
        foreignField: "destinationId",
        as: "countryDestination"
      }
    },
    {
      $unwind: { path: "$countryDestination", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        tourId: "$tourDetails.tourId",
        title: "$tourDetails.name",
        images: "$tourDetails.images",
        rating: { $ifNull: ["$tourDetails.averageRating", 0] },
        reviewCount: { $ifNull: ["$tourDetails.totalRatings", 0] },
        duration: "$tourDetails.duration",
        price: "$tourDetails.price.adult",
        createdAt: "$tourDetails.createdAt",
        destination: "$tourDetails.destinationId",
        location: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ["$destinationInfo.destination", ""] },
                {
                  $cond: {
                    if: { $gt: [{ $strLenCP: "$parentDestination.destination" }, 0] },
                    then: ", ",
                    else: ""
                  }
                },
                { $ifNull: ["$parentDestination.destination", ""] },
                {
                  $cond: {
                    if: { $gt: [{ $strLenCP: "$countryDestination.destination" }, 0] },
                    then: ", ",
                    else: ""
                  }
                },
                { $ifNull: ["$countryDestination.destination", ""] }
              ]
            }
          }
        },
        bookingCount: 1
      }
    },
    {
      $sort: { bookingCount: -1 }
    },
    {
      $limit: limit
    }
  ]
};

export default tourAggregations;
