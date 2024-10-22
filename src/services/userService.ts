import { errorMessage } from "../handlers/errorHandler";
import User from "../models/userModel";
import { SignupSchemaType } from "../validators/userValidators";

export const createUser = async(userData: Omit<SignupSchemaType, "confirmPassword">) => {
    const existingUser = await User.findOne({email: userData.email})
    if(existingUser)
        throw new Error(errorMessage.badRequest)
    const newUser = new User(userData)
    newUser.hashPassword(userData.password)
    await newUser.save() 
}