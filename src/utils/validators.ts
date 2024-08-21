import { body } from "express-validator";
import { categories, languages } from "../models/modelConfig";

const validateString = (
  values: [string],
  minLength: number,
  maxLength: number
) =>
  values.every(
    (value: string) =>
      typeof value === "string" &&
      value.length >= minLength &&
      value.length <= maxLength
  );

const sanitizeString = (value: string) => value.trim().replace(/\s+/g, " ");

export const addTourValidator = [
  body("name")
    .isString()
    .withMessage("Tour name must be string")
    .customSanitizer(sanitizeString)
    .isLength({ min: 8, max: 40 })
    .withMessage(
      "Tour name should be minimum 8 characters and maximum 40 characters"
    ),
  body("description")
    .isString()
    .withMessage("Tour description must be string")
    .customSanitizer(sanitizeString)
    .isLength({ min: 100, max: 400 })
    .withMessage(
      "Tour description should be minimum 8 characters and maximum 40 characters"
    ),
  body("keywords")
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage(
      "Keywords must be given in an array and size should not be more than 10"
    )
    .customSanitizer((keywords) => keywords.map(sanitizeString))
    .custom((keywords) => validateString(keywords, 2, 30))
    .withMessage(
      "Keywords must contain strings and their length should be less than 30 characters"
    ),
  body("category")
    .customSanitizer(sanitizeString)
    .notEmpty()
    .withMessage("Invalid category name has given")
    .custom((category: string) => categories.includes(category))
    .withMessage("Category is not valid"),
  body("hightlights")
    .isArray({ min: 2, max: 10 })
    .withMessage("Highlights must be an array and should be from 2 to 10")
    .customSanitizer((highlights) => highlights.map(sanitizeString))
    .custom((highlights) => validateString(highlights, 20, 100))
    .withMessage(
      "Highlights must contain atleast 20 characters and less than 100 characters"
    ),
  body("city")
    .isString()
    .withMessage("City must be string")
    .customSanitizer(sanitizeString)
    .isLength({ min: 2, max: 168 })
    .withMessage("City name must not be empty"),
  body("state")
    .isString()
    .withMessage("State must be string")
    .customSanitizer(sanitizeString)
    .isLength({ min: 2, max: 50 })
    .withMessage("State name must not be empty"),
  body("zipCode")
    .isInt({ min: 7, max: 8 })
    .withMessage("zip code must be a integer and should be 7 to 8 digits"),
  body("price")
    .isNumeric()
    .withMessage("Price must be a number")
    .customSanitizer((price) => price.toFixed(2))
    .isFloat({ min: 5, max: 10000 })
    .withMessage(
      "Price should not be lesser than 5 and bigger than 10000 dollars"
    ),
  body("itinerary*place")
    .isString()
    .withMessage("Place must be string")
    .customSanitizer(sanitizeString)
    .isLength({ min: 4, max: 50 })
    .withMessage(
      "place name must not be empty and should not be more than 300 or less than 4 characters"
    ),
  body("itinerary*description")
    .isString()
    .withMessage("Description must be string")
    .customSanitizer(sanitizeString)
    .isLength({ min: 20, max: 300 })
    .withMessage(
      "Description name must not be empty and should not be more than 300 or less than 4 characters"
    ),
  body("languages")
    .isArray({ min: 1, max: 8 })
    .withMessage("Languages must be an array and should be from 1 to 10")
    .customSanitizer((languages) => languages.map(sanitizeString))
    .custom((guideLangs) =>
      guideLangs.every((language: string) => languages.includes(language))
    )
    .withMessage("Invalid language has given"),
  body("minAge")
    .isInt({ min: 0, max: 18 })
    .withMessage("Age must be integer and less than or equal to 18"),
  body("freeCancellation")
    .isBoolean()
    .withMessage("Free cancellation must be provided"),
  body("availableDates")
    .isArray({ min: 1, max: 180 })
    .withMessage(
      "Atleast one date should be given and length should not be more than 180 dates"
    ),
];
