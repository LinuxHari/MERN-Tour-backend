import { Router } from "express";
import { addTour } from "../controllers/adminControllers";
import { TourSchema } from "../validators/adminValidators";
import requestHandler from "../handlers/requestHandler";

const router = Router();

router.post("/tour", requestHandler(TourSchema), addTour);

export default router;
