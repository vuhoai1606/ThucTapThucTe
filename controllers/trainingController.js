const db = require('../config/database');

const TrainingController = {
  // GET /api/training/courses
  async getCourses(req, res, next) {
    try {
      const result = await db.query(`SELECT * FROM courses ORDER BY id ASC`);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/training/courses
  async createCourse(req, res, next) {
    try {
      const { title, trainer, duration, certificate_name, description } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Tên khóa học là bắt buộc!' });
      }
      const result = await db.query(
        `INSERT INTO courses (title, trainer, duration, certificate_name, description) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title.trim(), trainer || '', duration || '', certificate_name || '', description || '']
      );
      res.status(201).json({ success: true, message: 'Tạo khóa học thành công!', data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/training/results
  async getResults(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : 'Employee';
      const userEmpId = req.user ? req.user.employeeId : null;
      let targetEmpId = req.query.employee_id;

      if (userRole === 'Employee') {
        targetEmpId = userEmpId;
      }

      let query = `
        SELECT tr.*, c.title as course_title, c.trainer, c.certificate_name, e.full_name as employee_name, e.department
        FROM training_results tr
        JOIN courses c ON tr.course_id = c.id
        LEFT JOIN employees e ON tr.employee_id = e.id
        WHERE 1=1
      `;
      const params = [];
      if (targetEmpId) {
        query += ` AND tr.employee_id = $1`;
        params.push(targetEmpId);
      }
      query += ` ORDER BY tr.id DESC`;
      const result = await db.query(query, params);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/training/enroll
  async enrollCourse(req, res, next) {
    try {
      const { course_id, employee_id } = req.body;
      const userRole = req.user ? req.user.role : 'Employee';
      const userEmpId = req.user ? req.user.employeeId : null;

      let empId = userEmpId;
      if ((userRole === 'Admin' || userRole === 'HR') && employee_id) {
        empId = employee_id;
      }

      if (!course_id) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn khóa học!' });
      }

      if (!empId) {
        return res.status(400).json({ success: false, message: 'Không xác định được mã nhân viên đăng ký!' });
      }

      const courseCheck = await db.query(`SELECT * FROM courses WHERE id = $1`, [course_id]);
      if (courseCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Khóa học không tồn tại!' });
      }

      const enrollCheck = await db.query(
        `SELECT * FROM training_results WHERE course_id = $1 AND employee_id = $2`,
        [course_id, empId]
      );
      if (enrollCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Nhân viên đã đăng ký khóa học này rồi!' });
      }

      const result = await db.query(
        `INSERT INTO training_results (course_id, employee_id, status, score) VALUES ($1, $2, 'In Progress', 0) RETURNING *`,
        [course_id, empId]
      );
      res.status(201).json({ success: true, message: 'Đăng ký khóa học thành công!', data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = TrainingController;
