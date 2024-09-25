import express from "express"
import { search, tours } from "../controllers/tourControllers"
import requestHandler from "../handlers/requestHandler"
import { SearchSuggestionSchema, TourListingSchema } from "../validators/tourValidators"

const router = express.Router()

router.get('/', requestHandler(TourListingSchema, "query"), tours)
router.get('/search', requestHandler(SearchSuggestionSchema, "query"), search)

export default router