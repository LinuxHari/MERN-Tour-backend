import mongoose, { InferSchemaType } from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tours',
    required: true
  },
  ratings: {
    Location: {
      type: Number,
      required: true,
    },
    Amenities: {
      type: Number,
      required: true,
    },
    Food: {
      type: Number,
      required: true,
    },
    Room: {
      type: Number,
      required: true,
    },
    Price: {
      type: Number,
      required: true,
    },
  },
  title: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
}, {timestamps: true});

const Review = mongoose.model("Reviews", reviewSchema)

export type ReviewType = InferSchemaType<typeof reviewSchema>

export default Review