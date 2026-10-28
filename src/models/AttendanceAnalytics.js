import { pool } from "../config/db.js";

class AttendanceAnalytics {
  static async getSummary() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM staff) AS total_staff,
        (
          SELECT COUNT(*)
          FROM student_attendance
          WHERE attendance_date = CURRENT_DATE
        ) AS student_attendance_today,
        (
          SELECT COUNT(*)
          FROM staff_attendance
          WHERE attendance_date = CURRENT_DATE
        ) AS staff_attendance_today,
        (
          SELECT COUNT(*)
          FROM receipts
          WHERE created_at >= date_trunc('day', NOW())
            AND created_at < date_trunc('day', NOW()) + INTERVAL '1 day'
        ) AS receipts_today,
        (
          SELECT COUNT(*)
          FROM receipts
          WHERE payment_date >= date_trunc('month', CURRENT_DATE)::date
            AND payment_date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date
        ) AS receipts_this_month
    `);

    const summary = result.rows[0];
    const studentAttendanceToday = Number(summary.student_attendance_today);
    const staffAttendanceToday = Number(summary.staff_attendance_today);

    return {
      total_students: Number(summary.total_students),
      total_staff: Number(summary.total_staff),
      today: {
        student_attendance: studentAttendanceToday,
        staff_attendance: staffAttendanceToday,
        total_attendance: studentAttendanceToday + staffAttendanceToday,
      },
      receipts_today: Number(summary.receipts_today),
      receipts_this_month: Number(summary.receipts_this_month),
    };
  }
}

export default AttendanceAnalytics;