import cron from "node-cron";
import { fetchExchangeRates } from "./services/exchangeService";

cron.schedule("0 0 * * *", fetchExchangeRates, { scheduled: true, timezone: "UTC" });
