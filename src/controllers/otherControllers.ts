import { Request, Response } from "express";
import asyncWrapper from "../asyncWrapper";
import { getCurrencyExchangeRate } from "../services/exchangeService";
import { ServerError } from "../handlers/errorHandler";
import responseHandler from "../handlers/responseHandler";

export const getExchangeRate = asyncWrapper(async (req: Request, res: Response) => {
  const exchangeData = await getCurrencyExchangeRate(req.params.currency);
  if (!exchangeData) throw new ServerError(`Failed to change currency ${req.params.currency}`);
  responseHandler.ok(res, exchangeData);
});
