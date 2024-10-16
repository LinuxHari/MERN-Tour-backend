import mongoose, { InferSchemaType } from "mongoose";
import { DESTINATION_TYPES } from "../config/tourConfig";

const destinationSchema = new mongoose.Schema({
    destination: {
        type: String,
        required: true
    },
    destinationType: {
        type: String,
        enum: DESTINATION_TYPES,
        required: true
    },
    destinationId: {
        type: String,
        required: true
    },
    parentDestinationId: { // Optional since country won't have any parent destination
        type: String
    }
})

const Destination = mongoose.model("Destinations", destinationSchema)

export type DestinationType = InferSchemaType<typeof destinationSchema>

export default Destination