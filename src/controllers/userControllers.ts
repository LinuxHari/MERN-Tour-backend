import { Request, Response } from "express";
import asyncWrapper from "../asyncWrapper";
import { authenticateUser, createUser } from "../services/userService";
import responseHandler from "../handlers/responseHandler";

export const signup = asyncWrapper(async (req: Request, res: Response) => {
  const { firstName, lastName, password, email } = req.body;
  await createUser({ firstName, lastName, email, password });
  responseHandler.ok(res, { message: "Signup success" });
});

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const authToken = await authenticateUser(req.body);
  res.cookie("authToken", authToken, {signed: true})
  responseHandler.ok(res, { message: "Login success" });
});
