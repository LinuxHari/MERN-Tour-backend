import { Request, Response } from "express";
import asyncWrapper from "../asyncWrapper";
import { authenticateUser, createUser, getUserInfo } from "../services/userService";
import responseHandler from "../handlers/responseHandler";

export const signup = asyncWrapper(async (req: Request, res: Response) => {
  const { firstName, lastName, password, email } = req.body;
  await createUser({ firstName, lastName, email, password });
  responseHandler.ok(res, { message: "Signup success" });
});

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const authToken = await authenticateUser(req.body);
  res.cookie("authToken", authToken, {
    signed: true,
    httpOnly: true,
    secure: process.env.NODE_ENV !==  "development",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 1000
  }).send();
});

export const logout = asyncWrapper(async(_: Request, res: Response) => res.clearCookie("authToken").send())

export const userInfo = asyncWrapper(async (_: Request, res: Response) => {
    const userInfo = await getUserInfo(res.locals.email)
    console.log(userInfo, "user info")
    responseHandler.ok(res, userInfo)
})
