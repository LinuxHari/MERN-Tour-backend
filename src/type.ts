export type JwtData = {
  email: string;
  role?: string;
};

export type upstashData = {
  body: string;
  signature: string;
};

export type upstashPublishData = {
  body: {
    eventType: "reserve";
    reserveId: string;
  };
  delay: number;
};
