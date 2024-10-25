import mongoose from 'mongoose';

import { Request, Response, NextFunction } from 'express';
import responseHandler from './responseHandler';

export const errorMessage = {
    notFound: "Not found",
    serverError: "Internal server error",
    badRequest: "Bad request",
    conflict: "Conflict"
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

  if(errorMessage.badRequest === err.message){
    return responseHandler.badrequest(res, err.stack)
  }

  else if(errorMessage.notFound === err.message){
    return responseHandler.notfound(res)
  }

  else if(errorMessage.serverError === err.message){
    responseHandler.error(res, err.message)
  }

  else if (err instanceof mongoose.Error.ValidationError) {
    
    return responseHandler.badrequest(res, err.stack || "Mongoose validation error");
  }

  else if (err instanceof mongoose.Error.CastError) {
    return responseHandler.badrequest(res, err.stack || "Mongoose cast error");
  }

  else if (err instanceof mongoose.Error.DivergentArrayError) {
    return responseHandler.error(res, err.stack || "Mongoose divergent array error");
  }

  else if (err instanceof mongoose.Error.DocumentNotFoundError) {
    return responseHandler.notfound(res);
  }

  else if (err instanceof mongoose.Error.MissingSchemaError) {
    return responseHandler.error(res, err.stack || "Mongoose missing schema error");
  }

  else if (err instanceof mongoose.Error.MongooseServerSelectionError) {
    return responseHandler.error(res, err.stack || "Mongoose server selection error");
  }

  else if (err instanceof mongoose.Error.OverwriteModelError) {
    return responseHandler.error(res, err.stack || "Mongoose overwrite model error");
  }

  else if (err instanceof mongoose.Error.ParallelSaveError) {
    return responseHandler.error(res, err.stack || "Mongoose parallel save error");
  }

  else if (err instanceof mongoose.Error.StrictModeError) {
    return responseHandler.badrequest(res, err.stack || "Mongoose strict mode error");
  }

  else if (err instanceof mongoose.Error.StrictPopulateError) {
    return responseHandler.badrequest(res, err.stack || "Mongoose strict populate error");
  }

  else if (err instanceof mongoose.Error.ValidatorError) {
    return responseHandler.badrequest(res, err.stack || "Mongoose validator error");
  }

  else if (err instanceof mongoose.Error.VersionError) {
    return responseHandler.error(res, err.stack || "Mongoose version error");
  }

  else if (err.code === 11000) {
    return responseHandler.badrequest(res, err.stack);
  }

  else {
    return responseHandler.error(res, err.stack);
  }
};

