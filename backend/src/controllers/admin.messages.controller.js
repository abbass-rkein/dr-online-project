import { pool } from "../db.js";

export async function listMessages(req, res, next) {
  try {
    const statusRaw = String(req.query.status || "NEW").toUpperCase();
    const status = ["NEW", "READ", "ARCHIVED"].includes(statusRaw) ? statusRaw : "NEW";

    const q = String(req.query.q || "").trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(5, Number(req.query.limit || 10)));
    const offset = (page - 1) * limit;

    const where = ["cm.status = ?"];
    const params = [status];

    if (q) {
      where.push(
        "(cm.full_name LIKE ? OR cm.email LIKE ? OR cm.subject LIKE ? OR cm.message LIKE ?)"
      );
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) as total FROM contact_messages cm ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `
      SELECT
        cm.message_id,
        cm.user_id,
        cm.full_name,
        cm.email,
        cm.subject,
        cm.message,
        cm.status,
        cm.created_at
      FROM contact_messages cm
      ${whereSql}
      ORDER BY cm.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      ok: true,
      status,
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

export async function updateMessageStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status || "").toUpperCase();

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid message id" });
    }
    if (!["NEW", "READ", "ARCHIVED"].includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid status" });
    }

    const [r] = await pool.query(
      `UPDATE contact_messages SET status=? WHERE message_id=? LIMIT 1`,
      [status, id]
    );

    if (r.affectedRows !== 1) {
      return res.status(404).json({ ok: false, error: "Message not found" });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
