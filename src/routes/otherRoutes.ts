import { Router } from "express";
import requestHandler from "../handlers/requestHandler";
import { currencySchema } from "../validators/otherValidators";
import { getExchangeRate } from "../controllers/otherControllers";

const router = Router();

router.get("/exchange-rates/:currency", requestHandler(currencySchema, "params"), getExchangeRate);

export default router;
