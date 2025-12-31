// src/routes/doctor.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

import {
  getMySlots,
  createSlot,
  deleteSlot,
  getMyAppointments,
  updateAppointment,
} from "../controllers/doctors.controller.js";

const r = Router();

// Doctor only
r.use(requireAuth, requireRole("DOCTOR"));

// Slots
// GET /api/doctor/slots
r.get("/slots", getMySlots);

// POST /api/doctor/slots
r.post("/slots", createSlot);

// DELETE /api/doctor/slots/:slot_id
r.delete("/slots/:slot_id", deleteSlot);

// Appointments
// GET /api/doctor/appointments?status=CONFIRMED
r.get("/appointments", getMyAppointments);

// PUT /api/doctor/appointments/:id
r.put("/appointments/:id", updateAppointment);

export default r;
