import bcrypt from "bcrypt";
import { pool } from "../db.js";

function pickIntArray(x) {
  if (!Array.isArray(x)) return [];
  return [...new Set(x.map(Number).filter((n) => Number.isFinite(n) && n > 0))];
}

export async function listDoctors(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(5, Number(req.query.limit || 10)));
    const offset = (page - 1) * limit;

    const where = [`u.role='DOCTOR'`];
    const params = [];

    if (q) {
      where.push("(u.full_name LIKE ? OR u.email LIKE ? OR dp.title LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) as total
       FROM users u
       JOIN doctor_profiles dp ON dp.doctor_id = u.user_id
       ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `
      SELECT
        u.user_id AS doctor_id,
        u.full_name,
        u.email,
        u.phone,
        u.country,
        u.is_active,

        dp.title,
        dp.bio,
        dp.years_experience,
        dp.rating,
        dp.rating_count,
        dp.is_verified,
        dp.consultation_fee,

        u.created_at
      FROM users u
      JOIN doctor_profiles dp ON dp.doctor_id = u.user_id
      ${whereSql}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    // attach specialties + languages (compact, no N+1)
    const ids = rows.map((r) => r.doctor_id);
    let specMap = new Map();
    let langMap = new Map();

    if (ids.length) {
      const [specRows] = await pool.query(
        `
        SELECT ds.doctor_id, s.specialty_id, s.name
        FROM doctor_specialties ds
        JOIN specialties s ON s.specialty_id = ds.specialty_id
        WHERE ds.doctor_id IN (${ids.map(() => "?").join(",")})
        ORDER BY s.name ASC
        `,
        ids
      );

      const [langRows] = await pool.query(
        `
        SELECT dl.doctor_id, l.language_id, l.name
        FROM doctor_languages dl
        JOIN languages l ON l.language_id = dl.language_id
        WHERE dl.doctor_id IN (${ids.map(() => "?").join(",")})
        ORDER BY l.name ASC
        `,
        ids
      );

      for (const r of specRows) {
        if (!specMap.has(r.doctor_id)) specMap.set(r.doctor_id, []);
        specMap.get(r.doctor_id).push({ specialty_id: r.specialty_id, name: r.name });
      }
      for (const r of langRows) {
        if (!langMap.has(r.doctor_id)) langMap.set(r.doctor_id, []);
        langMap.get(r.doctor_id).push({ language_id: r.language_id, name: r.name });
      }
    }

    const data = rows.map((d) => ({
      ...d,
      specialties: specMap.get(d.doctor_id) || [],
      languages: langMap.get(d.doctor_id) || [],
    }));

    res.json({
      ok: true,
      page,
      limit,
      total: Number(countRow.total || 0),
      totalPages: Math.ceil(Number(countRow.total || 0) / limit),
      data,
    });
  } catch (e) {
    next(e);
  }
}

export async function createDoctor(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const full_name = String(req.body?.full_name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const phone = req.body?.phone ? String(req.body.phone).trim() : null;
    const country = req.body?.country ? String(req.body.country).trim().toUpperCase() : null;

    const title = req.body?.title ? String(req.body.title).trim() : null;
    const bio = req.body?.bio ? String(req.body.bio).trim() : null;
    const years_experience = Math.max(0, Number(req.body?.years_experience || 0));
    const is_verified = req.body?.is_verified ? 1 : 0;
    const consultation_fee = req.body?.consultation_fee !== undefined && req.body?.consultation_fee !== null
      ? Number(req.body.consultation_fee)
      : null;

    const specialty_ids = pickIntArray(req.body?.specialty_ids);
    const language_ids = pickIntArray(req.body?.language_ids);

    const rawPassword = String(req.body?.password || "123"); // dev default
    if (!full_name || !email) {
      return res.status(400).json({ ok: false, error: "full_name and email are required" });
    }

    await conn.beginTransaction();

    // ensure email unique
    const [[exists]] = await conn.query(
      `SELECT user_id FROM users WHERE email=? LIMIT 1`,
      [email]
    );
    if (exists?.user_id) {
      await conn.rollback();
      return res.status(409).json({ ok: false, error: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(rawPassword, 12);

    const [u] = await conn.query(
      `INSERT INTO users (role, full_name, email, password_hash, phone, country, is_active)
       VALUES ('DOCTOR', ?, ?, ?, ?, ?, 1)`,
      [full_name, email, password_hash, phone, country]
    );

    const doctorId = u.insertId;

    await conn.query(
      `INSERT INTO doctor_profiles
       (doctor_id, title, bio, years_experience, rating, rating_count, is_verified, consultation_fee)
       VALUES (?, ?, ?, ?, 0.0, 0, ?, ?)`,
      [doctorId, title, bio, years_experience, is_verified, consultation_fee]
    );

    if (specialty_ids.length) {
      const values = specialty_ids.map(() => "(?, ?)").join(",");
      const params = specialty_ids.flatMap((sid) => [doctorId, sid]);
      await conn.query(
        `INSERT IGNORE INTO doctor_specialties (doctor_id, specialty_id) VALUES ${values}`,
        params
      );
    }

    if (language_ids.length) {
      const values = language_ids.map(() => "(?, ?)").join(",");
      const params = language_ids.flatMap((lid) => [doctorId, lid]);
      await conn.query(
        `INSERT IGNORE INTO doctor_languages (doctor_id, language_id) VALUES ${values}`,
        params
      );
    }

    await conn.commit();
    res.json({ ok: true, doctor_id: doctorId });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    next(e);
  } finally {
    conn.release();
  }
}

export async function updateDoctor(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const doctorId = Number(req.params.id);
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid doctor id" });
    }

    const full_name = req.body?.full_name !== undefined ? String(req.body.full_name).trim() : undefined;
    const phone = req.body?.phone !== undefined ? (req.body.phone ? String(req.body.phone).trim() : null) : undefined;
    const country = req.body?.country !== undefined ? (req.body.country ? String(req.body.country).trim().toUpperCase() : null) : undefined;
    const is_active = req.body?.is_active !== undefined ? (req.body.is_active ? 1 : 0) : undefined;

    const title = req.body?.title !== undefined ? (req.body.title ? String(req.body.title).trim() : null) : undefined;
    const bio = req.body?.bio !== undefined ? (req.body.bio ? String(req.body.bio).trim() : null) : undefined;
    const years_experience = req.body?.years_experience !== undefined ? Math.max(0, Number(req.body.years_experience || 0)) : undefined;
    const is_verified = req.body?.is_verified !== undefined ? (req.body.is_verified ? 1 : 0) : undefined;
    const consultation_fee =
      req.body?.consultation_fee !== undefined ? (req.body.consultation_fee === null ? null : Number(req.body.consultation_fee)) : undefined;

    const specialty_ids = req.body?.specialty_ids !== undefined ? pickIntArray(req.body.specialty_ids) : undefined;
    const language_ids = req.body?.language_ids !== undefined ? pickIntArray(req.body.language_ids) : undefined;

    await conn.beginTransaction();

    // ensure doctor exists
    const [[u]] = await conn.query(
      `SELECT user_id FROM users WHERE user_id=? AND role='DOCTOR' LIMIT 1`,
      [doctorId]
    );
    if (!u?.user_id) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "Doctor not found" });
    }

    // update users fields
    const userSets = [];
    const userParams = [];
    if (full_name !== undefined) { userSets.push("full_name=?"); userParams.push(full_name); }
    if (phone !== undefined) { userSets.push("phone=?"); userParams.push(phone); }
    if (country !== undefined) { userSets.push("country=?"); userParams.push(country); }
    if (is_active !== undefined) { userSets.push("is_active=?"); userParams.push(is_active); }

    if (userSets.length) {
      await conn.query(
        `UPDATE users SET ${userSets.join(", ")} WHERE user_id=? LIMIT 1`,
        [...userParams, doctorId]
      );
    }

    // update doctor_profiles fields
    const profSets = [];
    const profParams = [];
    if (title !== undefined) { profSets.push("title=?"); profParams.push(title); }
    if (bio !== undefined) { profSets.push("bio=?"); profParams.push(bio); }
    if (years_experience !== undefined) { profSets.push("years_experience=?"); profParams.push(years_experience); }
    if (is_verified !== undefined) { profSets.push("is_verified=?"); profParams.push(is_verified); }
    if (consultation_fee !== undefined) { profSets.push("consultation_fee=?"); profParams.push(consultation_fee); }

    if (profSets.length) {
      await conn.query(
        `UPDATE doctor_profiles SET ${profSets.join(", ")} WHERE doctor_id=? LIMIT 1`,
        [...profParams, doctorId]
      );
    }

    // replace specialties
    if (specialty_ids !== undefined) {
      await conn.query(`DELETE FROM doctor_specialties WHERE doctor_id=?`, [doctorId]);
      if (specialty_ids.length) {
        const values = specialty_ids.map(() => "(?, ?)").join(",");
        const params = specialty_ids.flatMap((sid) => [doctorId, sid]);
        await conn.query(
          `INSERT IGNORE INTO doctor_specialties (doctor_id, specialty_id) VALUES ${values}`,
          params
        );
      }
    }

    // replace languages
    if (language_ids !== undefined) {
      await conn.query(`DELETE FROM doctor_languages WHERE doctor_id=?`, [doctorId]);
      if (language_ids.length) {
        const values = language_ids.map(() => "(?, ?)").join(",");
        const params = language_ids.flatMap((lid) => [doctorId, lid]);
        await conn.query(
          `INSERT IGNORE INTO doctor_languages (doctor_id, language_id) VALUES ${values}`,
          params
        );
      }
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    next(e);
  } finally {
    conn.release();
  }
}
