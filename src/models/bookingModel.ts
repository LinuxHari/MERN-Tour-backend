import mongoose, { InferSchemaType } from "mongoose";
import { passengerSchema } from "./reserveModel";

const bookerInfoSchema = {
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
};

const historySchema = new mongoose.Schema({
    clientSecret: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    card: {
      number: {
        type: String, // Card numbers are generally stored as strings
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      required: false
    },
    currency: {
      type: String,
      enum: ["INR", "USD"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "failed", "successful"],
      required: true, 
      default: "pending", 
    },
    attemptDate: {
      type: Date,
      required: true,
      default: new Date(),
    },
  }, { _id: false });
  

const transactionSchema = new mongoose.Schema({
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid",
    required: true,
  },
  history: {
    type: historySchema,
    required: true,
  },
}, {_id: false});

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
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
    required: true,
  },
  startDate: {
    type: Date,
    requried: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  bookingStatus: {
    type: String,
    enum: ["Init", "Failed", "Success"],
    default: "Init",
    required: true,
  },
  attempts: {
    type: Number,
    required: true,
  },
  transaction: {
    type: transactionSchema,
    required: true,
  },
});

const Booking = mongoose.model("Booking", bookingSchema);

export type BookingType = InferSchemaType<typeof bookingSchema>;

export default Booking;
