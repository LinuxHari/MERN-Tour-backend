import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../asyncWrapper";
import { BadRequestError, UnauthroizedError } from "../handlers/errorHandler";
import { verifyToken } from "../utils/authTokenManager";

const verifyAuthToken = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.signedCookies["authToken"];
  if (!token) throw new UnauthroizedError("User is unauthorized");
  const { data, error } = verifyToken(token);
  if (error || !data) throw new BadRequestError("Invalid token");
  res.locals.email = data.email;
  next();
});

export default verifyAuthToken;
