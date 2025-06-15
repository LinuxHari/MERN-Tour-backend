import { Request, Response } from "express";
import asyncWrapper from "../asyncWrapper";
import { getCurrencyExchangeRate } from "../services/exchangeService";
import { ServerError } from "../handlers/errorHandler";
import responseHandler from "../handlers/responseHandler";
import { getNewUserTokens } from "../services/otherService";
import { ACCESS_TOKEN_EXPIRY, COOKIE, REFRESH_TOKEN_EXPIRY } from "../config/userConfig";

export const getExchangeRate = asyncWrapper(async (req: Request, res: Response) => {
  const exchangeData = await getCurrencyExchangeRate(req.params.currency);
  if (!exchangeData) throw new ServerError(`Failed to change currency ${req.params.currency}`);
  responseHandler.ok(res, exchangeData);
});

export const getNewTokens = asyncWrapper(async (req, res) => {
  const currentRefreshToken = req.signedCookies.refreshToken;

  const { accessToken, refreshToken } = await getNewUserTokens(currentRefreshToken);

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
