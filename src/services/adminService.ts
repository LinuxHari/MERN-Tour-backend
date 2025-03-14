import { ObjectId } from "mongodb";
import { TourSchemaType } from "../validators/adminValidators";
import Destination, { DestinationType } from "../models/destinationModel";
import { BadRequestError, ServerError } from "../handlers/errorHandler";
import generateId from "../utils/generateId";
import Tour from "../models/tourModel";
import tourAggregations from "../aggregations/tourAggregations";
import Booking from "../models/bookingModel";
import adminAggregations from "../aggregations/adminAggregations";

export const createTour = async (tourData: TourSchemaType) => {
  const createDestination = async (
    destinationType: DestinationType["destinationType"],
    destination: string,
    parentDestinationId?: string
  ) => {
    if (
      (destinationType === "Country" && parentDestinationId) ||
      (destinationType !== "Country" && !parentDestinationId)
    )
      throw new ServerError("Something went wrong");

    const destinationDetails: DestinationType = {
      destinationType,
      destination,
      parentDestinationId,
      destinationId: generateId()
    };
    await Destination.create(destinationDetails);
    return destinationDetails;
  };

  const createMissingDestinations = async (city: string, state: string, country: string) => {
    const countryDestinationDetails = await Destination.findOne({
      destination: country
    });
    if (!countryDestinationDetails) {
      const destinationCountry = await createDestination("Country", country);
      const destinationState = await createDestination(
        "State",
        state,
        destinationCountry.destinationId
      );
      const destinationCity = await createDestination("City", city, destinationState.destinationId);
      return destinationCity.destinationId;
    }

    const stateDestinationDetails = await Destination.findOne({
      destination: state,
      parentDestinationId: countryDestinationDetails.destinationId
    });
    if (!stateDestinationDetails) {
      const destinationState = await createDestination(
        "State",
        state,
        countryDestinationDetails?.destinationId
      );
      const destinationCity = await createDestination("City", city, destinationState.destinationId);
      return destinationCity.destinationId;
    }

    const cityDestinationDetails = await Destination.findOne({
      destination: city,
      parentDestinationId: stateDestinationDetails.destinationId
    });
    if (!cityDestinationDetails) {
      const destinationCity = await createDestination(
        "City",
        city,
        stateDestinationDetails?.destinationId
      );
      return destinationCity.destinationId;
    }
    return cityDestinationDetails.destinationId;
  };

  const { city, state, country, ...extractedTourData } = tourData;
  const cityDestinationId = await createMissingDestinations(city, state, country);

  const newTour = {
    ...extractedTourData,
    markAsDeleted: false,
    tourId: generateId(),
    destinationId: cityDestinationId,
    duration: tourData.itinerary.length,
    submissionStatus: "Approved",
    recurringEndDate: new Date(),
    publisher: new ObjectId()
  };
  await Tour.create(newTour);
};

export const getPublishedTours = async (page: number) => {
  const limit = 12;
  const totalCount = await Tour.countDocuments({ markAsDeleted: { $ne: true } });

  const tours = await Tour.aggregate(tourAggregations.getPublishedTours(limit, page));

  const totalPages = Math.ceil(totalCount / limit);

  return { tours, totalPages, totalCount };
};

export const updatePublishedTour = async (tourData: TourSchemaType, tourId: string) => {
  const updatedTour = await Tour.findOneAndUpdate({ tourId }, tourData, {
    runValidators: true,
    new: true
  });
  if (!updatedTour) throw new BadRequestError(`Invalid tour id ${tourId} is sent for updation`);
};

export const deletePublishedTour = async (tourId: string) => {
  const deletedTour = await Tour.findOneAndUpdate(
    { tourId },
    { markAsDeleted: true },
    { new: true }
  );
  if (!deletedTour) throw new BadRequestError(`Invalid tour id ${tourId} is sent for deletion`);
};

export const getAllStats = async () => {
  const revenueStats = await Booking.aggregate(adminAggregations.getEarnings());

  return revenueStats[0];
};
