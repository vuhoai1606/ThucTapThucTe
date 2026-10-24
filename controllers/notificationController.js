const db = require('../config/database');

const NotificationController = {
  // GET /api/notifications
  async getAll(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.json({ success: true, unreadCount: 0, data: [] });
      }

      const [listRes, countRes] = await Promise.all([
        db.query(
          `SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 30`,
          [userId]
        ),
        db.query(
          `SELECT COUNT(*)::int as count FROM notifications WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false`,
          [userId]
        )
      ]);

      const unreadCount = countRes.rows[0].count;
      res.json({ success: true, unreadCount, data: listRes.rows });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/notifications/:id/read
  async markAsRead(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID thông báo không hợp lệ!' });
      }

      const result = await db.query(
        `UPDATE notifications SET is_read = true WHERE id = $1 AND (user_id = $2 OR user_id IS NULL) RETURNING *`,
        [id, userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo!' });
      }
      res.json({ success: true, message: 'Đã đánh dấu là đã đọc!' });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/notifications/read-all
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc!' });
      }
      await db.query(
        `UPDATE notifications SET is_read = true WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false`,
        [userId]
      );
      res.json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc!' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = NotificationController;
