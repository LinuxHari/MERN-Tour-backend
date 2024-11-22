import { z } from "zod";
import removeSpaces from "../utils/removeSpaces";
import {
  CATEGORIES,
  LANGUAGES,
  SPECIALS
} from "../config/tourConfig";
import { EmailSchema } from "./authValidators";
import { LocationSchema } from "./adminValidators";

const isValidDate = (date: string) =>
  date === new Date(date).toISOString().split("T")[0];
const parseToInt = (value: string) => parseInt(value);

const strToArr = (values: string) => {
  const valueArr = values.split(",");
  if (valueArr.length) return valueArr;
  return [values];
};

export const SearchSuggestionSchema = z.object({
  searchText: z
    .string()
    .transform(removeSpaces)
    .pipe(z.string().min(1).max(50)),
});

export const TourListingSchema = z.object({
  destinationId: z
    .string()
    .length(8, { message: "Invalid destination id" }),
  startDate: z.string().refine(isValidDate),
  endDate: z.string().refine(isValidDate),
  adults: z
    .string()
    .transform(parseToInt)
    .pipe(
      z
        .number()
        .int()
        .min(1, { message: "Atleast 1 adult required" })
        .max(10, "Number of adults should not exceed 9")
    ),
  children: z
    .string()
    .transform(parseToInt)
    .pipe(
      z
        .number()
        .int()
        .min(0)
        .max(10, { message: "Number of children should not exceed 9" })
    ),
  infants: z
    .string()
    .transform(parseToInt)
    .pipe(
      z
        .number()
        .int()
        .min(0)
        .max(9, { message: "Number of infant should not exceed 9" })
    ),
    teens: z
    .string()
    .transform(parseToInt)
    .pipe(
      z
        .number()
        .int()
        .min(0)
        .max(9, { message: "Number of infant should not exceed 9" })
    ),
  page: z
    .string()
    .transform(parseToInt)
    .pipe(
      z.number().int().min(0).max(100, { message: "Page number is not valid" })
    ),
  filters: z.string().transform((value) => Boolean(parseInt(value))),
  sortType: z.string().min(11).max(25),
  tourTypes: z
    .string()
    .min(4)
    .max(50)
    .transform(strToArr)
    .pipe(z.array(z.enum(CATEGORIES)))
    .optional(),
  rating: z
    .string()
    .transform((rating) => parseInt(rating))
    .pipe(z.number().min(0).max(5))
    .optional(),
  languages: z
    .string()
    .min(3)
    .max(100)
    .transform(strToArr)
    .pipe(z.array(z.enum(LANGUAGES)))
    .optional(),
  specials: z
    .string()
    .min(5)
    .max(50)
    .transform(strToArr)
    .pipe(z.array(z.enum(SPECIALS)))
    .optional(),
  minPrice: z
    .string()
    .transform(parseToInt)
    .pipe(z.number().int().min(1).max(1000000))
    .optional(),
  maxPrice: z
    .string()
    .transform(parseToInt)
    .pipe(z.number().int().min(2).max(1000000))
    .optional(),
});

export const SingleTourSchema = z.object({
  tourId: z.string().length(8)
})

export const ReserveTourSchema = z.object({
  startDate: z.string().transform((dateStr) => new Date(dateStr)).pipe(z.date({message: "Invalid start date"})),
  endDate: z.string().transform((dateStr) => new Date(dateStr)).pipe(z.date({message: "Invalid end date"})),
  pax: z.object({
    adults: z.number().int().min(1, { message: "Atleast 1 adult required" }).max(10, "Number of adults should not exceed 9"),
  children: z
        .number()
        .int()
        .min(0)
        .max(10, { message: "Number of children should not exceed 9" }).optional(),
  infants: 
      z
        .number()
        .int()
        .min(0)
        .max(9, { message: "Number of infant should not exceed 9" }).optional(),
    teens: z
        .number()
        .int()
        .min(0)
        .max(9, { message: "Number of infant should not exceed 9" }).optional(),
  })
}).merge(SingleTourSchema)

export const ReserveTourParamSchema = z.object({
  reserveId: z
.string()
.length(8, { message: "Invalid reserve id" }
)})

export const BookingSchema = z.object({
  fullName: z.string().min(2, {message: "Full name must contain atleast 2 characters"}).max(64, {message: "Full name must not exceed 64 characters"}),
  countryCode: z.number({message: "Country code must be a number"}).min(1, {message: "Invalid country code"}).max(999, {message: "Country code is invalid"}),
  phone: z.number({message: "Phone number must be number"}).min(1000,{message: "Invalid phone number"}).max(99999999999, {message: "Invalid phone number"})
}).merge(EmailSchema).merge(LocationSchema.omit({city: true}))

export type BookingSchemaType = z.infer<typeof BookingSchema>

export default BookingSchema

export type TourListingSchemaType = z.infer<typeof TourListingSchema>;
export type ReserveTourType = z.infer<typeof ReserveTourSchema>
export type BookingTourType = z.infer<typeof BookingSchema>
