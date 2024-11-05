import express from "express"
import { reserve, search, tour, tours } from "../controllers/tourControllers"
import requestHandler from "../handlers/requestHandler"
import { ReserveTourSchema, SearchSuggestionSchema, SingleTourSchema, TourListingSchema } from "../validators/tourValidators"
import verifyAuthToken from "../middlewares/verifyAuthToken"

const router = express.Router()

router.get('/search', requestHandler(SearchSuggestionSchema, "query"), search)
router.get('/', requestHandler(TourListingSchema, "query"), tours)
router.get('/:tourId', requestHandler(SingleTourSchema, "params"), tour)
router.post("/reserve", requestHandler(ReserveTourSchema), verifyAuthToken, reserve)

export default router