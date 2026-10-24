/**
 * FSOFT HRMS - Comprehensive API Client Module with JWT & RBAC
 */
const API_BASE_URL = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('fsoft_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const API = {
  // Auth API
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi kết nối đăng nhập' };
    }
  },

  async getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Không thể lấy thông tin người dùng' };
    }
  },

  async updateProfile(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi cập nhật hồ sơ cá nhân' };
    }
  },

  async changePassword(oldPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ oldPassword, newPassword })
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi đổi mật khẩu' };
    }
  },

  // Employees
  async getEmployees({ search = '', department = 'ALL', status = 'ALL', level = 'ALL', sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
    try {
      const params = new URLSearchParams({ search, department, status, level, sortBy, sortOrder });
      const response = await fetch(`${API_BASE_URL}/employees?${params.toString()}`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi tải danh sách nhân viên' };
    }
  },

  async createEmployee(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi tạo nhân viên mới' };
    }
  },

  async updateEmployee(id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi cập nhật nhân viên' };
    }
  },

  async deleteEmployee(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi xóa nhân viên' };
    }
  },

  // Departments & Positions
  async getDepartments() {
    try {
      const response = await fetch(`${API_BASE_URL}/departments`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async getDepartmentDetails(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${encodeURIComponent(id)}/details`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi tải chi tiết đơn vị FSU' };
    }
  },

  async createDepartment(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi tạo đơn vị FSU' };
    }
  },

  async updateDepartment(id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi cập nhật đơn vị FSU' };
    }
  },

  async deleteDepartment(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi xóa đơn vị FSU' };
    }
  },

  async getPositions() {
    try {
      const response = await fetch(`${API_BASE_URL}/positions`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async createPosition(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/positions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi thêm chức danh' };
    }
  },

  async deletePosition(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi xóa chức danh' };
    }
  },

  // Skill Matrix
  async getSkills() {
    try {
      const response = await fetch(`${API_BASE_URL}/skills`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async getSkillMatrix() {
    try {
      const response = await fetch(`${API_BASE_URL}/skills/matrix`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async assignSkill(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/skills/employee`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi khi gán skill' };
    }
  },

  // Projects & Resources
  async getProjects() {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async createProject(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi tạo dự án' };
    }
  },

  async updateProject(id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi cập nhật dự án' };
    }
  },

  async deleteProject(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi xóa dự án' };
    }
  },

  async getAllocations() {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/allocations`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async getBenchResources() {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/bench`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async assignResource(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi phân bổ resource' };
    }
  },

  async deleteAllocation(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/allocations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi xóa phân bổ' };
    }
  },

  // Leave Requests
  async getLeaveRequests() {
    try {
      const response = await fetch(`${API_BASE_URL}/leave`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async createLeaveRequest(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/leave`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi tạo đơn nghỉ phép' };
    }
  },

  async approveLeave(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/leave/${id}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi duyệt phép' };
    }
  },

  async rejectLeave(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/leave/${id}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi từ chối đơn phép' };
    }
  },

  // Payroll & Payslips
  async getPayroll() {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async generatePayroll(monthYear = '08/2026') {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ month_year: monthYear })
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi tính lương' };
    }
  },

  async getPayslip(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/${id}`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi lấy phiếu lương' };
    }
  },

  // Performance KPI
  async getPerformanceReviews() {
    try {
      const response = await fetch(`${API_BASE_URL}/performance`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async createPerformanceReview(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/performance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi lưu KPI' };
    }
  },

  // Training & Courses
  async getCourses() {
    try {
      const response = await fetch(`${API_BASE_URL}/training/courses`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async enrollCourse(courseId) {
    try {
      const response = await fetch(`${API_BASE_URL}/training/enroll`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ course_id: courseId })
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi đăng ký khóa học' };
    }
  },

  async createCourse(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/training/courses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi tạo khóa đào tạo' };
    }
  },

  async getTrainingResults(employeeId) {
    try {
      const url = employeeId ? `${API_BASE_URL}/training/results?employee_id=${encodeURIComponent(employeeId)}` : `${API_BASE_URL}/training/results`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  // Recruitment
  async getCandidates() {
    try {
      const response = await fetch(`${API_BASE_URL}/recruitment/candidates`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async createCandidate(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/recruitment/candidates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi thêm ứng viên' };
    }
  },

  async updateCandidateStage(id, stage) {
    try {
      const response = await fetch(`${API_BASE_URL}/recruitment/candidates/${id}/stage`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stage })
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi chuyển vòng tuyển dụng' };
    }
  },

  // Assets
  async getAssets() {
    try {
      const response = await fetch(`${API_BASE_URL}/assets`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async createAsset(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi thêm tài sản' };
    }
  },

  async assignAsset(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi cấp phát tài sản' };
    }
  },

  async revokeAsset(assignmentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/return/${assignmentId}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi thu hồi tài sản' };
    }
  },

  // Notifications
  async getNotifications() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async markNotificationRead(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi đánh dấu đã đọc' };
    }
  },

  async markAllNotificationsRead() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi đánh dấu tất cả đã đọc' };
    }
  },

  // Dashboards
  async getHrDashboard() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/hr`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: null };
    }
  },

  async getPmDashboard() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/pm`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: null };
    }
  },

  async getEmployeeDashboard() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/employee`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: null };
    }
  },

  // DB Status
  async getDbStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/db-status`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Lỗi kiểm tra CSDL' };
    }
  },

  // Audit Logs
  async getAuditLogs() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/audit-logs`, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      return { success: false, data: [] };
    }
  }
};
