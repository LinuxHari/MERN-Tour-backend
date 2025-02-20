import jwt from "jsonwebtoken";
import { JwtData } from "../type";
import envConfig from "../config/envConfig";

export const generateToken = (data: JwtData) => jwt.sign(data, envConfig.jwtSecret as string);

export const verifyToken = (token: string) => {
  try {
    const data = jwt.verify(token, envConfig.jwtSecret as string) as JwtData;
    return { error: false, data };
  } catch (_) {
    return { error: true, data: null };
  }
};
