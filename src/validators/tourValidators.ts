import { z } from "zod";
import removeSpaces from "../utils/removeSpaces";
import { CATEGORIES, SORTTYPES, SPECIALS } from "../config/tourConfig";
import { EmailSchema } from "./authValidators";
import { LocationSchema, PageSchema } from "./adminValidators";
import { CURRENCIES } from "../config/otherConfig";
import { isValidDate, parseToInt, strToArr } from "../utils/schemaUtils";

export const SearchSuggestionSchema = z.object({
  searchText: z.string().transform(removeSpaces).pipe(z.string().min(1).max(50))
});

const FiltersSchema = z
  .object({
    filters: z.string().transform((value) => Boolean(parseInt(value))),
    sortType: z.enum(SORTTYPES).optional(),
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
    languages: z.string().min(3).max(100).transform(strToArr).pipe(z.array(z.string())).optional(),
    specials: z
      .string()
      .min(5)
      .max(50)
      .transform(strToArr)
      .pipe(z.array(z.enum(SPECIALS)))
      .optional(),
    minPrice: z.string().transform(parseToInt).pipe(z.number().int().min(1).max(1000000)).optional(),
    maxPrice: z.string().transform(parseToInt).pipe(z.number().int().min(2).max(1000000)).optional()
  })
  .merge(PageSchema);

export const TourListingSchema = z
  .object({
    destinationId: z.string().length(8, { message: "Invalid destination id" }),
    startDate: z.string().refine(isValidDate),
    endDate: z.string().refine(isValidDate),
    adults: z
      .string()
      .transform(parseToInt)
      .pipe(
        z.number().int().min(1, { message: "Atleast 1 adult required" }).max(10, "Number of adults should not exceed 9")
      ),
    children: z
      .string()
      .transform(parseToInt)
      .pipe(z.number().int().min(0).max(10, { message: "Number of children should not exceed 9" })),
    infants: z
      .string()
      .transform(parseToInt)
      .pipe(z.number().int().min(0).max(9, { message: "Number of infant should not exceed 9" })),
    teens: z
      .string()
      .transform(parseToInt)
      .pipe(z.number().int().min(0).max(9, { message: "Number of infant should not exceed 9" }))
  })
  .merge(FiltersSchema);

export const SingleTourParamSchema = z.object({
  tourId: z.string().length(8, { message: "Invalid tour id" })
});

export const ReserveTourSchema = z
  .object({
    startDate: z
      .string()
      .transform((dateStr) => new Date(dateStr))
      .pipe(z.date({ message: "Invalid start date" })),
    endDate: z
      .string()
      .transform((dateStr) => new Date(dateStr))
      .pipe(z.date({ message: "Invalid end date" })),
    pax: z.object({
      adults: z
        .number()
        .int()
        .min(1, { message: "Atleast 1 adult required" })
        .max(10, "Number of adults should not exceed 9"),
      children: z.number().int().min(0).max(10, { message: "Number of children should not exceed 9" }).optional(),
      infants: z.number().int().min(0).max(9, { message: "Number of infant should not exceed 9" }).optional(),
      teens: z.number().int().min(0).max(9, { message: "Number of infant should not exceed 9" }).optional()
    }),
    currency: z.enum(CURRENCIES)
  })
  .merge(SingleTourParamSchema);

export const ReserveTourParamSchema = z.object({
  reserveId: z.string().length(8, { message: "Invalid reserve id" })
});

export const BookingSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: "Full name must contain atleast 2 characters" })
      .max(64, { message: "Full name must not exceed 64 characters" }),
    countryCode: z
      .number({ message: "Country code must be a number" })
      .min(1, { message: "Invalid country code" })
      .max(999, { message: "Country code is invalid" }),
    phone: z
      .number({ message: "Phone number must be number" })
      .min(1000, { message: "Invalid phone number" })
      .max(99999999999, { message: "Invalid phone number" })
  })
  .merge(EmailSchema)
  .merge(LocationSchema.omit({ city: true }));

export const BookingTourParamSchema = z.object({
  bookingId: z.string().length(8, { message: "Invalid booking id" })
});

export const RatingSchema = z.object({
  ratings: z.object({
    Location: z.number().min(1, { message: "Invalid location rating" }).max(5, { message: "Invalid location rating" }),
    Amenities: z
      .number()
      .min(1, { message: "Invalid amenities rating" })
      .max(5, { message: "Invalid amenities rating" }),
    Food: z.number().min(1, { message: "Invalid food rating" }).max(5, { message: "Invalid food rating" }),
    Room: z.number().min(1, { message: "Invalid room rating" }).max(5, { message: "Invalid room rating" }),
    Price: z.number().min(1, { message: "Invalid price rating" }).max(5, { message: "Invalid price rating" })
  }),
  title: z
    .string()
    .min(2, { message: "Title should have atleast two characters" })
    .max(100, { message: "Title should not exceed more than 100 characters" }),
  comment: z
    .string()
    .min(2, { message: "Comment should have atleast two characters" })
    .max(500, { message: "Comment should not exceed more than 500 characters" })
});

export const ToursByCategorySchema = FiltersSchema.omit({
  tourTypes: true
});

export const CategorySchema = z.object({
  category: z.enum(CATEGORIES, { message: "Invalid category" })
});

export type RatingType = z.infer<typeof RatingSchema>;
export type BookingSchemaType = z.infer<typeof BookingSchema>;
export type TourListingSchemaType = z.infer<typeof TourListingSchema>;
export type ReserveTourType = z.infer<typeof ReserveTourSchema>;
export type BookingTourType = z.infer<typeof BookingSchema>;
export type ToursByCategoryType = z.infer<typeof ToursByCategorySchema>;
