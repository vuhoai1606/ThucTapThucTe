const db = require('../config/database');

const ResourceController = {
  // GET /api/resources/allocations
  async getAllocations(req, res, next) {
    try {
      const query = `
        SELECT 
          pm.id,
          pm.project_id,
          p.name as project_name,
          p.client_name,
          pm.employee_id,
          e.full_name as employee_name,
          e.department,
          e.position,
          pm.role_in_project,
          pm.allocation_percentage,
          pm.start_date,
          pm.end_date
        FROM project_members pm
        JOIN projects p ON pm.project_id = p.id
        JOIN employees e ON pm.employee_id = e.id
        ORDER BY p.name ASC, e.full_name ASC
      `;
      const result = await db.query(query);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/resources/bench
  async getBenchResources(req, res, next) {
    try {
      const query = `
        SELECT 
          e.id as employee_id,
          e.full_name,
          e.department,
          e.position,
          e.level,
          COALESCE(SUM(CASE WHEN p.status = 'In Progress' THEN pm.allocation_percentage ELSE 0 END), 0)::int as total_allocated,
          (100 - COALESCE(SUM(CASE WHEN p.status = 'In Progress' THEN pm.allocation_percentage ELSE 0 END), 0))::int as free_capacity
        FROM employees e
        LEFT JOIN project_members pm ON e.id = pm.employee_id
        LEFT JOIN projects p ON pm.project_id = p.id
        WHERE e.status = 'Active'
        GROUP BY e.id, e.full_name, e.department, e.position, e.level
        HAVING COALESCE(SUM(CASE WHEN p.status = 'In Progress' THEN pm.allocation_percentage ELSE 0 END), 0) < 100
        ORDER BY free_capacity DESC, e.full_name ASC
      `;
      const result = await db.query(query);
      res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/resources/assign
  async assignResource(req, res, next) {
    try {
      const { project_id, employee_id, role_in_project, allocation_percentage, start_date, end_date } = req.body;
      if (!project_id || !employee_id || !allocation_percentage) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn Dự án, Nhân viên và % Phân bổ!' });
      }

      // Check project exists
      const projectCheck = await db.query(`SELECT * FROM projects WHERE id = $1`, [project_id]);
      if (projectCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin dự án!' });
      }

      // Check current allocation total on active projects
      const checkRes = await db.query(
        `SELECT COALESCE(SUM(pm.allocation_percentage), 0)::int as total 
         FROM project_members pm
         JOIN projects p ON pm.project_id = p.id
         WHERE pm.employee_id = $1 AND p.status = 'In Progress'`,
        [employee_id]
      );
      const currentAllocated = parseInt(checkRes.rows[0].total, 10);
      const parsedAlloc = parseInt(allocation_percentage, 10);
      if (isNaN(parsedAlloc) || parsedAlloc <= 0 || parsedAlloc > 100) {
        return res.status(400).json({ success: false, message: '% Phân bổ phải từ 1 đến 100!' });
      }

      if (currentAllocated + parsedAlloc > 100) {
        return res.status(400).json({
          success: false,
          message: `Cảnh báo Over-allocation! Nhân viên đã phân bổ ${currentAllocated}%. Thêm ${parsedAlloc}% sẽ vượt quá 100%!`
        });
      }

      const query = `
        INSERT INTO project_members (project_id, employee_id, role_in_project, allocation_percentage, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const result = await db.query(query, [
        project_id, employee_id, role_in_project || 'Member', parsedAlloc, start_date || null, end_date || null
      ]);

      res.status(201).json({ success: true, message: 'Phân bổ nhân sự vào dự án thành công!', data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/resources/allocations/:id
  async removeAllocation(req, res, next) {
    try {
      const result = await db.query(`DELETE FROM project_members WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phân bổ nhân sự để hủy!' });
      }
      res.json({ success: true, message: 'Hủy phân bổ nhân sự thành công!' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ResourceController;
