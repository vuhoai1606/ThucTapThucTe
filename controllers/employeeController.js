const EmployeeModel = require('../models/employeeModel');

const EmployeeController = {
  // GET /api/employees
  async getAll(req, res, next) {
    try {
      const { search, department, status, level, sortBy, sortOrder } = req.query;
      const employees = await EmployeeModel.findAll({ search, department, status, level, sortBy, sortOrder });
      res.json({
        success: true,
        count: employees.length,
        data: employees
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/employees/:id
  async getById(req, res, next) {
    try {
      const employee = await EmployeeModel.findById(req.params.id);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên với ID này!' });
      }
      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/employees
  async create(req, res, next) {
    try {
      const { fullName, email, department, position } = req.body;
      if (!fullName || !email || !department) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ Họ tên, Email và Phòng ban!'
        });
      }

      const newEmployee = await EmployeeModel.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Thêm mới nhân viên thành công!',
        data: newEmployee
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, message: 'Email này đã tồn tại trong hệ thống!' });
      }
      next(error);
    }
  },

  // PUT /api/employees/:id
  async update(req, res, next) {
    try {
      const updatedEmployee = await EmployeeModel.update(req.params.id, req.body);
      if (!updatedEmployee) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên để cập nhật!' });
      }
      res.json({
        success: true,
        message: 'Cập nhật thông tin nhân viên thành công!',
        data: updatedEmployee
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/employees/:id
  async delete(req, res, next) {
    try {
      const deletedEmployee = await EmployeeModel.delete(req.params.id);
      if (!deletedEmployee) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên để xóa!' });
      }
      res.json({
        success: true,
        message: 'Xóa nhân viên thành công!',
        data: deletedEmployee
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = EmployeeController;
