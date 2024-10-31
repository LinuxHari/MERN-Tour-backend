import { ROLE } from "../config/userConfig";
import { BadRequestError, ConflictError, NotFoundError } from "../handlers/errorHandler";
import User from "../models/userModel";
import { generateToken } from "../utils/authTokenManager";
import {
  LoginSchemaType,
  SignupSchemaType,
} from "../validators/authValidators";
import bcrypt from "bcrypt"

export const createUser = async (
  userData: Omit<SignupSchemaType, "confirmPassword">
) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) throw new ConflictError("User already exists");
  const newUser = new User({...userData, role: ROLE[0]});
  await newUser.hashPassword(userData.password);
  await newUser.save();
};

export const authenticateUser = async (userData: LoginSchemaType) => {
  const existingUser = await User.findOne({ email: userData.email });
  if(!existingUser)
    throw new NotFoundError("User not found")
  const isValidPassword = await bcrypt.compare(userData.password, existingUser.password)
  if(!isValidPassword)
    throw new BadRequestError("Invalid username or password")
  const token = generateToken({email: existingUser.email, role: existingUser.role})
  return token
};

export const getUserInfo = async (email: string) => {
  const userInfo = await User.findOne({email},{_id: 0, favorites: 0, publishedTours: 0, password: 0, __v: 0}).lean()
  if(!userInfo)
    throw new NotFoundError("User not found")
  return userInfo
}
