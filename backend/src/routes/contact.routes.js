import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendMessage } from "../controllers/contact.controller.js";

const r = Router();
// allow guest OR logged-in; if logged in, attach user_id
r.post("/", (req, res, next) => {
  // optional auth: if header has token, decode it
  // simplest: just rely on client to send without token for guests
  next();
}, sendMessage);

export default r;
