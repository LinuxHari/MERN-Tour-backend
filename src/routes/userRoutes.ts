import express from "express";
import {
  addTourToFavorite,
  getBookings,
  getUserFavoriteTours,
  login,
  logout,
  removeTourFromFavorite,
  sendResetPassMail,
  sendVerificationMail,
  signup,
  updatePassword,
  updateProfile,
  updateResetPassword,
  userInfo,
  verifyEmail,
  verifyResetToken
} from "../controllers/userControllers";
import requestHandler from "../handlers/requestHandler";
import { EmailSchema, LoginSchema, SignupSchema } from "../validators/authValidators";
import {
  PasswordSchema,
  ResetPasswordSchema,
  TokenSchema,
  UserBookings,
  UserSchema
} from "../validators/userValidators";
import verifyAuthToken from "../middlewares/verifyAuthToken";
import { SingleTourParamSchema } from "../validators/tourValidators";
import { PageSchema } from "../validators/adminValidators";

const router = express.Router();

router.post("/signup", requestHandler(SignupSchema), signup);
router.post("/login", requestHandler(LoginSchema), login);
router.post("/logout", verifyAuthToken, requestHandler(TokenSchema, "signedCookies"), logout);

router.post("/verify-email", requestHandler(TokenSchema), verifyEmail);
router.post("/send-verification-email", requestHandler(EmailSchema), sendVerificationMail);

router.post("/reset-password", requestHandler(EmailSchema), sendResetPassMail);
router.post("/verify-reset-token", requestHandler(TokenSchema), verifyResetToken);
router.patch("/update-password", requestHandler(ResetPasswordSchema), updateResetPassword);

router.get("/bookings", verifyAuthToken, requestHandler(UserBookings, "query"), getBookings);
router.get("/favorite", verifyAuthToken, requestHandler(PageSchema, "query"), getUserFavoriteTours);
router.post("/favorite/:tourId", verifyAuthToken, requestHandler(SingleTourParamSchema, "params"), addTourToFavorite);
router.delete(
  "/favorite/:tourId",
  verifyAuthToken,
  requestHandler(SingleTourParamSchema, "params"),
  removeTourFromFavorite
);

router.get("/", verifyAuthToken, requestHandler(TokenSchema, "signedCookies"), userInfo);
router.put(
  "/",
  verifyAuthToken,
  requestHandler(TokenSchema, "signedCookies"),
  requestHandler(UserSchema, "body"),
  updateProfile
);

router.put(
  "/password",
  verifyAuthToken,
  requestHandler(TokenSchema, "signedCookies"),
  requestHandler(PasswordSchema, "body"),
  updatePassword
);

export default router;
