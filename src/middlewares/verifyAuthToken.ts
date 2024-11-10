import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../asyncWrapper";
import { BadRequestError, UnauthroizedError } from "../handlers/errorHandler";
import { verifyToken } from "../utils/authTokenManager";
import { JwtData } from "../type";

const verifyAuthToken = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.signedCookies["authToken"]
    if(!token)
        throw new UnauthroizedError("User is unauthorized")
    try{
        const payload = verifyToken(token) as JwtData
        console.log(payload)
        res.locals.email = payload.email
        next()
    } catch(err){
        throw new BadRequestError("Invalid token")
    }
})

export default verifyAuthToken