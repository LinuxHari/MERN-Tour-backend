import { ROLE } from "../config/userConfig";
import { errorMessage } from "../handlers/errorHandler";
import User from "../models/userModel";
import { generateToken } from "../utils/authTokenManager";
import {
  LoginSchemaType,
  SignupSchemaType,
} from "../validators/userValidators";
import bcrypt from "bcrypt"

export const createUser = async (
  userData: Omit<SignupSchemaType, "confirmPassword">
) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) throw new Error(errorMessage.conflict);
  const newUser = new User({...userData, role: ROLE[0]});
  newUser.hashPassword(userData.password);
  await newUser.save();
};

export const authenticateUser = async (userData: LoginSchemaType) => {
  const existingUser = await User.findOne({ email: userData.email });
  if(!existingUser)
    throw new Error(errorMessage.notFound)
  const isValidPassword = await bcrypt.compare(userData.password, existingUser.password)
  if(!isValidPassword)
    throw new Error(errorMessage.badRequest)
  const token = generateToken({email: existingUser.email, role: existingUser.role})
  return token
};
