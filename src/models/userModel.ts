import mongoose, { InferSchemaType } from "mongoose";
import bcrypt from "bcrypt"
import { ROLE } from "../config/userConfig";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    countryCode: {
        type: Number
    },
    phone: {
        type: Number
    },
    role: {
        type: String,
        enum: ROLE,
        required: true
    },
    profile: {
        type: String,
    },
    country: {
        type: String
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    address: {
        type: String
    },
    favorites: {
        type: [mongoose.Schema.Types.ObjectId]
    },
    publishedTours: {
        type: [mongoose.Schema.Types.ObjectId]
    }
})

userSchema.method("hashPassword", async function(password: string){
    const saltCount = 10
    this.password = await bcrypt.hash(password, saltCount)
})


export type UserModel = InferSchemaType<typeof userSchema>

type Methods = {
    hashPassword: (password: string) => void
}

const User = mongoose.model<UserModel & Methods>("Users", userSchema)

export default User