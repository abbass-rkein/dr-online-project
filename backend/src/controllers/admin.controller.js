import { pool } from "../db.js";

export async function summary(_req, res, next) {
  try {
    const [[u]] = await pool.query(`SELECT COUNT(*) as c FROM users`);
    const [[d]] = await pool.query(`SELECT COUNT(*) as c FROM users WHERE role='DOCTOR'`);
    const [[a]] = await pool.query(`SELECT COUNT(*) as c FROM appointments`);
    const [[m]] = await pool.query(`SELECT COUNT(*) as c FROM contact_messages WHERE status='NEW'`);

    res.json({
      ok: true,
      data: {
        users: Number(u.c),
        doctors: Number(d.c),
        appointments: Number(a.c),
        newMessages: Number(m.c),
      },
    });
  } catch (e) {
    next(e);
  }
}
