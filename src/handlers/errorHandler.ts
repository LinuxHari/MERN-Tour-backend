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
    return responseHandler.conflict(res)
  }

  else if(err instanceof GoneError){
    return responseHandler.gone(res)
  }

  else if(err instanceof ServerError){
    return responseHandler.error(res, err.message)
  }

  else if (err instanceof mongoose.Error.ValidationError)  
    return responseHandler.badrequest(res, err.stack || "Mongoose validation error");

  else if (err instanceof mongoose.Error.CastError) 
    return responseHandler.badrequest(res, err.stack || "Mongoose cast error");
  
  else if (err instanceof mongoose.Error.DivergentArrayError) 
    return responseHandler.error(res, err.stack || "Mongoose divergent array error");

  else if (err instanceof mongoose.Error.DocumentNotFoundError)  
    return responseHandler.notfound(res);

  else if (err instanceof mongoose.Error.MissingSchemaError)
    return responseHandler.error(res, err.stack || "Mongoose missing schema error");

  else if (err instanceof mongoose.Error.MongooseServerSelectionError) 
    return responseHandler.error(res, err.stack || "Mongoose server selection error");

  else if (err instanceof mongoose.Error.OverwriteModelError) 
    return responseHandler.error(res, err.stack || "Mongoose overwrite model error");

  else if (err instanceof mongoose.Error.ParallelSaveError) 
    return responseHandler.error(res, err.stack || "Mongoose parallel save error");

  else if (err instanceof mongoose.Error.StrictModeError) 
    return responseHandler.badrequest(res, err.stack || "Mongoose strict mode error");

  else if (err instanceof mongoose.Error.StrictPopulateError)
    return responseHandler.badrequest(res, err.stack || "Mongoose strict populate error");

  else if (err instanceof mongoose.Error.ValidatorError) 
    return responseHandler.badrequest(res, err.stack || "Mongoose validator error");

  else if (err instanceof mongoose.Error.VersionError) 
    return responseHandler.error(res, err.stack || "Mongoose version error");

  else if (err.code === 11000) 
    return responseHandler.badrequest(res, err.stack);

  else {
    return responseHandler.error(res, err.stack);
  }
};

