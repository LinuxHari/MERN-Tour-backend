import bookingAggregations from "../aggregations/userAggregations";
import { ROLE } from "../config/userConfig";
import { BadRequestError, ConflictError, NotFoundError, UnauthroizedError } from "../handlers/errorHandler";
import Booking from "../models/bookingModel";
import Tour from "../models/tourModel";
import User from "../models/userModel";
import { generateRefreshToken, generateToken, verifyToken } from "../utils/authTokenManager";
import { LoginSchemaType, SignupSchemaType } from "../validators/authValidators";
import bcrypt from "bcrypt";
import { BookingStatusSchemaType, PasswordSchemaType, UserSchemaType } from "../validators/userValidators";
import { sendResetPassMail, sendVerificationMail } from "./emailService";
import userAggregations from "../aggregations/userAggregations";
import redis from "./redisService";
import mongoose from "mongoose";

export const sendUserVerificationMail = async (email: string, id?: string, name?: string) => {
  // ID here can be email
  if (name && id) {
    const token = generateToken({ id });
    await sendVerificationMail(email, token, name);
  } else {
    const user = await User.findOne({ email, isDeleted: false }, { firstName: 1, lastName: 1 }).lean();
    if (!user) throw new BadRequestError(`Invalid email ${email} sent to verification process`);
    if (user.isVerified) throw new ConflictError(`User email was already verified`);
    const token = generateToken({ id: String(user._id) });
    await sendVerificationMail(user.email, token, `${user.firstName} ${user.lastName}`);
  }
};

export const sendUserResetPassMail = async (email: string) => {
  const user = await User.findOne({ email, isDeleted: false }, { firstName: 1, lastName: 1 }).lean();
  if (!user) throw new BadRequestError(`Invalid email ${email} sent to verification process`);
  const token = generateToken({ id: String(user._id) });
  await sendResetPassMail(user.email, token, `${user.firstName} ${user.lastName}`);
};

export const verifyUserResetToken = async (token: string) => {
  const { error, data } = verifyToken(token);
  if (error || !data) throw new BadRequestError("Reset token verification failed");
  const user = await User.findOne(
    { _id: new mongoose.Types.ObjectId(data.id), isDeleted: false },
    { isVerified: 1 }
  ).lean();
  if (!user) throw new BadRequestError(`Invalid id ${data.id} sent to verification process`);
  if (!user.isVerified) throw new UnauthroizedError(`User has not verified email ${user.email} yet`);
};

export const createUser = async (userData: Omit<SignupSchemaType, "confirmPassword">) => {
  const existingUser = await User.findOne({ email: userData.email, isDeleted: false });
  if (existingUser) throw new ConflictError("User already exists");
  const newUser = new User({ ...userData, role: ROLE[0] });
  await newUser.hashPassword(userData.password);
  await sendUserVerificationMail(newUser.email, String(newUser._id), `${userData.firstName} ${userData.lastName}`);
  await newUser.save();
};

export const verifyUserEmail = async (token: string) => {
  const { error, data } = verifyToken(token);
  if (error || !data) throw new BadRequestError("Token verification failed");

  const user = await User.findOne({ _id: new mongoose.Types.ObjectId(data.id) }, { isVerified: 1 });
  if (!user) throw new BadRequestError(`User with ${data.id} is not found after token is verified`);
  if (user.isVerified) throw new ConflictError(`User email was already verified`);

  user.isVerified = true;
  await user.save();
};

export const authenticateUser = async (userData: LoginSchemaType, userAgent: string) => {
  const existingUser = await User.findOne({ email: userData.email, isDeleted: false });

  if (!existingUser) throw new NotFoundError("User not found");

  if (!existingUser.isVerified) throw new UnauthroizedError("Email is not verified");

  const isValidPassword = await bcrypt.compare(userData.password, existingUser.password);

  if (!isValidPassword) throw new BadRequestError("Invalid username or password");

  const accessToken = generateToken({ id: String(existingUser._id), role: existingUser.role });
  const refreshToken = generateRefreshToken();
  const userSessionData = {
    userAgent,
    userId: String(existingUser._id),
    lastSeen: Date.now(),
    issuedAt: Date.now()
  };
  await redis.setUserSession(userSessionData, refreshToken);
  await redis.setUserSessions(String(existingUser._id), refreshToken);

  return { accessToken, refreshToken };
};

export const getUserInfo = async (id: string) => {
  const userInfo = await User.findOne(
    { _id: new mongoose.Types.ObjectId(id), isDeleted: false, isVerified: true },
    { _id: 0, favorites: 0, publishedTours: 0, password: 0, __v: 0 }
  ).lean();
  if (!userInfo) throw new NotFoundError("User not found");
  return userInfo;
};

export const updateUserProfile = async (updatedData: UserSchemaType, id: string) => {
  const user = await User.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), isDeleted: false, isVerified: true },
    { $set: updatedData },
    { new: true, runValidators: true }
  );

  if (!user) throw new NotFoundError("User not found");

  const token = generateToken({ id: String(user._id), role: user.role });
  return token;
};

export const updateUserPassword = async ({ newPassword, oldPassword }: PasswordSchemaType, id: string) => {
  const user = await User.findOne({ _id: new mongoose.Types.ObjectId(id), isDeleted: false, isVerified: true });
  if (!user) throw new BadRequestError(`User with id ${id} does not exist`);
  const isValidPassword = await user.validatePassword(oldPassword);
  if (!isValidPassword) throw new BadRequestError("Invalid password");
  user.hashPassword(newPassword);
  await user.save();
};

export const updateUserResetPassword = async (newPassword: string, token: string) => {
  const { error, data } = verifyToken(token);
  if (error || !data) throw new BadRequestError("Password reset token verification failed");
  const user = await User.findOne({ _id: new mongoose.Types.ObjectId(data.id), isDeleted: false });
  if (!user) throw new BadRequestError(`User with id ${data.id} does not exist`);
  if (!user.isVerified) throw new UnauthroizedError(`User email ${user.email} is not verified`);
  user.hashPassword(newPassword);
  await user.save();
};

export const addTourToFavorites = async (tourId: string, id: string, ip?: string) => {
  const user = await User.findOne(
    { _id: new mongoose.Types.ObjectId(id), isDeleted: false, isVerified: true },
    { favorites: 1 }
  );
  if (!user)
    throw new BadRequestError(`Unauthorized user with ip ${ip} tried to add a tour with id ${tourId} to favorite`);
  const tour = await Tour.findOne({ tourId }, { _id: 1 }).lean();
  if (!tour) throw new BadRequestError(`Invalid tour id ${tourId} while adding to favorite`);
  user.favorites = [...user.favorites, tour._id];
  await user.save();
};

export const getFavoriteTours = async (id: string, page: number, limit: number, ip?: string) => {
  const user = await User.findOne({ _id: new mongoose.Types.ObjectId(id), isDeleted: false }, { favorites: 1 }).lean();
  if (!user) throw new BadRequestError(`Unauthorized user with ip ${ip} tried to get favorite tours with id ${id}`);
  const result = await Tour.aggregate(bookingAggregations.getFavoriteTours(user.favorites, page, limit));
  const favoriteTours = result[0].tours;
  const totalCount = result[0].totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);
  return { favoriteTours, totalPages, totalCount };
};

export const removeFavoriteTour = async (id: string, tourId: string, ip?: string) => {
  const user = await User.findOne(
    { _id: new mongoose.Types.ObjectId(id), isDeleted: false, isVerified: true },
    { favorites: 1 }
  );
  if (!user)
    throw new BadRequestError(`Unauthorized user with ip ${ip} tried to remove a tour from favorite with id ${tourId}`);
  const tour = await Tour.findOne({ tourId }, { _id: 1 }).lean();
  if (!tour) throw new BadRequestError(`Invalid tour id ${tourId} while removing from favorite`);
  if (!user.favorites.includes(tour._id)) throw new ConflictError("Tour was already removed from favorite");
  user.favorites = user.favorites.filter((favoriteTourId) => String(favoriteTourId) !== String(tour._id));
  await user.save();
};

export const getUserBookings = async (
  id: string,
  page: number,
  status: BookingStatusSchemaType["status"],
  limit: number,
  bookingId?: string,
  ip?: string
) => {
  const user = await User.findOne(
    { _id: new mongoose.Types.ObjectId(id), isDeleted: false, isVerified: true },
    { _id: 1 }
  ).lean();
  if (!user) throw new BadRequestError(`User with ip ${ip} tried to access all bookings with id ${id}`);
  const bookings = await Booking.aggregate(bookingAggregations.userBookings(user._id, page, status, limit, bookingId));

  return { bookings, totalPages: Math.ceil(bookings.length / limit) };
};

export const getStats = async (id: string, ip?: string) => {
  const currentDate = new Date();

  const monthsArray = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }).reverse();

  const user = await User.findOne(
    { _id: new mongoose.Types.ObjectId(id), isDeleted: false, isVerified: true },
    { _id: 1 }
  ).lean();

  if (!user) throw new BadRequestError(`User with ip ${ip} tried to get access user stats ${id}`);

  const userStats = await Booking.aggregate(userAggregations.getUserStats(currentDate, monthsArray, user._id));

  return userStats[0];
};
