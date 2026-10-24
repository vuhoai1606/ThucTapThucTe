const db = require('../config/database');

const SettingModel = {
  // Test PostgreSQL live connection & retrieve server version and stats
  async testDbConnection() {
    try {
      const startTime = Date.now();
      const res = await db.query('SELECT version(), current_database(), current_user');
      const latency = Date.now() - startTime;

      const tableRes = await db.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);

      return {
        status: 'CONNECTED',
        latencyMs: latency,
        database: res.rows[0].current_database,
        user: res.rows[0].current_user,
        version: res.rows[0].version,
        tables: tableRes.rows.map(r => r.table_name)
      };
    } catch (error) {
      return {
        status: 'ERROR',
        message: error.message,
        hint: 'Vui lòng kiểm tra file .env xem thông số DB_HOST, DB_USER, DB_PASSWORD, DB_PORT có chính xác không.'
      };
    }
  },

  // Record an action to audit_logs
  async logAction(userId, username, action, entity, details, ipAddress = '') {
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, username, action, entity, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId || null, username || 'Anonymous', action, entity, details, ipAddress]
      );
    } catch (e) {
      console.error('Audit log write error:', e.message);
    }
  },

  // Retrieve latest audit logs
  async getAuditLogs(limit = 50) {
    const res = await db.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
};

module.exports = SettingModel;
