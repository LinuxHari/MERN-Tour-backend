import { Router } from "express"
import { bookTour, reserve, reservedDetails, search, tour, tours } from "../controllers/tourControllers"
import requestHandler from "../handlers/requestHandler"
import BookingSchema, { ReserveTourParamSchema, ReserveTourSchema, SearchSuggestionSchema, SingleTourSchema, TourListingSchema } from "../validators/tourValidators"
import verifyAuthToken from "../middlewares/verifyAuthToken"

const router = Router()

router.get('/search', requestHandler(SearchSuggestionSchema, "query"), search)
router.get('/', requestHandler(TourListingSchema, "query"), tours)
router.get('/:tourId', requestHandler(SingleTourSchema, "params"), tour)
router.post('/reserve', verifyAuthToken, requestHandler(ReserveTourSchema), reserve)
router.get('/reserve/:reserveId', verifyAuthToken, requestHandler(ReserveTourParamSchema, "params"), reservedDetails)
router.post('/book/:reserveId', verifyAuthToken, requestHandler(ReserveTourParamSchema, "params") ,requestHandler(BookingSchema), bookTour)

export default router