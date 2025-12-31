import { pool } from "../db.js";

export async function listMyAppointments(req, res, next) {
  try {
    const patient_id = req.user?.user_id;
    const role = req.user?.role;

    if (!patient_id)
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    if (role !== "PATIENT")
      return res
        .status(403)
        .json({ ok: false, error: "Only patients can view" });

    // upcoming first, then past
    const [rows] = await pool.query(
      `
      SELECT
        a.appointment_id,
        a.doctor_id,
        a.slot_id,
        a.appointment_at,
        a.mode,
        a.status,
        a.patient_notes,
        a.created_at,

        u.full_name AS doctor_name,
        dp.title AS doctor_title,
        u.country AS doctor_country,

        av.start_at,
        av.end_at
      FROM appointments a
      JOIN users u ON u.user_id = a.doctor_id
      JOIN doctor_profiles dp ON dp.doctor_id = a.doctor_id
      LEFT JOIN doctor_availability av ON av.slot_id = a.slot_id
      WHERE a.patient_id = ?
      ORDER BY
        (a.appointment_at >= UTC_TIMESTAMP()) DESC,
        a.appointment_at ASC
      `,
      [patient_id]
    );

    res.json({ ok: true, data: rows || [] });
  } catch (e) {
    next(e);
  }
}

export async function createAppointment(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const patient_id = req.user?.user_id;
    const role = req.user?.role;

    if (!patient_id)
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    if (role !== "PATIENT")
      return res
        .status(403)
        .json({ ok: false, error: "Only patients can book" });

    const doctor_id = Number(req.body?.doctor_id);
    const slot_id = Number(req.body?.slot_id);
    const mode = String(req.body?.mode || "ONLINE");
    const patient_notes = String(req.body?.patient_notes || "").trim();

    if (!Number.isFinite(doctor_id) || doctor_id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid doctor_id" });
    }
    if (!Number.isFinite(slot_id) || slot_id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid slot_id" });
    }
    if (!["ONLINE", "IN_PERSON"].includes(mode)) {
      return res.status(400).json({ ok: false, error: "Invalid mode" });
    }

    await conn.beginTransaction();

    // Lock slot row to prevent double booking
    const [slotRows] = await conn.query(
      `
      SELECT slot_id, doctor_id, start_at, end_at, is_booked
      FROM doctor_availability
      WHERE slot_id = ?
      FOR UPDATE
      `,
      [slot_id]
    );

    if (!slotRows.length) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "Slot not found" });
    }

    const slot = slotRows[0];
    if (Number(slot.doctor_id) !== doctor_id) {
      await conn.rollback();
      return res
        .status(400)
        .json({ ok: false, error: "Slot does not belong to this doctor" });
    }
    if (slot.is_booked) {
      await conn.rollback();
      return res.status(409).json({ ok: false, error: "Slot already booked" });
    }

    // Create appointment
    const [ins] = await conn.query(
      `
      INSERT INTO appointments
        (patient_id, doctor_id, slot_id, appointment_at, mode, status, patient_notes)
      VALUES
        (?, ?, ?, ?, ?, 'CONFIRMED', ?)
      `,
      [
        patient_id,
        doctor_id,
        slot_id,
        slot.start_at,
        mode,
        patient_notes || null,
      ]
    );

    // Mark slot booked
    await conn.query(
      `UPDATE doctor_availability SET is_booked=1 WHERE slot_id=? LIMIT 1`,
      [slot_id]
    );

    await conn.commit();

    res.json({
      ok: true,
      appointment_id: ins.insertId,
      appointment_at: slot.start_at,
    });
  } catch (e) {
    try {
      await conn.rollback();
    } catch {}
    next(e);
  } finally {
    conn.release();
  }
}

export async function cancelMyAppointment(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const patient_id = req.user?.user_id;
    const role = req.user?.role;
    const appointment_id = Number(req.params.id);

    if (!patient_id)
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    if (role !== "PATIENT")
      return res
        .status(403)
        .json({ ok: false, error: "Only patients can cancel" });
    if (!Number.isFinite(appointment_id) || appointment_id <= 0)
      return res
        .status(400)
        .json({ ok: false, error: "Invalid appointment id" });

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `
      SELECT appointment_id, slot_id, status
      FROM appointments
      WHERE appointment_id = ? AND patient_id = ?
      FOR UPDATE
      `,
      [appointment_id, patient_id]
    );

    if (!rows.length) {
      await conn.rollback();
      return res
        .status(404)
        .json({ ok: false, error: "Appointment not found" });
    }

    const appt = rows[0];
    if (appt.status !== "CONFIRMED") {
      await conn.rollback();
      return res
        .status(400)
        .json({
          ok: false,
          error: "Only confirmed appointments can be cancelled",
        });
    }

    await conn.query(
      `UPDATE appointments SET status='CANCELLED' WHERE appointment_id=? LIMIT 1`,
      [appointment_id]
    );

    // free the slot again
    if (appt.slot_id) {
      await conn.query(
        `UPDATE doctor_availability SET is_booked=0 WHERE slot_id=? LIMIT 1`,
        [appt.slot_id]
      );
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try {
      await conn.rollback();
    } catch {}
    next(e);
  } finally {
    conn.release();
  }
}
