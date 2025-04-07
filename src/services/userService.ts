import bookingAggregations from "../aggregations/userAggregations";
import { ROLE } from "../config/userConfig";
import { BadRequestError, ConflictError, NotFoundError, UnauthroizedError } from "../handlers/errorHandler";
import Booking from "../models/bookingModel";
import Tour from "../models/tourModel";
import User from "../models/userModel";
import { generateToken, verifyToken } from "../utils/authTokenManager";
import { LoginSchemaType, SignupSchemaType } from "../validators/authValidators";
import bcrypt from "bcrypt";
import { BookingStatusSchemaType, PasswordSchemaType, UserSchemaType } from "../validators/userValidators";
import { sendResetPassMail, sendVerificationMail } from "./emailService";

export const sendUserVerificationMail = async (email: string, name?: string) => {
  const token = generateToken({ email });
  if (name) await sendVerificationMail(email, token, name);
  else {
    const user = await User.findOne({ email }, { firstName: 1, lastName: 1 }).lean();
    if (!user) throw new BadRequestError(`Invalid email ${email} sent to verification process`);
    if (user.isVerified) throw new ConflictError(`User email was already verified`);
    await sendVerificationMail(email, token, `${user.firstName} ${user.lastName}`);
  }
};

export const sendUserResetPassMail = async (email: string) => {
  const token = generateToken({ email });

  const user = await User.findOne({ email }, { firstName: 1, lastName: 1 }).lean();
  if (!user) throw new BadRequestError(`Invalid email ${email} sent to verification process`);
  await sendResetPassMail(email, token, `${user.firstName} ${user.lastName}`);
};

export const verifyUserResetToken = async (token: string) => {
  const { error, data } = verifyToken(token);
  if (error || !data) throw new BadRequestError("Reset token verification failed");
  const user = await User.findOne({ email: data.email }, { isVerified: 1 }).lean();
  if (!user) throw new BadRequestError(`Invalid email ${data.email} sent to verification process`);
  if (!user.isVerified) throw new UnauthroizedError(`User has not verified email ${data.email} yet`);
};

export const createUser = async (userData: Omit<SignupSchemaType, "confirmPassword">) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) throw new ConflictError("User already exists");
  const newUser = new User({ ...userData, role: ROLE[0] });
  await newUser.hashPassword(userData.password);
  await sendUserVerificationMail(userData.email, `${userData.firstName} ${userData.lastName}`);
  await newUser.save();
};

export const verifyUserEmail = async (token: string) => {
  const { error, data } = verifyToken(token);
  if (error || !data) throw new BadRequestError("Token verification failed");

  const user = await User.findOne({ email: data.email }, { isVerified: 1 });
  if (!user) throw new BadRequestError(`User with ${data.email} is not found after token is verified`);
  if (user.isVerified) throw new ConflictError(`User email was already verified`);

  user.isVerified = true;
  await user.save();
};

export const authenticateUser = async (userData: LoginSchemaType) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (!existingUser) throw new NotFoundError("User not found");
  if (!existingUser.isVerified) throw new UnauthroizedError("Email is not verified");
  const isValidPassword = await bcrypt.compare(userData.password, existingUser.password);
  if (!isValidPassword) throw new BadRequestError("Invalid username or password");
  const token = generateToken({ email: existingUser.email, role: existingUser.role });
  return token;
};

export const getUserInfo = async (email: string) => {
  const userInfo = await User.findOne(
    { email, isVerified: true },
    { _id: 0, favorites: 0, publishedTours: 0, password: 0, __v: 0 }
  ).lean();
  if (!userInfo) throw new NotFoundError("User not found");
  return userInfo;
};

export const updateUserProfile = async (updatedData: UserSchemaType, email: string) => {
  const user = await User.findOneAndUpdate(
    { email, isVerified: true },
    { $set: updatedData },
    { new: true, runValidators: true }
  );

  if (!user) throw new NotFoundError("User not found");

  const token = generateToken({ email: user.email, role: user.role });
  return token;
};

export const updateUserPassword = async ({ newPassword, oldPassword }: PasswordSchemaType, email: string) => {
  const user = await User.findOne({ email, isVerified: true });
  if (!user) throw new BadRequestError(`User with ${email} does not exist`);
  const isValidPassword = await user.validatePassword(oldPassword);
  if (!isValidPassword) throw new BadRequestError("Invalid password");
  user.hashPassword(newPassword);
  await user.save();
};

export const updateUserResetPassword = async (newPassword: string, token: string) => {
  const { error, data } = verifyToken(token);
  if (error || !data) throw new BadRequestError("Password reset token verification failed");
  const user = await User.findOne({ email: data.email });
  if (!user) throw new BadRequestError(`User with ${data.email} does not exist`);
  if (!user.isVerified) throw new UnauthroizedError(`User email ${data.email} is not verified`);
  user.hashPassword(newPassword);
  await user.save();
};

export const addTourToFavorites = async (tourId: string, email: string, ip?: string) => {
  const user = await User.findOne({ email, isVerified: true }, { favorites: 1 });
  if (!user)
    throw new BadRequestError(`Unauthorized user with ip ${ip} tried to add a tour with id ${tourId} to favorite`);
  const tour = await Tour.findOne({ tourId }, { _id: 1 }).lean();
  if (!tour) throw new BadRequestError(`Invalid tour id ${tourId} while adding to favorite`);
  user.favorites = [...user.favorites, tour._id];
  await user.save();
};

export const getFavoriteTours = async (email: string, page: number, limit: number, ip?: string) => {
  const user = await User.findOne({ email }, { favorites: 1 }).lean();
  if (!user)
    throw new BadRequestError(`Unauthorized user with ip ${ip} tried to get favorite tours with email ${email}`);
  const result = await Tour.aggregate(bookingAggregations.getFavoriteTours(user.favorites, page, limit));
  const favoriteTours = result[0].tours;
  const totalCount = result[0].totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);
  return { favoriteTours, totalPages, totalCount };
};

export const removeFavoriteTour = async (email: string, tourId: string, ip?: string) => {
  const user = await User.findOne({ email, isVerified: true }, { favorites: 1 });
  if (!user)
    throw new BadRequestError(`Unauthorized user with ip ${ip} tried to remove a tour from favorite with id ${tourId}`);
  const tour = await Tour.findOne({ tourId }, { _id: 1 }).lean();
  if (!tour) throw new BadRequestError(`Invalid tour id ${tourId} while removing from favorite`);
  if (!user.favorites.includes(tour._id)) throw new ConflictError("Tour was already removed from favorite");
  user.favorites = user.favorites.filter((favoriteTourId) => String(favoriteTourId) !== String(tour._id));
  await user.save();
};

export const getUserBookings = async (
  email: string,
  page: number,
  status: BookingStatusSchemaType["status"],
  limit: number,
  bookingId?: string,
  ip?: string
) => {
  const user = await User.findOne({ email, isVerified: true }, { _id: 1 }).lean();
  if (!user) throw new BadRequestError(`User with ip ${ip} tried to access all bookings with email ${email}`);
  const bookings = await Booking.aggregate(bookingAggregations.userBookings(user._id, page, status, limit, bookingId));

  return { bookings, totalPages: Math.ceil(bookings.length / limit) };
};
