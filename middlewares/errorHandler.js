/**
 * Centralized Error Handling Middleware for Express
 */
function errorHandler(err, req, res, next) {
  console.error('🔥 Server Error Stack:', err.stack || err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ.';

  if (err.message && err.message.includes('password authentication failed')) {
    message = 'Lỗi kết nối CSDL: Mật khẩu PostgreSQL trong tệp .env chưa đúng. Vui lòng mở tệp .env và cập nhật DB_PASSWORD thành mật khẩu PostgreSQL trên máy của bạn!';
    statusCode = 500;
  } else if (err.message && err.message.includes('does not exist')) {
    message = 'Bảng CSDL đang được tự động khởi tạo. Vui lòng đảm bảo mật khẩu PostgreSQL trong tệp .env đúng và tải lại trang!';
    statusCode = 500;
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
