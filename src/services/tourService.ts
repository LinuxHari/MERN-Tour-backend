import { errorMessage } from "../handlers/errorHandler";
import Tour from "../models/tourModel";
import generateId from "../utils/generateId";
import { TourSchemaType } from "../validators/adminValidators";
import { ObjectId } from "mongodb";
import { TourListingSchemaType } from "../validators/tourValidators";
import tourAggregations from "../aggregations/tourAggegations";
import Destination, { DestinationType } from "../models/destinationModel";

export const searchSuggestions = async (searchText: string) => {
  const regex = new RegExp(searchText, "i");
  const result = await Destination.find({destination: regex}, {_id: 0, parentDestinationId: 0, __v: 0}).limit(5).lean()

  return result;
};

export const getTours = async (params: TourListingSchemaType) => {
  const {
    destinationId,
    adults,
    children,
    infants,
    teens,
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
  
  const minAge = Boolean(infants)? 0 : Boolean(children)? 3: Boolean(teens)? 13 : 18;
  const duration = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const destinationResult = await Destination.aggregate(tourAggregations.destinationQuery(destinationId));
  const cityDestinationIds = destinationResult.length
    ? destinationResult[0].destinationIds
    : [destinationId];

  const result = await Tour.aggregate(
    tourAggregations.getTours(
      cityDestinationIds,
      minAge,
      page,
      filters,
      rating,
      minPrice,
      maxPrice,
      tourTypes,
      specials,
      languages
    )
  );

  const returnResult = result[0]
  if(result[0]?.filters?.[0])
    returnResult.filters = result[0].filters[0]
  return returnResult;
};

export const getTour = async(tourId: string) => {
  
  const tour = await Tour.aggregate(tourAggregations.getTour(tourId)).exec();
  
  if(!tour.length)
    throw new Error(errorMessage.notFound)
  return tour[0]
}

export const createTour = async (tourData: TourSchemaType) => {

  const createDestination = async (destinationType: DestinationType["destinationType"], destination: string, parentDestinationId?: string) => {
    if((destinationType === "Country" && parentDestinationId) || (destinationType !== "Country" && !parentDestinationId))
      throw new Error(errorMessage.serverError)
  
    const destinationDetails: DestinationType = {
      destinationType,
      destination,
      parentDestinationId,
      destinationId: generateId()
    }
    await Destination.create(destinationDetails)
    return destinationDetails
  }
  
  const createMissingDestinations = async (city: string, state: string, country: string) => {
    const countryDestinationDetails = await Destination.findOne({destination: country})
    if(!countryDestinationDetails){
      const destinationCountry = await createDestination("Country", country)
      const destinationState = await createDestination("State", state, destinationCountry.destinationId)
      const destinationCity = await createDestination("City", city, destinationState.destinationId)
      return destinationCity.destinationId
    }
  
    const stateDestinationDetails = await Destination.findOne({destination: state, parentDestinationId: countryDestinationDetails.destinationId})
    if(!stateDestinationDetails){
      const destinationState = await createDestination("State", state, countryDestinationDetails?.destinationId)
      const destinationCity = await createDestination("City", city, destinationState.destinationId)
      return destinationCity.destinationId
    }
  
    const cityDestinationDetails = await Destination.findOne({destination: city, parentDestinationId: stateDestinationDetails.destinationId})
    if(!cityDestinationDetails){
      const destinationCity = await createDestination("City", city, stateDestinationDetails?.destinationId)
      return destinationCity.destinationId
    }
    return cityDestinationDetails.destinationId
  }

  const { city, state, country, ...extractedTourData } = tourData
  const cityDestinationId = await createMissingDestinations(city, state, country)
  
  const newTour = {
    ...extractedTourData,
    markAsDeleted: false,
    tourId: generateId(),
    destinationId: cityDestinationId,
    duration: tourData.itinerary.length,
    submissionStatus: "Approved",
    recurringEndDate: new Date(),
    publisher: new ObjectId(),
  };
  await Tour.create(newTour);
};

export const updateTour = async (tourId: string, tourData: TourSchemaType) => {
  const existingTour = await Tour.findOne({ tourId });

  if (!existingTour)
    throw new Error(errorMessage.notFound);

  const updatedTour = {
    ...tourData,
    duration: tourData.itinerary.length,
    submissionStatus: existingTour.submissionStatus,
    recurringEndDate: existingTour.recurringEndDate,
    publisher: existingTour.publisher,
  };

  await Tour.updateOne({ tourId }, updatedTour, { runValidators: true });
};
