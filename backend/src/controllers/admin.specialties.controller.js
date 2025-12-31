import { pool } from "../db.js";

export async function listSpecialties(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(5, Number(req.query.limit || 10)));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (q) {
      where.push("s.name LIKE ?");
      params.push(`%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM specialties s ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `
      SELECT
        s.specialty_id,
        s.name,
        s.created_at,
        (
          SELECT COUNT(*)
          FROM doctor_specialties ds
          WHERE ds.specialty_id = s.specialty_id
        ) AS doctor_count
      FROM specialties s
      ${whereSql}
      ORDER BY s.name ASC
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

export async function createSpecialty(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ ok: false, error: "Name is required" });

    // case-insensitive uniqueness
    const [[exists]] = await pool.query(
      `SELECT specialty_id FROM specialties WHERE LOWER(name)=LOWER(?) LIMIT 1`,
      [name]
    );
    if (exists?.specialty_id) {
      return res.status(409).json({ ok: false, error: "Specialty already exists" });
    }

    const [r] = await pool.query(
      `INSERT INTO specialties (name) VALUES (?)`,
      [name]
    );

    res.json({ ok: true, specialty_id: r.insertId });
  } catch (e) {
    next(e);
  }
}

export async function updateSpecialty(req, res, next) {
  try {
    const id = Number(req.params.id);
    const name = String(req.body?.name || "").trim();

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid specialty id" });
    }
    if (!name) return res.status(400).json({ ok: false, error: "Name is required" });

    // ensure exists
    const [[cur]] = await pool.query(
      `SELECT specialty_id FROM specialties WHERE specialty_id=? LIMIT 1`,
      [id]
    );
    if (!cur?.specialty_id) {
      return res.status(404).json({ ok: false, error: "Specialty not found" });
    }

    // check duplicates (case-insensitive)
    const [[dup]] = await pool.query(
      `SELECT specialty_id FROM specialties WHERE LOWER(name)=LOWER(?) AND specialty_id<>? LIMIT 1`,
      [name, id]
    );
    if (dup?.specialty_id) {
      return res.status(409).json({ ok: false, error: "Another specialty has the same name" });
    }

    await pool.query(
      `UPDATE specialties SET name=? WHERE specialty_id=? LIMIT 1`,
      [name, id]
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function deleteSpecialty(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid specialty id" });
    }

    // safe delete: block if used
    const [[usage]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM doctor_specialties WHERE specialty_id=?`,
      [id]
    );

    if (Number(usage?.cnt || 0) > 0) {
      return res.status(409).json({
        ok: false,
        error: "Cannot delete: specialty is assigned to doctors",
      });
    }

    const [r] = await pool.query(
      `DELETE FROM specialties WHERE specialty_id=? LIMIT 1`,
      [id]
    );

    if (r.affectedRows !== 1) {
      return res.status(404).json({ ok: false, error: "Specialty not found" });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
