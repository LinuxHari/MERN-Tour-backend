import { NextFunction, Request, Response } from "express"
import { searchSuggestions } from "../services/tourService"
import responseHandler from "../handlers/responseHandler"

export const search = async(req:Request, res: Response, next: NextFunction) => {
    try{
        const searchText = req.query.searchText as string
        const locations = await searchSuggestions(searchText)
        responseHandler.ok(res, locations )
    } catch(err){
        next(err)
    }
}