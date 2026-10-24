const db = require('../config/database');

const AssetController = {
  // GET /api/assets
  async getAll(req, res, next) {
    try {
      const query = `
        SELECT 
          a.id,
          a.asset_code,
          a.name,
          a.category,
          a.serial_number,
          a.status,
          a.assigned_to as employee_id,
          u.full_name as assigned_to,
          a.assigned_date,
          a.notes
        FROM assets a
        LEFT JOIN users u ON a.assigned_to = u.employee_id OR a.assigned_to = u.id::text
        ORDER BY a.id ASC
      `;
      const result = await db.query(query);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/assets
  async create(req, res, next) {
    try {
      const { asset_code, name, category, serial_number } = req.body;
      const result = await db.query(
        `INSERT INTO assets (asset_code, name, category, serial_number, status) VALUES ($1, $2, $3, $4, 'Available') RETURNING *`,
        [asset_code, name, category || 'Laptop', serial_number || '']
      );
      res.status(201).json({ success: true, message: 'Thêm tài sản thành công!', data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/assets/assign
  async assignAsset(req, res, next) {
    try {
      const { asset_id, employee_id, notes } = req.body;
      if (!asset_id || !employee_id) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn thiết bị và nhân viên!' });
      }

      const result = await db.query(
        `UPDATE assets 
         SET status = 'Assigned', assigned_to = $1, assigned_date = CURRENT_DATE, notes = $2 
         WHERE id = $3 
         RETURNING *`,
        [employee_id, notes || '', asset_id]
      );

      res.json({ success: true, message: 'Cấp phát tài sản thành công!', data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/assets/return/:id
  async returnAsset(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID thiết bị không hợp lệ!' });
      }

      const checkAsset = await db.query(`SELECT * FROM assets WHERE id = $1`, [id]);
      if (checkAsset.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị để thu hồi!' });
      }

      const returnNotes = req.body && req.body.notes !== undefined ? req.body.notes : checkAsset.rows[0].notes;

      const result = await db.query(
        `UPDATE assets 
         SET status = 'Available', assigned_to = NULL, assigned_date = NULL, notes = $1 
         WHERE id = $2 
         RETURNING *`,
        [returnNotes, id]
      );
      res.json({ success: true, message: 'Thu hồi tài sản thành công!', data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = AssetController;
