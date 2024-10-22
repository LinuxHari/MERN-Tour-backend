import { Request, Response } from "express"
import asyncWrapper from "../asyncWrapper"

export const signup = asyncWrapper((req:Request, res: Response) => {
    res.send("account created")
})

export const login = asyncWrapper((req:Request, res: Response) => {
    res.send("account created")
})