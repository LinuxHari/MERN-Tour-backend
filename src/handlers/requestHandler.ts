import { NextFunction, Request, Response } from "express";
import {AnyZodObject, ZodError} from "zod"
import responseHandler from "./responseHandler";

const validate = (schema: AnyZodObject) => async(req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      responseHandler.badrequest(res, error.name );
    } else {
      next(error)
    }
  }
};

export default validate;
