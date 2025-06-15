import { Router } from "express";
import requestHandler from "../handlers/requestHandler";
import { currencySchema } from "../validators/otherValidators";
import { getExchangeRate, getNewTokens } from "../controllers/otherControllers";

const router = Router();

router.get("/exchange-rates/:currency", requestHandler(currencySchema, "params"), getExchangeRate);

router.get("/refresh-token", getNewTokens);

export default router;
