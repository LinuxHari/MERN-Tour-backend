import { config } from "dotenv";
config();
const envConfig = {
  stripeSecret: process.env.STRIPE_SECRET,
  stripeKey: process.env.STRIPE_PUBLIC_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  cookieSecret: process.env.COOKIE_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: process.env.MONGO_URI,
  environment: process.env.NODE_ENV,
  port: process.env.PORT,
  frontend: process.env.FRONTEND_URL,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS
} as const;

export default envConfig;
