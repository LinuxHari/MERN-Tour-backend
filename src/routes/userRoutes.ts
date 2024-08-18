import express from "express"
import { signup } from "../controllers/userControllers"

const router = express.Router()

router.get("/signup", signup)

export default router