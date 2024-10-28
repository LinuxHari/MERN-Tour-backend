import express from "express"
import { login, signup, userInfo } from "../controllers/userControllers"
import requestHandler from "../handlers/requestHandler"
import { LoginSchema, SignupSchema } from "../validators/authValidators"
import { UserSchema } from "../validators/userValidators"
import verifyAuthToken from "../middlewares/verifyAuthToken"

const router = express.Router()

router.post("/signup", requestHandler(SignupSchema), signup)
router.post("/login", requestHandler(LoginSchema), login)
router.get("/info", requestHandler(UserSchema), verifyAuthToken, userInfo )

export default router