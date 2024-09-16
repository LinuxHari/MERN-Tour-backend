import { NextFunction, Request, Response } from "express";
import {AnyZodObject, ZodError} from "zod"
import responseHandler from "./responseHandler";

type DataToValidate = "query" | "body" | "cookies" | "params"

const validate = (schema: AnyZodObject, dataToValidate: DataToValidate = "body") => async(req: Request, res: Response, next: NextFunction) => {
  try {
    req[dataToValidate] = await schema.parseAsync(req[dataToValidate]);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      responseHandler.badrequest(res, err.errors);
    } else {
      next(err)
    }
  }
};

export default validate;
