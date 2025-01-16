import bookingAggregations from "../aggregations/bookingAggregations";
import tourAggregations from "../aggregations/tourAggegations";
import { ROLE } from "../config/userConfig";
import { BadRequestError, ConflictError, NotFoundError } from "../handlers/errorHandler";
import Booking from "../models/bookingModel";
import Tour from "../models/tourModel";
import User from "../models/userModel";
import { generateToken } from "../utils/authTokenManager";
import { LoginSchemaType, SignupSchemaType } from "../validators/authValidators";
import bcrypt from "bcrypt";

export const createUser = async (userData: Omit<SignupSchemaType, "confirmPassword">) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) throw new ConflictError("User already exists");
  const newUser = new User({ ...userData, role: ROLE[0] });
  await newUser.hashPassword(userData.password);
  await newUser.save();
};

export const authenticateUser = async (userData: LoginSchemaType) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (!existingUser) throw new NotFoundError("User not found");
  const isValidPassword = await bcrypt.compare(userData.password, existingUser.password);
  if (!isValidPassword) throw new BadRequestError("Invalid username or password");
  const token = generateToken({ email: existingUser.email, role: existingUser.role });
  return token;
};

export const getUserInfo = async (email: string) => {
  const userInfo = await User.findOne(
    { email },
    { _id: 0, favorites: 0, publishedTours: 0, password: 0, __v: 0 }
  ).lean();
  if (!userInfo) throw new NotFoundError("User not found");
  return userInfo;
};

export const addTourToFavorites = async (tourId: string, email: string, ip?: string) => {
  const user = await User.findOne({ email }, { favorites: 1 });
  if (!user)
    throw new BadRequestError(
      `Unauthorized user with ip ${ip} tried to add a tour with id ${tourId} to favorite`
    );
  const tour = await Tour.findOne({ tourId }, { _id: 1 }).lean();
  if (!tour) throw new BadRequestError(`Invalid tour id ${tourId} while adding to favorite`);
  user.favorites = [...user.favorites, tour._id];
  await user.save();
};

export const getFavoriteTours = async (email: string, page: number, ip?: string) => {
  const limit = 10;
  const user = await User.findOne({ email }, { favorites: 1 }).lean();
  if (!user)
    throw new BadRequestError(
      `Unauthorized user with ip ${ip} tried to get favorite tours with email ${email}`
    );
  const result = await Tour.aggregate(
    tourAggregations.getFavoriteTours(user.favorites, page, limit)
  );
  const favoriteTours = result[0].tours;
  const totalCount = result[0].totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);
  return { favoriteTours, totalPages, totalCount };
};

export const removeFavoriteTour = async (email: string, tourId: string, ip?: string) => {
  const user = await User.findOne({ email }, { favorites: 1 });
  if (!user)
    throw new BadRequestError(
      `Unauthorized user with ip ${ip} tried to remove a tour from favorite with id ${tourId}`
    );
  const tour = await Tour.findOne({ tourId }, { _id: 1 }).lean();
  if (!tour) throw new BadRequestError(`Invalid tour id ${tourId} while removing from favorite`);
  user.favorites = user.favorites.filter(
    (favoriteTourId) => String(favoriteTourId) !== String(tour._id)
  );
  await user.save();
};

export const getUserBookings = async (email: string, page: number, ip?: string) => {
  const limit = 10;
  const user = await User.findOne({ email }, { _id: 1 }).lean();
  if (!user)
    throw new BadRequestError(
      `User with ip ${ip} tried to access all bookings with email ${email}`
    );
  const bookings = await Booking.aggregate(bookingAggregations.userBookings(user._id, page, limit));

  return { bookings, totalPages: bookings.length / limit };
};
