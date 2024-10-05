import { z } from "zod";
import sanitizeString from "../utils/sanitizeString";
import {
  destinationTypes,
  languages,
  specials,
  tourTypes,
} from "../config/tourConfig";

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
    .transform(sanitizeString)
    .pipe(z.string().min(1).max(50)),
});

export const TourListingSchema = z.object({
  destination: z
    .string()
    .min(2, { message: "Invalid destination name" })
    .max(85, { message: "Destination name is too long" }),
  destinationType: z.enum(destinationTypes as [string, ...string[]]),
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
        .max(9, "Number of adults should not exceed 9")
    ),
  children: z
    .string()
    .transform(parseToInt)
    .pipe(
      z
        .number()
        .int()
        .min(0)
        .max(9, { message: "Number of children should not exceed 9" })
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
    .min(6)
    .max(50)
    .transform(strToArr)
    .pipe(z.array(z.enum(tourTypes as [string, ...string[]])))
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
    .pipe(z.array(z.enum(languages as [string, ...string[]])))
    .optional(),
  specials: z
    .string()
    .min(5)
    .max(50)
    .transform(strToArr)
    .pipe(z.array(z.enum(specials as [string, ...string[]])))
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

export type TourListingSchemaType = z.infer<typeof TourListingSchema>;
