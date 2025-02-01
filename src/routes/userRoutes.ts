import express from "express";
import {
  addTourToFavorite,
  getBookings,
  getUserFavoriteTours,
  login,
  logout,
  removeTourFromFavorite,
  signup,
  updateProfile,
  userInfo
} from "../controllers/userControllers";
import requestHandler from "../handlers/requestHandler";
import { LoginSchema, SignupSchema } from "../validators/authValidators";
import { TokenSchema, UserBookings, UserSchema } from "../validators/userValidators";
import verifyAuthToken from "../middlewares/verifyAuthToken";
import { PageSchema, SingleTourParamSchema } from "../validators/tourValidators";

const router = express.Router();

router.post("/signup", requestHandler(SignupSchema), signup);
router.post("/login", requestHandler(LoginSchema), login);
router.post("/logout", verifyAuthToken, requestHandler(TokenSchema, "signedCookies"), logout);
router.get("/bookings", verifyAuthToken, requestHandler(UserBookings, "query"), getBookings);
router.get("/favorite", verifyAuthToken, requestHandler(PageSchema, "query"), getUserFavoriteTours);
router.post(
  "/favorite/:tourId",
  verifyAuthToken,
  requestHandler(SingleTourParamSchema, "params"),
  addTourToFavorite
);
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

export default router;
