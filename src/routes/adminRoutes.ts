import { Router } from "express";
import { addTour, getTours, getRevenue, deleteTour } from "../controllers/adminControllers";
import { RevenueDurationSchema, TourSchema } from "../validators/adminValidators";
import requestHandler from "../handlers/requestHandler";
import { PageSchema, SingleTourParamSchema } from "../validators/tourValidators";
import verifyAuthToken from "../middlewares/verifyAuthToken";

const router = Router();

router.post("/tour", verifyAuthToken, requestHandler(TourSchema), addTour);
router.get("/tour", verifyAuthToken, requestHandler(PageSchema, "query"), getTours);
router.delete(
  "/tour/:tourId",
  verifyAuthToken,
  requestHandler(SingleTourParamSchema, "params"),
  deleteTour
);
router.get("/revenue", verifyAuthToken, requestHandler(RevenueDurationSchema), getRevenue);

export default router;
