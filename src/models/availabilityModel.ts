import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  tourId: {
    type: String,
    required: true
  },
  availableSeats: {
    type: Number,
    required: true
  }
});

const Availability = mongoose.model("Availability", availabilitySchema);

export default Availability;
