import { Router } from "express";
import {
  bookedTour,
  bookTour,
  cancelBooking,
  deleteReview,
  getPopularTours,
  getReview,
  getTourAvailability,
  getTrendingTours,
  reserve,
  reservedDetails,
  reviewTour,
  search,
  tour,
  tours,
  toursByCategory,
  updateReview
} from "../controllers/tourControllers";
import requestHandler from "../handlers/requestHandler";
import {
  BookingTourParamSchema,
  ReserveTourParamSchema,
  ReserveTourSchema,
  SearchSuggestionSchema,
  SingleTourParamSchema,
  TourListingSchema,
  BookingSchema,
  RatingSchema,
  ToursByCategorySchema,
  CategorySchema
} from "../validators/tourValidators";
import verifyAuthToken from "../middlewares/verifyAuthToken";
import { LimitSchema, ReviewSchema } from "../validators/adminValidators";

const router = Router();

router.get("/search", requestHandler(SearchSuggestionSchema, "query"), search);
router.post("/reserve", verifyAuthToken, requestHandler(ReserveTourSchema), reserve);
router.get("/reserve/:reserveId", verifyAuthToken, requestHandler(ReserveTourParamSchema, "params"), reservedDetails);
router.get("/book/:bookingId", verifyAuthToken, requestHandler(BookingTourParamSchema, "params"), bookedTour);
router.post(
  "/book/:reserveId",
  verifyAuthToken,
  requestHandler(ReserveTourParamSchema, "params"),
  requestHandler(BookingSchema),
  bookTour
);
router.post(
  "/book/cancel/:bookingId",
  verifyAuthToken,
  requestHandler(BookingTourParamSchema, "params"),
  cancelBooking
);
router.get(
  "/review/:tourId",
  requestHandler(SingleTourParamSchema, "params"),
  requestHandler(ReviewSchema, "query"),
  getReview
);
router.post(
  "/review/:tourId",
  verifyAuthToken,
  requestHandler(SingleTourParamSchema, "params"),
  requestHandler(RatingSchema),
  reviewTour
);
router.put(
  "/review/:tourId",
  verifyAuthToken,
  requestHandler(SingleTourParamSchema, "params"),
  requestHandler(RatingSchema),
  updateReview
);

router.delete("/review/:tourId", verifyAuthToken, requestHandler(SingleTourParamSchema, "params"), deleteReview);

router.get("/popular", requestHandler(LimitSchema, "query"), getPopularTours);
router.get("/trending", requestHandler(LimitSchema, "query"), getTrendingTours);

router.get(
  "/category/:category",
  requestHandler(CategorySchema, "params"),
  requestHandler(ToursByCategorySchema, "query"),
  toursByCategory
);

router.get("/:tourId/availability", requestHandler(SingleTourParamSchema, "params"), getTourAvailability);

router.get("/", requestHandler(TourListingSchema, "query"), tours);
router.get("/:tourId", requestHandler(SingleTourParamSchema, "params"), tour);

export default router;
