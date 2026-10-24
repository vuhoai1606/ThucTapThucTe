const ProjectModel = require('../models/projectModel');

const ProjectController = {
  // GET /api/projects
  async getAll(req, res, next) {
    try {
      const { search, department, status } = req.query;
      const projects = await ProjectModel.findAll({ search, department, status });
      res.json({
        success: true,
        count: projects.length,
        data: projects
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/projects/:id
  async getById(req, res, next) {
    try {
      const project = await ProjectModel.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dự án!' });
      }
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/projects
  async create(req, res, next) {
    try {
      const { name, department } = req.body;
      if (!name || !department) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền Tên dự án và Phòng ban!' });
      }
      const newProject = await ProjectModel.create(req.body);
      res.status(201).json({ success: true, message: 'Tạo dự án mới thành công!', data: newProject });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/projects/:id
  async update(req, res, next) {
    try {
      const updatedProject = await ProjectModel.update(req.params.id, req.body);
      if (!updatedProject) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dự án để cập nhật!' });
      }
      res.json({ success: true, message: 'Cập nhật dự án thành công!', data: updatedProject });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/projects/:id
  async delete(req, res, next) {
    try {
      const deletedProject = await ProjectModel.delete(req.params.id);
      if (!deletedProject) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dự án để xóa!' });
      }
      res.json({ success: true, message: 'Xóa dự án thành công!', data: deletedProject });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ProjectController;
