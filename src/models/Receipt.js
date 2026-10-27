import { pool } from "../config/db.js";

const withReceiptNumber = (receipt) => ({
  ...receipt,
  receipt_number: `ZYT-${String(receipt.id).padStart(6, "0")}`,
});

class Receipt {
  static async create({ studentId, amount, purpose, paymentDate }) {
    const result = await pool.query(
      `INSERT INTO receipts (student_id, student_name, course, amount, purpose, payment_date)
       SELECT id, name, course, $2, $3, $4
       FROM students
       WHERE id = $1
       RETURNING id, student_id, student_name, course, amount, purpose, payment_date, created_at`,
      [studentId, amount, purpose, paymentDate],
    );
    return result.rows[0] ? withReceiptNumber(result.rows[0]) : null;
  }

  static async findAll() {
    const result = await pool.query(
      `SELECT id, student_id, student_name, course, amount, purpose, payment_date, created_at
       FROM receipts
       ORDER BY created_at DESC, id DESC`,
    );
    return result.rows.map(withReceiptNumber);
  }
}

export default Receipt;
