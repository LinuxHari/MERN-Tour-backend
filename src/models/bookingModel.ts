import mongoose, { InferSchemaType } from "mongoose";
import { passengerSchema } from "./reserveModel";
import { CURRENCIES } from "../config/otherConfig";

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
};

const historySchema = {
  clientSecret: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  card: {
    number: {
      type: String // Card numbers are generally stored as strings
    },
    brand: {
      type: String
    },
    expMonth: {
      type: Number
    },
    expYear: {
      type: Number
    }
  },
  reciept: {
    type: String
  },
  currency: {
    type: String,
    enum: CURRENCIES,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  baseAmount: {
    // Base currency(USD) amount
    type: Number,
    required: true
  },
  refundableAmount: {
    type: Number,
    required: true
  },
  baseRefundableAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "failed", "success"] as const,
    required: true,
    default: "pending"
  },
  attemptDate: {
    type: Date,
    required: true,
    default: new Date()
  }
};

const transactionSchema = {
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"] as const,
    default: "unpaid",
    required: true
  },
  history: {
    type: [historySchema],
    required: true
  }
};

const bookingSchema = new mongoose.Schema(
  {
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
      required: true
    },
    passengers: {
      type: passengerSchema,
      _id: false,
      required: true
    },
    reserveId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    bookerInfo: {
      type: bookerInfoSchema,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    bookingStatus: {
      type: String,
      enum: ["init", "pending", "failed", "success", "canceled"],
      required: true
    },
    attempts: {
      type: Number,
      required: true
    },
    transaction: {
      type: transactionSchema,
      _id: false,
      required: true
    },
    emailStatus: {
      type: String,
      enum: ["sent", "failed"]
    }
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export type BookingType = InferSchemaType<typeof bookingSchema>;

export type PaymentType = BookingType["transaction"]["history"][0];

export default Booking;
