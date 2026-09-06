import { getDatabasePool } from '../../config/database.js';

const userColumns = `user_id AS "userId", full_name AS "fullName", email, role,
  matric_number AS "matricNumber", staff_number AS "staffNumber",
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export const authRepository = {
  async createUser(user) {
    const result = await getDatabasePool().query(
      `INSERT INTO users (full_name, email, password_hash, role, matric_number, staff_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${userColumns}`,
      [user.fullName, user.email, user.passwordHash, user.role, user.matricNumber ?? null, user.staffNumber ?? null],
    );
    return result.rows[0];
  },
  async findUserByEmail(email) {
    const result = await getDatabasePool().query(
      `SELECT ${userColumns}, password_hash AS "passwordHash" FROM users WHERE email = $1`, [email],
    );
    return result.rows[0] ?? null;
  },
  async findUserById(userId) {
    const result = await getDatabasePool().query(`SELECT ${userColumns} FROM users WHERE user_id = $1`, [userId]);
    return result.rows[0] ?? null;
  },
};
