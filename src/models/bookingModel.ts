import mongoose, { InferSchemaType } from "mongoose";
import { passengerSchema } from "./reserveModel";

const bookerInfoSchema = {
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    }, 
    phoneNumber: {
        type: String,
        required: true
    }
}

const transactionSchema = {
    clientSecret: {
        type: String,
        required: true
    },
    paymentId: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid"],
        required: true
    },
    currency: {
        type: String,
        enum: ["INR","USD"],
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    amountCharged: {
        type: Number,
        required: true
    }
}

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    tourId: {
      type: String,
      required: true,
    },
    passengers: {
      type: passengerSchema,
      required: true,
    },
    reserveId: {
      type: String,
      required: true,
    },
    bookerInfo: {
      type: bookerInfoSchema,
      required: true
    },
    startDate: {
      type: Date,
      requried: true
    },
    endDate: {
      type: Date,
      required: true
    },
    bookingStatus: {
        type: String,
        enum: ["Init", "Failed", "Success"]
    },
    transaction: {
        type: transactionSchema,
        _id: false,
        requried: true
    }
})

const Booking = mongoose.model("Booking", bookingSchema)

export type BookingType = InferSchemaType<typeof bookingSchema> 

export default Booking