import {
  BadRequestError,
  ConflictError,
  GoneError,
  ManyRequests,
  NotFoundError,
  ServerError
} from "../handlers/errorHandler";
import Tour, { TourModel } from "../models/tourModel";
import generateId from "../utils/generateId";
import { TourSchemaType } from "../validators/adminValidators";
import { BookingSchemaType, RatingType, ReserveTourType, TourListingSchemaType } from "../validators/tourValidators";
import tourAggregations from "../aggregations/tourAggregations";
import Destination from "../models/destinationModel";
import User from "../models/userModel";
import Reserved from "../models/reserveModel";
import { stripeCreate, stripeRefund } from "./stripeService";
import Booking, { BookingType, PaymentType } from "../models/bookingModel";
import { MAX_BOOKING_RETRY } from "../config/tourConfig";
import getDuration from "../utils/getDuration";
import Review from "../models/reviewModel";
import { sendBookingMail } from "./emailService";
import userAggregations from "../aggregations/userAggregations";
import Availability from "../models/availabilityModel";
import { upstashPublish } from "./upstashService";
import mongoose from "mongoose";

export const searchSuggestions = async (searchText: string) => {
  const regex = new RegExp(searchText, "i");
  const result = await Destination.find({ destination: regex }, { _id: 0, parentDestinationId: 0, __v: 0 })
    .limit(5)
    .lean();

  return result;
};

export const getTours = async (params: TourListingSchemaType, email?: string) => {
  const {
    destinationId,
    adults,
    children,
    infants,
    teens,
    page,
    startDate,
    // endDate,
    filters,
    sortType,
    specials,
    languages,
    rating,
    tourTypes,
    minPrice,
    maxPrice
  } = params;

  const minAge = infants ? 0 : children ? 3 : teens ? 13 : 18;
  // const duration = getDuration(startDate, endDate);

  const destinationResult = await Destination.aggregate(tourAggregations.destinationQuery(destinationId));
  const cityDestinationIds = destinationResult.length ? destinationResult[0].destinationIds : [destinationId];

  const result = await Tour.aggregate(
    tourAggregations.getTours({
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
      date: new Date(startDate)
    }),
    { hint: { destinationId: 1, minAge: 1 }, $allowDiskUse: true }
  );

  const returnResult = result[0];
  if (result[0]?.filters?.[0]) returnResult.filters = result[0].filters[0];

  if (email) {
    const result = await User.aggregate(userAggregations.getFavoriteToursIds(email));
    const favToursIds = result[0]?.tourIds || [];
    if (favToursIds.length) {
      const favToursSet = new Set(favToursIds);
      const finalResult = returnResult.tours.map((tour: TourModel) =>
        favToursSet.has(tour.tourId) ? { ...tour, isFavorite: true } : tour
      );
      return { ...returnResult, tours: finalResult };
    }
    return returnResult;
  }

  return returnResult;
};

export const getToursByCategory = async (params: TourListingSchemaType, category: string, email?: string) => {
  const { page, filters, sortType, specials, languages, rating, minPrice, maxPrice } = params;

  const result = await Tour.aggregate(
    tourAggregations.getToursByCategory({
      category,
      page,
      filters,
      rating,
      minPrice,
      maxPrice,
      specials,
      languages,
      sortType
    }),
    { hint: { category: 1 }, $allowDiskUse: true }
  );

  const returnResult = result[0];
  if (result[0]?.filters?.[0]) returnResult.filters = result[0].filters[0];

  if (email) {
    const result = await User.aggregate(userAggregations.getFavoriteToursIds(email));
    const favToursIds = result[0]?.tourIds || [];
    if (favToursIds.length) {
      const favToursSet = new Set(favToursIds);
      const finalResult = returnResult.tours.map((tour: TourModel) =>
        favToursSet.has(tour.tourId) ? { ...tour, isFavorite: true } : tour
      );
      return { ...returnResult, tours: finalResult };
    }
    return returnResult;
  }

  return returnResult;
};

export const getTour = async (tourId: string, email?: string) => {
  const tour = await Tour.aggregate(tourAggregations.getTour(tourId, email)).exec();

  if (!tour.length) throw new NotFoundError("Tour not found");
  return tour[0];
};

export const updateTour = async (tourId: string, tourData: TourSchemaType) => {
  const existingTour = await Tour.findOne({ tourId });

  if (!existingTour) throw new NotFoundError(`Tour with id ${tourId} not found`);

  const updatedTour = {
    ...tourData,
    duration: tourData.itinerary.length
  };

  await Tour.updateOne({ tourId }, updatedTour, { runValidators: true });
};

export const reserveTour = async (reserveDetails: ReserveTourType, email: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reserveId = generateId();
    const { startDate, endDate, tourId, pax } = reserveDetails;

    const user = await User.findOne({ email }, { _id: 1 }).lean().session(session);
    if (!user) throw new NotFoundError(`User with ${email} email not found`);

    const tour = await Tour.findOne({ tourId }, { price: 1 }).session(session);
    if (!tour) throw new NotFoundError(`Tour with ${tourId} id not found`);

    const totalPassengers = pax.adults + (pax?.teens || 0) + (pax?.children || 0) + (pax?.infants || 0);

    startDate.setUTCHours(0, 0, 0, 0);

    const availabilityDetails = await Availability.findOne({
      tourId,
      date: {
        $gte: startDate,
        $lt: new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }).session(session);

    if (!availabilityDetails) throw new NotFoundError(`Availability for tour ${tourId} not found`);

    if (availabilityDetails.availableSeats < totalPassengers) throw new ConflictError("Tour is not available");

    const { price } = tour;
    let totalAmount = pax.adults * price.adult;
    if (price?.teen) totalAmount += price.teen * (pax.teens || 0);
    if (price?.child) totalAmount += price.child * (pax.children || 0);
    if (price?.infant) totalAmount += price.infant * (pax.infants || 0);

    const now = new Date();
    const expiresAt = new Date(now.setMinutes(now.getMinutes() + 10)).getTime();

    await Reserved.create(
      [
        {
          tourId,
          reserveId,
          startDate,
          endDate,
          userId: user._id,
          passengers: pax,
          expiresAt,
          totalAmount
        }
      ],
      { session }
    );

    availabilityDetails.availableSeats -= totalPassengers;
    await availabilityDetails.save({ session });

    await upstashPublish({
      body: { eventType: "reserve", reserveId },
      delay: 12 * 60
    });

    await session.commitTransaction();
    session.endSession();

    return reserveId;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getReservedDetails = async (reserveId: string, email: string) => {
  const reserved = await Reserved.findOne({ reserveId }, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }).lean();

  if (!reserved) throw new NotFoundError(`Reserve id ${reserveId} is not found`);

  const user = await User.findById(reserved.userId).lean({ email: 1 }); // Prevent someone else other than reserved user intercepts with valid reserve id
  if (user?.email !== email) throw new BadRequestError(`Reserve id ${reserveId} is not valid`);

  reserved.expiresAt = reserved.expiresAt - 60000; // We are sending expire time one minute less than stored time since submission backend process may go upto 1 minute

  const tour = await Tour.findOne(
    { tourId: reserved.tourId },
    { duration: 1, price: 1, images: 1, name: 1, minAge: 1, _id: 0 }
  ).lean();

  const { tourId: _, userId: __, ...reservedDetails } = reserved;
  return { ...reservedDetails, tourDetails: tour };
};

export const getBooking = async (bookingId: string, email: string) => {
  const booking = await Booking.findOne({ bookingId }).lean();
  if (!booking) throw new NotFoundError(`Booking for booking id ${bookingId} not found`);

  const tour = await Tour.findOne({ tourId: booking.tourId }).lean({ name: 1, duration: 1 });
  if (!tour) throw new NotFoundError(`Booked tour with id ${booking.tourId} not found for booking ${bookingId}`);

  const user = await User.findOne({ email }, { _id: 1 }).lean();
  if (String(user?._id) !== String(booking.userId))
    throw new NotFoundError(`${email} tried to access booking ${booking.bookingId} which was done by ${user?.email}`); // We are sending 404 instead of bad request to confuse user that there is no booking with this id, so it will prevent someone who tries to enumerate booking details

  const payment = booking.transaction.history[booking.transaction.history.length - 1];
  return {
    bookDate: booking.createdAt,
    paymentMethod: "Card",
    name: booking.bookerInfo.name,
    email: booking.bookerInfo.email,
    status: booking.bookingStatus,
    freeCancellation:
      tour.freeCancellation && booking.bookingStatus !== "canceled" && booking.bookingStatus !== "failed",
    isCancellable: new Date().getTime() < booking.startDate.getTime(),
    amount: payment.amount,
    amountPaid: payment.status === "success" ? payment.amount : 0,
    refundableAmount: payment.refundableAmount,
    tourInfo: {
      tourName: tour.name,
      startDate: booking.startDate,
      duration: getDuration(booking.startDate, booking.endDate),
      passengers: booking.passengers
    },
    ...(payment.status === "success" &&
      payment.card && {
        paymentInfo: {
          cardNumber: payment.card.number,
          cardBrand: payment.card.brand,
          paymentDate: payment.attemptDate,
          recipetUrl: payment.reciept
        }
      })
  };
};

export const bookReservedTour = async (tourData: BookingSchemaType, reserveId: string, email: string) => {
  const reservedTour = await Reserved.findOne({ reserveId });
  if (!reservedTour) throw new BadRequestError(`Invalid booking for reserve id ${reserveId}`);

  const user = await User.findById(reservedTour.userId, { _id: 1, email: 1 }).lean();
  if (!user) throw new BadRequestError(`Invalid user id ${reservedTour.userId} used for booking`);

  if (String(reservedTour.userId) !== String(user._id) || user.email !== email)
    throw new BadRequestError(`Invalid user id ${String(user._id)} or reserve id ${reserveId} used for booking`);

  const now = new Date();
  const currency = "USD";
  if (reservedTour.expiresAt < now.getTime()) throw new GoneError(`Reservation ${reservedTour.id} is timed out`);

  const existingBooking = await Booking.findOne({ reserveId: reservedTour._id });
  if (existingBooking && existingBooking.attempts === MAX_BOOKING_RETRY)
    throw new ManyRequests("Maximum booking attempts reached");

  const booking = existingBooking ? existingBooking : new Booking();
  const { clientSecret, paymentId } = await stripeCreate({
    amount: reservedTour.totalAmount * 100,
    currency,
    bookingId: booking.id,
    userId: String(user._id)
  });

  if (existingBooking) {
    booking.bookerInfo = {
      name: tourData.fullName,
      email: tourData.email,
      country: tourData.country,
      state: tourData.state,
      phoneNumber: `${tourData.countryCode} ${tourData.phone}`
    };
    existingBooking.attempts = existingBooking.attempts + 1;
    const newTransaction = {
      clientSecret: clientSecret as string,
      paymentId,
      currency,
      amount: reservedTour.totalAmount,
      refundableAmount: 0,
      status: "pending",
      attemptDate: new Date()
    } as PaymentType;

    existingBooking.transaction.history.push(newTransaction);
    await existingBooking.save();
    return { clientSecret, bookingId: existingBooking.bookingId };
  }

  const bookingId = generateId();
  const bookingDetails = {
    bookingId,
    userId: user._id,
    tourId: reservedTour.tourId,
    reserveId: reservedTour._id,
    passengers: reservedTour.passengers,
    startDate: reservedTour.startDate,
    endDate: reservedTour.endDate,
    bookingStatus: "init",
    attempts: 1,
    transaction: {
      paymentStatus: "unpaid",
      history: [
        {
          clientSecret: clientSecret as string,
          paymentId,
          currency,
          amount: reservedTour.totalAmount,
          refundableAmount: 0,
          status: "pending",
          attemptDate: new Date()
        }
      ]
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
  await booking.save();
  return { clientSecret, bookingId };
};

export const cancelBookedTour = async (bookingId: string, email: string) => {
  const booking = await Booking.findOne({ bookingId });
  if (!booking)
    throw new BadRequestError(`Cancellation request for booking id ${bookingId} failed, ${bookingId} does not exist`);

  const user = await User.findOne({ email }, { _id: 1 }).lean();
  if (String(user?._id) !== String(booking.userId))
    throw new NotFoundError(
      `Invalid email ${email} tried to cancel booking ${booking.bookingId} which was done by ${user?.email}`
    ); // We are sending 404 instead of bad request to confuse user that there is no booking with this id, so it will prevent someone who tries to enumerate booking details

  const tour = await Tour.findOne({ tourId: booking.tourId }, { name: 1, destinationId: 1 }).lean();
  if (!tour) throw new NotFoundError(`Invalid tour id ${booking.tourId} is stored for booking ${booking.bookingId}`);

  if (booking.bookingStatus === "success") {
    const payment = booking.transaction.history[booking.transaction.history.length - 1];
    await stripeRefund(payment.paymentId, payment.refundableAmount * 100);
    booking.transaction.paymentStatus = "refunded";
  }

  const destination = await Destination.findOne({ destinationId: tour.destinationId }, { destination: 1 }).lean();

  if (!destination)
    throw new ServerError(`Invalid destination id ${tour.destinationId} from tour with id ${booking.tourId}`);

  booking.bookingStatus = "canceled";
  const { error } = await sendBookingMail({
    ...booking.toObject(),
    tourName: tour.name,
    destination: destination.destination
  });
  booking.emailStatus = error ? "failed" : "sent";
  await booking.save();
};

export const tourReview = async (review: RatingType, tourId: string, email: string) => {
  const user = await User.findOne({ email }, { _id: 1 }).lean();
  const tour = await Tour.findOne({ tourId }, { _id: 1 }).lean();
  if (!user) throw new BadRequestError(`User with ${email} does not exist and tried to put review`);
  if (!tour) throw new BadRequestError(`Tour with ${tourId} does not exist and happened to put review`);
  await Review.create({
    userId: user._id,
    tourId: tour._id,
    ...review
  });

  const result = await Review.aggregate(tourAggregations.getTourReviews(tour._id));

  if (result.length > 0) {
    const { totalRatings, averageRating } = result[0];

    await Tour.findByIdAndUpdate(tour._id, { totalRatings, averageRating }, { new: true, runValidators: true });
  }
};

export const getTourReview = async (tourId: string) => {
  const tourDb = await Tour.findOne({ tourId }, { _id: 1 }).lean();
  if (!tourDb) {
    throw new BadRequestError(`Tour with ${tourId} id does not exist and happened to access review`);
  }

  const reviews = await Review.aggregate(tourAggregations.getReviews(tourDb._id));
  return reviews[0];
};

export const getTopPopularTours = async () => {
  const tours = await Tour.aggregate(tourAggregations.getPopularTours());

  if (!tours.length) throw new NotFoundError("No popular tours found");

  return tours;
};

export const getTopTrendingTours = async () => {
  const tours = await Booking.aggregate(tourAggregations.getTrendingTours());

  if (!tours.length) throw new NotFoundError("No popular tours found");

  return tours;
};

export const getSingleTourAvailability = async (tourId: string) => {
  const availability = await Availability.find({ tourId }, { date: 1, availableSeats: 1, _id: 0 }).lean();
  if (!availability.length) throw new NotFoundError(`No availability found for tour ${tourId}`);
  return availability;
};
