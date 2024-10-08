import { Request, Response } from "express"
import { getTour, getTours, searchSuggestions } from "../services/tourService"
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

export const tour = asyncWrapper(async(req: Request, res: Response) => {
    const tour = await getTour(req.params.id)
    responseHandler.ok(res, tour)
})