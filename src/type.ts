import { ReserveTourType } from "./validators/tourValidators";

export type JwtData = {
  id: string;
  role?: string;
};

export type UpstashData = {
  body: string;
  signature: string;
};

export type UpstashPublishData = {
  body: {
    eventType: "reserve";
    reserveId: string;
  };
  delay: number;
};

export type CookieData = {
  cookieName: string;
  expires: Date;
  maxAge: number;
  data: string;
};

export type RedisUserSession = {
  userId: string;
  userAgent: string;
  lastSeen: number;
  issuedAt: number;
};

export type Currency = ReserveTourType["currency"];
