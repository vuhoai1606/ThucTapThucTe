const db = require('../config/database');

const DepartmentController = {
  async getAll(req, res, next) {
    try {
      const result = await db.query(`
        SELECT d.*, 
               COUNT(DISTINCT e.id)::int as employee_count,
               COUNT(DISTINCT p.id)::int as project_count,
               COALESCE(SUM(e.salary), 0)::numeric as total_salary
        FROM departments d 
        LEFT JOIN employees e ON d.id = e.department 
        LEFT JOIN projects p ON d.id = p.department
        GROUP BY d.id 
        ORDER BY d.id ASC
      `);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  async getDetails(req, res, next) {
    try {
      const deptId = req.params.id;
      const deptRes = await db.query(`SELECT * FROM departments WHERE id = $1`, [deptId]);
      if (deptRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn vị FSU!' });
      }

      const employeesRes = await db.query(`
        SELECT id, user_id, full_name, email, phone, position, level, status, salary, avatar, role
        FROM employees 
        WHERE department = $1 
        ORDER BY full_name ASC
      `, [deptId]);

      const projectsRes = await db.query(`
        SELECT * FROM projects 
        WHERE department = $1 
        ORDER BY start_date DESC
      `, [deptId]);

      const dept = deptRes.rows[0];
      const emps = employeesRes.rows;
      const projs = projectsRes.rows;

      const totalSalary = emps.reduce((acc, e) => acc + (parseFloat(e.salary) || 0), 0);
      const activeEmps = emps.filter(e => e.status === 'Active').length;

      res.json({
        success: true,
        data: {
          department: dept,
          employees: emps,
          projects: projs,
          stats: {
            totalEmployees: emps.length,
            activeEmployees: activeEmps,
            totalSalary,
            totalProjects: projs.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const result = await db.query(`SELECT * FROM departments WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phòng ban!' });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { id, name, manager_name, description } = req.body;
      if (!id || !id.trim() || !name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Mã phòng ban và Tên phòng ban là bắt buộc!' });
      }
      const result = await db.query(
        `INSERT INTO departments (id, name, manager_name, description) VALUES ($1, $2, $3, $4) RETURNING *`,
        [id.trim().toUpperCase(), name.trim(), manager_name || '', description || '']
      );
      res.status(201).json({ success: true, data: result.rows[0], message: 'Tạo phòng ban thành công!' });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, message: 'Mã phòng ban này đã tồn tại!' });
      }
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, manager_name, description, status } = req.body;
      const result = await db.query(
        `UPDATE departments SET name = COALESCE($1, name), manager_name = COALESCE($2, manager_name), description = COALESCE($3, description), status = COALESCE($4, status) WHERE id = $5 RETURNING *`,
        [name, manager_name, description, status, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phòng ban để cập nhật!' });
      }
      res.json({ success: true, data: result.rows[0], message: 'Cập nhật phòng ban thành công!' });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await db.query(`DELETE FROM departments WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phòng ban để xóa!' });
      }
      res.json({ success: true, message: 'Xóa phòng ban thành công!' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = DepartmentController;
