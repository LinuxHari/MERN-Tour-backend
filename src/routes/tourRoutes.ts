import express from "express"
import { search, tour, tours } from "../controllers/tourControllers"
import requestHandler from "../handlers/requestHandler"
import { SearchSuggestionSchema, TourListingSchema } from "../validators/tourValidators"

const router = express.Router()

router.get('/search', requestHandler(SearchSuggestionSchema, "query"), search)
router.get('/', requestHandler(TourListingSchema, "query"), tours)
router.get('/:id', tour)

export default router