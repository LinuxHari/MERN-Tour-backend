import mongoose from "mongoose";
import { categories, languages, submissionStatus } from "./modelConfig";

const itinerarySchema = new mongoose.Schema({
  place: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    tyoe: String,
    required: true,
  },
  keywords: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    required: true,
    enum: categories
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
  zipCode: {
    type: Number,
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
  itinerary: {
    type: [itinerarySchema],
    requried: true,
  },
  languages: {
    type: String,
    required: true,
    enum: languages,
  },
  faq: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  minAge: {
    type: Number,
    enum: [0, 13, 18],
    required: true,
  },
  publisher: {
    type: mongoose.Schema.Types.ObjectId,
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
  freeCancelllation: {
    type: Boolean,
    default: false,
  },
  markAsDeleted: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Tours", tourSchema)