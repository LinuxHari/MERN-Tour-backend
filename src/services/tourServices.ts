import {
  BadRequestError,
  GoneError,
  NotFoundError,
  ServerError,
} from "../handlers/errorHandler";
import Tour from "../models/tourModel";
import generateId from "../utils/generateId";
import { TourSchemaType } from "../validators/adminValidators";
import { ObjectId } from "mongodb";
import {
  BookingSchemaType,
  ReserveTourType,
  TourListingSchemaType,
} from "../validators/tourValidators";
import tourAggregations from "../aggregations/tourAggegations";
import Destination, { DestinationType } from "../models/destinationModel";
import User from "../models/userModel";
import Reserved from "../models/reserveModel";
import { stripeCreate } from "./stripeService";
import Booking, { BookingType } from "../models/bookingModel";
import responseHandler from "../handlers/responseHandler";

export const searchSuggestions = async (searchText: string) => {
  const regex = new RegExp(searchText, "i");
  const result = await Destination.find(
    { destination: regex },
    { _id: 0, parentDestinationId: 0, __v: 0 }
  )
    .limit(5)
    .lean();

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
    maxPrice,
  } = params;

  const minAge = Boolean(infants)
    ? 0
    : Boolean(children)
    ? 3
    : Boolean(teens)
    ? 13
    : 18;
  const duration = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const destinationResult = await Destination.aggregate(
    tourAggregations.destinationQuery(destinationId)
  );
  const cityDestinationIds = destinationResult.length
    ? destinationResult[0].destinationIds
    : [destinationId];

  const result = await Tour.aggregate(
    tourAggregations.getTours(
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
      languages
    )
  );

  const returnResult = result[0];
  if (result[0]?.filters?.[0]) returnResult.filters = result[0].filters[0];
  return returnResult;
};

export const getTour = async (tourId: string) => {
  const tour = await Tour.aggregate(tourAggregations.getTour(tourId)).exec();

  if (!tour.length) throw new NotFoundError("Tour not found");
  return tour[0];
};

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
      destinationId: generateId(),
    };
    await Destination.create(destinationDetails);
    return destinationDetails;
  };

  const createMissingDestinations = async (
    city: string,
    state: string,
    country: string
  ) => {
    const countryDestinationDetails = await Destination.findOne({
      destination: country,
    });
    if (!countryDestinationDetails) {
      const destinationCountry = await createDestination("Country", country);
      const destinationState = await createDestination(
        "State",
        state,
        destinationCountry.destinationId
      );
      const destinationCity = await createDestination(
        "City",
        city,
        destinationState.destinationId
      );
      return destinationCity.destinationId;
    }

    const stateDestinationDetails = await Destination.findOne({
      destination: state,
      parentDestinationId: countryDestinationDetails.destinationId,
    });
    if (!stateDestinationDetails) {
      const destinationState = await createDestination(
        "State",
        state,
        countryDestinationDetails?.destinationId
      );
      const destinationCity = await createDestination(
        "City",
        city,
        destinationState.destinationId
      );
      return destinationCity.destinationId;
    }

    const cityDestinationDetails = await Destination.findOne({
      destination: city,
      parentDestinationId: stateDestinationDetails.destinationId,
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
  const cityDestinationId = await createMissingDestinations(
    city,
    state,
    country
  );

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
    throw new NotFoundError(`Tour with id ${tourId} not found`);

  const updatedTour = {
    ...tourData,
    duration: tourData.itinerary.length,
    submissionStatus: existingTour.submissionStatus,
    recurringEndDate: existingTour.recurringEndDate,
    publisher: existingTour.publisher,
  };

  await Tour.updateOne({ tourId }, updatedTour, { runValidators: true });
};

export const reserveTour = async (
  reserveDetails: ReserveTourType,
  email: string
) => {
  const reserveId = generateId();
  const { startDate, endDate, tourId, pax } = reserveDetails;
  const userId = await User.findOne({ email }, { _id: 1 }).lean();
  if (!userId) throw new NotFoundError(`User with ${email} email not found`);
  const tour = await Tour.findOne({ tourId }, { price: 1 });
  if (!tour) throw new NotFoundError(`Tour with ${tourId} id not found`);
  const totalAmount = (() => {
    const { price } = tour;
    let totalAmount = pax.adults * price.adult;
    if (price?.teen) totalAmount += price.teen * (pax.teens || 0);
    if (price?.child) totalAmount += price.child * (pax.children || 0);
    if (price?.infant) totalAmount += price.infant * (pax.infants || 0);
    return totalAmount;
  })();
  const now = new Date();
  const expiresAt = new Date(now.setMinutes(now.getMinutes() + 10)).getTime();
  await Reserved.create({
    tourId,
    reserveId,
    startDate,
    endDate,
    userId,
    passengers: pax,
    expiresAt,
    totalAmount,
  });
  return reserveId;
};

export const getReservedDetails = async (reserveId: string, email: string) => {
  const reserved = await Reserved.findOne(
    { reserveId },
    { _id: 0, __v: 0 }
  ).lean();
  if (!reserved)
    throw new NotFoundError(`Reserve id ${reserveId} is not found`);
  const user = await User.findById(reserved.userId).lean({ email: 1 }); // Prevent someone else other than reserved user intercepts with valid reserve id
  if (user?.email !== email)
    throw new BadRequestError(`Reserve id ${reserveId} is not valid`);
  reserved.expiresAt = reserved.expiresAt - 60000; // We are sending expire time one minute less than stored time since submission backend process may go upto 1 minute
  const tour = await Tour.findOne(
    { tourId: reserved.tourId },
    { duration: 1, price: 1, images: 1, name: 1, minAge: 1 }
  ).lean();
  const { tourId, userId, ...reservedDetails } = reserved;
  return { ...reservedDetails, tourDetails: tour };
};

export const bookReservedTour = async (
  tourData: BookingSchemaType,
  reserveId: string,
  email: string
) => {
  const reservedTour = await Reserved.findOne({ reserveId });
  if (!reservedTour)
    throw new BadRequestError(`Invalid booking for reserve id ${reserveId}`);
  const user = await User.findById(reservedTour.userId);
  if (!user)
    throw new BadRequestError(
      `Invalid user id ${reservedTour.userId} used for booking`
    );
  if (String(reservedTour.userId) !== String(user._id) || user.email !== email)
    throw new BadRequestError(
      `Invalid user id ${user.id} or reserve id ${reserveId} used for booking`
    );
  const now = new Date();
  const currency = "USD"
  if (reservedTour.expiresAt < now.getTime())
    throw new GoneError(`Reservation ${reservedTour.id} is timed out`);
  const newBooking = new Booking();
  const { clientSecret, paymentId, amount } = await stripeCreate({
    amount: reservedTour.totalAmount,
    currency,
    bookingId: newBooking.id,
    userId: user.id,
  });

  const bookingId = generateId()
  const bookingDetails: BookingType = {
    bookingId,
    userId: user._id,
    tourId: reservedTour.tourId,
    reserveId: reservedTour.id,
    passengers: reservedTour.passengers,
    startDate: reservedTour.startDate,
    endDate: reservedTour.endDate,
    bookingStatus: "Init",
    transaction: {
      clientSecret: clientSecret as string,
      paymentId,
      currency,
      amount,
      paymentStatus: "unpaid",
    },
    bookerInfo: {
      name: tourData.fullName,
      email: tourData.email,
      country: tourData.country,
      state: tourData.state,
      phoneNumber: `${tourData.countryCode} ${tourData.phone}`
    }
  };
  Object.assign(newBooking, bookingDetails);
  await newBooking.save()
  return {clientSecret, bookingId}
};
