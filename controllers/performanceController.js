const db = require('../config/database');

const PerformanceController = {
  // GET /api/performance
  async getAll(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : 'Employee';
      const userEmpId = req.user ? req.user.employeeId : null;
      const { period } = req.query;
      let targetEmpId = req.query.employee_id;

      // Regular employees can only see their own reviews
      if (userRole === 'Employee') {
        targetEmpId = userEmpId;
      }

      let query = `
        SELECT pr.*, COALESCE(e.full_name, pr.employee_name, 'Nhân viên') as employee_name, e.department, e.position 
        FROM performance_reviews pr 
        LEFT JOIN employees e ON pr.employee_id = e.id 
        WHERE 1=1
      `;
      const params = [];
      let count = 1;

      if (targetEmpId) {
        query += ` AND pr.employee_id = $${count}`;
        params.push(targetEmpId);
        count++;
      }

      if (period) {
        query += ` AND pr.review_period = $${count}`;
        params.push(period);
        count++;
      }

      query += ` ORDER BY pr.review_date DESC`;
      const result = await db.query(query, params);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/performance
  async create(req, res, next) {
    try {
      const {
        employee_id, review_period, communication_score, technical_score,
        teamwork_score, leadership_score, comments
      } = req.body;

      if (!employee_id || !review_period) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn nhân viên và kỳ đánh giá!' });
      }

      const reviewerName = req.user ? req.user.fullName : 'PM Lead';
      const cScore = Math.max(1, Math.min(10, parseInt(communication_score, 10) || 8));
      const tScore = Math.max(1, Math.min(10, parseInt(technical_score, 10) || 8));
      const wScore = Math.max(1, Math.min(10, parseInt(teamwork_score, 10) || 8));
      const lScore = Math.max(1, Math.min(10, parseInt(leadership_score, 10) || 8));

      const overall = Math.round(((cScore + tScore + wScore + lScore) / 40) * 100);
      let rating = 'B';
      if (overall >= 95) rating = 'A+';
      else if (overall >= 85) rating = 'A';
      else if (overall >= 70) rating = 'B';
      else if (overall >= 50) rating = 'C';
      else rating = 'D';

      // Get employee name
      const empRes = await db.query(`SELECT full_name FROM employees WHERE id = $1`, [employee_id]);
      const empName = empRes.rows.length > 0 ? empRes.rows[0].full_name : 'Nhân viên';

      const query = `
        INSERT INTO performance_reviews (
          employee_id, employee_name, reviewer_name, review_period,
          communication_score, technical_score, teamwork_score, leadership_score,
          kpi_score, rating, comments
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;

      const result = await db.query(query, [
        employee_id, empName, reviewerName, review_period,
        cScore, tScore, wScore, lScore, overall, rating, comments || ''
      ]);

      res.status(201).json({ success: true, message: 'Đã lưu kết quả Đánh giá KPI nhân viên!', data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = PerformanceController;
