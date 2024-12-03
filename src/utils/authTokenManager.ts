import jwt from "jsonwebtoken"
import { JwtData } from "../type"
import envConfig from "../config/envConfig"

export const generateToken = (data: JwtData) => jwt.sign(data, envConfig.jwtSecret as string)

export const verifyToken = (token: string) => jwt.verify(token, envConfig.jwtSecret as string)
