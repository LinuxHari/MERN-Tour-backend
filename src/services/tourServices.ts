import {
  BadRequestError,
  GoneError,
  ManyRequests,
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
import { stripeCreate, stripeRefund } from "./stripeService";
import Booking, { BookingType } from "../models/bookingModel";
import { MAX_BOOKING_RETRY } from "../config/tourConfig";
import getDuration from "../utils/getDuration";

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
  const duration = getDuration(startDate, endDate)

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

export const getBooking = async (bookingId: string) => {
  const booking = await Booking.findOne({bookingId}).lean()
  if(!booking)
    throw new NotFoundError(`Booking for booking id ${bookingId} not found`)
  const tour = await Tour.findOne({tourId: booking.tourId}).lean({name: 1, duration: 1})
  if(!tour)
    throw new NotFoundError(`Booked tour with id ${booking.tourId} not found for booking ${bookingId}`)
  return {
    bookDate: booking.createdAt,
    paymentMethod: "Card",
    name: booking.bookerInfo.name,
    email: booking.bookerInfo.email, 
    tourInfo: {
    tourName: tour.name,
    startDate: Date,
    duration: getDuration(booking.startDate, booking.endDate),
    passengers: booking.passengers,
    amount: booking.transaction.amount
  }
}}

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
  const existingBooking = await Booking.findOne({reserveId})
  if(existingBooking && existingBooking.attempts === MAX_BOOKING_RETRY)
   throw new ManyRequests("Maximum booking attempts reached")
  const booking = existingBooking? existingBooking: new Booking();
  const amount = reservedTour.totalAmount * 100 
  const { clientSecret, paymentId } = await stripeCreate({
    amount,
    currency,
    bookingId: booking.id,
    userId: user.id,
  });

  if(existingBooking){
    booking.bookerInfo = {
      name: tourData.fullName,
      email: tourData.email,
      country: tourData.country,
      state: tourData.state,
      phoneNumber: `${tourData.countryCode} ${tourData.phone}`
    }
    existingBooking.attempts = existingBooking.attempts + 1
    const newTransaction = {
      clientSecret: clientSecret as string,
      paymentId,
      currency,
      amount,
      status: "pending",
      attemptDate: new Date()
    }
    existingBooking.transaction.history.push(newTransaction)
    await existingBooking.save()
    return {clientSecret, bookingId: existingBooking.bookingId}
  }

  const bookingId = generateId()
  const bookingDetails = {
    bookingId,
    userId: user._id,
    tourId: reservedTour.tourId,
    reserveId: reservedTour.id,
    passengers: reservedTour.passengers,
    startDate: reservedTour.startDate,
    endDate: reservedTour.endDate,
    bookingStatus: "init",
    attempts: 1,
    transaction: {
      paymentStatus: "unpaid",
      history: 
        [{
          clientSecret: clientSecret as string,
          paymentId,
          currency,
          amount,
          status: "pending",
          attemptDate: new Date(),
          reciept: ""
        }]
    },
    bookerInfo: {
      name: tourData.fullName,
      email: tourData.email,
      country: tourData.country,
      state: tourData.state,
      phoneNumber: `${tourData.countryCode} ${tourData.phone}`
    }
  } as BookingType;
  
  Object.assign(booking, bookingDetails);
  await booking.save()
  return {clientSecret, bookingId}
};

export const cancelBookedTour = async(bookingId: string) => {
  const booking = await Booking.findOne({bookingId})
  if(!booking)
    throw new BadRequestError(`Cancellation request for booking id ${bookingId} failed, ${bookingId} does not exist`)
  if(booking.bookingStatus === "success"){
    const payment = booking.transaction.history[booking.transaction.history.length - 1]
    await stripeRefund(payment.paymentId)
    booking.transaction.paymentStatus = "refunded"
  }
  booking.bookingStatus = "canceled"
  await booking.save()
}