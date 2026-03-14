import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import salonsRouter from "./salons.js";
import usersRouter from "./users.js";
import techniciansRouter from "./technicians.js";
import servicesRouter from "./services.js";
import appointmentsRouter from "./appointments.js";
import waitlistRouter from "./waitlist.js";
import nailColorsRouter from "./nail-colors.js";
import loyaltyRouter from "./loyalty.js";
import clientsRouter from "./clients.js";
import notificationsRouter from "./notifications.js";
import analyticsRouter from "./analytics.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(salonsRouter);
router.use(usersRouter);
router.use(techniciansRouter);
router.use(servicesRouter);
router.use(appointmentsRouter);
router.use(waitlistRouter);
router.use(nailColorsRouter);
router.use(loyaltyRouter);
router.use(clientsRouter);
router.use(notificationsRouter);
router.use(analyticsRouter);

export default router;
