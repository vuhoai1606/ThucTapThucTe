/**
 * FSOFT HRMS - Auth & Multi-Role RBAC Module (Synchronous Cache + Async Verify)
 */
import { API } from './api.js';
import { showToast } from './toast.js';
import { Router } from './router.js';

export const Auth = {
  currentUser: (() => {
    try {
      return JSON.parse(localStorage.getItem('fsoft_user')) || null;
    } catch (e) {
      return null;
    }
  })(),
  token: localStorage.getItem('fsoft_token') || null,

  async init(onAuthChange) {
    this.onAuthChange = onAuthChange;
    await this.checkCurrentSession();
  },

  getToken() {
    return this.token;
  },

  async checkCurrentSession() {
    if (!this.token) {
      this.updateUI(null);
      return;
    }

    // Ghi nhớ đăng nhập trong 1 tuần (7 ngày)
    const loginTime = localStorage.getItem('fsoft_login_time');
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    if (loginTime && (Date.now() - parseInt(loginTime, 10) > ONE_WEEK_MS)) {
      this.logout();
      return;
    }

    const res = await API.getCurrentUser();
    if (res.success && res.data) {
      this.currentUser = res.data;
      localStorage.setItem('fsoft_user', JSON.stringify(this.currentUser));
      if (!loginTime) {
        localStorage.setItem('fsoft_login_time', Date.now().toString());
      }
      this.updateUI(this.currentUser);
    } else {
      this.logout();
    }
  },

  bindLoginEvents() {
    const screenLoginForm = document.getElementById('screenLoginForm');

    // Preset Quick Login Buttons (Admin, HR, PM, Employee)
    const presets = {
      presetAdminBtn: { user: 'admin', pass: 'admin123' },
      presetHrBtn: { user: 'hr', pass: 'hr123' },
      presetPmBtn: { user: 'pm', pass: 'pm123' },
      presetUserBtn: { user: 'employee', pass: 'emp123' }
    };

    Object.keys(presets).forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          const usernameInput = document.getElementById('screenLoginUsername');
          const passwordInput = document.getElementById('screenLoginPassword');
          if (usernameInput && passwordInput) {
            usernameInput.value = presets[btnId].user;
            passwordInput.value = presets[btnId].pass;
            showToast(`Đã chọn tài khoản mẫu: ${presets[btnId].user}`, 'info');
          }
        });
      }
    });

    if (screenLoginForm) {
      screenLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('screenLoginUsername').value.trim();
        const password = document.getElementById('screenLoginPassword').value;

        if (!username || !password) {
          showToast('Vui lòng nhập tên đăng nhập và mật khẩu!', 'error');
          return;
        }

        const res = await API.login(username, password);
        if (res.success && res.data) {
          this.token = res.data.token;
          this.currentUser = res.data.user;
          localStorage.setItem('fsoft_token', this.token);
          localStorage.setItem('fsoft_user', JSON.stringify(this.currentUser));
          localStorage.setItem('fsoft_login_time', Date.now().toString());

          showToast(res.message, 'success');
          this.updateUI(this.currentUser);
          Router.navigate('/dashboard');
        } else {
          showToast(res.message || 'Tên đăng nhập hoặc Mật khẩu không chính xác!', 'error');
        }
      });
    }
  },

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('fsoft_token');
    localStorage.removeItem('fsoft_user');
    localStorage.removeItem('fsoft_login_time');
    this.updateUI(null);
    Router.navigate('/login', true);
  },

  async updateUI(user) {
    const userProfileSection = document.getElementById('userProfileSection');
    const sidebarRoleLabel = document.getElementById('sidebarRoleLabel');
    const openAddModalBtn = document.getElementById('openAddModalBtn');
    const notifBadge = document.getElementById('notifBadge');

    if (user) {
      if (sidebarRoleLabel) sidebarRoleLabel.textContent = `${user.role} Portal`;

      if (userProfileSection) {
        userProfileSection.innerHTML = `
          <div class="user-profile">
            <a href="/profile" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; cursor: pointer;" title="Xem hồ sơ cá nhân">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}" alt="Avatar" class="user-avatar">
              <div class="user-info">
                <h4>${user.fullName}</h4>
                <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                  <span class="badge badge-status active" style="font-size: 10px; padding: 2px 8px;">${user.role}</span>
                </div>
              </div>
            </a>
            <button id="logoutBtn" style="background: transparent; border: none; color: var(--fpt-red); cursor: pointer; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;" title="Đăng xuất">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        `;

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
          this.logout();
          showToast('Đã đăng xuất khỏi hệ thống', 'info');
        });
      }

      // Load user-specific notifications count
      const notifRes = await API.getNotifications();
      if (notifRes.success && notifBadge) {
        notifBadge.textContent = notifRes.unreadCount || 0;
      }

      if (openAddModalBtn) {
        openAddModalBtn.style.display = (user.role === 'Admin' || user.role === 'HR') ? 'inline-flex' : 'none';
      }
    }

    if (typeof this.onAuthChange === 'function') {
      this.onAuthChange(user);
    }
  }
};
