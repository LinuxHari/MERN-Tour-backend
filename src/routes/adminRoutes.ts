import express from "express"
import { addTour } from "../controllers/adminControllers"
import { TourSchema } from "../utils/validators"
import requestHandler from "../handlers/requestHandler"

const router = express.Router()

router.post('/add-tour', requestHandler(TourSchema), requestHandler ,addTour)

export default router