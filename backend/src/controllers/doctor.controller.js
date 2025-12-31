// src/controllers/doctor.controller.js
import { pool } from "../db.js";

// helper: avoid overlaps (optional but recommended)
function overlapsSql() {
  // newStart < existingEnd AND newEnd > existingStart
  return `( ? < end_at AND ? > start_at )`;
}

/**
 * GET /api/doctor/slots
 * Doctor sees their upcoming slots (booked + unbooked)
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
 * body: { start_at, end_at }  (ISO date or "YYYY-MM-DD HH:mm:ss")
 * Creates one slot (you can later add "generate many")
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

    // overlap check (prevents double slots)
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
 * Only delete if it's NOT booked
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
 * GET /api/doctor/appointments
 * query: ?status=CONFIRMED (optional)
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
      "CONFIRMED",
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW",
      "PENDING",
    ];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid status" });
    }

    // must belong to doctor
    const [rows] = await pool.query(
      `SELECT appointment_id FROM appointments WHERE appointment_id=? AND doctor_id=? LIMIT 1`,
      [appointment_id, doctor_id]
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ ok: false, error: "Appointment not found" });

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
