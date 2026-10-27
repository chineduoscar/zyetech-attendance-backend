import { pool } from "../config/db.js";

class StaffAttendance {
  static async create({ staffNumber }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const staffResult = await client.query(
        `SELECT id, staff_number, name, email, phone, roles
         FROM staff
         WHERE UPPER(BTRIM(staff_number)) = UPPER(BTRIM($1))
           AND status = 'active'
         FOR SHARE`,
        [staffNumber],
      );
      const staff = staffResult.rows[0];
      if (!staff) {
        await client.query("ROLLBACK");
        return null;
      }

      const attendanceResult = await client.query(
        `INSERT INTO staff_attendance (name, staff_number)
         VALUES ($1, $2)
         RETURNING id, name, course, staff_number, created_at`,
        [staff.name, staff.staff_number],
      );
      await client.query("COMMIT");
      return {
        ...attendanceResult.rows[0],
        email: staff.email,
        phone: staff.phone,
        roles: staff.roles,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll() {
    const result = await pool.query(
      `SELECT id, staff_number, name, course, created_at
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
       RETURNING id, staff_number, name, course, created_at`,
      [id, name, course],
    );

    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      `DELETE FROM staff_attendance
       WHERE id = $1
       RETURNING id, staff_number, name, created_at`,
      [id],
    );

    return result.rows[0];
  }
}

export default StaffAttendance;
