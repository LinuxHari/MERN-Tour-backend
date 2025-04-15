import { Router } from "express";
import {
  addTour,
  getTours,
  getStats,
  deleteTour,
  updateTour,
  getTour,
  getBookings,
  getUsers,
  deleteUser
} from "../controllers/adminControllers";
import { BaseTourSchema, PublishedTourSchema, TourSchema, UsersSchema } from "../validators/adminValidators";
import requestHandler from "../handlers/requestHandler";
import { BookingTourParamSchema, SingleTourParamSchema } from "../validators/tourValidators";
import { UserBookings } from "../validators/userValidators";
import { EmailSchema } from "../validators/authValidators";

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
router.get("/bookings", requestHandler(UserBookings, "query"), getBookings);
router.post("/bookings/:bookingId/cancel", requestHandler(BookingTourParamSchema, "params"), getBookings);
router.get("/users", requestHandler(UsersSchema, "query"), getUsers);
router.delete("/users", requestHandler(EmailSchema, "query"), deleteUser);

export default router;
