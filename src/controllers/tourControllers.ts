import { Request, Response } from "express"
import { getTours, searchSuggestions } from "../services/tourService"
import responseHandler from "../handlers/responseHandler"
import asyncWrapper from "../asyncWrapper"
import { TourListingSchemaType } from "../validators/tourValidators"

export const search = asyncWrapper(async(req:Request, res: Response) => {
    const searchText = req.query.searchText as string
    const locations = await searchSuggestions(searchText)
    responseHandler.ok(res, locations)
})

export const tours = asyncWrapper(async(req: Request<{},{},{},TourListingSchemaType>, res: Response) => {
    const tours = await getTours(req.query)
    responseHandler.ok(res, tours)
})