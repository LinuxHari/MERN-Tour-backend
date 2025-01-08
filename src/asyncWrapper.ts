import { Request, Response, NextFunction } from "express";

type FunctionType = (req: Request, res: Response, next: NextFunction) => void;

const asyncWrapper = (fn: FunctionType) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncWrapper;
