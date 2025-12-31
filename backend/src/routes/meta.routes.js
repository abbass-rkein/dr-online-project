import { Router } from "express";
import { pool } from "../db.js";

const r = Router();

r.get("/specialties", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT specialty_id, name FROM specialties ORDER BY name ASC`
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    next(e);
  }
});

r.get("/languages", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT language_id, name FROM languages ORDER BY name ASC`
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    next(e);
  }
});

export default r;
