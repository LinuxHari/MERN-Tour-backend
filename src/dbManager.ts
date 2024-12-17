import mongoose from "mongoose";
import envConfig from "./config/envConfig";
import { shutdown } from "./index";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const dbConnect = async () => {
  try {
    await mongoose.connect(envConfig.mongoUri as string);
    console.log("Database is connected");
  } catch (err) {
    console.log(err);
    shutdown(1);
  }
};

export const dbDisconnect = async (count = 0) => {
  try {
    if (mongoose.connection.readyState) await mongoose.disconnect();
    console.log("Db is disconnected");
  } catch (err) {
    if (count <= 5) {
      count++;
      await delay(10000);
      await dbDisconnect(count);
    } else {
        throw new Error("Failed to disconnect database")
    }
  }
};
