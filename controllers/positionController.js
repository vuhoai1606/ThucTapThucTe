const db = require('../config/database');

const PositionController = {
  async getAll(req, res, next) {
    try {
      const result = await db.query(`SELECT * FROM positions ORDER BY id ASC`);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { title, level, salary_grade, description } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tên Chức danh / Vị trí!' });
      }
      const result = await db.query(
        `INSERT INTO positions (title, level, salary_grade, description) VALUES ($1, $2, $3, $4) RETURNING *`,
        [title.trim(), level || 'Middle', salary_grade || 'SG-03', description || '']
      );
      res.status(201).json({ success: true, data: result.rows[0], message: 'Thêm vị trí công việc thành công!' });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { title, level, salary_grade, description } = req.body;
      const result = await db.query(
        `UPDATE positions SET title = COALESCE($1, title), level = COALESCE($2, level), salary_grade = COALESCE($3, salary_grade), description = COALESCE($4, description) WHERE id = $5 RETURNING *`,
        [title, level, salary_grade, description, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy chức danh để cập nhật!' });
      }
      res.json({ success: true, data: result.rows[0], message: 'Cập nhật chức danh thành công!' });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await db.query(`DELETE FROM positions WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy vị trí để xóa!' });
      }
      res.json({ success: true, message: 'Xóa vị trí thành công!' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = PositionController;
