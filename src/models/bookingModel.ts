import mongoose from "mongoose";
import { passengerSchema } from "./reserveModel";

const transactionSchema = new mongoose.Schema({
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
        required: true
    },
    currency: {
        type: String,
        enum: ["INR","USD"],
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
})

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
        enum: ["Pending", "Failed", "Success"]
    },
    transaction: {
        type: transactionSchema,
        requried: true
    }
})

const Booking = mongoose.model("Booking", bookingSchema)

export default Booking