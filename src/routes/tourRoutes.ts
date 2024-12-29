import { Router } from "express"
import { bookedTour, bookTour, cancelBooking, getReview, reserve, reservedDetails, reviewTour, search, tour, tours } from "../controllers/tourControllers"
import requestHandler from "../handlers/requestHandler"
import { BookingTourParamSchema, ReserveTourParamSchema, ReserveTourSchema, SearchSuggestionSchema, SingleTourParamSchema, TourListingSchema, BookingSchema, RatingSchema } from "../validators/tourValidators"
import verifyAuthToken from "../middlewares/verifyAuthToken"

const router = Router()

router.get('/search', requestHandler(SearchSuggestionSchema, "query"), search)
router.get('/', requestHandler(TourListingSchema, "query"), tours)
router.get('/:tourId', requestHandler(SingleTourParamSchema, "params"), tour)
router.post('/reserve', verifyAuthToken, requestHandler(ReserveTourSchema), reserve)
router.get('/reserve/:reserveId', verifyAuthToken, requestHandler(ReserveTourParamSchema, "params"), reservedDetails)
router.get('/book/:bookingId', verifyAuthToken, requestHandler(BookingTourParamSchema, "params"), bookedTour)
router.post('/book/:reserveId', verifyAuthToken, requestHandler(ReserveTourParamSchema, "params") ,requestHandler(BookingSchema), bookTour)
router.post('/book/cancel/:bookingId', verifyAuthToken, requestHandler(BookingTourParamSchema, "params"), cancelBooking)
router.post('/tour/review/:tourId', verifyAuthToken, requestHandler(SingleTourParamSchema, "params"), requestHandler(RatingSchema), reviewTour)
router.get('/tour/review/:tourId', verifyAuthToken, requestHandler(SingleTourParamSchema, "params"), getReview)

export default router;