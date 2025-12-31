// src/routes/doctors.routes.js
import { Router } from "express";
import { listPublicDoctors } from "../controllers/doctors.controller.js";

const r = Router();

// Public: list doctors with filters/pagination
// GET /api/doctors?q=&page=&limit=&specialty_id=&language_id=&verified=
r.get("/", listPublicDoctors);

export default r;
