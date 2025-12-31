import { Router } from "express";
import { getPublicDoctor, listPublicDoctorSlots } from "../controllers/public_doctor.controller.js";

const r = Router();

r.get("/:id", getPublicDoctor);
r.get("/:id/slots", listPublicDoctorSlots);

export default r;
