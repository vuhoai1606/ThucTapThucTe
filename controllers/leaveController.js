const db = require('../config/database');

const LeaveController = {
  // GET /api/leave
  async getAll(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : 'Employee';
      const userEmpId = req.user ? req.user.employeeId : null;
      let targetEmployeeId = req.query.employee_id;

      // Regular employees can only see their own leave requests
      if (userRole === 'Employee') {
        targetEmployeeId = userEmpId;
      }

      let query = `
        SELECT l.*, e.full_name as employee_name, e.department, e.position 
        FROM leave_requests l 
        LEFT JOIN employees e ON l.employee_id = e.id 
        WHERE 1=1
      `;
      const params = [];
      let count = 1;

      if (targetEmployeeId) {
        query += ` AND l.employee_id = $${count}`;
        params.push(targetEmployeeId);
        count++;
      }

      if (req.query.status) {
        query += ` AND l.status = $${count}`;
        params.push(req.query.status);
        count++;
      }

      query += ` ORDER BY l.created_at DESC`;
      const result = await db.query(query, params);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/leave
  async create(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : 'Employee';
      const userEmpId = req.user ? req.user.employeeId : null;

      // Prevent IDOR: only Admin or HR can submit leave for another employee
      let employeeId = userEmpId;
      if ((userRole === 'Admin' || userRole === 'HR') && req.body.employee_id) {
        employeeId = req.body.employee_id;
      }

      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Không xác định được mã nhân viên tạo đơn!' });
      }

      const { leave_type, start_date, end_date, days_count, reason } = req.body;

      if (!leave_type || !start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn loại nghỉ phép và thời gian!' });
      }

      // Calculate days count if missing or invalid
      let calculatedDays = parseInt(days_count, 10);
      if (isNaN(calculatedDays) || calculatedDays <= 0) {
        const start = new Date(start_date);
        const end = new Date(end_date);
        const diffTime = Math.abs(end - start);
        calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      }

      const query = `
        INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_count, reason, status, current_step)
        VALUES ($1, $2, $3, $4, $5, $6, 'Pending PM', 'PM')
        RETURNING *;
      `;
      const result = await db.query(query, [
        employeeId, leave_type, start_date, end_date, calculatedDays, reason || ''
      ]);

      res.status(201).json({
        success: true,
        message: 'Gửi đơn xin nghỉ phép thành công! Đơn đã được chuyển tới Project Manager (PM) phê duyệt.',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/leave/:id/approve (2-Tier Approval: PM -> HR or Admin)
  async approve(req, res, next) {
    try {
      const requestId = req.params.id;
      const userRole = req.user ? req.user.role : null;
      const userEmpId = req.user ? req.user.employeeId : null;

      if (!userRole || userRole === 'Employee') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền phê duyệt đơn nghỉ phép!' });
      }

      const leaveRes = await db.query(`SELECT * FROM leave_requests WHERE id = $1`, [requestId]);
      if (leaveRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn nghỉ phép!' });
      }

      const request = leaveRes.rows[0];

      // Prevent non-Admin self-approval
      if (userRole !== 'Admin' && request.employee_id === userEmpId) {
        return res.status(400).json({ success: false, message: 'Bạn không thể tự phê duyệt đơn xin nghỉ phép của chính mình!' });
      }

      if (request.status === 'Approved') {
        return res.status(400).json({ success: false, message: 'Đơn nghỉ phép này đã được phê duyệt hoàn tất trước đó!' });
      }

      if (request.status === 'Rejected') {
        return res.status(400).json({ success: false, message: 'Đơn nghỉ phép này đã bị từ chối!' });
      }

      let updateQuery = '';
      let message = '';

      if (userRole === 'Project Manager') {
        if (request.current_step !== 'PM' && request.current_step !== 'Leader') {
          return res.status(400).json({ success: false, message: 'Đơn nghỉ phép này hiện không ở bước chờ Project Manager duyệt!' });
        }
        updateQuery = `UPDATE leave_requests SET pm_approved = true, status = 'Pending HR', current_step = 'HR' WHERE id = $1 RETURNING *`;
        message = 'Project Manager (PM) đã phê duyệt thành công! Đơn chuyển tới HR phê duyệt bước cuối.';
      } else if (userRole === 'HR') {
        if (!request.pm_approved && request.current_step === 'PM') {
          return res.status(400).json({ success: false, message: 'Đơn nghỉ phép này cần được Project Manager (PM) phê duyệt trước khi chuyển đến HR!' });
        }
        updateQuery = `UPDATE leave_requests SET hr_approved = true, status = 'Approved', current_step = 'Completed' WHERE id = $1 RETURNING *`;
        message = 'HR đã phê duyệt thành công! Đơn xin nghỉ phép đã được chấp thuận hoàn tất.';
      } else if (userRole === 'Admin') {
        updateQuery = `UPDATE leave_requests SET pm_approved = true, hr_approved = true, status = 'Approved', current_step = 'Completed' WHERE id = $1 RETURNING *`;
        message = 'Admin đã phê duyệt toàn diện đơn nghỉ phép thành công!';
      } else {
        return res.status(403).json({ success: false, message: 'Vai trò của bạn không có quyền phê duyệt đơn nghỉ phép!' });
      }

      const result = await db.query(updateQuery, [requestId]);
      res.json({ success: true, message, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/leave/:id/reject
  async reject(req, res, next) {
    try {
      const requestId = req.params.id;
      const userRole = req.user ? req.user.role : null;

      if (!userRole || userRole === 'Employee') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền từ chối đơn nghỉ phép!' });
      }

      const leaveRes = await db.query(`SELECT * FROM leave_requests WHERE id = $1`, [requestId]);
      if (leaveRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn nghỉ phép!' });
      }

      const result = await db.query(
        `UPDATE leave_requests SET status = 'Rejected', current_step = 'Rejected' WHERE id = $1 RETURNING *`,
        [requestId]
      );
      res.json({ success: true, message: 'Đã từ chối đơn xin nghỉ phép!', data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = LeaveController;
