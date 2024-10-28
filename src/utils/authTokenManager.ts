import jwt from "jsonwebtoken"
import { JwtData } from "../type"

export const generateToken = (data: JwtData) => jwt.sign(data, process.env.JWT_SECRET as string)

export const verifyToken = (token: string) => jwt.verify(token, process.env.JWT_SECRET as string)
