import { NextFunction, Request, Response } from "express";
import {AnyZodObject, ZodError} from "zod"

const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
    const errorMessages = error.errors.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
      }))
      res.status(400).json({ error: true, message: errorMessages });
    } else {
      res.status(500).json({ error: true, message: 'Internal server error' });
    }
  }
};

export default validate;
