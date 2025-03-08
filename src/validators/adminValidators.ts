import { z } from "zod";
import { CATEGORIES, LANGUAGES, MIN_AGE } from "../config/tourConfig";
import removeSpaces from "../utils/removeSpaces";

const allowedAges = Object.values(MIN_AGE);

export const LocationSchema = z.object({
  city: z
    .string()
    .transform(removeSpaces)
    .pipe(
      z
        .string()
        .min(2, { message: "City name must be at least 2 characters" })
        .max(168, { message: "City name must not exceed 168 characters" })
    ),

  state: z
    .string()
    .transform(removeSpaces)
    .pipe(
      z
        .string()
        .min(2, { message: "State name must be at least 2 characters" })
        .max(50, { message: "State name must not exceed 50 characters" })
    ),

  country: z
    .string()
    .transform(removeSpaces)
    .pipe(
      z
        .string()
        .min(3, { message: "State name must be at least 3 characters" })
        .max(56, { message: "State name must not exceed 56 characters" })
    )
});

export const BaseTourSchema = z.object({
  name: z
    .string()
    .transform(removeSpaces)
    .pipe(
      z
        .string()
        .min(8, { message: "Tour name should be minimum 8 characters" })
        .max(40, { message: "Tour name should be maximum 40 characters" })
    ),

  description: z
    .string()
    .transform(removeSpaces)
    .pipe(
      z
        .string()
        .min(100, {
          message: "Tour description should be minimum 100 characters"
        })
        .max(400, {
          message: "Tour description should be maximum 400 characters"
        })
    ),

  category: z.enum(CATEGORIES, {
    message: "Category is not valid"
  }),

  highlights: z
    .array(
      z
        .string()
        .transform(removeSpaces)
        .pipe(
          z
            .string()
            .min(20, { message: "Highlight should be minimum 20 characters" })
            .max(100, { message: "Highlight should be maximum 100 characters" })
        )
    )
    .min(2, { message: "Highlights must have at least 2 entries" })
    .max(10, { message: "Highlights should not exceed 10 entries" }),

  capacity: z
    .number()
    .min(2, { message: "Capacity should not be less than 2" })
    .max(10000, { message: "Capacity should not be more than 1000" })
    .transform((value) => parseFloat(value.toFixed(2))),

  price: z.object({
    adult: z
      .number()
      .min(5, { message: "Price should not be less than 5" })
      .max(10000, { message: "Price should not be more than 10000" })
      .transform((value) => parseFloat(value.toFixed(2))),

    teen: z
      .number()
      .min(5, { message: "Price should not be less than 5" })
      .max(10000, { message: "Price should not be more than 10000" })
      .transform((value) => parseFloat(value.toFixed(2)))
      .optional(),

    child: z
      .number()
      .min(5, { message: "Price should not be less than 5" })
      .max(10000, { message: "Price should not be more than 10000" })
      .transform((value) => parseFloat(value.toFixed(2)))
      .optional(),

    infant: z
      .number()
      .min(5, { message: "Price should not be less than 5" })
      .max(10000, { message: "Price should not be more than 10000" })
      .transform((value) => parseFloat(value.toFixed(2)))
      .optional()
  }),

  itinerary: z
    .array(
      z.object({
        activity: z
          .string()
          .transform(removeSpaces)
          .pipe(
            z
              .string()
              .min(4, { message: "Place must be at least 4 characters" })
              .max(50, { message: "Place must not exceed 50 characters" })
          ),

        details: z
          .string()
          .transform(removeSpaces)
          .pipe(
            z
              .string()
              .min(10, {
                message: "Description must be at least 10 characters"
              })
              .max(300, {
                message: "Description must not exceed 300 characters"
              })
          ),
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180)
      })
    )
    .min(2, { message: "Itinerary must have at least 1 entry" })
    .max(10, { message: "Itinerary should not exceed 10 entries" }),

  languages: z
    .array(z.enum(LANGUAGES))
    .min(1, { message: "At least one language must be selected" })
    .max(8, { message: "Languages should not exceed 8 entries" }),

  faq: z
    .array(
      z.object({
        question: z
          .string()
          .transform(removeSpaces)
          .pipe(
            z.string().min(8, { message: "FAQ question must be at least 8 characters" }).max(100, {
              message: "FAQ question must not exceed 100 characters"
            })
          ),

        answer: z
          .string()
          .transform(removeSpaces)
          .pipe(
            z.string().min(2, { message: "FAQ answer must be at least 2 characters" }).max(300, {
              message: "FAQ answer must not exceed 300 characters"
            })
          )
      })
    )
    .min(1, { message: "At least one FAQ must be provided" })
    .max(10, { message: "FAQ should not exceed 10 entries" }),

  included: z.object({
    beveragesAndFood: z.boolean(),
    localTaxes: z.boolean(),
    hotelPickup: z.boolean(),
    insuranceTransfer: z.boolean(),
    softDrinks: z.boolean(),
    tourGuide: z.boolean(),
    towel: z.boolean(),
    tips: z.boolean(),
    alcoholicBeverages: z.boolean()
  }),

  minAge: z
    .string()
    .transform((age) => parseInt(age, 10))
    .pipe(
      z.union(
        [
          z.literal(allowedAges[0]),
          z.literal(allowedAges[1]),
          z.literal(allowedAges[2]),
          z.literal(allowedAges[3])
        ],
        {
          message: "Invalid age is selected"
        }
      )
    ),

  images: z
    .array(
      z
        .string()
        .transform(removeSpaces)
        .pipe(
          z
            .string()
            .min(30, { message: "Invalid image url" })
            .max(400, { message: "Invalid image url too long" })
        )
    )
    .min(2, { message: "Atleast 2 images needed" })
    .max(10, { message: "Can't upload more than 10 images" }),

  freeCancellation: z
    .string()
    .refine((value) => value === "yes" || value === "no", {
      message: "Invalid value provided"
    })
    .default("yes")
});

export const TourSchema = BaseTourSchema.extend(LocationSchema.shape);

export type TourSchemaType = z.infer<typeof TourSchema>;

export type UpdateSchemaType = z.infer<typeof BaseTourSchema>;
