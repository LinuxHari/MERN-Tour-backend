import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import allRoutes from "./routes/routes";
import mongoose from "mongoose";
import { errorHandler } from "./handlers/errorHandler";

const app = express();

dotenv.config();

app.use(cors({ origin: "*", methods: "GET,PUT,POST,DELETE" }));

app.use(express.json())

app.use("/api/v1", allRoutes);

app.use("*", (req: Request, res: Response) => {
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
