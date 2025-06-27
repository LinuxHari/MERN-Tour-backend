import { Request, Response } from "express";
import asyncWrapper from "../asyncWrapper";
import {
  addTourToFavorites,
  authenticateUser,
  createUser,
  getFavoriteTours,
  getStats,
  getUserBookings,
  getUserInfo,
  removeFavoriteTour,
  sendUserResetPassMail,
  sendUserVerificationMail,
  updateUserPassword,
  updateUserProfile,
  updateUserResetPassword,
  verifyUserEmail,
  verifyUserResetToken
} from "../services/userService";
import responseHandler from "../handlers/responseHandler";
import { BookingStatusSchemaType } from "../validators/userValidators";
import { ACCESS_TOKEN_EXPIRY, COOKIE, REFRESH_TOKEN_EXPIRY } from "../config/userConfig";
import { removeUserSession } from "../services/otherService";

export const signup = asyncWrapper(async (req: Request, res: Response) => {
  const { firstName, lastName, password, email } = req.body;
  await createUser({ firstName, lastName, email, password });
  responseHandler.ok(res, { message: "Signup success" });
});

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const userAgent = req.headers["user-agent"] || "Unknown";
  const { accessToken, refreshToken } = await authenticateUser(req.body, userAgent);

  responseHandler.setCookie(res, {
    cookieName: COOKIE.accessToken,
    data: accessToken,
    maxAge: ACCESS_TOKEN_EXPIRY * 1000,
    expires: new Date(Date.now() + ACCESS_TOKEN_EXPIRY)
  });

  responseHandler.setCookie(res, {
    cookieName: COOKIE.refreshToken,
    data: refreshToken,
    maxAge: REFRESH_TOKEN_EXPIRY * 1000,
    expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRY)
  });

  responseHandler.ok(res, { message: "success" });
});

export const logout = asyncWrapper(async (req: Request, res: Response) => {
  await removeUserSession(res.locals.id, req.signedCookies.accessToken, req.signedCookies.refreshToken);
  responseHandler.clearCookie(res, COOKIE.accessToken);

  responseHandler.ok(res, { message: "success" });
});

export const verifyEmail = asyncWrapper(async (req: Request, res: Response) => {
  await verifyUserEmail(req.body.authToken);
  responseHandler.ok(res, { message: "success" });
});

export const sendVerificationMail = asyncWrapper(async (req: Request, res: Response) => {
  await sendUserVerificationMail(req.body.email);
  responseHandler.ok(res, { message: "success" });
});

export const sendResetPassMail = asyncWrapper(async (req: Request, res: Response) => {
  await sendUserResetPassMail(req.body.email);
  responseHandler.ok(res, { message: "success" });
});

export const verifyResetToken = asyncWrapper(async (req: Request, res: Response) => {
  await verifyUserResetToken(req.body.accessToken);
  responseHandler.ok(res, { message: "success" });
});

export const updateResetPassword = asyncWrapper(async (req: Request, res: Response) => {
  await updateUserResetPassword(req.body.newPassword, req.body.accessToken);
  responseHandler.ok(res, { message: "success" });
});

export const userInfo = asyncWrapper(async (_: Request, res: Response) => {
  const userInfo = await getUserInfo(res.locals.id);
  responseHandler.ok(res, userInfo);
});

export const updateProfile = asyncWrapper(async (req: Request, res: Response) => {
  const authToken = await updateUserProfile(req.body, res.locals.id);

  responseHandler.setCookie(res, {
    cookieName: COOKIE.accessToken,
    data: authToken,
    maxAge: 60 * 60 * 24 * 365 * 1000,
    expires: new Date(Date.now() + 60 * 60 * 24 * 365)
  });
  responseHandler.ok(res, { message: "success" });
});

export const updatePassword = asyncWrapper(async (req: Request, res: Response) => {
  await updateUserPassword(req.body, res.locals.id);
  responseHandler.ok(res, { message: "Success" });
});

export const addTourToFavorite = asyncWrapper(async (req: Request, res: Response) => {
  await addTourToFavorites(req.params.tourId, res.locals.id, req.ip);
  responseHandler.ok(res, { message: "Success" });
});

export const getUserFavoriteTours = asyncWrapper(async (req: Request, res: Response) => {
  const page = typeof req.query.page === "number" ? req.query.page : 1;
  const limit = typeof req.query.limit === "number" ? req.query.limit : 12;
  const favoriteTours = await getFavoriteTours(res.locals.id, page, limit, req.ip);
  responseHandler.ok(res, favoriteTours);
});

export const removeTourFromFavorite = asyncWrapper(async (req: Request, res: Response) => {
  await removeFavoriteTour(res.locals.id, req.params.tourId, req.ip);
  responseHandler.ok(res, { message: "Success" });
});

export const getBookings = asyncWrapper(async (req: Request, res: Response) => {
  const page = typeof req.query.page === "number" ? req.query.page : 1;
  const limit = typeof req.query.limit === "number" ? req.query.limit : 10;
  const status = req.query.status as BookingStatusSchemaType["status"];
  const bookingId = req.query.bookingId as string | undefined;

  const bookings = await getUserBookings(res.locals.id, page, status, limit, bookingId, req.ip);
  responseHandler.ok(res, bookings);
});

export const getUserStats = asyncWrapper(async (req: Request, res: Response) => {
  const stats = await getStats(res.locals.id, req.ip);
  responseHandler.ok(res, stats);
});
