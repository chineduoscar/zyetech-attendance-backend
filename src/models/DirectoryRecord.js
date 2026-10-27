import { pool } from "../config/db.js";

const TABLES = {
  students: { table: "students", hasCourse: true },
  staff: { table: "staff", hasCourse: false },
};

const getConfig = (kind) => {
  const config = TABLES[kind];
  if (!config) throw new Error("Unsupported directory type.");
  return config;
};

class DirectoryRecord {
  static async findAll(kind) {
    const { table, hasCourse } = getConfig(kind);
    const courseColumn = hasCourse ? ", course" : "";
    const result = await pool.query(
      `SELECT id, name, email, phone${courseColumn}, status, created_at, updated_at
       FROM ${table}
       ORDER BY name ASC, id ASC`,
    );
    return result.rows;
  }

  static async create(kind, { name, email, phone, course, status }) {
    const { table, hasCourse } = getConfig(kind);
    const columns = hasCourse
      ? "(name, email, phone, course, status)"
      : "(name, email, phone, status)";
    const values = hasCourse ? "($1, $2, $3, $4, $5)" : "($1, $2, $3, $4)";
    const params = hasCourse
      ? [name, email, phone, course, status]
      : [name, email, phone, status];
    const result = await pool.query(
      `INSERT INTO ${table} ${columns}
       VALUES ${values}
       RETURNING *`,
      params,
    );
    return result.rows[0];
  }

  static async update(kind, id, { name, email, phone, course, status }) {
    const { table, hasCourse } = getConfig(kind);
    const assignments = hasCourse
      ? "name = $2, email = $3, phone = $4, course = $5, status = $6"
      : "name = $2, email = $3, phone = $4, status = $5";
    const params = hasCourse
      ? [id, name, email, phone, course, status]
      : [id, name, email, phone, status];
    const result = await pool.query(
      `UPDATE ${table}
       SET ${assignments}, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      params,
    );
    return result.rows[0];
  }

  static async delete(kind, id) {
    const { table } = getConfig(kind);
    const result = await pool.query(
      `DELETE FROM ${table}
       WHERE id = $1
       RETURNING id`,
      [id],
    );
    return result.rows[0];
  }
}

export default DirectoryRecord;
