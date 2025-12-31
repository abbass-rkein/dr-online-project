import mysql from "mysql2/promise";
import { config } from "./config.js";

export const pool = mysql.createPool(config.db);

export async function pingDb() {
  const c = await pool.getConnection();
  try {
    await c.ping();
  } finally {
    c.release();
  }
}
