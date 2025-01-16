import { Router } from "express";
import { addTour, getRevenue } from "../controllers/adminControllers";
import { TourSchema } from "../validators/adminValidators";
import requestHandler from "../handlers/requestHandler";
import { TourListingSchema } from "../validators/tourValidators";
import { getPublishedTours } from "../services/adminServices";
import { verifyToken } from "../utils/authTokenManager";

const router = Router();

router.post("/tour", verifyToken, requestHandler(TourSchema), addTour);
router.get(
  "/tours",
  verifyToken,
  requestHandler(TourListingSchema.shape.page, "query"),
  getPublishedTours
);
router.get("/revenue", verifyToken, getRevenue);
export default router;
