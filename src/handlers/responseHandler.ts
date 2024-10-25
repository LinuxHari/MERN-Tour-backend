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

  console.log('Error stack:', stack)

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

const unauthorize = (res: Response) =>
  responseWithStatus(res, 401, {
    error: true,
    message: "Unathorized",
  });

const notfound = (res: Response) =>
  responseWithStatus(res, 404, {
    error: true,
    message: "Resource not found",
  });

const conflict = (res: Response) => responseWithStatus(res, 409, {
  error: true,
  message: "Conflict"
})

const responseHandler = {
  error,
  badrequest,
  ok,
  created,
  unauthorize,
  notfound,
  conflict
};

export default responseHandler;
