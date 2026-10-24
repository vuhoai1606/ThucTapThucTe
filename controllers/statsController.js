const db = require('../config/database');

const StatsController = {
  // GET /api/stats
  async getDashboardStats(req, res, next) {
    try {
      const [empRes, deptRes, projRes, leaveRes] = await Promise.all([
        db.query(`SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = 'Active')::int as active FROM employees`),
        db.query(`SELECT COUNT(*)::int as total FROM departments`),
        db.query(`SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = 'In Progress')::int as active FROM projects`),
        db.query(`SELECT COUNT(*) FILTER (WHERE status LIKE 'Pending%')::int as pending FROM leave_requests`)
      ]);

      res.json({
        success: true,
        data: {
          employees: empRes.rows[0],
          departments: deptRes.rows[0],
          projects: projRes.rows[0],
          leaves: leaveRes.rows[0]
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = StatsController;
