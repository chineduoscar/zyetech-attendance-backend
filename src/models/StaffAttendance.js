import { pool } from "../config/db.js";

class StaffAttendance {
  static async create({ name, course }) {
    const result = await pool.query(
      `INSERT INTO staff_attendance (name, course)
       VALUES ($1, $2)
       RETURNING id, name, course, created_at`,
      [name, course],
    );

    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(
      `SELECT id, name, course, created_at
       FROM staff_attendance
       ORDER BY created_at DESC, id DESC`,
    );

    return result.rows;
  }

  static async update(id, { name, course }) {
    const result = await pool.query(
      `UPDATE staff_attendance
       SET name = $2, course = $3
       WHERE id = $1
       RETURNING id, name, course, created_at`,
      [id, name, course],
    );

    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      `DELETE FROM staff_attendance
       WHERE id = $1
       RETURNING id, name, created_at`,
      [id],
    );

    return result.rows[0];
  }
}

export default StaffAttendance;
