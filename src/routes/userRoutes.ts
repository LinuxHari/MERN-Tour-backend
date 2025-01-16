import express from "express";
import {
  addTourToFavorite,
  getBookings,
  getUserFavoriteTours,
  login,
  logout,
  removeTourFromFavorite,
  signup,
  userInfo
} from "../controllers/userControllers";
import requestHandler from "../handlers/requestHandler";
import { LoginSchema, SignupSchema } from "../validators/authValidators";
import { TokenSchema } from "../validators/userValidators";
import verifyAuthToken from "../middlewares/verifyAuthToken";
import { SingleTourParamSchema, TourListingSchema } from "../validators/tourValidators";

const router = express.Router();

router.post("/signup", requestHandler(SignupSchema), signup);
router.post("/login", requestHandler(LoginSchema), login);
router.post("/logout", verifyAuthToken, requestHandler(TokenSchema, "signedCookies"), logout);
router.get("/info", verifyAuthToken, requestHandler(TokenSchema, "signedCookies"), userInfo);
router.get(
  "/bookings",
  verifyAuthToken,
  requestHandler(TourListingSchema.shape.page, "query"),
  getBookings
);
router.post(
  "/favorite/:tourId",
  verifyAuthToken,
  requestHandler(SingleTourParamSchema),
  addTourToFavorite
);
router.get(
  "/favorite",
  verifyAuthToken,
  requestHandler(TourListingSchema.shape.page, "query"),
  getUserFavoriteTours
);
router.delete("/favorite", verifyAuthToken, removeTourFromFavorite);

export default router;
