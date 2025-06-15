export const ROLE = ["Traveler", "Publisher", "Admin"] as const;

export const BOOKING_STATUS = ["confirmed", "pending", "canceled"] as const;

export const COOKIE = {
  accessToken: "accessToken",
  refreshToken: "refreshToken"
};

export const ACCESS_TOKEN_EXPIRY = 5 * 60;

export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;
