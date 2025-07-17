import mongoose from "mongoose";
import { UnauthroizedError } from "../handlers/errorHandler";
import User from "../models/userModel";
import redis from "./redisService";
import { decodeToken, generateRefreshToken, generateToken } from "../utils/authTokenManager";

export const getNewUserTokens = async (refreshToken: string) => {
  if (!refreshToken) throw new UnauthroizedError(`Invalid refresh token ${refreshToken}`);

  const userSession = await redis.getUserSession(refreshToken);
  if (!Object.keys(userSession).length) throw new UnauthroizedError(`Invalid refresh token ${refreshToken}`);

  await redis.removeSessionToken(userSession.userId, refreshToken);
  await redis.deleteUserSession(refreshToken);

  const user = await User.findOne(
    { _id: new mongoose.Types.ObjectId(userSession.userId), isDeleted: false },
    { role: 1 }
  ).lean();

  if (!user) throw new UnauthroizedError(`User does not exist or deleted ${userSession.userId}`);

  const newAccessToken = generateToken({ id: userSession.userId, role: user.role });
  const newRefreshToken = generateRefreshToken();

  await redis.setUserSession(
    {
      userAgent: userSession.userAgent,
      userId: userSession.userId,
      lastSeen: Date.now(),
      issuedAt: Date.now()
    },
    refreshToken
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const removeUserSession = async (userId: string, accessToken: string, refreshToken: string) => {
  const userSessionData = await redis.getUserSession(refreshToken);

  if (userSessionData) await redis.removeSessionToken(userId, refreshToken);

  await redis.deleteUserSession(refreshToken);

  try {
    const decodedAccessToken = decodeToken(accessToken);
    if (decodedAccessToken && decodedAccessToken.exp) {
      const remainingExpiry = decodedAccessToken.exp * 1000 - Date.now();
      if (remainingExpiry > 0) await redis.blacklistToken(accessToken, remainingExpiry);
    }
  } catch (error) {
    console.error("Error blacklisting access token:", error);
  }
};

export const revokeAllUserSessions = async (userId: string) => await redis.deleteAllUserSessions(userId);
