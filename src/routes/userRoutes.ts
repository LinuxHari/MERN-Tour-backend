import express from "express"
import { login, logout, signup, userInfo } from "../controllers/userControllers"
import requestHandler from "../handlers/requestHandler"
import { LoginSchema, SignupSchema } from "../validators/authValidators"
import { TokenSchema } from "../validators/userValidators"
import verifyAuthToken from "../middlewares/verifyAuthToken"

const router = express.Router()

router.post("/signup", requestHandler(SignupSchema), signup)
router.post("/login", requestHandler(LoginSchema), login)
router.post("/logout", requestHandler(TokenSchema, "signedCookies"), verifyAuthToken, logout)
router.get("/info", requestHandler(TokenSchema, "signedCookies"), verifyAuthToken, userInfo )

export default router