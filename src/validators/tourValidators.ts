import { z } from "zod";
import sanitizeString from "../utils/sanitizeString";
import { destinationTypes, tourTypes } from "../config/tourConfig";

const isValidDate = (date:string) => date === (new Date(date)).toISOString().split("T")[0]
const parseToInt = (value: string) => parseInt(value)

export const SearchSuggestionSchema = z.object({
    searchText: z.string().transform(sanitizeString).pipe(z.string().min(1).max(50)),
});

export const TourListingSchema = z.object({
    destination: z.string().min(2, {message: "Invalid destination name"}).max(85, {message: "Destination name is too long"}),
    destinationType:  z.string().refine((value) => destinationTypes.includes(value), {message: "Invalid destination type"}),
    tourType: z.string().refine((value) => tourTypes.includes(value), {message: "Invalid tour type"}),
    startDate: z.string().refine(isValidDate),
    endDate: z.string().refine(isValidDate),
    adults: z.string().transform((parseToInt)).pipe( z.number().int().min(1, {message: "Atleast 1 adult required"}).max(9, "Number of adults should not exceed 9")),
    children: z.string().transform(parseToInt).pipe(z.number().int().min(0).max(9, {message: "Number of children should not exceed 9"})),
    infants: z.string().transform(parseToInt).pipe(z.number().int().min(0).max(9, {message: "Number of infant should not exceed 9"})),
    page: z.string().transform(parseToInt).pipe(z.number().int().min(0).max(100, {message: "Page number is not valid"}))
})

export type TourListingSchemaType = z.infer<typeof TourListingSchema>