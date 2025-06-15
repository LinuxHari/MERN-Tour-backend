const redisKeys = {
  getSessionKey: (refreshToken: string) => `userSession:${refreshToken}`,
  getUserSessions: (userId: string) => `userSessionsTokens:${userId}`,
  getBlacklistKey: (token: string) => `blacklist:${token}`
};

export default redisKeys;
