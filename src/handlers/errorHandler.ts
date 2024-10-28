import mongoose from 'mongoose';

import { Request, Response, NextFunction } from 'express';
import responseHandler from './responseHandler';

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

export class ServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerError";
  }
}


export const errorHandler = (err: any, _: Request, res: Response, __: NextFunction) => {

  if(err instanceof BadRequestError){
    return responseHandler.badrequest(res, err?.stack || "")
  }

  if(err instanceof UnauthroizedError){
    return responseHandler.unauthorized(res)
  }

  else if(err instanceof NotFoundError){
    return responseHandler.notfound(res)
  }

  else if(err instanceof ConflictError){
    responseHandler.conflict(res)
  }

  else if(err instanceof ServerError){
    responseHandler.error(res, err.message)
  }

  else if (err instanceof mongoose.Error.ValidationError)  
    responseHandler.badrequest(res, err.stack || "Mongoose validation error");

  else if (err instanceof mongoose.Error.CastError) 
     responseHandler.badrequest(res, err.stack || "Mongoose cast error");
  

  else if (err instanceof mongoose.Error.DivergentArrayError) 
     responseHandler.error(res, err.stack || "Mongoose divergent array error");

  else if (err instanceof mongoose.Error.DocumentNotFoundError)  
    responseHandler.notfound(res);

  else if (err instanceof mongoose.Error.MissingSchemaError)
     responseHandler.error(res, err.stack || "Mongoose missing schema error");

  else if (err instanceof mongoose.Error.MongooseServerSelectionError) 
     responseHandler.error(res, err.stack || "Mongoose server selection error");

  else if (err instanceof mongoose.Error.OverwriteModelError) 
     responseHandler.error(res, err.stack || "Mongoose overwrite model error");

  else if (err instanceof mongoose.Error.ParallelSaveError) 
     responseHandler.error(res, err.stack || "Mongoose parallel save error");

  else if (err instanceof mongoose.Error.StrictModeError) 
     responseHandler.badrequest(res, err.stack || "Mongoose strict mode error");

  else if (err instanceof mongoose.Error.StrictPopulateError)
     responseHandler.badrequest(res, err.stack || "Mongoose strict populate error");

  else if (err instanceof mongoose.Error.ValidatorError) 
     responseHandler.badrequest(res, err.stack || "Mongoose validator error");

  else if (err instanceof mongoose.Error.VersionError) 
     responseHandler.error(res, err.stack || "Mongoose version error");

  else if (err.code === 11000) 
     responseHandler.badrequest(res, err.stack);

  else {
    return responseHandler.error(res, err.stack);
  }
};

