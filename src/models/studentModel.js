import { pool } from "../config/db.js";

class StudentModel {
  static async emailExists(email) {
    const result = await pool.query(
      "SELECT 1 FROM students WHERE LOWER(BTRIM(email)) = $1 LIMIT 1",
      [email],
    );
    return result.rowCount > 0;
  }

  static async create({ name, email, phone, course, receipt }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const year = new Date().getFullYear() % 100;
      const counterResult = await client.query(
        `INSERT INTO directory_id_counters (kind, year, last_value)
         VALUES ('S', $1, 1)
         ON CONFLICT (kind, year)
         DO UPDATE SET last_value = directory_id_counters.last_value + 1
         RETURNING last_value`,
        [year],
      );
      const studentNumber = `S${String(year).padStart(2, "0")}/${String(
        counterResult.rows[0].last_value,
      ).padStart(3, "0")}`;
      const studentResult = await client.query(
        `INSERT INTO students (name, email, phone, course, student_number)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, student_number, name, email, phone, course, status, created_at, updated_at`,
        [name, email, phone, course, studentNumber],
      );
      const student = studentResult.rows[0];
      let createdReceipt = null;

      if (receipt) {
        const receiptResult = await client.query(
          `INSERT INTO receipts (student_id, student_name, course, amount, purpose, payment_date)
           VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE))
           RETURNING id, student_id, student_name, course, amount, purpose, payment_date, created_at`,
          [
            student.id,
            student.name,
            student.course,
            receipt.amount,
            receipt.purpose,
            receipt.paymentDate,
          ],
        );
        createdReceipt = receiptResult.rows[0];
      }

      await client.query("COMMIT");
      return { ...student, ...(createdReceipt ? { receipt: createdReceipt } : {}) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll() {
    const result = await pool.query(
      `SELECT students.id, students.student_number, students.name, students.email, students.phone,
              students.course, students.status, students.created_at, students.updated_at,
              COUNT(receipts.id)::integer AS receipt_count,
              COALESCE(SUM(receipts.amount), 0) AS total_paid
       FROM students
       LEFT JOIN receipts ON receipts.student_id = students.id
       GROUP BY students.id
       ORDER BY students.created_at DESC, students.id DESC`,
    );
    return result.rows;
  }

  static async findById(id) {
    const studentResult = await pool.query(
      `SELECT id, student_number, name, email, phone, course, status, created_at, updated_at
       FROM students
       WHERE id = $1`,
      [id],
    );
    if (!studentResult.rows[0]) return null;

    const receiptsResult = await pool.query(
      `SELECT id, student_id, student_name, course, amount, purpose, payment_date, created_at
       FROM receipts
       WHERE student_id = $1
       ORDER BY payment_date DESC, id DESC`,
      [id],
    );
    return { ...studentResult.rows[0], receipts: receiptsResult.rows };
  }

  static async update(id, { name, email, phone, course, status }) {
    const result = await pool.query(
      `UPDATE students
       SET name = $2, email = $3, phone = $4, course = $5, status = $6, updated_at = NOW()
       WHERE id = $1
       RETURNING id, student_number, name, email, phone, course, status, created_at, updated_at`,
      [id, name, email, phone, course, status],
    );
    return result.rows[0] ?? null;
  }

  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const studentResult = await client.query(
        "SELECT id FROM students WHERE id = $1 FOR UPDATE",
        [id],
      );
      if (!studentResult.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }

      await client.query("DELETE FROM receipts WHERE student_id = $1", [id]);
      const deletedResult = await client.query(
        "DELETE FROM students WHERE id = $1 RETURNING id",
        [id],
      );
      await client.query("COMMIT");
      return deletedResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export default StudentModel;
