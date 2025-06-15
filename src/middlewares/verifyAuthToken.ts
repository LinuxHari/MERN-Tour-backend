import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../asyncWrapper";
import { BadRequestError, UnauthroizedError } from "../handlers/errorHandler";
import { verifyToken } from "../utils/authTokenManager";
import redis from "../services/redisService";

const verifyAuthToken = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.signedCookies["accessToken"];
  const refreshToken = req.signedCookies["refreshToken"];

  if (!token || !refreshToken) throw new UnauthroizedError("User is unauthorized");

  const isTokenBlacklisted = await redis.isTokenBlacklisted(token);

  if (isTokenBlacklisted) throw new BadRequestError("Blacklisted token is sent");

  const { data, error } = verifyToken(token);
  if (error || !data) throw new BadRequestError("Invalid token");
  res.locals.id = data.id;
  next();
});

export default verifyAuthToken;
