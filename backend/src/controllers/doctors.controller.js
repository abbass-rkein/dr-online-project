// src/controllers/doctors.controller.js
import { pool } from "../db.js";

/* =========================
   PUBLIC: LIST DOCTORS
   GET /api/doctors  (or /api/public/doctors/list depending on your routes)
   ========================= */
export async function listPublicDoctors(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const specialty_id = req.query.specialty_id
      ? Number(req.query.specialty_id)
      : null;
    const language_id = req.query.language_id
      ? Number(req.query.language_id)
      : null;
    const verified =
      req.query.verified !== undefined ? String(req.query.verified) : "";

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(30, Math.max(6, Number(req.query.limit || 9)));
    const offset = (page - 1) * limit;

    const where = ["u.role='DOCTOR'", "u.is_active=1"];
    const params = [];

    if (q) {
      where.push("(u.full_name LIKE ? OR dp.title LIKE ? OR u.email LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    if (verified === "1" || verified.toLowerCase() === "true") {
      where.push("dp.is_verified=1");
    }

    // filter by specialty
    if (Number.isFinite(specialty_id) && specialty_id > 0) {
      where.push(`
        EXISTS (
          SELECT 1 FROM doctor_specialties ds
          WHERE ds.doctor_id = u.user_id AND ds.specialty_id = ?
        )
      `);
      params.push(specialty_id);
    }

    // filter by language
    if (Number.isFinite(language_id) && language_id > 0) {
      where.push(`
        EXISTS (
          SELECT 1 FROM doctor_languages dl
          WHERE dl.doctor_id = u.user_id AND dl.language_id = ?
        )
      `);
      params.push(language_id);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const [[countRow]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM users u
      JOIN doctor_profiles dp ON dp.doctor_id = u.user_id
      ${whereSql}
      `,
      params
    );

    const [rows] = await pool.query(
      `
      SELECT
        u.user_id AS doctor_id,
        u.full_name,
        u.country,
        dp.title,
        dp.years_experience,
        dp.rating,
        dp.rating_count,
        dp.is_verified,
        dp.consultation_fee
      FROM users u
      JOIN doctor_profiles dp ON dp.doctor_id = u.user_id
      ${whereSql}
      ORDER BY dp.is_verified DESC, dp.rating DESC, dp.rating_count DESC, u.user_id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

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
        specMap.get(r.doctor_id).push({
          specialty_id: r.specialty_id,
          name: r.name,
        });
      }

      for (const r of langRows) {
        if (!langMap.has(r.doctor_id)) langMap.set(r.doctor_id, []);
        langMap.get(r.doctor_id).push({
          language_id: r.language_id,
          name: r.name,
        });
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

/* =========================
   DOCTOR DASHBOARD
   Mounted at /api/doctor/*
   Requires: requireAuth + requireRole("DOCTOR")
   ========================= */

function overlapsSql() {
  // newStart < existingEnd AND newEnd > existingStart
  return `( ? < end_at AND ? > start_at )`;
}

/**
 * GET /api/doctor/slots
 * Doctor sees upcoming slots (booked + unbooked)
 */
export async function getMySlots(req, res, next) {
  try {
    const doctor_id = req.user.user_id;

    const [rows] = await pool.query(
      `
      SELECT slot_id, start_at, end_at, is_booked, created_at
      FROM doctor_availability
      WHERE doctor_id = ?
        AND end_at >= UTC_TIMESTAMP()
      ORDER BY start_at ASC
      LIMIT 500
      `,
      [doctor_id]
    );

    res.json({ ok: true, data: rows });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/doctor/slots
 * body: { start_at, end_at }
 */
export async function createSlot(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const doctor_id = req.user.user_id;

    const start_at = String(req.body?.start_at || "").trim();
    const end_at = String(req.body?.end_at || "").trim();

    if (!start_at || !end_at) {
      return res
        .status(400)
        .json({ ok: false, error: "start_at and end_at required" });
    }

    await conn.beginTransaction();

    // prevent overlaps for same doctor
    const [ov] = await conn.query(
      `
      SELECT slot_id
      FROM doctor_availability
      WHERE doctor_id = ?
        AND ${overlapsSql()}
      LIMIT 1
      `,
      [doctor_id, start_at, end_at]
    );

    if (ov.length) {
      await conn.rollback();
      return res
        .status(409)
        .json({ ok: false, error: "Slot overlaps an existing slot" });
    }

    const [ins] = await conn.query(
      `
      INSERT INTO doctor_availability (doctor_id, start_at, end_at, is_booked)
      VALUES (?, ?, ?, 0)
      `,
      [doctor_id, start_at, end_at]
    );

    await conn.commit();

    res.json({ ok: true, slot_id: ins.insertId });
  } catch (e) {
    try {
      await conn.rollback();
    } catch {}
    next(e);
  } finally {
    conn.release();
  }
}

/**
 * DELETE /api/doctor/slots/:slot_id
 * Only delete if it's not booked and belongs to doctor
 */
export async function deleteSlot(req, res, next) {
  try {
    const doctor_id = req.user.user_id;
    const slot_id = Number(req.params.slot_id);

    if (!Number.isFinite(slot_id) || slot_id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid slot_id" });
    }

    const [r] = await pool.query(
      `
      DELETE FROM doctor_availability
      WHERE slot_id = ?
        AND doctor_id = ?
        AND is_booked = 0
      LIMIT 1
      `,
      [slot_id, doctor_id]
    );

    if (r.affectedRows === 0) {
      return res.status(409).json({
        ok: false,
        error: "Cannot delete (slot not found / not yours / already booked)",
      });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/doctor/appointments?status=CONFIRMED
 */
export async function getMyAppointments(req, res, next) {
  try {
    const doctor_id = req.user.user_id;
    const status = String(req.query.status || "").trim();

    const params = [doctor_id];
    let where = "a.doctor_id = ?";

    if (status) {
      where += " AND a.status = ?";
      params.push(status);
    }

    const [rows] = await pool.query(
      `
      SELECT
        a.appointment_id,
        a.patient_id,
        u.full_name AS patient_name,
        u.email AS patient_email,
        u.phone AS patient_phone,
        a.slot_id,
        a.appointment_at,
        a.mode,
        a.status,
        a.patient_notes,
        a.doctor_notes,
        a.created_at,
        a.updated_at
      FROM appointments a
      JOIN users u ON u.user_id = a.patient_id
      WHERE ${where}
      ORDER BY a.appointment_at ASC
      LIMIT 500
      `,
      params
    );

    res.json({ ok: true, data: rows });
  } catch (e) {
    next(e);
  }
}

/**
 * PUT /api/doctor/appointments/:id
 * body: { status, doctor_notes }
 */
export async function updateAppointment(req, res, next) {
  try {
    const doctor_id = req.user.user_id;
    const appointment_id = Number(req.params.id);

    if (!Number.isFinite(appointment_id) || appointment_id <= 0) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid appointment id" });
    }

    const status = String(req.body?.status || "").trim();
    const doctor_notes = String(req.body?.doctor_notes || "").trim();

    const allowed = [
      "PENDING",
      "CONFIRMED",
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW",
    ];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid status" });
    }

    // must belong to this doctor
    const [rows] = await pool.query(
      `SELECT appointment_id FROM appointments WHERE appointment_id=? AND doctor_id=? LIMIT 1`,
      [appointment_id, doctor_id]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ ok: false, error: "Appointment not found" });
    }

    await pool.query(
      `
      UPDATE appointments
      SET
        status = COALESCE(?, status),
        doctor_notes = COALESCE(?, doctor_notes)
      WHERE appointment_id = ?
        AND doctor_id = ?
      LIMIT 1
      `,
      [status || null, doctor_notes || null, appointment_id, doctor_id]
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
