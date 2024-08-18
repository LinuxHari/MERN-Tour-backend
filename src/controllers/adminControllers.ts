import { Request, Response } from "express"

export const addTour = (req:Request, res: Response) => {
    res.send("tour added")
}