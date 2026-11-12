import { pool } from "../config/db.js";

class StudentAttendance {
  static async create({ studentNumber, email, session = null }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const studentResult = await client.query(
        `SELECT id, student_number, name, email, course
         FROM students
         WHERE UPPER(BTRIM(student_number)) = UPPER(BTRIM($1))
           AND LOWER(BTRIM(email)) = LOWER(BTRIM($2))
           AND status = 'active'
         FOR SHARE`,
        [studentNumber, email],
      );
      const student = studentResult.rows[0];
      if (!student) {
        await client.query("ROLLBACK");
        return null;
      }

      const claimResult = await client.query(
        `INSERT INTO attendance_daily_claims (kind, identifier, attendance_date)
         VALUES ('S', UPPER(BTRIM($1)), CURRENT_DATE)
         ON CONFLICT DO NOTHING
         RETURNING identifier`,
        [student.student_number],
      );
      if (claimResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return { alreadyMarked: true };
      }

      const attendanceResult = await client.query(
        `INSERT INTO student_attendance (name, course, "session", student_number, attendance_date)
         VALUES ($1, $2, $3, $4, CURRENT_DATE)
         RETURNING id, name, course, "session", student_number, attendance_date, time_in, time_out, created_at`,
        [student.name, student.course, session, student.student_number],
      );
      await client.query("COMMIT");
      return { ...attendanceResult.rows[0], email: student.email };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll() {
    const result = await pool.query(
      `SELECT id, student_number, name, course, "session", attendance_date, time_in, time_out, created_at
       FROM student_attendance
       ORDER BY created_at DESC, id DESC`,
    );

    return result.rows;
  }

  static async signOut({ studentNumber, email }) {
    const result = await pool.query(
      `UPDATE student_attendance
       SET time_out = NOW()
       WHERE id = (
         SELECT attendance.id
         FROM student_attendance attendance
         JOIN students
           ON UPPER(BTRIM(students.student_number)) = UPPER(BTRIM(attendance.student_number))
         WHERE UPPER(BTRIM(attendance.student_number)) = UPPER(BTRIM($1))
           AND LOWER(BTRIM(students.email)) = LOWER(BTRIM($2))
           AND students.status = 'active'
           AND attendance.attendance_date = CURRENT_DATE
           AND attendance.time_out IS NULL
         ORDER BY attendance.time_in DESC, attendance.id DESC
         LIMIT 1
       )
         AND time_out IS NULL
       RETURNING id, name, course, "session", student_number, attendance_date, time_in, time_out, created_at`,
      [studentNumber, email],
    );

    if (result.rowCount > 0) {
      return { attendance: result.rows[0], alreadySignedOut: false };
    }

    const existing = await pool.query(
      `SELECT attendance.id, attendance.name, attendance.course, attendance."session",
              attendance.student_number, attendance.attendance_date,
              attendance.time_in, attendance.time_out, attendance.created_at
       FROM student_attendance attendance
       JOIN students
         ON UPPER(BTRIM(students.student_number)) = UPPER(BTRIM(attendance.student_number))
       WHERE UPPER(BTRIM(attendance.student_number)) = UPPER(BTRIM($1))
         AND LOWER(BTRIM(students.email)) = LOWER(BTRIM($2))
         AND students.status = 'active'
         AND attendance.attendance_date = CURRENT_DATE
       ORDER BY attendance.time_in DESC, attendance.id DESC
       LIMIT 1`,
      [studentNumber, email],
    );

    if (existing.rowCount === 0) return null;
    return { attendance: existing.rows[0], alreadySignedOut: true };
  }

  static async update(id, { name, course, session = null }) {
    const result = await pool.query(
      `UPDATE student_attendance
       SET name = $2, course = $3, "session" = $4
       WHERE id = $1
       RETURNING id, student_number, name, course, "session", attendance_date, time_in, time_out, created_at`,
      [id, name, course, session],
    );

    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      `DELETE FROM student_attendance
       WHERE id = $1
       RETURNING id, student_number, name, course, "session", attendance_date, created_at`,
      [id],
    );

    return result.rows[0];
  }
}

export default StudentAttendance;
