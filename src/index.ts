import express, { Response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { errorHandler } from "./handlers/errorHandler";
import allRoutes from "./routes/routes";
import envConfig from "./config/envConfig";

const app = express();

app.use(
  cors({
    origin: "http://localhost:4000",
    methods: "GET,PUT,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());

app.use("/api/v1", allRoutes);

app.use("*", (_, res: Response) => {
  res.status(404).send("Endpoint does not exist!");
});

app.use(errorHandler);

const PORT = envConfig.port || 8000;

mongoose
  .connect(envConfig.mongoUri as string)
  .then(() => {
    app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
  })
  .catch(() => process.exit());
