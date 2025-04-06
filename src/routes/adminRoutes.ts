import { Router } from "express";
import { addTour, getTours, getStats, deleteTour, updateTour, getTour } from "../controllers/adminControllers";
import { BaseTourSchema, PublishedTourSchema, TourSchema } from "../validators/adminValidators";
import requestHandler from "../handlers/requestHandler";
import { SingleTourParamSchema } from "../validators/tourValidators";

const router = Router();

router.post("/tour", requestHandler(TourSchema), addTour);
router.get("/tours", requestHandler(PublishedTourSchema, "query"), getTours);
router.get("/tour/:tourId", requestHandler(SingleTourParamSchema, "params"), getTour);
router.put(
  "/tour/:tourId",
  requestHandler(SingleTourParamSchema, "params"),
  requestHandler(BaseTourSchema),
  updateTour
);
router.delete("/tour/:tourId", requestHandler(SingleTourParamSchema, "params"), deleteTour);
router.get("/stats", getStats);

export default router;
