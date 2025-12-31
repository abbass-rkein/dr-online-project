import { pool } from "../db.js";

export async function sendMessage(req, res, next) {
  try {
    const userId = req.user?.user_id || null;
    const { full_name, email, subject, message } = req.body;

    await pool.query(
      `
      INSERT INTO contact_messages (user_id, full_name, email, subject, message)
      VALUES (?, ?, ?, ?, ?)
      `,
      [userId, full_name, String(email).toLowerCase(), subject, message]
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
