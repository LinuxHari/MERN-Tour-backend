import express from "express"
import adminRoutes from "./adminRoutes"
import tourRoutes from "./tourRoutes"
import userRoutes from "./userRoutes"

const router = express.Router()

router.use("/admin", adminRoutes)

router.use("/tour", tourRoutes)

router.use("/user", userRoutes)

export default router