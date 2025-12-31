import { pool } from "../db.js";

export async function getPublicDoctor(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid doctor id" });
    }

    const [rows] = await pool.query(
      `
      SELECT
        u.user_id AS doctor_id,
        u.full_name,
        u.country,
        dp.title,
        dp.bio,
        dp.years_experience,
        dp.rating,
        dp.rating_count,
        dp.is_verified,
        dp.consultation_fee
      FROM users u
      JOIN doctor_profiles dp ON dp.doctor_id = u.user_id
      WHERE u.user_id = ?
        AND u.role='DOCTOR'
        AND u.is_active=1
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Doctor not found" });
    }

    const doctor = rows[0];

    const [specs] = await pool.query(
      `
      SELECT s.specialty_id, s.name
      FROM doctor_specialties ds
      JOIN specialties s ON s.specialty_id = ds.specialty_id
      WHERE ds.doctor_id=?
      ORDER BY s.name ASC
      `,
      [id]
    );

    const [langs] = await pool.query(
      `
      SELECT l.language_id, l.name
      FROM doctor_languages dl
      JOIN languages l ON l.language_id = dl.language_id
      WHERE dl.doctor_id=?
      ORDER BY l.name ASC
      `,
      [id]
    );

    res.json({
      ok: true,
      data: { ...doctor, specialties: specs, languages: langs },
    });
  } catch (e) {
    next(e);
  }
}

export async function listPublicDoctorSlots(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid doctor id" });
    }

    // upcoming only + not booked
    const [slots] = await pool.query(
      `
      SELECT slot_id, start_at, end_at
      FROM doctor_availability
      WHERE doctor_id = ?
        AND is_booked = 0
        AND start_at >= UTC_TIMESTAMP()
      ORDER BY start_at ASC
      LIMIT 200
      `,
      [id]
    );

    res.json({ ok: true, data: slots });
  } catch (e) {
    next(e);
  }
}
