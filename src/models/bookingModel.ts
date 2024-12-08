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

const historySchema = {
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
      brand: {
        type: String,
        required: true,
      },
      expMonth:{
        type: Number,
        required: true,
      },
      expYear: {
        type: Number,
        required: true,
      },
      required: false
    },
    reciept: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      enum: ["INR", "USD"] as const ,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "failed", "success"] as const,
      required: true, 
      default: "pending", 
    },
    attemptDate: {
      type: Date,
      required: true,
      default: new Date(),
    },
  };

const transactionSchema = {
  amount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid",
    required: true,
  },
  history: {
    type: [historySchema],
    required: true,
  },
};

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
    enum: ["init", "failed", "success"],
    default: "init",
    required: true,
  },
  attempts: {
    type: Number,
    required: true,
  },
  transaction: {
    type: transactionSchema,
    _id: false,
    required: true,
  },
});

const Booking = mongoose.model("Booking", bookingSchema);

export type BookingType = InferSchemaType<typeof bookingSchema>;

export type PaymentType = BookingType["transaction"]["history"][0]

export default Booking;
