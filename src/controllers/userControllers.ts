import { Request, Response } from "express";
import asyncWrapper from "../asyncWrapper";
import {
  addTourToFavorites,
  authenticateUser,
  createUser,
  getFavoriteTours,
  getUserBookings,
  getUserInfo,
  removeFavoriteTour,
  updateUserProfile
} from "../services/userServices";
import responseHandler from "../handlers/responseHandler";
import envConfig from "../config/envConfig";
import { BookingStatusSchemaType } from "../validators/userValidators";

export const signup = asyncWrapper(async (req: Request, res: Response) => {
  const { firstName, lastName, password, email } = req.body;
  await createUser({ firstName, lastName, email, password });
  responseHandler.ok(res, { message: "Signup success" });
});

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const authToken = await authenticateUser(req.body);
  res
    .cookie("authToken", authToken, {
      signed: true,
      httpOnly: true,
      secure: envConfig.environment !== "development",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 1000
    })
    .send();
});

export const logout = asyncWrapper(async (_: Request, res: Response) =>
  res.clearCookie("authToken").send()
);

export const userInfo = asyncWrapper(async (_: Request, res: Response) => {
  const userInfo = await getUserInfo(res.locals.email);
  responseHandler.ok(res, userInfo);
});

export const updateProfile = asyncWrapper(async (req: Request, res: Response) => {
  await updateUserProfile(req.body, res.locals.email);
  responseHandler.ok(res, { message: "Success" });
});

export const addTourToFavorite = asyncWrapper(async (req: Request, res: Response) => {
  await addTourToFavorites(req.params.tourId, res.locals.email, req.ip);
  responseHandler.ok(res, { message: "Success" });
});

export const getUserFavoriteTours = asyncWrapper(async (req: Request, res: Response) => {
  const page = typeof req.query.page === "number" ? req.query.page : 1;
  const favoriteTours = await getFavoriteTours(res.locals.email, page, req.ip);
  responseHandler.ok(res, favoriteTours);
});

export const removeTourFromFavorite = asyncWrapper(async (req: Request, res: Response) => {
  await removeFavoriteTour(res.locals.email, req.params.tourId, req.ip);
  responseHandler.ok(res, { message: "Success" });
});

export const getBookings = asyncWrapper(async (req: Request, res: Response) => {
  const page = typeof req.query.page === "number" ? req.query.page : 1;
  const status = req.query.status as BookingStatusSchemaType["status"];

  const bookings = await getUserBookings(res.locals.email, page, status, req.ip);
  responseHandler.ok(res, bookings);
});
