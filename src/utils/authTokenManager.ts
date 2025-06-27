import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { JwtData } from "../type";
import envConfig from "../config/envConfig";
import { ACCESS_TOKEN_EXPIRY } from "../config/userConfig";

export const generateToken = (data: JwtData) =>
  jwt.sign(data, envConfig.jwtSecret as string, { expiresIn: ACCESS_TOKEN_EXPIRY });

export const decodeToken = (token: string) => jwt.decode(token) as JwtPayload;

export const verifyToken = (token: string) => {
  try {
    const data = jwt.verify(token, envConfig.jwtSecret as string) as JwtData;
    return { error: false, data };
  } catch (err) {
    console.log(err, "errot jwt");

    return { error: true, data: null };
  }
};

export const generateRefreshToken = () => uuidv4();
