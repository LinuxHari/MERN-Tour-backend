import { Router } from "express";
import { addTour, getTours, getStats, deleteTour } from "../controllers/adminControllers";
import { TourSchema } from "../validators/adminValidators";
import requestHandler from "../handlers/requestHandler";
import { PageSchema, SingleTourParamSchema } from "../validators/tourValidators";

const router = Router();

router.post("/tour", requestHandler(TourSchema), addTour);
router.get("/tour", requestHandler(PageSchema, "query"), getTours);
router.delete("/tour/:tourId", requestHandler(SingleTourParamSchema, "params"), deleteTour);
router.get("/stats", getStats);

export default router;
