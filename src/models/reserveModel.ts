import mongoose, { InferSchemaType } from "mongoose";
import { modelOptions } from "../config/modelConfig";
import { CURRENCIES } from "../config/otherConfig";
import { priceType } from "./tourModel";

export const passengerSchema = {
  adults: {
    type: Number,
    required: true
  },
  teens: {
    type: Number
  },
  children: {
    type: Number
  },
  infants: {
    type: Number
  }
};

export const reservedSchema = new mongoose.Schema(
  {
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
      required: true,
      _id: false
    },
    reserveId: {
      type: String,
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
    totalAmount: {
      type: Number,
      required: true
    },
    price: {
      type: priceType,
      required: true
    },
    baseTotalAmount: {
      // Total amount in base currency for analytics
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: CURRENCIES,
      required: true
    },
    expiresAt: {
      type: Number, //It will be Epoach time in milliseconds
      required: true
    }
  },
  modelOptions
);

const Reserved = mongoose.model("reserved", reservedSchema);

export type ReservedType = InferSchemaType<typeof reservedSchema>;

export default Reserved;
