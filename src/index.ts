import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import allRoutes from "./routes/routes";
import mongoose from "mongoose";

const app = express();

dotenv.config();

app.use(cors({ origin: "*", methods: "GET,PUT,POST,DELETE" }));

app.use("/api/v1", allRoutes);

app.get("/test", (req: Request, res: Response) => {
  res.json({ message: "works" });
});

app.use("*", (req: Request, res: Response) => {
  res.status(404).send("Endpoint does not exist!");
});

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
  })
  .catch(() => process.exit());
