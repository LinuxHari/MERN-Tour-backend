import { PipelineStage } from "mongoose";

const tourAggregations = {
  suggestions: (regex: RegExp) => [
    {
      $match: {
        $or: [{ city: regex }, { state: regex }, { country: regex }],
      },
    },
    {
      $group: {
        _id: null,
        states: {
          $addToSet: {
            $cond: [
              { $regexMatch: { input: "$state", regex } },
              "$state",
              null,
            ],
          },
        },
        cities: {
          $addToSet: {
            $cond: [{ $regexMatch: { input: "$city", regex } }, "$city", null],
          },
        },
        countries: {
          $addToSet: {
            $cond: [
              { $regexMatch: { input: "$country", regex } },
              "$country",
              null,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        states: {
          $filter: {
            input: "$states",
            as: "state",
            cond: { $ne: ["$$state", null] },
          },
        },
        cities: {
          $filter: {
            input: "$cities",
            as: "city",
            cond: { $ne: ["$$city", null] },
          },
        },
        countries: {
          $filter: {
            input: "$countries",
            as: "country",
            cond: { $ne: ["$$country", null] },
          },
        },
      },
    },
    {
      $project: {
        State: {
          $cond: {
            if: { $gt: [{ $size: "$states" }, 0] },
            then: { $slice: ["$states", 5] },
            else: "$$REMOVE",
          },
        },
        City: {
          $cond: {
            if: { $gt: [{ $size: "$cities" }, 0] },
            then: {
              $slice: ["$cities", { $subtract: [5, { $size: "$states" }] }],
            },
            else: "$$REMOVE",
          },
        },
        Country: {
          $cond: {
            if: { $gt: [{ $size: "$countries" }, 0] },
            then: {
              $slice: [
                "$countries",
                {
                  $subtract: [
                    5,
                    { $add: [{ $size: "$states" }, { $size: "$cities" }] },
                  ],
                },
              ],
            },
            else: "$$REMOVE",
          },
        },
      },
    },
  ],
  getTours: (
    destinationType: string,
    destination: string,
    minAge: number,
    duration: number,
    page: number,
    filters: boolean,
    sortType: string,
    rating?: number,
    minPrice?: number,
    maxPrice?: number,
    tourTypes?: string[],
    specials?: string[],
    languages?: string[]
  ) => {
    const matchStage: Record<string, any> = {
      [destinationType]: destination,
      minAge: { $lte: minAge },
    };
  
    // Conditionally add fields to matchStage
    if (minPrice) {
      matchStage.price = { $gte: minPrice };
    }
  
    if (maxPrice) {
      if (!matchStage.price) {
        matchStage.price = { $lte: maxPrice };
      } else {
        matchStage.price.$lte = maxPrice;
      }
    }
  
    if (rating) {
      matchStage.rating = { $gte: rating };
    }
  
    if (languages && languages.length > 0) {
      matchStage.languages = { $in: languages };
    }
  
    if (specials && specials.includes("Free Cancellation")) {
      matchStage.freeCancellation = true;
    }
  
    const facetStage: Record<string, any> = {
      // priceRange: [
      //   {
      //     $group: {
      //       _id: null,
      //       minPrice: { $min: "$price" },
      //       maxPrice: { $max: "$price" },
      //     },
      //   },
      //   {
      //     $project: {
      //       _id: 0,
      //       minPrice: 1,
      //       maxPrice: 1,
      //     },
      //   },
      // ],
      paginatedResults: [
        {
          $match: { ...matchStage, ...(tourTypes && tourTypes.length > 0 ? { category: { $in: tourTypes } } : {}) }, // Apply tourTypes filter here
        },
        {
          $project: {
            _id: 0,
            destination: {
              $switch: {
                branches: [
                  {
                    case: { $eq: [destinationType, "city"] },
                    then: {
                      $concat: ["$city", ", ", "$state", ", ", "$country"],
                    },
                  },
                  {
                    case: { $eq: [destinationType, "state"] },
                    then: { $concat: ["$state", ", ", "$country"] },
                  },
                ],
                default: "$country",
              },
            },
            name: 1,
            description: 1,
            freeCancellation: 1,
            duration: 1,
            images: { $slice: ["$images", 1] },
            price: 1,
          },
        },
        { $skip: (page - 1) * 10 },
        { $limit: 10 },
      ],
      totalCount: [
        {
          $match: { ...matchStage, ...(tourTypes && tourTypes.length > 0 ? { category: { $in: tourTypes } } : {}) }, // Apply the same filters here
        },
        { $count: "total" },
      ],
    };
  
    if (filters) {
      facetStage.filters = [
        {
          $group: {
            _id: null,
            tourTypes: { $addToSet: "$category" }, // Collect all unique tour types
            specials: {
              $addToSet: {
                $cond: [
                  { $eq: ["$freeCancellation", true] },
                  "Free Cancellation",
                  null,
                ],
              },
            },
            languages: { $addToSet: "$languages" },
          },
        },
        {
          $project: {
            _id: 0,
            tourTypes: { $setUnion: "$tourTypes" }, // Ensure we return unique types
            specials: { $setDifference: ["$specials", [null]] },
            languages: {
              $reduce: {
                input: "$languages",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
        },
      ];
    }
  
    const aggregationPipeline: Array<
      | { $match: Record<string, any> }
      | { $facet: Record<string, any> }
      | {
          $project: {
            tours: string;
            // minPrice: { $arrayElemAt: (string | number)[] };
            // maxPrice: { $arrayElemAt: (string | number)[] };
            totalCount: { $arrayElemAt: (string | number)[] };
            filters?: {
              tourTypes: { $arrayElemAt: (string | number)[] };
              specials: { $arrayElemAt: (string | number)[] };
              languages: { $arrayElemAt: (string | number)[] };
            };
          };
        }
    > = [
      {
        $match: matchStage,
      },
      {
        $facet: facetStage,
      },
      {
        $project: {
          tours: "$paginatedResults",
          // minPrice: { $arrayElemAt: ["$priceRange.minPrice", 0] },
          // maxPrice: { $arrayElemAt: ["$priceRange.maxPrice", 0] },
          totalCount: { $arrayElemAt: ["$totalCount.total", 0] },
        },
      },
    ];
  
    // Safely add filters to the project stage if it exists
    if (filters) {
      const projectStage = aggregationPipeline[2] as { $project: Record<string, any> };
      projectStage.$project.filters = {
        tourTypes: { $arrayElemAt: ["$filters.tourTypes", 0] },
        specials: { $arrayElemAt: ["$filters.specials", 0] },
        languages: { $arrayElemAt: ["$filters.languages", 0] },
      };
    }
  
    return aggregationPipeline;
  },
};

export default tourAggregations;
