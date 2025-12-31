import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

import { summary } from "../controllers/admin.controller.js";
import {
  listUsers,
  setUserActive,
} from "../controllers/admin.users.controller.js";
import {
  listMessages,
  updateMessageStatus,
} from "../controllers/admin.messages.controller.js";
import {
  listDoctors,
  createDoctor,
  updateDoctor,
} from "../controllers/admin.doctors.controller.js";
import {
  listSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from "../controllers/admin.specialties.controller.js";
import {
  listLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
} from "../controllers/admin.languages.controller.js";

const r = Router();

// summary
r.get("/summary", requireAuth, requireRole("ADMIN"), summary);

// users
r.get("/users", requireAuth, requireRole("ADMIN"), listUsers);
r.patch("/users/:id/active", requireAuth, requireRole("ADMIN"), setUserActive);

r.get("/messages", requireAuth, requireRole("ADMIN"), listMessages);
r.patch(
  "/messages/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateMessageStatus
);

r.get("/doctors", requireAuth, requireRole("ADMIN"), listDoctors);
r.post("/doctors", requireAuth, requireRole("ADMIN"), createDoctor);
r.put("/doctors/:id", requireAuth, requireRole("ADMIN"), updateDoctor);

r.get("/specialties", requireAuth, requireRole("ADMIN"), listSpecialties);
r.post("/specialties", requireAuth, requireRole("ADMIN"), createSpecialty);
r.put("/specialties/:id", requireAuth, requireRole("ADMIN"), updateSpecialty);
r.delete(
  "/specialties/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteSpecialty
);

r.get("/languages", requireAuth, requireRole("ADMIN"), listLanguages);
r.post("/languages", requireAuth, requireRole("ADMIN"), createLanguage);
r.put("/languages/:id", requireAuth, requireRole("ADMIN"), updateLanguage);
r.delete("/languages/:id", requireAuth, requireRole("ADMIN"), deleteLanguage);

export default r;
