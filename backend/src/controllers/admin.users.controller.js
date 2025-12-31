import { pool } from "../db.js";

export async function listUsers(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const role = String(req.query.role || "").trim().toUpperCase(); // PATIENT/DOCTOR/ADMIN
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(5, Number(req.query.limit || 10)));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (q) {
      where.push("(u.full_name LIKE ? OR u.email LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like);
    }

    if (role && ["PATIENT", "DOCTOR", "ADMIN"].includes(role)) {
      where.push("u.role = ?");
      params.push(role);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) as total FROM users u ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `
      SELECT
        u.user_id, u.role, u.full_name, u.email, u.phone, u.country,
        u.is_active, u.created_at, u.updated_at
      FROM users u
      ${whereSql}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      ok: true,
      page,
      limit,
      total: Number(countRow.total || 0),
      totalPages: Math.ceil(Number(countRow.total || 0) / limit),
      data: rows,
    });
  } catch (e) {
    next(e);
  }
}

export async function setUserActive(req, res, next) {
  try {
    const id = Number(req.params.id);
    const is_active = Number(req.body?.is_active);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid user id" });
    }
    if (![0, 1].includes(is_active)) {
      return res.status(400).json({ ok: false, error: "is_active must be 0 or 1" });
    }

    const [r] = await pool.query(
      `UPDATE users SET is_active=? WHERE user_id=? LIMIT 1`,
      [is_active, id]
    );

    if (r.affectedRows !== 1) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
