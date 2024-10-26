import jwt from "jsonwebtoken"

type Data = {
    email: string,
    role: string
}

export const generateToken = (data: Data) => jwt.sign(data, process.env.JWT_SECRET as string)


export const verifyToken = (token: string, ) => jwt.verify(token, process.env.JWT_SECRET as string)
