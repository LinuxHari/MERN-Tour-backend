import { Request, Response } from "express"
import asyncWrapper from "../asyncWrapper"
import { createUser } from "../services/userService"

export const signup = asyncWrapper(async(req:Request, res: Response) => {
    const { firstName, lastName, password, email } = req.body
    await createUser({firstName, lastName, email, password})
})

export const login = asyncWrapper(async (req:Request, res: Response) => {
    const { email, password } = req.body
    // await createUser({ email,  password})
    res.send("account created")
})