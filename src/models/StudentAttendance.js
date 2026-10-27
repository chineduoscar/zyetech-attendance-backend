import { pool } from "../config/db.js";

class StudentAttendance {
  static async create({ name, course, session = null }) {
    const result = await pool.query(
      `INSERT INTO student_attendance (name, course, "session")
       VALUES ($1, $2, $3)
       RETURNING id, name, course, "session", created_at`,
      [name, course, session],
    );

    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query(
      `SELECT id, name, course, "session", created_at
       FROM student_attendance
       ORDER BY created_at DESC, id DESC`,
    );

    return result.rows;
  }

  static async update(id, { name, course, session = null }) {
    const result = await pool.query(
      `UPDATE student_attendance
       SET name = $2, course = $3, "session" = $4
       WHERE id = $1
       RETURNING id, name, course, "session", created_at`,
      [id, name, course, session],
    );

    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      `DELETE FROM student_attendance
       WHERE id = $1
       RETURNING id, name, course, "session", created_at`,
      [id],
    );

    return result.rows[0];
  }
}

export default StudentAttendance;
