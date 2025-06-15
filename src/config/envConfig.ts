import { config } from "dotenv";
config();
const envConfig = {
  stripeSecret: process.env.STRIPE_SECRET,
  stripeKey: process.env.STRIPE_PUBLIC_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  upstashToken: process.env.UPSTASH_TOKEN,
  upstashCurrentSignKey: process.env.UPSTASH_CURRENT_SIGNING_KEY,
  upstashNextSignKey: process.env.UPSTASH_NEXT_SIGNING_KEY,
  cookieSecret: process.env.COOKIE_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: process.env.MONGO_URI,
  environment: process.env.NODE_ENV,
  port: process.env.PORT,
  frontend: process.env.FRONTEND_URL,
  backend: process.env.BACKEND_URL,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  exchangeKey: process.env.EXCHANGE_API_KEY,
  redisUri: process.env.REDIS_URI
} as const;

export default envConfig;
