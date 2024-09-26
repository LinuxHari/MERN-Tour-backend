import { PipelineStage } from "mongoose";

const tourAggregations = {
    suggestions: (regex: RegExp) => [
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
            State: {
              $cond: {
                if: { $gt: [{ $size: "$states" }, 0] },
                then: { $slice: ["$states", 5] },
                else: "$$REMOVE"
              }
            },
            City: {
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
            Country: {
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
      ],
      getTours: (destinationType: string, destination: string, minAge: number, duration: number, page: number):PipelineStage[] => [
        {
          $match: {
            [destinationType]: destination,
            minAge: { $lte: minAge }
          }
        },
        {
          $facet: {
            priceRange: [
              {
                $group: {
                  _id: null,
                  minPrice: { $min: "$price" },
                  maxPrice: { $max: "$price" }
                }
              },
              {
                $project: {
                  _id: 0,
                  minPrice: 1,
                  maxPrice: 1
                }
              }
            ],
            paginatedResults: [
              {
                $project: {
                  _id: 0,
                  destination: {
                    $switch: {
                      branches: [
                        { case: { $eq: [destinationType, "city"] }, then: { $concat: ["$city", ", ", "$state", ", ", "$country"] } },
                        { case: { $eq: [destinationType, "state"] }, then: { $concat: ["$state", ", ", "$country"] } }
                      ],
                      default: "$country"
                    }
                  },
                  name: 1,
                  description: 1,
                  freeCancellation: 1,
                  duration: { $literal: duration },
                  images: { $slice: ["$images", 1] },
                  price: 1
                }
              },
              { $skip: (page - 1) * 10 },
              { $limit: 10 }
            ],
            totalCount: [
              { $count: "total" }
            ]
          }
        },
        {
          $project: {
            tours: "$paginatedResults",
            minPrice: { $arrayElemAt: ["$priceRange.minPrice", 0] },
            maxPrice: { $arrayElemAt: ["$priceRange.maxPrice", 0] },
            totalCount: { $arrayElemAt: ["$totalCount.total", 0] }
          }
        }
      ]      
}

export default tourAggregations