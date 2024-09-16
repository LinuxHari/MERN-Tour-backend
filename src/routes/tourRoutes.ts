import express from "express"
import { search } from "../controllers/tourControllers"
import requestHandler from "../handlers/requestHandler"
import { SearchSuggestionSchema } from "../utils/validators"

const router = express.Router()

router.get('/search', requestHandler(SearchSuggestionSchema, "query"), search)

export default router