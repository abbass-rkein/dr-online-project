import { pool } from "../db.js";

export async function listLanguages(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(5, Number(req.query.limit || 10)));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (q) {
      where.push("l.name LIKE ?");
      params.push(`%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM languages l ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `
      SELECT
        l.language_id,
        l.name,
        (
          SELECT COUNT(*)
          FROM doctor_languages dl
          WHERE dl.language_id = l.language_id
        ) AS doctor_count
      FROM languages l
      ${whereSql}
      ORDER BY l.name ASC
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

export async function createLanguage(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ ok: false, error: "Name is required" });

    // case-insensitive uniqueness
    const [[exists]] = await pool.query(
      `SELECT language_id FROM languages WHERE LOWER(name)=LOWER(?) LIMIT 1`,
      [name]
    );
    if (exists?.language_id) {
      return res.status(409).json({ ok: false, error: "Language already exists" });
    }

    const [r] = await pool.query(
      `INSERT INTO languages (name) VALUES (?)`,
      [name]
    );

    res.json({ ok: true, language_id: r.insertId });
  } catch (e) {
    next(e);
  }
}

export async function updateLanguage(req, res, next) {
  try {
    const id = Number(req.params.id);
    const name = String(req.body?.name || "").trim();

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid language id" });
    }
    if (!name) return res.status(400).json({ ok: false, error: "Name is required" });

    const [[cur]] = await pool.query(
      `SELECT language_id FROM languages WHERE language_id=? LIMIT 1`,
      [id]
    );
    if (!cur?.language_id) {
      return res.status(404).json({ ok: false, error: "Language not found" });
    }

    const [[dup]] = await pool.query(
      `SELECT language_id FROM languages WHERE LOWER(name)=LOWER(?) AND language_id<>? LIMIT 1`,
      [name, id]
    );
    if (dup?.language_id) {
      return res.status(409).json({ ok: false, error: "Another language has the same name" });
    }

    await pool.query(
      `UPDATE languages SET name=? WHERE language_id=? LIMIT 1`,
      [name, id]
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function deleteLanguage(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid language id" });
    }

    const [[usage]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM doctor_languages WHERE language_id=?`,
      [id]
    );

    if (Number(usage?.cnt || 0) > 0) {
      return res.status(409).json({
        ok: false,
        error: "Cannot delete: language is assigned to doctors",
      });
    }

    const [r] = await pool.query(
      `DELETE FROM languages WHERE language_id=? LIMIT 1`,
      [id]
    );

    if (r.affectedRows !== 1) {
      return res.status(404).json({ ok: false, error: "Language not found" });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
