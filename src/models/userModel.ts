import mongoose, { InferSchemaType } from "mongoose";
import bcrypt from "bcrypt"
import { errorMessage } from "../handlers/errorHandler";

const userSchema = new mongoose.Schema({
    name: {
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
        enum: ["Traveler", "Publisher", "Admin"]
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

userSchema.method("hashPassword", function(password: string){
    const saltCount = 10
    bcrypt.hash(password, saltCount, (err, hash) => {
        if(err)
            throw new Error(errorMessage.serverError)
        this.password = hash
    })
})


export type UserModel = InferSchemaType<typeof userSchema>

type Methods = {
    hashPassword: (password: string) => void
}

const User = mongoose.model<UserModel & Methods>("Users", userSchema)

export default User