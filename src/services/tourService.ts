import { errorMessage } from "../handlers/errorHandler";
import Tour from "../models/tourModel";
import { generateToudId } from "../utils/generateId";
import { TourSchema } from "../validators/adminValidators";
import { ObjectId } from "mongodb";
import { TourListingSchemaType } from "../validators/tourValidators";
import tourAggregations from "../aggregations/tourAggegations";

export const searchSuggestions = async (searchText: string) => {
  const regex = new RegExp(searchText, "i");
  const result = await Tour.aggregate(tourAggregations.suggestions(regex));

  const [locations] = result;
  const fallbackValue = { states: [], cities: [], countries: [] };

  return locations || fallbackValue;
};

export const getTours = async (params: TourListingSchemaType) => {
  const {
    destination,
    destinationType,
    adults,
    children,
    infants,
    page,
    startDate,
    endDate,
    filters,
    sortType,
    specials,
    languages,
    rating,
    tourTypes,
    minPrice,
    maxPrice
  } = params;
  
  const minAge = Boolean(infants) ? 0 : Boolean(children) ? 3 : 18;
  const duration = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const result = await Tour.aggregate(
    tourAggregations.getTours(
      destinationType.toLowerCase(),
      destination,
      minAge,
      duration,
      page,
      filters,
      sortType,
      rating,
      minPrice,
      maxPrice,
      tourTypes,
      specials,
      languages,
    )
  );

  const returnResult = result[0]?.tours? {...result[0], tours: result[0].tours} : {}
  if(result[0]?.filters?.[0])
    returnResult.filters = result[0].filters[0]
  return returnResult;
};

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
