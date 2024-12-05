import express, { Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { errorHandler } from "./handlers/errorHandler";
import clientRoutes from "./routes/routes";
import envConfig from "./config/envConfig";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import webhookRoutes from "./routes/webhookRoutes";

const app = express();

app.use(helmet())

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
});
app.use(limiter);

const speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 20, 
  delayMs: () => 1000,
});
app.use(speedLimiter);

app.use(
  cors({
    origin: "http://localhost:4000",
    methods: "GET,PUT,POST,DELETE",
    credentials: true,
  })
);

app.use("/webhook", webhookRoutes)

app.use(express.json());

app.use(cookieParser(envConfig.cookieSecret));

app.use("/api/v1", clientRoutes);

app.use("*", (_, res: Response) => {
  res.status(404).send("Endpoint does not exist!");
});

app.use(errorHandler);

const PORT = envConfig.port || 8000;

export const server = app.listen(PORT, () => console.log(`Server is running in port ${PORT}`))
mongoose
  .connect(envConfig.mongoUri as string)


