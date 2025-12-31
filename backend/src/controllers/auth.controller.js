import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { config } from "../config.js";
import { signupSchema, loginSchema } from "../validators/auth.schema.js";

function sign(user) {
  return jwt.sign(
    { user_id: user.user_id, role: user.role, full_name: user.full_name, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export async function signup(req, res, next) {
  try {
    const inData = signupSchema.parse(req.body);
    const email = inData.email.toLowerCase();

    const [existing] = await pool.query("SELECT user_id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length) return res.status(409).json({ ok: false, error: "Email already used" });

    const hash = await bcrypt.hash(inData.password, 12);

    const [r] = await pool.query(
      `INSERT INTO users (role, full_name, email, password_hash, phone, country)
       VALUES ('PATIENT', ?, ?, ?, ?, ?)`,
      [inData.full_name, email, hash, inData.phone ?? null, inData.country ?? null]
    );

    const user = { user_id: r.insertId, role: "PATIENT", full_name: inData.full_name, email };
    return res.json({ ok: true, token: sign(user), user });
  } catch (e) {
    return next(e);
  }
}

export async function login(req, res, next) {
  try {
    const inData = loginSchema.parse(req.body);
    const email = inData.email.toLowerCase();

    const [rows] = await pool.query(
      `SELECT user_id, role, full_name, email, password_hash, is_active
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    if (!rows.length) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const u = rows[0];
    if (u.is_active !== 1) return res.status(403).json({ ok: false, error: "Account disabled" });

    const ok = await bcrypt.compare(inData.password, u.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const user = { user_id: u.user_id, role: u.role, full_name: u.full_name, email: u.email };
    return res.json({ ok: true, token: sign(user), user });
  } catch (e) {
    return next(e);
  }
}

export async function me(req, res) {
  res.json({ ok: true, user: req.user });
}
