import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import responseHandler from "./responseHandler";
import { server, shutdown} from "../index" 
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequest";
  }
}
export class UnauthroizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Unauthorized";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFound";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Conflict";
  }
}

export class GoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Gone";
  }
}

export class ServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerError";
  }
}

export const errorHandler = (err: any, _: Request, res: Response, __: NextFunction) => {
  if (err instanceof BadRequestError) return responseHandler.badrequest(res, err.stack || "");
  if (err instanceof UnauthroizedError) return responseHandler.unauthorized(res);
  if (err instanceof NotFoundError) return responseHandler.notfound(res);
  if (err instanceof ConflictError) return responseHandler.conflict(res);
  if (err instanceof GoneError) return responseHandler.gone(res);
  if (err instanceof ServerError) return responseHandler.error(res, err.message);

  if (err instanceof mongoose.Error) {
    switch (err.name) {
      case "ValidationError":
      case "CastError":
      case "StrictModeError":
      case "StrictPopulateError":
      case "ValidatorError":
        return responseHandler.badrequest(res, err.stack || "Mongoose error");
      default:
        return responseHandler.error(res, err.stack || "Mongoose error");
    }
  }

  if (err.code === 11000) return responseHandler.badrequest(res, "Duplicate key error");

  switch (err.constructor.name) {
    // case "StripeCardError":
    //   return responseHandler.paymentRequired(res, "Invalid card, try another card for payment");
    case "StripeRateLimitError":
      return responseHandler.manyRequests(res);
    case "StripeInvalidRequestError":
    case "StripeAPIError":
    case "StripeConnectionError":
    case "StripeAuthenticationError":
      return responseHandler.error(res, err.message);
    default:
      break;
  }

  return responseHandler.error(res, err.stack || "An unexpected error occurred");
};

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown(1);
});

process.on("unhandledRejection", (err: any, ) => {
  console.error("Promise got rejected unhandled", err.name, err.message, err?.stack)
  shutdown(1)
})


process.on('SIGTERM', () => {
  console.log('Received SIGTERM');
  shutdown(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT');
  shutdown(0);
});