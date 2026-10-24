const SettingModel = require('../models/settingModel');

const SettingController = {
  // GET /api/settings/db-status
  async checkDbStatus(req, res, next) {
    try {
      const dbInfo = await SettingModel.testDbConnection();
      res.json({
        success: dbInfo.status === 'CONNECTED',
        data: dbInfo
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/settings/audit-logs
  async getAuditLogs(req, res, next) {
    try {
      const logs = await SettingModel.getAuditLogs(50);
      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = SettingController;
