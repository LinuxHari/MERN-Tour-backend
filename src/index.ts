import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { errorHandler } from "./handlers/errorHandler";
import allRoutes from "./routes/routes";

const app = express();

dotenv.config();

app.use(
  cors({
    origin: "http://localhost:4000",
    methods: "GET,PUT,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser(process.env.COOKIE_SECRET));

app.use("/api/v1", allRoutes);

app.use("*", (_, res: Response) => {
  res.status(404).send("Endpoint does not exist!");
});

app.use(errorHandler);

const PORT = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
  })
  .catch(() => process.exit());
