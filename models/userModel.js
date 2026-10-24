const db = require('../config/database');
const bcrypt = require('bcryptjs');

const UserModel = {
  formatRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      employeeId: row.employee_id || row.id,
      username: row.username,
      email: row.email,
      fullName: row.full_name,
      role: row.role || 'Employee',
      department: row.department,
      position: row.position,
      level: row.level,
      salary: Math.max(0, parseFloat(row.salary) || 0),
      avatar: row.avatar,
      phone: row.phone,
      gender: row.gender || 'Nam',
      birthday: row.birthday ? (row.birthday.toISOString ? row.birthday.toISOString().split('T')[0] : String(row.birthday).split('T')[0]) : null,
      address: row.address || '',
      citizenId: row.citizen_id || '',
      joinDate: row.join_date ? (row.join_date.toISOString ? row.join_date.toISOString().split('T')[0] : String(row.join_date).split('T')[0]) : null,
      isActive: row.is_active,
      createdAt: row.created_at
    };
  },

  async findByUsername(username) {
    const res = await db.query(`SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`, [username]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...this.formatRow(row),
      passwordHash: row.password_hash
    };
  },

  async findById(id, includePassword = false) {
    if (!id) return null;
    const isNumeric = !isNaN(parseInt(id, 10)) && /^\d+$/.test(String(id).trim());
    let res;
    if (isNumeric) {
      res = await db.query(`SELECT * FROM users WHERE id = $1`, [parseInt(id, 10)]);
    } else {
      res = await db.query(`SELECT * FROM users WHERE employee_id = $1 OR LOWER(username) = LOWER($1)`, [String(id)]);
    }
    if (res.rows.length === 0) return null;
    const user = this.formatRow(res.rows[0]);
    if (includePassword) {
      user.passwordHash = res.rows[0].password_hash;
    }
    return user;
  },

  async verifyPassword(plainPassword, passwordHash) {
    return await bcrypt.compare(plainPassword, passwordHash);
  },

  async changePassword(userId, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    const parsedId = parseInt(userId, 10);
    const res = await db.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`, 
      [hash, parsedId]
    );
    // Invalidate old refresh tokens for security
    await db.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [parsedId]);
    return res.rows.length > 0;
  },

  async saveRefreshToken(userId, token, expiresAt) {
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
  },

  async verifyRefreshToken(token) {
    const res = await db.query(
      `SELECT r.*, u.username, u.full_name, u.email, u.role, u.employee_id 
       FROM refresh_tokens r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.token = $1 AND r.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );
    return res.rows.length > 0 ? res.rows[0] : null;
  },

  async deleteRefreshToken(token) {
    await db.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
  },

  async updateProfile(userId, { fullName, phone, gender, birthday, address }) {
    const parsedId = parseInt(userId, 10);
    const res = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           gender = COALESCE($3, gender),
           birthday = COALESCE($4, birthday),
           address = COALESCE($5, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        fullName || null,
        phone || null,
        gender || null,
        birthday || null,
        address || null,
        parsedId
      ]
    );
    if (res.rows.length === 0) return null;
    return this.formatRow(res.rows[0]);
  },

  async findAll() {
    const res = await db.query(`SELECT * FROM users ORDER BY id ASC`);
    return res.rows.map(this.formatRow);
  }
};

module.exports = UserModel;
