const db = require('../config/database');

const SkillController = {
  async getAll(req, res, next) {
    try {
      const result = await db.query(`SELECT * FROM skills ORDER BY category, name ASC`);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, category } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Tên kỹ năng là bắt buộc!' });
      }
      const result = await db.query(
        `INSERT INTO skills (name, category) VALUES ($1, $2) RETURNING *`,
        [name.trim(), category || 'Technical']
      );
      res.status(201).json({ success: true, data: result.rows[0], message: 'Thêm kỹ năng thành công!' });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, message: 'Kỹ năng này đã tồn tại!' });
      }
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, category } = req.body;
      const result = await db.query(
        `UPDATE skills SET name = COALESCE($1, name), category = COALESCE($2, category) WHERE id = $3 RETURNING *`,
        [name, category, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ năng để cập nhật!' });
      }
      res.json({ success: true, data: result.rows[0], message: 'Cập nhật kỹ năng thành công!' });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await db.query(`DELETE FROM skills WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy kỹ năng để xóa!' });
      }
      res.json({ success: true, message: 'Xóa kỹ năng thành công!' });
    } catch (error) {
      next(error);
    }
  },

  // Get full skill matrix for all employees
  async getMatrix(req, res, next) {
    try {
      const query = `
        SELECT 
          es.id,
          es.employee_id,
          e.full_name as employee_name,
          e.department,
          e.position,
          s.id as skill_id,
          s.name as skill_name,
          s.category as skill_category,
          es.level,
          es.years,
          es.last_updated
        FROM employee_skills es
        LEFT JOIN employees e ON es.employee_id = e.id
        JOIN skills s ON es.skill_id = s.id
        ORDER BY e.full_name ASC, s.name ASC
      `;
      const result = await db.query(query);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  // Assign or update employee skill rating
  async assignEmployeeSkill(req, res, next) {
    try {
      const { employee_id, skill_id, level, years } = req.body;
      if (!employee_id || !skill_id || !level) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn nhân viên, kỹ năng và level (1-5)!' });
      }

      const validLevel = Math.max(1, Math.min(5, parseInt(level, 10) || 1));
      const validYears = Math.max(0, parseInt(years, 10) || 1);

      const query = `
        INSERT INTO employee_skills (employee_id, skill_id, level, years, last_updated)
        VALUES ($1, $2, $3, $4, CURRENT_DATE)
        ON CONFLICT (employee_id, skill_id) 
        DO UPDATE SET level = EXCLUDED.level, years = EXCLUDED.years, last_updated = CURRENT_DATE
        RETURNING *;
      `;
      const result = await db.query(query, [employee_id, skill_id, validLevel, validYears]);
      res.json({ success: true, data: result.rows[0], message: 'Cập nhật Ma trận Kỹ năng thành công!' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = SkillController;
