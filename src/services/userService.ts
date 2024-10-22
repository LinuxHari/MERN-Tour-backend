import { errorMessage } from "../handlers/errorHandler";
import User from "../models/userModel";

type UserData = {
    name: string;
    email: string;
    password: string;
}

export const createUser = async(userData: UserData) => {
    const existingUser = await User.findOne({email: userData.email})
    if(existingUser)
        throw new Error(errorMessage.badRequest)
    const newUser = new User(userData)
    newUser.hashPassword(userData.password)
    await newUser.save() 
}