import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

class User {
  static async create({ name, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, name, email, role, approval_status, created_at`,
      [userId, name.trim(), email.trim().toLowerCase(), hashedPassword],
    );

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, role, approval_status, created_at
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()],
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, name, email, role, approval_status, created_at
       FROM users
       WHERE id = $1`,
      [id],
    );

    return result.rows[0];
  }

  static async updateRole(id, role) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtext('users-superadmin-role-change'))",
      );

      const currentResult = await client.query(
        `SELECT id, role, approval_status
         FROM users
         WHERE id = $1
         FOR UPDATE`,
        [id],
      );
      const current = currentResult.rows[0];
      if (!current) {
        await client.query("COMMIT");
        return null;
      }
      if (role !== "user" && current.approval_status !== "approved") {
        const error = new Error("Approve the user before assigning an administrative role.");
        error.code = "USER_NOT_APPROVED";
        throw error;
      }
      if (current.role === "superadmin" && role !== "superadmin") {
        const result = await client.query(
          "SELECT COUNT(*)::int AS count FROM users WHERE role = 'superadmin'",
        );
        if (result.rows[0].count <= 1) {
          const error = new Error("At least one superadmin account must remain.");
          error.code = "LAST_SUPERADMIN";
          throw error;
        }
      }

      const result = await client.query(
        `UPDATE users
         SET role = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING id, name, email, role, approval_status, created_at, updated_at`,
        [id, role],
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
      `SELECT id, name, email, role, approval_status, created_at
       FROM users
       ORDER BY created_at DESC`,
    );

    return result.rows;
  }

  static async updateApprovalStatus(id, approvalStatus) {
    const result = await pool.query(
      `UPDATE users
       SET approval_status = $2, updated_at = NOW()
       WHERE id = $1 AND role = 'user'
       RETURNING id, name, email, role, approval_status, created_at, updated_at`,
      [id, approvalStatus],
    );

    return result.rows[0];
  }
}

export default User;
