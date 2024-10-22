const destinationPipe = [
  {
    $lookup: {
      from: "destinations",
      localField: "destinationId",
      foreignField: "destinationId",
      as: "cityDetails",
    },
  },
  {
    $lookup: {
      from: "destinations",
      localField: "cityDetails.parentDestinationId",
      foreignField: "destinationId",
      as: "stateDetails",
    },
  },
  {
    $lookup: {
      from: "destinations",
      localField: "stateDetails.parentDestinationId",
      foreignField: "destinationId",
      as: "countryDetails",
    },
  },
  {
    $addFields: {
      destination: {
        $concat: [
          { $arrayElemAt: ["$cityDetails.destination", 0] }, ", ",
          { $arrayElemAt: ["$stateDetails.destination", 0] }, ", ",
          { $arrayElemAt: ["$countryDetails.destination", 0] }
        ]
      }
    }
  }
]

const tourAggregations = {
  destinationQuery:(destinationId: string) => [
    {
      $match: {
        $or: [
          { destinationId: destinationId },
          { parentDestinationId: destinationId },
        ],
      },
    },
    {
      $graphLookup: {
        from: "destinations",
        startWith: "$destinationId",
        connectFromField: "destinationId",
        connectToField: "parentDestinationId",
        as: "descendantDestinations",
      },
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
                in: "$$city.destinationId",
              },
            },
          ],
        },
      },
    },
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
  ) => {
    // Step 1: Match basic filters
    const matchStage: Record<string, any> = {
      destinationId: { $in: cityDestinationIds },
      minAge: { $lte: minAge },
    };
  
    if (rating) matchStage.rating = { $gte: rating };
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
            { $multiply: [{ $ifNull: ["$price.infants", 0] }, infants || 0] }, 
          ],
        },
      },
    };
  
    const priceFilterStage: Record<string, any> = {};
    if (minPrice) priceFilterStage.calculatedPrice = { $gte: minPrice };
    if (maxPrice) {
      priceFilterStage.calculatedPrice = priceFilterStage.calculatedPrice
        ? { ...priceFilterStage.calculatedPrice, $lte: maxPrice }
        : { $lte: maxPrice };
    }
  
    const facetStage: {
      paginatedResults: any[];
      totalCount: any[];
      filters?: any[];
    } = {
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
            images: { $slice: ["$images", 1] },
            tourId: 1,
          },
        },
        { $skip: (page - 1) * 10 },
        { $limit: 10 },
      ],
      totalCount: [{ $match: matchStage }, addFieldsStage, { $match: priceFilterStage }, { $count: "total" }],
    };
  
    if (filters) {
      facetStage.filters = [
        {
          $group: {
            _id: null,
            tourTypes: { $addToSet: "$category" },
            specials: {
              $addToSet: {
                $cond: [{ $eq: ["$freeCancellation", true] }, "Free Cancellation", null],
              },
            },
            languages: { $addToSet: "$languages" },
          },
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
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
        },
      ];
    }
  
    const aggregationPipeline = [
      { $facet: facetStage },
      {
        $project: {
          tours: "$paginatedResults",
          totalCount: { $arrayElemAt: ["$totalCount.total", 0] },
          filters: filters ? "$filters" : undefined,
        },
      },
    ];
  
    return aggregationPipeline;
  },  
  getTour: (tourId: string) => {
    return [
      { $match: { tourId } },
      ...destinationPipe,
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
          price: 1
        },
      },
    ];
  }
};

export default tourAggregations;
