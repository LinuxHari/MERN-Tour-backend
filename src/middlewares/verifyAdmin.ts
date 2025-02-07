import { NextFunction, Request, Response } from "express";
import asyncWrapper from "../asyncWrapper";
import User from "../models/userModel";
import { BadRequestError } from "../handlers/errorHandler";

const verifyAdmin = asyncWrapper(async (_: Request, res: Response, next: NextFunction) => {
  const user = await User.findOne({ email: res.locals.email });
  if (!user)
    throw new BadRequestError(`Invalid user with ${res.locals.email} tried to access admin routes`);
  if (user.role !== "Admin")
    throw new BadRequestError(`User with ${res.locals.email} tried to access admin routes`);
  next();
});

export default verifyAdmin;
