import { pool } from "../config/db.js";

const withReceiptNumber = (receipt) => ({
  ...receipt,
  receipt_number:
    receipt.receipt_number || `ZYT-${String(receipt.id).padStart(6, "0")}`,
});

class Receipt {
  static async create({
    studentId,
    studentName,
    course,
    amount,
    purpose,
    paymentDate,
    receiptNumber,
    paymentMethod,
    details,
    imageUrl,
    imagePublicId,
  }) {
    let linkedStudentId = studentId ?? null;
    let linkedStudentName = studentName;
    let linkedCourse = course;
    if (linkedStudentId !== null) {
      const studentResult = await pool.query(
        "SELECT id, name, course FROM students WHERE id = $1",
        [linkedStudentId],
      );
      if (!studentResult.rows[0]) return null;
      linkedStudentName ??= studentResult.rows[0].name;
      linkedCourse ??= studentResult.rows[0].course;
    } else {
      const studentResult = await pool.query(
        `SELECT id
         FROM students
         WHERE LOWER(BTRIM(name)) = LOWER(BTRIM($1))
         ORDER BY id DESC
         LIMIT 1`,
        [studentName],
      );
      linkedStudentId = studentResult.rows[0]?.id ?? null;
    }

    const result = await pool.query(
      `INSERT INTO receipts (
         student_id, student_name, course, amount, purpose, payment_date,
         receipt_number, payment_method, details, image_url, image_public_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, student_id, student_name, course, amount, purpose,
                 payment_date, created_at, receipt_number, payment_method,
                 details, image_url`,
      [
        linkedStudentId,
        linkedStudentName,
        linkedCourse,
        amount,
        purpose,
        paymentDate,
        receiptNumber,
        paymentMethod,
        details,
        imageUrl,
        imagePublicId,
      ],
    );
    return result.rows[0] ? withReceiptNumber(result.rows[0]) : null;
  }

  static async findAll() {
    const result = await pool.query(
      `SELECT receipts.id, receipts.student_id, students.student_number,
              receipts.student_name, receipts.course, receipts.amount,
              receipts.purpose, receipts.payment_date, receipts.created_at,
              receipts.receipt_number, receipts.payment_method, receipts.details,
              receipts.image_url
       FROM receipts
       LEFT JOIN students ON students.id = receipts.student_id
       ORDER BY receipts.created_at DESC, receipts.id DESC`,
    );
    return result.rows.map(withReceiptNumber);
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, receipt_number, image_url, image_public_id
       FROM receipts
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? withReceiptNumber(result.rows[0]) : null;
  }

  static async delete(id) {
    const result = await pool.query(
      `DELETE FROM receipts
       WHERE id = $1
       RETURNING id, receipt_number`,
      [id],
    );
    return result.rows[0] ? withReceiptNumber(result.rows[0]) : null;
  }
}

export default Receipt;
