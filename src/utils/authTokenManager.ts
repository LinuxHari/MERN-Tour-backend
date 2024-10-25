import jwt from "jsonwebtoken"

type Data = {
    email: string,
    role: string
}

const jwtSecret = process.env.JWT_SECRET as string

export const generateToken = (data: Data) => jwt.sign(data, jwtSecret)

export const verifyToken = (token: string, ) => jwt.verify(token, jwtSecret)