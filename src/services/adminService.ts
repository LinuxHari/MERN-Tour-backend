import mongoose, { ClientSession } from "mongoose";
import { TourSchemaType } from "../validators/adminValidators";
import Destination, { DestinationType } from "../models/destinationModel";
import { BadRequestError, ConflictError, NotFoundError, ServerError } from "../handlers/errorHandler";
import generateId from "../utils/generateId";
import Tour from "../models/tourModel";
import tourAggregations from "../aggregations/tourAggregations";
import Booking from "../models/bookingModel";
import adminAggregations from "../aggregations/adminAggregations";
import Availability from "../models/availabilityModel";
import { stripeRefund } from "./stripeService";
import { sendBookingMail } from "./emailService";
import User from "../models/userModel";

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
      const destinationState = await createDestination("State", state, destinationCountry.destinationId);
      const destinationCity = await createDestination("City", city, destinationState.destinationId);
      return destinationCity.destinationId;
    }

    const stateDestinationDetails = await Destination.findOne({
      destination: state,
      parentDestinationId: countryDestinationDetails.destinationId
    });
    if (!stateDestinationDetails) {
      const destinationState = await createDestination("State", state, countryDestinationDetails?.destinationId);
      const destinationCity = await createDestination("City", city, destinationState.destinationId);
      return destinationCity.destinationId;
    }

    const cityDestinationDetails = await Destination.findOne({
      destination: city,
      parentDestinationId: stateDestinationDetails.destinationId
    });
    if (!cityDestinationDetails) {
      const destinationCity = await createDestination("City", city, stateDestinationDetails?.destinationId);
      return destinationCity.destinationId;
    }
    return cityDestinationDetails.destinationId;
  };

  const { city, state, country, ...extractedTourData } = tourData;
  const cityDestinationId = await createMissingDestinations(city, state, country);

  const tourId = generateId();
  const newTour = {
    ...extractedTourData,
    markAsDeleted: false,
    tourId,
    destinationId: cityDestinationId,
    duration: tourData.itinerary.length
  };

  const availability = tourData.availableDates.map((date) => ({ tourId, date }));

  await Availability.insertMany(availability);

  await Tour.create(newTour);
};

export const getPublishedTours = async (page: number, tourName: string, limit: number) => {
  const totalCount = await Tour.countDocuments({ markAsDeleted: { $ne: true } });

  const tours = await Tour.aggregate(tourAggregations.getPublishedTours(limit, page, tourName));

  const totalPages = Math.ceil(totalCount / limit);

  return { tours, totalPages, totalCount };
};

export const getPublishedTour = async (tourId: string) => {
  const tour = await Tour.aggregate(tourAggregations.getPublishedTour(tourId));

  return tour[0];
};

const extractDates = (availableDates: Date[], existingAvailableDates: { date: Date }[]) => {
  const normalizeDate = (date: Date): string => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  };

  const existingDatesSet = new Set(existingAvailableDates.map((item) => normalizeDate(item.date)));
  const newDatesSet = new Set(availableDates.map((date) => normalizeDate(date)));

  const removedDates = Array.from(existingDatesSet).filter((dateStr) => !newDatesSet.has(dateStr));
  const newDates = Array.from(newDatesSet).filter((dateStr) => !existingDatesSet.has(dateStr));

  return { removedDates, newDates };
};

export const cancelBookedTour = async (bookingId: string, session?: mongoose.ClientSession) => {
  const bookingQuery = Booking.findOne({ bookingId });
  const booking = session ? await bookingQuery.session(session) : await bookingQuery;

  if (!booking)
    throw new BadRequestError(`Cancellation request for booking id ${bookingId} failed, ${bookingId} does not exist`);

  const tour = await Tour.findOne({ tourId: booking.tourId }, { name: 1, destinationId: 1 }).lean();

  if (!tour) throw new NotFoundError(`Invalid tour id ${booking.tourId} is stored for booking ${booking.bookingId}`);

  const isCancellable = new Date().getTime() < booking.startDate.getTime();

  if (!isCancellable) throw new ConflictError(`Cannot cancel past booking ${booking.bookingId}`);

  if (booking.bookingStatus === "success") {
    const payment = booking.transaction.history[booking.transaction.history.length - 1];
    await stripeRefund(payment.paymentId, payment.refundableAmount * 100, payment.currency);
    booking.transaction.paymentStatus = "refunded";
  }

  const destinationQuery = Destination.findOne({ destinationId: tour.destinationId }, { destination: 1 });
  const destination = session ? await destinationQuery.session(session).lean() : await destinationQuery.lean();

  if (!destination)
    throw new ServerError(`Invalid destination id ${tour.destinationId} from tour with id ${booking.tourId}`);

  booking.bookingStatus = "canceled";

  const { error } = await sendBookingMail({
    ...booking.toObject(),
    tourName: tour.name,
    destination: destination.destination
  });

  booking.emailStatus = error ? "failed" : "sent";

  await (session ? booking.save({ session }) : booking.save());
};

export const updatePublishedTour = async (tourData: TourSchemaType, tourId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { availableDates, ...tour } = tourData;

    const updatedTour = await Tour.findOneAndUpdate({ tourId }, tour, {
      runValidators: true,
      new: true,
      session
    });

    if (!updatedTour) throw new BadRequestError(`Invalid tour id ${tourId} is sent for updation`);

    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    threeDaysLater.setHours(0, 0, 0, 0);

    const existingAvailableDates = await Availability.find(
      { tourId, date: { $gte: threeDaysLater } },
      { date: 1 }
    ).lean();

    const { removedDates, newDates } = extractDates(availableDates, existingAvailableDates);

    if (removedDates.length > 0) {
      const removedDateObjects = removedDates.map((dateStr) => {
        const date = new Date(dateStr);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      });

      const affectedBookings = await Booking.find(
        { tourId, startDate: { $in: removedDateObjects }, bookingStatus: "success" },
        { bookingId: 1, _id: 0 }
      ).lean();

      for (const booking of affectedBookings) {
        await cancelBookedTour(booking.bookingId, session);
      }

      await Availability.deleteMany(
        {
          tourId,
          $or: removedDateObjects.map((date) => ({
            date: {
              $gte: new Date(date.setUTCHours(0, 0, 0, 0)),
              $lt: new Date(date.setUTCHours(23, 59, 59, 999))
            }
          }))
        },
        { session }
      );
    }

    if (newDates.length > 0) {
      const newDateObjects = newDates.map((dateStr) => {
        const date = new Date(dateStr);
        date.setUTCHours(0, 0, 0, 0);
        return {
          tourId,
          date,
          availableSeats: tour.capacity
        };
      });
      await Availability.insertMany(newDateObjects, { session });
    }

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const deletePublishedTour = async (tourId: string) => {
  const deletedTour = await Tour.findOneAndUpdate({ tourId }, { markAsDeleted: true }, { new: true });
  if (!deletedTour) throw new BadRequestError(`Invalid tour id ${tourId} is sent for deletion`);
};

export const getAllStats = async () => {
  const revenueStats = await Booking.aggregate(adminAggregations.getEarnings());

  return revenueStats[0];
};

export const getTotalBookings = async (page: number, status: string, limit: number, bookingId?: string) => {
  const totalBookings = await Booking.aggregate(adminAggregations.getBookings(page, status, limit, bookingId));
  return { bookings: totalBookings, totalPages: Math.ceil(totalBookings.length / limit) };
};

export const getAllUsers = async (page: number, limit: number, email: string) => {
  const options = { favorites: 0, _id: 0, publishedTours: 0, __v: 0, password: 0, role: 0 };
  if (email) {
    const user = await User.findOne({ email, isDeleted: false }, options);
    if (user) return { users: [user], totalPages: 1 };
    return { users: [], totalPages: 0 };
  } else {
    const users = await User.find({ isDeleted: false }, options)
      .sort({ _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return { users, totalPages: Math.ceil(users.length / 10) };
  }
};

export const deleteExistingUser = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new BadRequestError(`User with ${email} is not available so it can not be deleted.`);
  user.isDeleted = true;
  await user.save();
};
