import { pool } from "../config/db.js";

class StaffModel {
  static async emailExists(email) {
    const result = await pool.query(
      "SELECT 1 FROM staff WHERE LOWER(BTRIM(email)) = $1 LIMIT 1",
      [email],
    );
    return result.rowCount > 0;
  }

  static async create({ name, email, phone, roles }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const year = new Date().getFullYear() % 100;
      const counterResult = await client.query(
        `INSERT INTO directory_id_counters (kind, year, last_value)
         VALUES ('E', $1, 1)
         ON CONFLICT (kind, year)
         DO UPDATE SET last_value = directory_id_counters.last_value + 1
         RETURNING last_value`,
        [year],
      );
      const staffNumber = `E${String(year).padStart(2, "0")}/${String(
        counterResult.rows[0].last_value,
      ).padStart(3, "0")}`;
      const result = await client.query(
        `INSERT INTO staff (name, email, phone, roles, staff_number)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, staff_number, name, email, phone, roles, status, created_at, updated_at`,
        [name, email, phone, roles, staffNumber],
      );
      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll() {
    const result = await pool.query(
      `SELECT id, staff_number, name, email, phone, roles, status, created_at, updated_at
       FROM staff
       ORDER BY created_at DESC, id DESC`,
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, staff_number, name, email, phone, roles, status, created_at, updated_at
       FROM staff
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  static async update(id, { name, email, phone, roles, status }) {
    const result = await pool.query(
      `UPDATE staff
       SET name = $2, email = $3, phone = $4, roles = $5, status = $6, updated_at = NOW()
       WHERE id = $1
       RETURNING id, staff_number, name, email, phone, roles, status, created_at, updated_at`,
      [id, name, email, phone, roles, status],
    );
    return result.rows[0] ?? null;
  }

  static async delete(id) {
    const result = await pool.query(
      "DELETE FROM staff WHERE id = $1 RETURNING id",
      [id],
    );
    return result.rows[0] ?? null;
  }
}

export default StaffModel;
