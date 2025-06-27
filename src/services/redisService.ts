import { createClient } from "redis";
import envConfig from "../config/envConfig";
import { RedisUserSession } from "../type";
import redisKeys from "../config/redisConfig";
import { REFRESH_TOKEN_EXPIRY } from "../config/userConfig";

const redisClient = createClient({
  url: envConfig.redisUri
});

redisClient
  .connect()
  .then(() => console.log("Redis connected successfully!"))
  .catch((err) => {
    console.log("Redis is failed to connect!");
    throw new Error(err);
  });

const setUserSession = async (userSessionData: RedisUserSession, refreshToken: string) => {
  const sessionKey = redisKeys.getSessionKey(refreshToken);
  await redisClient
    .multi()
    .hSet(sessionKey, userSessionData)
    .expire(sessionKey, REFRESH_TOKEN_EXPIRY * 1000)
    .execAsPipeline();
};

const getUserSession = async (refreshToken: string) => await redisClient.hGetAll(redisKeys.getSessionKey(refreshToken));

const deleteUserSession = async (refreshToken: string) => await redisClient.del(redisKeys.getSessionKey(refreshToken));

const deleteAllUserSessions = async (userId: string) => {
  const refreshTokens = await redisClient.sMembers(redisKeys.getUserSessions(userId));
  if (refreshTokens && refreshTokens.length > 0) {
    const keysToDelete = refreshTokens.map((token: string) => redisKeys.getSessionKey(token));
    await redisClient.del(keysToDelete);
    await redisClient.del(redisKeys.getUserSessions(userId));
  }
};

const setUserSessions = async (userId: string, refreshToken: string) =>
  await redisClient.sAdd(redisKeys.getUserSessions(userId), refreshToken);

const removeSessionToken = async (userId: string, refreshToken: string) =>
  await redisClient.sRem(redisKeys.getUserSessions(userId), refreshToken);

const blacklistToken = async (token: string, expiryTime: number) =>
  await redisClient.set(redisKeys.getBlacklistKey(token), "blacklisted", { PX: expiryTime });

const isTokenBlacklisted = async (token: string) => await redisClient.exists(redisKeys.getBlacklistKey(token));

let isConnected = false;
let keepAliveInterval: NodeJS.Timeout | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;

redisClient.on("ready", () => {
  console.log("Redis client ready");
  isConnected = true;
  startKeepAlive();
  startHealthCheck();
});

redisClient.on("error", (err) => {
  console.error("Redis client error:", err);
  isConnected = false;
});

redisClient.on("end", () => {
  console.log("Redis client disconnected");
  isConnected = false;
  stopKeepAlive();
  stopHealthCheck();
});

redisClient.on("reconnecting", () => {
  console.log("Redis client reconnecting...");
});

// Keeping Redis alive by pinging every 30 seconds
const startKeepAlive = () => {
  if (keepAliveInterval) clearInterval(keepAliveInterval);

  keepAliveInterval = setInterval(async () => {
    try {
      if (isConnected) {
        await redisClient.ping();
      }
    } catch (error) {
      console.error("Keep-alive ping failed:", error);
    }
  }, 30000);
};

const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};

// Checking Redis health every 60 seconds
const startHealthCheck = () => {
  if (healthCheckInterval) clearInterval(healthCheckInterval);

  healthCheckInterval = setInterval(async () => {
    try {
      const start = Date.now();
      await redisClient.ping();
      const latency = Date.now() - start;
      console.log(`Redis health check: OK (${latency}ms)`);
    } catch (error) {
      console.error("Redis health check failed:", error);
      isConnected = false;
    }
  }, 60000);
};

const stopHealthCheck = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
};

const redis = {
  setUserSession,
  getUserSession,
  setUserSessions,
  removeSessionToken,
  deleteUserSession,
  deleteAllUserSessions,
  blacklistToken,
  isTokenBlacklisted
};

export default redis;
