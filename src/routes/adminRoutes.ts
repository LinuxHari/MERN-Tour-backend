import express from "express"
import { addTour } from "../controllers/adminControllers"
import { addTourValidator } from "../utils/validators"
import requestHandler from "../handlers/requestHandler"

const router = express.Router()

router.post('/add-tour', addTourValidator , requestHandler ,addTour)

export default router