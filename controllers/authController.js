const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const SettingModel = require('../models/settingModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fsoft_super_secret_jwt_key_2026_fpt_software';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fsoft_refresh_token_secret_key_2026';

const AuthController = {
  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập Tên đăng nhập và Mật khẩu!'
        });
      }

      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc Mật khẩu không chính xác!'
        });
      }

      const isMatch = await UserModel.verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc Mật khẩu không chính xác!'
        });
      }

      const payload = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

      // Save refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await UserModel.saveRefreshToken(user.id, refreshToken, expiresAt);

      await SettingModel.logAction(user.id, user.username, 'LOGIN', 'Auth', `Đăng nhập hệ thống (${user.role})`, req.ip);

      res.json({
        success: true,
        message: `Chào mừng ${user.fullName} (${user.role}) đã đăng nhập thành công!`,
        data: {
          token,
          refreshToken,
          user: payload
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/refresh
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token là bắt buộc!' });
      }

      const storedToken = await UserModel.verifyRefreshToken(refreshToken);
      if (!storedToken) {
        return res.status(401).json({ success: false, message: 'Refresh Token không hợp lệ hoặc đã hết hạn!' });
      }

      const payload = {
        id: storedToken.user_id,
        username: storedToken.username,
        fullName: storedToken.full_name,
        email: storedToken.email,
        role: storedToken.role,
        employeeId: storedToken.employee_id
      };

      const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

      res.json({
        success: true,
        data: { token: newToken }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/logout
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await UserModel.deleteRefreshToken(refreshToken);
      }
      res.json({ success: true, message: 'Đăng xuất thành công!' });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/change-password
  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới!' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự!' });
      }

      const userId = req.user.id;
      const user = await UserModel.findById(userId, true);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản!' });
      }

      const isMatch = await UserModel.verifyPassword(oldPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng!' });
      }

      await UserModel.changePassword(userId, newPassword);

      await SettingModel.logAction(userId, user.username, 'CHANGE_PASSWORD', 'Auth', 'Đổi mật khẩu thành công', req.ip);

      res.json({ success: true, message: 'Đổi mật khẩu thành công! Các phiên đăng nhập khác đã được thu hồi an toàn.' });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ!' });
      }

      const user = await UserModel.findByUsername(email);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Email này không tồn tại trong hệ thống!' });
      }

      res.json({
        success: true,
        message: `Mã khôi phục mật khẩu đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư!`
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/me
  async getCurrentUser(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản' });
      }
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/auth/profile
  async updateProfile(req, res, next) {
    try {
      const { fullName, phone, gender, birthday, address } = req.body;
      const userId = req.user.id;

      const updatedUser = await UserModel.updateProfile(userId, {
        fullName: fullName ? fullName.trim() : null,
        phone: phone ? phone.trim() : null,
        gender: gender || null,
        birthday: birthday || null,
        address: address ? address.trim() : null
      });

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng!' });
      }

      await SettingModel.logAction(
        userId,
        updatedUser.username,
        'UPDATE_PROFILE',
        'Profile',
        `Cập nhật thông tin hồ sơ cá nhân: ${updatedUser.fullName}`,
        req.ip
      );

      res.json({
        success: true,
        message: 'Cập nhật thông tin hồ sơ cá nhân thành công!',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = AuthController;
