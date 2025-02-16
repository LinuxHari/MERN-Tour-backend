import express, { Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { errorHandler } from "./handlers/errorHandler";
import clientRoutes from "./routes/routes";
import envConfig from "./config/envConfig";
import webhookRoutes from "./routes/webhookRoutes";
import { dbConnect, dbDisconnect } from "./dbManager";

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30
});
app.use(limiter);

const speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 20,
  delayMs: () => 1000
});
app.use(speedLimiter);

app.use(
  cors({
    origin: envConfig.frontend,
    methods: "GET,PUT,POST,DELETE",
    credentials: true
  })
);

app.use("/webhook", webhookRoutes);

app.use(express.json());

app.use(cookieParser(envConfig.cookieSecret));

app.use("/api/v1", clientRoutes);

app.use("*", (_, res: Response) => {
  res.status(404).send("Endpoint does not exist!");
});

app.use(errorHandler);

dbConnect();

const PORT = envConfig.port || 8000;

export const server = app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));

export const shutdown = async (type: number) => {
  console.log("Shutting down...");
  try {
    await dbDisconnect();
  } catch (err) {
    console.log(err);
  }
  if (server) {
    server.close(() => {
      server.close(() => {
        console.log("Server closed");
        process.exit(type);
      });
    });
  } else {
    console.log("Server closed before server initialization");
    process.exit(1);
  }

  setTimeout(() => {
    console.error("Forced shutdown due to lingering connections.");
    process.exit(1);
  }, 10000);
};

export default app;
