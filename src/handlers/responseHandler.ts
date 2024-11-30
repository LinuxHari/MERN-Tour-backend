import { Response } from "express";
import { ZodIssue } from "zod";

type ResponseData = object | object[];

const responseWithStatus = (
  res: Response,
  statusCode: number,
  data: ResponseData
) => res.status(statusCode).json(data);

const isDevelopment = process.env.NODE_ENV === 'development';

const error = (res: Response, stack: string) => {
  responseWithStatus(res, 500, {
    error: true,
    message: "Oops! Something worng!",
    stack: isDevelopment ? stack : undefined
  });
}

const badrequest = (res: Response, stack: string | ZodIssue[]) => 
  responseWithStatus(res, 400, {
    error: true,
    message: "Bad request",
    stack: isDevelopment ? stack : undefined
  })

const ok = (res: Response, data: ResponseData) =>
  responseWithStatus(res, 200, data);

const created = (res: Response, data: ResponseData) =>
  responseWithStatus(res, 201, data);

const unauthorized = (res: Response) =>
  responseWithStatus(res, 401, {
    error: true,
    message: "Unathorized",
  });

const paymentRequired = (res: Response, message: string) => 
  responseWithStatus(res, 402, {
    error: true,
    message
  })

const notfound = (res: Response) =>
  responseWithStatus(res, 404, {
    error: true,
    message: "Resource not found",
  });

const conflict = (res: Response) => responseWithStatus(res, 409, {
  error: true,
  message: "Conflict"
})

const gone = (res: Response) => responseWithStatus(res, 410, {
  error: true,
  message: "Gone"
})

const manyRequests = (res: Response) => responseWithStatus(res, 429, {
  error: true,
  message: "Too many requests"
})

const responseHandler = {
  error,
  badrequest,
  ok,
  created,
  unauthorized,
  paymentRequired,
  notfound,
  conflict,
  gone,
  manyRequests
};

export default responseHandler;
