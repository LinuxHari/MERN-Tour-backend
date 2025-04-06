import { z } from "zod";
import { CURRENCIES } from "../config/otherConfig";

export const currencySchema = z.object({
  currency: z.enum(CURRENCIES, { message: "Invalid or unsupported currency is paused" })
});
