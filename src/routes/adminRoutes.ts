import express from "express"
import { addTour } from "../controllers/adminControllers"

const router = express.Router()

router.post('/add-tour', addTour)

export default router