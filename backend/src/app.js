import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./config.js";
import { errorHandler, notFound } from "./middleware/error.js";

import authRoutes from "./routes/auth.routes.js";
import doctorsRoutes from "./routes/doctors.routes.js";
import appointmentsRoutes from "./routes/appointments.routes.js";
// import articlesRoutes from "./routes/articles.routes.js";
// import discussionsRoutes from "./routes/discussions.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import publicDoctorRoutes from "./routes/public_doctor.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/doctors", doctorsRoutes);
  app.use("/api/doctor", doctorRoutes);
  app.use("/api/public/doctors", publicDoctorRoutes);
  app.use("/api/appointments", appointmentsRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/meta", metaRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
