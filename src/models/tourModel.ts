import mongoose, { InferSchemaType } from "mongoose";
import { CATEGORIES, LANGUAGES, MIN_AGE } from "../config/tourConfig";
import { modelOptions } from "../config/modelConfig";

const itineraryType = {
  activity: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lon: {
    type: Number,
    required: true
  }
};

const faqType = {
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  }
};

export const priceType = {
  adult: {
    type: Number,
    required: true
  },
  teen: {
    type: Number
  },
  child: {
    type: Number
  },
  infant: {
    type: Number
  }
};

const includedType = {
  beveragesAndFood: Boolean,
  localTaxes: Boolean,
  hotelPickup: Boolean,
  insuranceTransfer: Boolean,
  softDrinks: Boolean,
  tourGuide: Boolean,
  towel: Boolean,
  tips: Boolean,
  alcoholicBeverages: Boolean
};

const tourSchema = new mongoose.Schema(
  {
    tourId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES
    },
    highlights: {
      type: [String],
      required: true
    },
    images: {
      type: [String],
      required: true
    },
    price: {
      type: priceType,
      _id: false,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    capacity: {
      type: Number,
      requried: true
    },
    included: {
      type: includedType,
      required: true,
      _id: false
    },
    itinerary: {
      type: [itineraryType],
      required: true,
      _id: false
    },
    languages: {
      type: [String],
      required: true,
      enum: LANGUAGES
    },
    faq: {
      type: [faqType],
      required: true,
      _id: false
    },
    minAge: {
      type: Number,
      enum: MIN_AGE,
      required: true
    },
    destinationId: {
      type: String,
      required: true
    },
    // publisher: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Users",
    //   required: true
    // },
    // recurringEndDate: {
    //   type: Date,
    //   required: true
    // },
    // submissionStatus: {
    //   type: String,
    //   required: true,
    //   enum: SUBMISSION_STATUS
    // },
    freeCancellation: {
      type: Boolean,
      default: false
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    markAsDeleted: {
      type: Boolean,
      default: false
    }
  },
  modelOptions
);

const Tour = mongoose.model("Tours", tourSchema);

export type TourModel = InferSchemaType<typeof tourSchema>;

export default Tour;
