const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fsoft_super_secret_jwt_key_2026_fpt_software';

// Verify JWT token from Header
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập! Vui lòng đăng nhập để thực hiện chức năng này.'
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Mã Token không hợp lệ!'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc Token không hợp lệ! Vui lòng đăng nhập lại.'
    });
  }
}

// Enforce specific allowed roles
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập!'
      });
    }

    if (req.user.role === 'Admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `TRUY CẬP BỊ CẤM (403 Forbidden): Vai trò "${req.user.role}" không có quyền truy cập vào tài nguyên này!`
    });
  };
}

// Enforce Admin Role permission
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'TRUY CẬP BỊ CẤM (403 Forbidden): Bạn không có quyền Admin để thực hiện thao tác này!'
    });
  }
  next();
}

module.exports = {
  verifyToken,
  requireRoles,
  requireAdmin
};
