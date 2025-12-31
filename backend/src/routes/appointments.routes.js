import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import {
  createAppointment,
  listMyAppointments,
  cancelMyAppointment,
} from "../controllers/appointments.controller.js";

const r = Router();

r.get("/mine", requireAuth, requireRole("PATIENT"), listMyAppointments);
r.post("/", requireAuth, requireRole("PATIENT"), createAppointment);
r.put("/:id/cancel", requireAuth, requireRole("PATIENT"), cancelMyAppointment);

export default r;
