import express from "express"
import { login, signup } from "../controllers/userControllers"
import requestHandler from "../handlers/requestHandler"
import { LoginSchema, SignupSchema } from "../validators/userValidators"

const router = express.Router()

router.post("/signup", requestHandler(SignupSchema), signup)
router.post("/login", requestHandler(LoginSchema), login)

export default router