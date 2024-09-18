import express from "express"
import { addTour } from "../controllers/adminControllers"
import { TourSchema } from "../utils/validators"
import requestHandler from "../handlers/requestHandler"

const router = express.Router()

router.post('/tour', requestHandler(TourSchema), addTour)

export default router