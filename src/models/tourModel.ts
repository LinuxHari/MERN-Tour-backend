import mongoose, { InferSchemaType } from "mongoose";
import {
  categories,
  languages,
  minAge,
  submissionStatus,
} from "../config/tourConfig";
import { modelOptions } from "./modelConfig";

const itineraryType = {
  activity: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
};

const faqType = {
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
};

const includedType =  {
  beveragesAndFood: Boolean,
  localTaxes: Boolean,
  hotelPickup: Boolean,
  insuranceTransfer: Boolean,
  softDrinks: Boolean,
  tourGuide: Boolean,
  towel: Boolean,
  tips: Boolean,
  alcoholicBeverages: Boolean,
}

const tourSchema = new mongoose.Schema({
  tourId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: categories,
  },
  highlights: {
    type: [String],
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    requried: true
  },
  included: {
    type: includedType,
    required: true
  },
  itinerary: {
    type: [itineraryType],
    required: true,
  },
  languages: {
    type: [String],
    required: true,
    enum: languages,
  },
  faq: {
    type: [faqType],
    required: true,
  },
  minAge: {
    type: Number,
    enum: minAge,
    required: true,
  },
  publisher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recurringEndDate: {
    type: Date,
    required: true,
  },
  submissionStatus: {
    type: String,
    required: true,
    enum: submissionStatus,
  },
  freeCancellation: {
    type: Boolean,
    default: false,
  },
  markAsDeleted: {
    type: Boolean,
    default: false,
  },
}, modelOptions);

const Tour = mongoose.model("Tours", tourSchema);

export type TourModel = InferSchemaType<typeof tourSchema>;

export default Tour;
