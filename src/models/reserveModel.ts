import mongoose, { InferSchemaType } from "mongoose";
import { modelOptions } from "./modelConfig";

const passengerSchema = {
  adults: {
    type: Number,
    required: true,
  },
  teens: {
    type: Number,
  },
  children: {
    type: Number,
  },
  infants: {
    type: Number,
  },
};

const reservedSchema = new mongoose.Schema({
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
  totalAmount: {
    type: Number,
    required: true
  },
  expiresAt: {
    type: Number, //It will be Epoach time in milliseconds
    required: true
  }
}, modelOptions);

const Reserved = mongoose.model("reserved", reservedSchema)

export type ReservedType = InferSchemaType<typeof reservedSchema> 

export default Reserved