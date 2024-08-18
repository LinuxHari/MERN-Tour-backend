import express from "express"
import { search } from "../controllers/tourControllers"

const router = express.Router()

router.get('/search:id', search)

export default router