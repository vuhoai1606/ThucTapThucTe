/**
 * FSOFT HRMS - Main Application Controller with Modular Views & Enterprise Router
 */
import { API } from './modules/api.js';
import { showToast } from './modules/toast.js';
import { Modal } from './modules/modal.js';
import { 
  renderDeptBarChart, 
  renderLevelDonutChart, 
  renderPayrollTrendChart, 
  renderSkillsRadarChart, 
  renderProjectProgressBarChart, 
  renderKpiHistoryChart 
} from './modules/chart.js';
import { Auth } from './modules/auth.js';
import { Router } from './modules/router.js';
import { FsuView } from './modules/fsuView.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Global App State
  const state = {
    employees: [],
    departments: [],
    positions: [],
    skills: [],
    projects: [],
    allocations: [],
    bench: [],
    leaveRequests: [],
    payroll: [],
    reviews: [],
    courses: [],
    candidates: [],
    assets: [],
    notifications: [],
    editingEmployeeId: null,
    editingProjectId: null,
    theme: localStorage.getItem('fsoft_theme') || 'light'
  };

  await init();

  async function init() {
    applyTheme(state.theme);
    bindShellEvents();

    // Load reusable modals once
    await loadReusableModals();

    // Auth Initialization
    await Auth.init((user) => {
      applyRbacUI(user);
    });

    // Router Initialization with Page Loaders
    Router.init({
      '/login': () => {
        Auth.bindLoginEvents();
      },
      '/dashboard': () => {
        loadDashboardData();
      },
      '/employees': () => {
        bindEmployeesEvents();
        loadEmployees();
      },
      '/departments': () => {
        loadDepartments();
      },
      '/positions': () => {
        bindPositionsEvents();
        loadPositions();
      },
      '/skills': () => {
        bindSkillsEvents();
        loadSkillMatrix();
      },
      '/projects': () => {
        bindProjectsEvents();
        loadProjects();
      },
      '/resources': () => {
        bindResourcesEvents();
        loadResources();
      },
      '/leave': () => {
        bindLeaveEvents();
        loadLeaveRequests();
      },
      '/payroll': () => {
        bindPayrollEvents();
        loadPayroll();
      },
      '/performance': () => {
        bindPerformanceEvents();
        loadPerformanceReviews();
      },
      '/training': () => {
        bindTrainingEvents();
        loadCourses();
      },
      '/recruitment': () => {
        bindRecruitmentEvents();
        loadRecruitment();
      },
      '/assets': () => {
        bindAssetsEvents();
        loadAssets();
      },
      '/notifications': () => {
        loadNotifications();
      },
      '/profile': () => {
        bindProfileEvents();
        loadProfile();
      },
      '/settings': () => {
        bindProfileEvents();
        loadProfile();
      }
    });
  }

  async function loadReusableModals() {
    try {
      const res = await fetch('/views/modals.html?v=' + Date.now());
      const html = await res.text();
      const container = document.getElementById('modalsContainer');
      if (container) {
        container.innerHTML = html;
        Modal.init();
        bindModalEvents();
      }
    } catch (err) {
      console.error('Error loading modals.html:', err);
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('themeToggleBtn');
    if (!themeBtn) return;
    const icon = themeBtn.querySelector('i');
    const label = themeBtn.querySelector('span');
    if (theme === 'dark') {
      if (icon) icon.className = 'fas fa-sun';
      if (label) label.textContent = 'Giao diện Sáng';
    } else {
      if (icon) icon.className = 'fas fa-moon';
      if (label) label.textContent = 'Giao diện Tối';
    }
  }

  function applyRbacUI(user) {
    if (!user) return;
    const role = user.role;

    // 1. Dynamic Sidebar Filtering
    const menuItems = document.querySelectorAll('#sidebarMenu .menu-item');
    menuItems.forEach(item => {
      const allowedRoles = item.getAttribute('data-roles') || '';
      if (role === 'Admin') {
        item.style.display = 'block';
      } else {
        const rolesList = allowedRoles.split(',').map(r => r.trim());
        if (rolesList.includes(role)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      }
    });

    // 2. Settings profile info
    const settingsUser = document.getElementById('settingsUsernameDisplay');
    const settingsRole = document.getElementById('settingsRoleDisplay');
    if (settingsUser) settingsUser.textContent = `${user.fullName} (${user.username})`;
    if (settingsRole) settingsRole.textContent = user.role;

    // 3. Button Level RBAC
    document.querySelectorAll('.rbac-admin-only').forEach(el => {
      el.style.display = (role === 'Admin') ? 'block' : 'none';
    });
    document.querySelectorAll('.rbac-admin-hr').forEach(el => {
      el.style.display = (role === 'Admin' || role === 'HR') ? 'inline-flex' : 'none';
    });
    document.querySelectorAll('.rbac-pm-admin').forEach(el => {
      el.style.display = (role === 'Admin' || role === 'Project Manager') ? 'inline-flex' : 'none';
    });
    document.querySelectorAll('.rbac-kpi-mgr').forEach(el => {
      el.style.display = (role === 'Admin' || role === 'HR' || role === 'Project Manager') ? 'inline-flex' : 'none';
    });
    document.querySelectorAll('.rbac-skill-mgr').forEach(el => {
      el.style.display = (role === 'Admin' || role === 'HR' || role === 'Project Manager' || role === 'Team Leader') ? 'inline-flex' : 'none';
    });
  }

  function bindShellEvents() {
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('fsoft_theme', state.theme);
      applyTheme(state.theme);
      if (Router.currentPath === '/dashboard' || Router.currentPath === '/') {
        loadDashboardData();
      }
    });

    document.getElementById('notifBellBtn')?.addEventListener('click', () => {
      Router.navigate('/notifications');
    });

    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggleBtn && sidebar) {
      sidebarToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('mobile-open');
      });

      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
          if (!sidebar.contains(e.target) && !sidebarToggleBtn.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
          }
        }
      });

      document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            sidebar.classList.remove('mobile-open');
          }
        });
      });
    }
  }

  // Populate Dropdown Helpers
  function populateEmployeeSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select || !state.employees.length) return;
    select.innerHTML = state.employees.map(e => `
      <option value="${e.id}">${e.fullName} (${e.id}) - ${e.department} - ${e.position || e.role}</option>
    `).join('');
  }

  function populateProjectSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select || !state.projects.length) return;
    select.innerHTML = state.projects.map(p => `
      <option value="${p.id}">${p.name} (${p.id}) - FSU ${p.department}</option>
    `).join('');
  }

  function populateAssetSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select || !state.assets.length) return;
    const avail = state.assets.filter(a => a.status === 'Available');
    if (!avail.length) {
      select.innerHTML = `<option value="">-- Không có thiết bị trống --</option>`;
      return;
    }
    select.innerHTML = avail.map(a => `
      <option value="${a.id}">${a.asset_code} - ${a.name} (${a.category})</option>
    `).join('');
  }

  // Bind All CRUD Modals
  function bindModalEvents() {
    // 1. Employee Modal
    document.getElementById('closeModalBtn')?.addEventListener('click', () => Modal.close());
    document.getElementById('cancelModalBtn')?.addEventListener('click', () => Modal.close());
    document.getElementById('employeeForm')?.addEventListener('submit', handleEmployeeSubmit);

    // 2. Project Modal
    const projectModal = document.getElementById('projectModal');
    document.getElementById('closeProjectModalBtn')?.addEventListener('click', () => projectModal?.classList.remove('active'));
    document.getElementById('cancelProjectModalBtn')?.addEventListener('click', () => projectModal?.classList.remove('active'));
    document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('prjName').value.trim(),
        department: document.getElementById('prjDepartment').value,
        clientName: document.getElementById('prjClient').value.trim(),
        country: document.getElementById('prjCountry').value,
        pmName: document.getElementById('prjPmName').value.trim(),
        leaderName: document.getElementById('prjLeaderName').value.trim(),
        technology: document.getElementById('prjTech').value.trim(),
        progress: parseInt(document.getElementById('prjProgress').value, 10) || 0,
        budget: parseFloat(document.getElementById('prjBudget').value) || 0,
        status: document.getElementById('prjStatus').value
      };
      let res;
      if (state.editingProjectId) {
        res = await API.updateProject(state.editingProjectId, data);
      } else {
        res = await API.createProject(data);
      }
      if (res.success) {
        showToast(res.message, 'success');
        projectModal?.classList.remove('active');
        state.editingProjectId = null;
        loadProjects();
      } else {
        showToast(res.message || 'Lỗi lưu dự án', 'error');
      }
    });

    // 3. Skill Modal
    const skillModal = document.getElementById('skillModal');
    document.getElementById('closeSkillModalBtn')?.addEventListener('click', () => skillModal?.classList.remove('active'));
    document.getElementById('cancelSkillModalBtn')?.addEventListener('click', () => skillModal?.classList.remove('active'));
    document.getElementById('skillForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        employee_id: document.getElementById('skillEmployeeSelect').value,
        skill_id: parseInt(document.getElementById('skillSelect').value, 10),
        level: parseInt(document.getElementById('skillLevel').value, 10),
        years: parseInt(document.getElementById('skillYears').value, 10)
      };
      const res = await API.assignSkill(data);
      if (res.success) {
        showToast(res.message, 'success');
        skillModal?.classList.remove('active');
        loadSkillMatrix();
      } else {
        showToast(res.message || 'Lỗi gán kỹ năng', 'error');
      }
    });

    // 4. Resource Allocation Modal
    const resourceModal = document.getElementById('resourceModal');
    document.getElementById('closeResourceModalBtn')?.addEventListener('click', () => resourceModal?.classList.remove('active'));
    document.getElementById('cancelResourceModalBtn')?.addEventListener('click', () => resourceModal?.classList.remove('active'));
    document.getElementById('resourceForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        project_id: document.getElementById('resProjectSelect').value,
        employee_id: document.getElementById('resEmployeeSelect').value,
        role_in_project: document.getElementById('resRole').value.trim(),
        allocation_percentage: parseInt(document.getElementById('resAllocation').value, 10)
      };
      const res = await API.assignResource(data);
      if (res.success) {
        showToast(res.message, 'success');
        resourceModal?.classList.remove('active');
        loadResources();
      } else {
        showToast(res.message || 'Lỗi phân bổ nhân sự', 'error');
      }
    });

    // 5. Leave Request Modal
    const leaveModal = document.getElementById('leaveModal');
    document.getElementById('closeLeaveModalBtn')?.addEventListener('click', () => leaveModal?.classList.remove('active'));
    document.getElementById('cancelLeaveModalBtn')?.addEventListener('click', () => leaveModal?.classList.remove('active'));
    document.getElementById('leaveForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const start = document.getElementById('leaveStartDate').value;
      const end = document.getElementById('leaveEndDate').value;
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffTime = endDate.getTime() - startDate.getTime();
      const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      const data = {
        leave_type: document.getElementById('leaveType').value,
        start_date: start,
        end_date: end,
        days_count: daysCount,
        reason: document.getElementById('leaveReason').value.trim()
      };
      const res = await API.createLeaveRequest(data);
      if (res.success) {
        showToast(res.message, 'success');
        leaveModal?.classList.remove('active');
        loadLeaveRequests();
      } else {
        showToast(res.message || 'Lỗi gửi đơn nghỉ phép', 'error');
      }
    });

    // 6. Performance KPI Modal
    const kpiModal = document.getElementById('kpiModal');
    document.getElementById('closeKpiModalBtn')?.addEventListener('click', () => kpiModal?.classList.remove('active'));
    document.getElementById('cancelKpiModalBtn')?.addEventListener('click', () => kpiModal?.classList.remove('active'));
    document.getElementById('kpiForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        employee_id: document.getElementById('kpiEmployeeSelect').value,
        review_period: document.getElementById('kpiPeriod').value,
        communication_score: document.getElementById('kpiComm').value,
        technical_score: document.getElementById('kpiTech').value,
        teamwork_score: document.getElementById('kpiTeamwork').value,
        leadership_score: document.getElementById('kpiLeader').value,
        comments: document.getElementById('kpiComments').value.trim()
      };
      const res = await API.createPerformanceReview(data);
      if (res.success) {
        showToast(res.message, 'success');
        kpiModal?.classList.remove('active');
        loadPerformanceReviews();
      } else {
        showToast(res.message || 'Lỗi lưu KPI', 'error');
      }
    });

    // 7. Candidate Modal
    const candidateModal = document.getElementById('candidateModal');
    document.getElementById('closeCandidateModalBtn')?.addEventListener('click', () => candidateModal?.classList.remove('active'));
    document.getElementById('cancelCandidateModalBtn')?.addEventListener('click', () => candidateModal?.classList.remove('active'));
    document.getElementById('candidateForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        full_name: document.getElementById('candName').value.trim(),
        email: document.getElementById('candEmail').value.trim(),
        phone: document.getElementById('candPhone').value.trim(),
        position_applied: document.getElementById('candPosition').value.trim(),
        interviewer: document.getElementById('candInterviewer').value.trim(),
        notes: document.getElementById('candNotes').value.trim()
      };
      const res = await API.createCandidate(data);
      if (res.success) {
        showToast(res.message, 'success');
        candidateModal?.classList.remove('active');
        loadRecruitment();
      } else {
        showToast(res.message || 'Lỗi thêm ứng viên', 'error');
      }
    });

    // 8. Asset Modals
    const assetModal = document.getElementById('assetModal');
    const assignAssetModal = document.getElementById('assignAssetModal');
    document.getElementById('closeAssetModalBtn')?.addEventListener('click', () => assetModal?.classList.remove('active'));
    document.getElementById('cancelAssetModalBtn')?.addEventListener('click', () => assetModal?.classList.remove('active'));
    document.getElementById('assetForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        asset_code: document.getElementById('assetCode').value.trim(),
        name: document.getElementById('assetName').value.trim(),
        category: document.getElementById('assetCategory').value,
        serial_number: document.getElementById('assetSerial').value.trim()
      };
      const res = await API.createAsset(data);
      if (res.success) {
        showToast(res.message, 'success');
        assetModal?.classList.remove('active');
        loadAssets();
      } else {
        showToast(res.message || 'Lỗi thêm tài sản', 'error');
      }
    });

    document.getElementById('closeAssignAssetModalBtn')?.addEventListener('click', () => assignAssetModal?.classList.remove('active'));
    document.getElementById('cancelAssignAssetModalBtn')?.addEventListener('click', () => assignAssetModal?.classList.remove('active'));
    document.getElementById('assignAssetForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        asset_id: parseInt(document.getElementById('assignAssetSelect').value, 10),
        employee_id: document.getElementById('assignAssetEmpSelect').value,
        notes: document.getElementById('assignAssetNotes').value.trim()
      };
      const res = await API.assignAsset(data);
      if (res.success) {
        showToast(res.message, 'success');
        assignAssetModal?.classList.remove('active');
        loadAssets();
      } else {
        showToast(res.message || 'Lỗi cấp phát tài sản', 'error');
      }
    });

    // 9. Change Password Modal
    const changePassModal = document.getElementById('changePasswordModal');
    document.getElementById('closeChangePassModalBtn')?.addEventListener('click', () => changePassModal?.classList.remove('active'));
    document.getElementById('cancelChangePassModalBtn')?.addEventListener('click', () => changePassModal?.classList.remove('active'));
    document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('oldPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmNew = document.getElementById('confirmNewPassword').value;

      if (newPassword !== confirmNew) {
        showToast('Mật khẩu xác nhận không trùng khớp!', 'error');
        return;
      }
      const res = await API.changePassword(oldPassword, newPassword);
      if (res.success) {
        showToast(res.message, 'success');
        changePassModal?.classList.remove('active');
        document.getElementById('changePasswordForm')?.reset();
      } else {
        showToast(res.message || 'Đổi mật khẩu thất bại', 'error');
      }
    });

    // 10. Position Modal
    const positionModal = document.getElementById('positionModal');
    document.getElementById('closePositionModalBtn')?.addEventListener('click', () => positionModal?.classList.remove('active'));
    document.getElementById('cancelPositionModalBtn')?.addEventListener('click', () => positionModal?.classList.remove('active'));
    document.getElementById('positionForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        title: document.getElementById('posTitle').value.trim(),
        level: document.getElementById('posLevel').value,
        salary_grade: document.getElementById('posSalaryGrade').value.trim(),
        description: document.getElementById('posDescription').value.trim()
      };
      const res = await API.createPosition(data);
      if (res.success) {
        showToast(res.message, 'success');
        positionModal?.classList.remove('active');
        document.getElementById('positionForm')?.reset();
        loadPositions();
      } else {
        showToast(res.message || 'Lỗi thêm chức danh', 'error');
      }
    });

    // 11. Course Modal
    const courseModal = document.getElementById('courseModal');
    document.getElementById('closeCourseModalBtn')?.addEventListener('click', () => courseModal?.classList.remove('active'));
    document.getElementById('cancelCourseModalBtn')?.addEventListener('click', () => courseModal?.classList.remove('active'));
    document.getElementById('courseForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        title: document.getElementById('courseTitle').value.trim(),
        trainer: document.getElementById('courseTrainer').value.trim(),
        duration: document.getElementById('courseDuration').value.trim(),
        certificate_name: document.getElementById('courseCertName').value.trim(),
        description: document.getElementById('courseDescription').value.trim()
      };
      const res = await API.createCourse(data);
      if (res.success) {
        showToast(res.message, 'success');
        courseModal?.classList.remove('active');
        document.getElementById('courseForm')?.reset();
        loadCourses();
      } else {
        showToast(res.message || 'Lỗi tạo khóa học', 'error');
      }
    });
  }

  // PAGE EVENT BINDINGS
  function bindEmployeesEvents() {
    const openAdd = () => {
      state.editingEmployeeId = null;
      Modal.open(null);
    };
    document.getElementById('openAddModalBtn')?.addEventListener('click', openAdd);
    document.getElementById('addEmpToolbarBtn')?.addEventListener('click', openAdd);

    document.getElementById('deptFilter')?.addEventListener('change', () => loadEmployees());
    document.getElementById('levelFilter')?.addEventListener('change', () => loadEmployees());
    document.getElementById('sortSelect')?.addEventListener('change', () => loadEmployees());

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let t;
      searchInput.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          if (Router.currentPath === '/employees') {
            loadEmployees();
          }
        }, 300);
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (Router.currentPath !== '/employees') {
            Router.navigate('/employees');
          } else {
            loadEmployees();
          }
        }
      });
    }
  }

  function bindSkillsEvents() {
    document.getElementById('assignSkillBtn')?.addEventListener('click', () => {
      populateEmployeeSelect('skillEmployeeSelect');
      document.getElementById('skillModal')?.classList.add('active');
    });
  }

  function bindProjectsEvents() {
    document.getElementById('addProjectBtn')?.addEventListener('click', () => {
      state.editingProjectId = null;
      document.getElementById('projectForm')?.reset();
      document.getElementById('projectModal')?.classList.add('active');
    });
  }

  function bindResourcesEvents() {
    document.getElementById('assignResourceBtn')?.addEventListener('click', () => {
      populateProjectSelect('resProjectSelect');
      populateEmployeeSelect('resEmployeeSelect');
      document.getElementById('resourceModal')?.classList.add('active');
    });
  }

  function bindLeaveEvents() {
    document.getElementById('createLeaveBtn')?.addEventListener('click', () => {
      const today = new Date().toISOString().split('T')[0];
      const start = document.getElementById('leaveStartDate');
      const end = document.getElementById('leaveEndDate');
      if (start) start.value = today;
      if (end) end.value = today;
      document.getElementById('leaveModal')?.classList.add('active');
    });
  }

  function bindPayrollEvents() {
    document.getElementById('generatePayrollBtn')?.addEventListener('click', async () => {
      const now = new Date();
      const currentMonthYear = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      const res = await API.generatePayroll(currentMonthYear);
      if (res.success) {
        showToast(res.message, 'success');
        loadPayroll();
      } else {
        showToast(res.message || 'Lỗi tính lương', 'error');
      }
    });
  }

  function bindPerformanceEvents() {
    document.getElementById('addKpiBtn')?.addEventListener('click', () => {
      populateEmployeeSelect('kpiEmployeeSelect');
      document.getElementById('kpiModal')?.classList.add('active');
    });
  }

  function bindRecruitmentEvents() {
    document.getElementById('addCandidateBtn')?.addEventListener('click', () => {
      document.getElementById('candidateModal')?.classList.add('active');
    });
  }

  function bindAssetsEvents() {
    document.getElementById('addAssetBtn')?.addEventListener('click', () => {
      document.getElementById('assetModal')?.classList.add('active');
    });

    document.getElementById('assignAssetBtn')?.addEventListener('click', () => {
      populateAssetSelect('assignAssetSelect');
      populateEmployeeSelect('assignAssetEmpSelect');
      document.getElementById('assignAssetModal')?.classList.add('active');
    });
  }

  function bindProfileEvents() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
          fullName: document.getElementById('profileInputFullName')?.value.trim(),
          phone: document.getElementById('profileInputPhone')?.value.trim(),
          gender: document.getElementById('profileSelectGender')?.value,
          birthday: document.getElementById('profileInputBirthday')?.value,
          address: document.getElementById('profileInputAddress')?.value.trim()
        };

        const res = await API.updateProfile(data);
        if (res.success && res.data) {
          showToast(res.message, 'success');
          Auth.currentUser = res.data;
          localStorage.setItem('fsoft_user', JSON.stringify(res.data));
          Auth.updateUI(res.data);
          loadProfile();
        } else {
          showToast(res.message || 'Lỗi cập nhật hồ sơ cá nhân', 'error');
        }
      };
    }

    const passwordForm = document.getElementById('profilePasswordForm');
    if (passwordForm) {
      passwordForm.onsubmit = async (e) => {
        e.preventDefault();
        const oldPassword = document.getElementById('profileOldPassword')?.value;
        const newPassword = document.getElementById('profileNewPassword')?.value;
        const confirmPassword = document.getElementById('profileConfirmPassword')?.value;

        if (newPassword !== confirmPassword) {
          showToast('Mật khẩu xác nhận không trùng khớp!', 'error');
          return;
        }

        if (newPassword.length < 6) {
          showToast('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'error');
          return;
        }

        const res = await API.changePassword(oldPassword, newPassword);
        if (res.success) {
          showToast(res.message, 'success');
          passwordForm.reset();
        } else {
          showToast(res.message || 'Đổi mật khẩu thất bại', 'error');
        }
      };
    }

    document.getElementById('testDbBtn')?.addEventListener('click', () => loadProfile());
  }

  function bindSettingsEvents() {
    bindProfileEvents();
  }

  function bindPositionsEvents() {
    document.getElementById('addPositionBtn')?.addEventListener('click', () => {
      document.getElementById('positionForm')?.reset();
      document.getElementById('positionModal')?.classList.add('active');
    });
  }

  function bindTrainingEvents() {
    document.getElementById('addCourseBtn')?.addEventListener('click', () => {
      document.getElementById('courseForm')?.reset();
      document.getElementById('courseModal')?.classList.add('active');
    });
  }

  // DATA LOADERS
  async function loadDashboardData() {
    const user = Auth.currentUser;
    if (!user) return;

    const bannerTitle = document.getElementById('welcomeBannerTitle');
    const bannerDesc = document.getElementById('welcomeBannerDesc');
    const container = document.getElementById('dashboardRoleContainer');
    const actionBtn = document.getElementById('dashboardActionBtn');
    const actionText = document.getElementById('dashboardActionText');

    if (bannerTitle && bannerDesc) {
      bannerTitle.innerHTML = `Xin chào, ${user.fullName}! 🚀`;
      bannerDesc.innerHTML = `Đang đăng nhập với vai trò: <strong style="color: var(--primary-fpt); font-size: 15px;">${user.role}</strong>. Cổng thông tin phân tích dữ liệu FPT Software.`;
    }

    applyRbacUI(user);
    if (!container) return;

    // =========================================================================
    // CASE 1: ADMIN & HR DASHBOARD (Doanh Nghiệp & Toàn Bộ Phân Hệ)
    // =========================================================================
    if (user.role === 'Admin' || user.role === 'HR') {
      if (actionText) actionText.textContent = 'Thêm Nhân Viên';
      if (actionBtn) {
        actionBtn.style.display = 'inline-flex';
        actionBtn.onclick = () => { state.editingEmployeeId = null; Modal.open(null); };
      }

      const res = await API.getHrDashboard();
      if (!res.success || !res.data) return;
      const data = res.data;

      container.innerHTML = `
        <!-- KPI METRICS ROW -->
        <section class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
          <div class="stat-card">
            <div class="stat-icon orange"><i class="fas fa-users"></i></div>
            <div class="stat-details">
              <h3>${data.totalEmployees}</h3>
              <p>Tổng Nhân Sự (${data.activeEmployees} chính thức)</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green"><i class="fas fa-money-bill-wave"></i></div>
            <div class="stat-details">
              <h3>${(data.totalMonthlySalary / 1000000).toFixed(0)} Tr ₫</h3>
              <p>Quỹ Lương Tháng Này</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon blue"><i class="fas fa-project-diagram"></i></div>
            <div class="stat-details">
              <h3>${data.activeProjects}</h3>
              <p>Dự Án Đang Chạy</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon purple"><i class="fas fa-star"></i></div>
            <div class="stat-details">
              <h3>${data.avgKpiScore} / 100</h3>
              <p>Điểm KPI Trung Bình</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange"><i class="fas fa-user-plus"></i></div>
            <div class="stat-details">
              <h3>${data.candidatesInPipeline}</h3>
              <p>Ứng Viên Phỏng Vấn</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green"><i class="fas fa-laptop"></i></div>
            <div class="stat-details">
              <h3>${data.assetsAssigned} / ${data.assetsTotal}</h3>
              <p>Thiết Bị Đã Cấp Phát</p>
            </div>
          </div>
        </section>

        <!-- ANALYTICAL CHARTS 2x2 GRID -->
        <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px;">
          <div class="chart-card">
            <div class="card-title">
              <h3><i class="fas fa-chart-bar" style="color: var(--primary-fpt);"></i> Phân Bổ Nhân Lực Theo Đơn Vị (FSU Capacity)</h3>
            </div>
            <div class="chart-container" style="height: 260px;">
              <canvas id="deptBarChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="card-title">
              <h3><i class="fas fa-chart-pie" style="color: var(--fpt-blue);"></i> Cơ Cấu Trình Độ Level Nhân Sự FSOFT</h3>
            </div>
            <div class="chart-container" style="height: 260px;">
              <canvas id="levelDonutChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="card-title">
              <h3><i class="fas fa-chart-line" style="color: var(--fpt-green);"></i> Xu Hướng Biến Động Quỹ Lương 6 Tháng Gần Nhất</h3>
            </div>
            <div class="chart-container" style="height: 260px;">
              <canvas id="payrollTrendChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="card-title">
              <h3><i class="fas fa-award" style="color: var(--fpt-purple);"></i> Top Kỹ Năng Công Nghệ Nòng Cốt FSOFT</h3>
            </div>
            <div class="chart-container" style="height: 260px;">
              <canvas id="topSkillsChart"></canvas>
            </div>
          </div>
        </section>

        <!-- RECENT ACTIVITY DATA TABLES -->
        <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px;">
          <div class="table-card">
            <div class="card-title" style="padding: 16px 20px; margin-bottom: 0; border-bottom: 1px solid var(--border-color); justify-content: space-between;">
              <h4><i class="fas fa-calendar-minus" style="color: var(--primary-fpt);"></i> Đơn Nghỉ Phép Mới Cần Duyệt</h4>
              <a href="/leave" class="btn-secondary" style="font-size: 11px; padding: 4px 8px;">Xem tất cả</a>
            </div>
            <div class="table-responsive">
              <table class="employee-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Loại nghỉ</th>
                    <th>Số ngày</th>
                    <th>Bước duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  ${(data.recentLeaveRequests || []).slice(0, 4).map(l => `
                    <tr>
                      <td><strong>${l.employee_name}</strong> (${l.department})</td>
                      <td><span class="badge badge-dept">${l.leave_type}</span></td>
                      <td>${l.days_count} ngày</td>
                      <td><span class="badge badge-status probation">${l.current_step}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="chart-card">
            <div class="card-title" style="margin-bottom: 12px;">
              <h3><i class="fas fa-tasks" style="color: var(--fpt-blue);"></i> Hoạt Động & Lối Tắt Nhanh (Quick Actions)</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
              <a href="/payroll" class="stat-card" style="padding: 14px; text-decoration: none; color: inherit; border: 1px solid var(--border-color); transition: transform 0.2s;">
                <i class="fas fa-calculator" style="font-size: 20px; color: var(--fpt-green); margin-bottom: 6px;"></i>
                <strong>Tính Lương Tháng</strong>
                <span style="font-size: 11px; color: var(--text-muted);">Cập nhật Payslip kỳ mới</span>
              </a>
              <a href="/recruitment" class="stat-card" style="padding: 14px; text-decoration: none; color: inherit; border: 1px solid var(--border-color); transition: transform 0.2s;">
                <i class="fas fa-user-plus" style="font-size: 20px; color: var(--primary-fpt); margin-bottom: 6px;"></i>
                <strong>Tuyển Dụng</strong>
                <span style="font-size: 11px; color: var(--text-muted);">Duyệt hồ sơ & phỏng vấn</span>
              </a>
              <a href="/assets" class="stat-card" style="padding: 14px; text-decoration: none; color: inherit; border: 1px solid var(--border-color); transition: transform 0.2s;">
                <i class="fas fa-laptop" style="font-size: 20px; color: var(--fpt-blue); margin-bottom: 6px;"></i>
                <strong>Cấp Phát Thiết Bị</strong>
                <span style="font-size: 11px; color: var(--text-muted);">Quản lý bàn giao tài sản</span>
              </a>
              <a href="/settings" class="stat-card" style="padding: 14px; text-decoration: none; color: inherit; border: 1px solid var(--border-color); transition: transform 0.2s;">
                <i class="fas fa-shield-alt" style="font-size: 20px; color: var(--fpt-purple); margin-bottom: 6px;"></i>
                <strong>Audit Logs</strong>
                <span style="font-size: 11px; color: var(--text-muted);">Nhật ký hệ thống</span>
              </a>
            </div>
          </div>
        </section>
      `;

      // Render Charts
      renderDeptBarChart('deptBarChart', data.departmentDistribution || [], state.theme);
      renderLevelDonutChart('levelDonutChart', data.levelDistribution || [], state.theme);
      renderPayrollTrendChart('payrollTrendChart', data.payrollTrend || [], state.theme);
      renderSkillsRadarChart('topSkillsChart', data.skillsDistribution || [], state.theme);
      return;
    }

    // =========================================================================
    // CASE 2: PROJECT MANAGER & TEAM LEADER DASHBOARD (Dự Án & Quản Trị Đội Ngũ)
    // =========================================================================
    if (user.role === 'Project Manager' || user.role === 'Team Leader') {
      if (actionText) actionText.textContent = 'Tạo Dự Án';
      if (actionBtn) {
        actionBtn.style.display = (user.role === 'Project Manager') ? 'inline-flex' : 'none';
        actionBtn.onclick = () => { document.getElementById('projectForm')?.reset(); document.getElementById('projectModal')?.classList.add('active'); };
      }

      const res = await API.getPmDashboard();
      if (!res.success || !res.data) return;
      const data = res.data;

      container.innerHTML = `
        <!-- PM STATS CARDS -->
        <section class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div class="stat-card">
            <div class="stat-icon blue"><i class="fas fa-project-diagram"></i></div>
            <div class="stat-details">
              <h3>${data.totalProjects}</h3>
              <p>Dự Án Phụ Trách (${data.activeProjects} In-Progress)</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green"><i class="fas fa-users-cog"></i></div>
            <div class="stat-details">
              <h3>${data.totalAllocatedMembers} Thành viên</h3>
              <p>Nhân Lực Trong Dự Án</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon purple"><i class="fas fa-user-ninja"></i></div>
            <div class="stat-details">
              <h3>${data.benchCount} Nhân sự</h3>
              <p>Bench Resource Đang Rảnh</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange"><i class="fas fa-calendar-check"></i></div>
            <div class="stat-details">
              <h3>100%</h3>
              <p>Chỉ Số On-time Delivery</p>
            </div>
          </div>
        </section>

        <!-- CHARTS ROW -->
        <section style="display: grid; grid-template-columns: 3fr 2fr; gap: 20px; margin-top: 24px;">
          <div class="chart-card">
            <div class="card-title">
              <h3><i class="fas fa-tasks" style="color: var(--primary-fpt);"></i> Tiến Độ Bàn Giao Từng Dự Án (Progress %)</h3>
            </div>
            <div class="chart-container" style="height: 260px;">
              <canvas id="pmProjectProgressChart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="card-title">
              <h3><i class="fas fa-code" style="color: var(--fpt-blue);"></i> Công Nghệ Nền Tảng Trong Dự Án</h3>
            </div>
            <div class="chart-container" style="height: 260px;">
              <canvas id="pmTechStackChart"></canvas>
            </div>
          </div>
        </section>

        <!-- BENCH & PROJECTS TABLES -->
        <section style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 24px;">
          <div class="table-card">
            <div class="card-title" style="padding: 16px 20px; margin-bottom: 0; border-bottom: 1px solid var(--border-color); justify-content: space-between;">
              <h4><i class="fas fa-list"></i> Tình Trạng Dự Án Chi Tiết</h4>
              <a href="/projects" class="btn-secondary" style="font-size: 11px; padding: 4px 8px;">Xem tất cả</a>
            </div>
            <div class="table-responsive">
              <table class="employee-table">
                <thead>
                  <tr>
                    <th>Dự án</th>
                    <th>FSU</th>
                    <th>Khách hàng</th>
                    <th>Công nghệ</th>
                    <th>Tiến độ</th>
                  </tr>
                </thead>
                <tbody>
                  ${(data.projects || []).slice(0, 4).map(p => `
                    <tr>
                      <td><strong>${p.name}</strong></td>
                      <td><span class="badge badge-dept">${p.department}</span></td>
                      <td>${p.client_name || 'FSOFT'}</td>
                      <td><span style="font-size:12px; font-weight:600;">${p.technology || 'C++, Java'}</span></td>
                      <td>
                        <div style="font-size: 11px; font-weight: 700; margin-bottom: 2px;">${p.progress}%</div>
                        <div style="background: var(--bg-input); height: 6px; border-radius: 3px; width: 80px; overflow: hidden;">
                          <div style="width: ${p.progress}%; background: var(--primary-fpt); height: 100%;"></div>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="chart-card">
            <div class="card-title" style="justify-content: space-between;">
              <h3><i class="fas fa-user-ninja" style="color: var(--primary-fpt);"></i> Bench Resource Sẵn Sàng</h3>
              <a href="/resources" class="btn-secondary" style="font-size: 11px; padding: 4px 8px;">Phân bổ</a>
            </div>
            <div style="font-size: 13px;">
              ${(data.benchList || []).slice(0, 4).map(b => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                  <div>
                    <strong>${b.full_name}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">${b.position} (${b.department})</div>
                  </div>
                  <span class="badge badge-status active">Rảnh ${b.free_capacity}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

      renderProjectProgressBarChart('pmProjectProgressChart', data.projects || [], state.theme);
      renderSkillsRadarChart('pmTechStackChart', data.techStackDistribution || [], state.theme);
      return;
    }

    // =========================================================================
    // CASE 3: EMPLOYEE DASHBOARD (Không Gian Cá Nhân & Phát Triển Sự Nghiệp)
    // =========================================================================
    if (user.role === 'Employee') {
      if (actionText) actionText.textContent = 'Xin Nghỉ Phép';
      if (actionBtn) {
        actionBtn.style.display = 'inline-flex';
        actionBtn.onclick = () => {
          const today = new Date().toISOString().split('T')[0];
          const start = document.getElementById('leaveStartDate');
          const end = document.getElementById('leaveEndDate');
          if (start) start.value = today;
          if (end) end.value = today;
          document.getElementById('leaveModal')?.classList.add('active');
        };
      }

      const res = await API.getEmployeeDashboard();
      if (!res.success || !res.data) return;
      const data = res.data;
      const payslip = data.latestPayslip || {};
      const kpi = data.latestKpi || {};

      container.innerHTML = `
        <!-- EMPLOYEE PERSONAL STATS -->
        <section class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div class="stat-card">
            <div class="stat-icon green"><i class="fas fa-wallet"></i></div>
            <div class="stat-details">
              <h3>${payslip.net_salary ? formatCurrency(payslip.net_salary) : '24.500.000 ₫'}</h3>
              <p>Lương Thực Nhận (${payslip.month_year || 'T8/2026'})</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon orange"><i class="fas fa-calendar-check"></i></div>
            <div class="stat-details">
              <h3>${data.remainingLeaveDays} / 12 Ngày</h3>
              <p>Phép Năm Còn Lại</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon purple"><i class="fas fa-award"></i></div>
            <div class="stat-details">
              <h3>${kpi.kpi_score ? `${kpi.kpi_score}/100 (${kpi.rating})` : '92/100 (A)'}</h3>
              <p>Đánh Giá KPI Gần Nhất</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon blue"><i class="fas fa-laptop-code"></i></div>
            <div class="stat-details">
              <h3>${(data.projects || []).length} Dự Án</h3>
              <p>Dự Án Đang Tham Gia</p>
            </div>
          </div>
        </section>

        <!-- PERSONAL CHARTS ROW -->
        <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px;">
          <div class="chart-card">
            <div class="card-title">
              <h3><i class="fas fa-award" style="color: var(--primary-fpt);"></i> Ma Trận Năng Lực & Kỹ Năng Cá Nhân (Skill Matrix)</h3>
            </div>
            <div class="chart-container" style="height: 260px;">
              <canvas id="empSkillRadar"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="card-title">
              <h3><i class="fas fa-chart-line" style="color: var(--fpt-green);"></i> Lịch Sử Đánh Giá Hiệu Suất KPI Qua Các Kỳ</h3>
            </div>
            <div class="chart-container" style="height: 260px;">
              <canvas id="empKpiHistoryChart"></canvas>
            </div>
          </div>
        </section>

        <!-- SELF-SERVICE WIDGETS -->
        <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px;">
          <!-- PAYSLIP SUMMARY WIDGET -->
          <div class="chart-card">
            <div class="card-title" style="justify-content: space-between;">
              <h3><i class="fas fa-file-invoice-dollar" style="color: var(--fpt-green);"></i> Tóm Tắt Phiếu Lương Kỳ ${payslip.month_year || 'T8/2026'}</h3>
              <a href="/payroll" class="btn-secondary" style="font-size: 11px; padding: 4px 8px;">Xem đầy đủ</a>
            </div>
            <div style="font-size: 13px; line-height: 2;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color);">
                <span>Lương cơ bản:</span>
                <strong>${formatCurrency(payslip.basic_salary || 25000000)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color);">
                <span>Phụ cấp & Thưởng:</span>
                <strong style="color: var(--fpt-green);">+${formatCurrency((payslip.allowance || 3500000) + (payslip.bonus || 0))}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color);">
                <span>Thuế TNCN & BHXH:</span>
                <strong style="color: var(--fpt-red);">-${formatCurrency((payslip.tax || 1800000) + (payslip.insurance || 2200000))}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 8px; font-size: 15px; font-weight: 800; color: var(--fpt-green);">
                <span>Thực Nhận (Net):</span>
                <span>${formatCurrency(payslip.net_salary || 24500000)}</span>
              </div>
            </div>
          </div>

          <!-- LEAVE REQUESTS & RECOMMENDED TRAINING WIDGET -->
          <div class="chart-card">
            <div class="card-title" style="justify-content: space-between;">
              <h3><i class="fas fa-calendar-minus" style="color: var(--primary-fpt);"></i> Trạng Thái Đơn Nghỉ Phép Của Tôi</h3>
              <a href="/leave" class="btn-secondary" style="font-size: 11px; padding: 4px 8px;">Tạo Đơn</a>
            </div>
            <div style="font-size: 13px;">
              ${(data.leaveRequests || []).length ? data.leaveRequests.slice(0, 3).map(l => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                  <div>
                    <strong>${l.leave_type}</strong> (${l.days_count} ngày)
                    <div style="font-size: 11px; color: var(--text-muted);">${new Date(l.start_date).toLocaleDateString('vi-VN')} -> ${new Date(l.end_date).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <span class="badge badge-status ${l.status === 'Approved' ? 'active' : 'probation'}">${l.status} (${l.current_step})</span>
                </div>
              `).join('') : '<p style="color:var(--text-muted); font-size:12px;">Bạn chưa gửi đơn xin nghỉ phép nào gần đây.</p>'}
            </div>

            <div style="margin-top: 18px;">
              <h4 style="font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--fpt-blue);"><i class="fas fa-graduation-cap"></i> Khóa Học Nâng Cao Đề Xuất:</h4>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${(data.recommendedCourses || []).slice(0, 2).map(c => `
                  <div style="background: var(--bg-input); padding: 8px 12px; border-radius: 6px; font-size: 12px; flex: 1;">
                    <strong>${c.title}</strong>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;"><i class="fas fa-clock"></i> ${c.duration}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </section>
      `;

      // Render Charts for Employee
      const empSkills = (data.skills && data.skills.length) ? data.skills : [
        { name: 'C++ Autosar', level: 4 },
        { name: 'Java Spring', level: 4 },
        { name: 'Docker / CI-CD', level: 3 },
        { name: 'React Frontend', level: 4 },
        { name: 'AWS Cloud', level: 3 },
        { name: 'JLPT Japanese', level: 4 }
      ];
      renderSkillsRadarChart('empSkillRadar', empSkills, state.theme);
      renderKpiHistoryChart('empKpiHistoryChart', data.allKpiReviews || [], state.theme);
    }
  }

  async function loadEmployees() {
    const searchInput = document.getElementById('searchInput');
    const deptFilter = document.getElementById('deptFilter');
    const levelFilter = document.getElementById('levelFilter');
    const sortSelect = document.getElementById('sortSelect');

    const search = searchInput ? searchInput.value.trim() : '';
    const department = deptFilter ? deptFilter.value : 'ALL';
    const level = levelFilter ? levelFilter.value : 'ALL';
    const [sortBy, sortOrder] = sortSelect ? sortSelect.value.split(':') : ['created_at', 'DESC'];

    applyRbacUI(Auth.currentUser);

    const res = await API.getEmployees({ search, department, level, sortBy, sortOrder });
    if (res.success && res.data) {
      state.employees = res.data;
      renderEmployeeTable(state.employees);
    }
  }

  function renderEmployeeTable(employees) {
    const tbody = document.getElementById('employeeTableBody');
    if (!tbody) return;

    const isAdmin = Auth.currentUser && (Auth.currentUser.role === 'Admin');
    const isHrOrAdmin = Auth.currentUser && (Auth.currentUser.role === 'Admin' || Auth.currentUser.role === 'HR');

    if (employees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px;">Không tìm thấy nhân viên nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = employees.map(emp => `
      <tr>
        <td>
          <div class="emp-profile-cell">
            <img src="${emp.avatar}" class="emp-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=FPT'">
            <div>
              <div class="emp-name">${emp.fullName}</div>
              <div class="emp-id-sub">${emp.id}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-dept">${emp.department}</span>
          <div style="font-size: 12px; margin-top: 4px; color: var(--text-muted); font-weight: 600;">${emp.position || emp.role || 'Lập trình viên'}</div>
        </td>
        <td><span class="badge" style="background: var(--bg-input);">${emp.level || 'Middle'}</span></td>
        <td>
          <div><i class="fas fa-envelope"></i> ${emp.email}</div>
          <div class="emp-id-sub"><i class="fas fa-phone"></i> ${emp.phone || 'N/A'}</div>
        </td>
        <td>
          <span class="badge badge-status ${emp.status.toLowerCase()}">${emp.status === 'Active' ? 'Chính thức' : 'Thử việc'}</span>
        </td>
        <td><strong>${isHrOrAdmin ? formatCurrency(emp.salary) : '****** ₫'}</strong></td>
        <td>
          <span style="font-size: 12px; color: var(--primary-fpt);"><i class="fas fa-file-pdf"></i> HopDong_${emp.id}.pdf</span>
        </td>
        <td>
          ${isHrOrAdmin ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn-icon-action edit-emp-btn" data-id="${emp.id}" title="Sửa"><i class="fas fa-edit"></i></button>
              ${isAdmin ? `<button class="btn-icon-action delete delete-emp-btn" data-id="${emp.id}" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
            </div>
          ` : '<span style="font-size:12px; color:var(--text-light);"><i class="fas fa-lock"></i> Xem</span>'}
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.edit-emp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const emp = state.employees.find(x => x.id === id);
        if (emp) {
          state.editingEmployeeId = id;
          Modal.open(emp);
        }
      });
    });

    document.querySelectorAll('.delete-emp-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm(`Xác nhận xóa nhân viên ${id}? Thao tác này không thể hoàn tác!`)) {
          const res = await API.deleteEmployee(id);
          if (res.success) {
            showToast(res.message, 'success');
            loadEmployees();
          }
        }
      });
    });
  }

  async function handleEmployeeSubmit(e) {
    e.preventDefault();
    const rawSalary = document.getElementById('empSalary').value ? parseInt(document.getElementById('empSalary').value, 10) : 0;
    if (rawSalary < 0) {
      showToast('Mức lương nhân viên không được là số âm!', 'error');
      return;
    }

    const data = {
      fullName: document.getElementById('empFullName').value.trim(),
      email: document.getElementById('empEmail').value.trim(),
      phone: document.getElementById('empPhone').value.trim(),
      department: document.getElementById('empDepartment').value,
      position: document.getElementById('empRole').value.trim(),
      role: document.getElementById('empSystemRole')?.value || 'Employee',
      level: document.getElementById('empLevel').value,
      salary: Math.max(0, rawSalary)
    };

    let res;
    if (state.editingEmployeeId) {
      res = await API.updateEmployee(state.editingEmployeeId, data);
    } else {
      res = await API.createEmployee(data);
    }

    if (res.success) {
      showToast(res.message, 'success');
      Modal.close();
      loadEmployees();
    } else {
      showToast(res.message || 'Lỗi lưu nhân viên', 'error');
    }
  }

  async function loadDepartments() {
    FsuView.init({
      api: API,
      toast: showToast,
      formatCurrency,
      currentUser: Auth.currentUser
    });
    await FsuView.loadDepartments();
  }

  async function loadPositions() {
    applyRbacUI(Auth.currentUser);
    const res = await API.getPositions();
    const tbody = document.getElementById('positionsTableBody');
    if (!tbody || !res.success) return;

    const isHrOrAdmin = Auth.currentUser && (Auth.currentUser.role === 'Admin' || Auth.currentUser.role === 'HR');

    tbody.innerHTML = res.data.map((p, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${p.title}</strong></td>
        <td><span class="badge badge-dept">${p.level}</span></td>
        <td><span class="badge badge-status active">${p.salary_grade}</span></td>
        <td>${p.description || ''}</td>
        ${isHrOrAdmin ? `
          <td style="text-align: center;">
            <button class="btn-icon delete-pos-btn" data-id="${p.id}" data-name="${p.title}" title="Xóa chức danh" style="color: var(--danger-color); cursor: pointer; background: transparent; border: none; padding: 4px 8px; border-radius: 4px;">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        ` : ''}
      </tr>
    `).join('');

    if (isHrOrAdmin) {
      tbody.querySelectorAll('.delete-pos-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const name = e.currentTarget.getAttribute('data-name');
          if (confirm(`Bạn có chắc chắn muốn xóa chức danh "${name}"?`)) {
            const delRes = await API.deletePosition(id);
            if (delRes.success) {
              showToast(delRes.message, 'success');
              loadPositions();
            } else {
              showToast(delRes.message || 'Lỗi khi xóa chức danh', 'error');
            }
          }
        });
      });
    }
  }

  async function loadSkillMatrix() {
    applyRbacUI(Auth.currentUser);
    const res = await API.getSkillMatrix();
    const tbody = document.getElementById('skillsTableBody');
    if (!tbody || !res.success) return;

    tbody.innerHTML = res.data.map(s => `
      <tr>
        <td><strong>${s.employee_name}</strong> (${s.employee_id})</td>
        <td><span class="badge badge-dept">${s.department}</span></td>
        <td><strong>${s.skill_name}</strong></td>
        <td><span class="badge" style="background: var(--bg-input);">${s.skill_category}</span></td>
        <td>
          <div style="display: flex; gap: 4px; color: #eab308;">
            ${'★'.repeat(s.level)}${'☆'.repeat(5 - s.level)}
          </div>
        </td>
        <td>${s.years} Năm</td>
        <td>${s.last_updated ? new Date(s.last_updated).toLocaleDateString('vi-VN') : ''}</td>
      </tr>
    `).join('');
  }

  async function loadProjects() {
    applyRbacUI(Auth.currentUser);
    const res = await API.getProjects();
    const container = document.getElementById('projectsContainer');
    if (!container || !res.success || !res.data) return;

    state.projects = res.data;
    const canManageProject = Auth.currentUser && (Auth.currentUser.role === 'Admin' || Auth.currentUser.role === 'Project Manager');

    // Hook up Add Project Button
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
      addProjectBtn.onclick = () => {
        state.editingProjectId = null;
        const form = document.getElementById('projectForm');
        if (form) form.reset();
        const titleEl = document.getElementById('projectModalTitle');
        if (titleEl) titleEl.textContent = 'Tạo Dự án Mới (FSOFT Project)';
        document.getElementById('projectModal')?.classList.add('active');
      };
    }

    container.innerHTML = res.data.map(p => `
      <div class="stat-card" style="flex-direction: column; align-items: flex-start; gap: 12px; position: relative;">
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <span class="badge badge-dept">${p.department}</span>
          <span class="badge badge-status active">${p.status}</span>
        </div>
        <h3 style="font-size: 16px; font-weight: 800;">${p.name}</h3>
        <div style="font-size: 12px; color: var(--text-muted); line-height: 1.6;">
          <div><i class="fas fa-globe"></i> Khách hàng: <strong>${p.clientName || 'FSOFT Client'} (${p.country || 'Japan'})</strong></div>
          <div><i class="fas fa-user-shield"></i> PM: <strong>${p.pmName || 'Chưa gán'}</strong> | Leader: <strong>${p.leaderName || 'Chưa gán'}</strong></div>
          <div><i class="fas fa-code"></i> Tech: <strong>${p.technology || p.tech_stack || 'C++, Spring Boot, React'}</strong></div>
        </div>
        <div style="width: 100%; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 4px;">
            <span>Tiến độ</span>
            <span>${p.progress}%</span>
          </div>
          <div style="background: var(--bg-input); height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="width: ${p.progress}%; background: var(--primary-fpt); height: 100%;"></div>
          </div>
        </div>
        ${canManageProject ? `
          <div style="display: flex; gap: 8px; justify-content: flex-end; width: 100%; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border-color);">
            <button class="btn-icon-action edit-project-btn" data-id="${p.id}" title="Chỉnh sửa Dự án" style="font-size: 12px; padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-edit"></i> Sửa</button>
            <button class="btn-icon-action delete delete-project-btn" data-id="${p.id}" title="Xóa Dự án" style="font-size: 12px; padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-trash"></i> Xóa</button>
          </div>
        ` : ''}
      </div>
    `).join('');

    // Attach Edit Project Handlers
    document.querySelectorAll('.edit-project-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const p = state.projects.find(x => x.id === id);
        if (p) {
          state.editingProjectId = id;
          const titleEl = document.getElementById('projectModalTitle');
          if (titleEl) titleEl.textContent = `Chỉnh sửa Dự án (${p.id})`;
          document.getElementById('prjName').value = p.name || '';
          document.getElementById('prjDepartment').value = p.department || 'GAT';
          document.getElementById('prjClient').value = p.clientName || '';
          document.getElementById('prjCountry').value = p.country || 'Japan';
          document.getElementById('prjPmName').value = p.pmName || '';
          document.getElementById('prjLeaderName').value = p.leaderName || '';
          document.getElementById('prjTech').value = p.technology || '';
          document.getElementById('prjProgress').value = p.progress || 0;
          document.getElementById('prjBudget').value = p.budget || 0;
          document.getElementById('prjStatus').value = p.status || 'In Progress';
          document.getElementById('projectModal')?.classList.add('active');
        }
      });
    });

    // Attach Delete Project Handlers
    document.querySelectorAll('.delete-project-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm(`Xác nhận xóa dự án ${id}? Thao tác này sẽ xóa toàn bộ phân bổ liên quan!`)) {
          const res = await API.deleteProject(id);
          if (res.success) {
            showToast(res.message, 'success');
            loadProjects();
          } else {
            showToast(res.message || 'Lỗi xóa dự án', 'error');
          }
        }
      });
    });
  }

  async function loadResources() {
    applyRbacUI(Auth.currentUser);
    const allocRes = await API.getAllocations();
    const tbody = document.getElementById('allocationsTableBody');
    if (tbody && allocRes.success && allocRes.data) {
      state.allocations = allocRes.data;
      const isPmOrAdmin = Auth.currentUser && (Auth.currentUser.role === 'Admin' || Auth.currentUser.role === 'Project Manager');
      tbody.innerHTML = allocRes.data.map(a => `
        <tr>
          <td><strong>${a.project_name}</strong></td>
          <td>${a.employee_name} (${a.employee_id})</td>
          <td>${a.role_in_project}</td>
          <td><span class="badge badge-status active">${a.allocation_percentage}% Workload</span></td>
          <td>
            ${isPmOrAdmin ? `<button class="btn-icon-action delete delete-alloc-btn" data-id="${a.id}"><i class="fas fa-trash"></i></button>` : '<i class="fas fa-lock"></i>'}
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.delete-alloc-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm('Xác nhận giải phóng nhân sự này khỏi dự án?')) {
            const res = await API.deleteAllocation(id);
            if (res.success) {
              showToast(res.message, 'success');
              loadResources();
            }
          }
        });
      });
    }

    const benchRes = await API.getBenchResources();
    const benchContainer = document.getElementById('benchContainer');
    if (benchContainer && benchRes.success && benchRes.data) {
      benchContainer.innerHTML = benchRes.data.map(b => `
        <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid var(--border-color);">
          <div>
            <strong>${b.full_name}</strong> (${b.department})
            <div style="font-size: 11px; color: var(--text-muted);">${b.position}</div>
          </div>
          <span class="badge badge-dept" style="color: var(--fpt-green);">Free ${b.free_capacity}%</span>
        </div>
      `).join('');
    }
  }

  async function loadLeaveRequests() {
    applyRbacUI(Auth.currentUser);
    const res = await API.getLeaveRequests();
    const tbody = document.getElementById('leaveTableBody');
    if (!tbody || !res.success) return;

    state.leaveRequests = res.data;
    const userRole = Auth.currentUser ? Auth.currentUser.role : 'Employee';

    tbody.innerHTML = res.data.map(l => {
      let canApprove = false;
      let approveBtnLabel = '';

      if (l.status !== 'Approved' && l.status !== 'Rejected') {
        if ((userRole === 'Team Leader' && l.current_step === 'Leader') || userRole === 'Admin') {
          canApprove = true;
          approveBtnLabel = 'Duyệt (Leader)';
        } else if ((userRole === 'Project Manager' && l.current_step === 'PM') || userRole === 'Admin') {
          canApprove = true;
          approveBtnLabel = 'Duyệt (PM)';
        } else if ((userRole === 'HR' && l.current_step === 'HR') || userRole === 'Admin') {
          canApprove = true;
          approveBtnLabel = 'Duyệt Final (HR)';
        }
      }

      let statusBadge = `<span class="badge badge-status probation">${l.status}</span>`;
      if (l.status === 'Approved') {
        statusBadge = `<span class="badge badge-status active"><i class="fas fa-check"></i> Đã duyệt</span>`;
      } else if (l.status === 'Rejected') {
        statusBadge = `<span class="badge badge-status" style="background: rgba(244, 67, 54, 0.15); color: #e53935;"><i class="fas fa-times"></i> Đã từ chối</span>`;
      }

      let actionHtml = '';
      if (canApprove) {
        actionHtml = `
          <button class="btn-primary approve-leave-btn" data-id="${l.id}" style="padding: 4px 10px; font-size: 11px;">
            <i class="fas fa-check"></i> ${approveBtnLabel}
          </button>
          <button class="btn-danger reject-leave-btn" data-id="${l.id}" style="padding: 4px 10px; font-size: 11px; margin-left: 4px; background: #e53935; color: white; border: none; border-radius: 4px; cursor: pointer;">
            <i class="fas fa-times"></i> Từ chối
          </button>
        `;
      } else if (l.status === 'Approved') {
        actionHtml = '<i class="fas fa-check-circle" style="color: var(--fpt-green);"></i> Đã hoàn tất';
      } else if (l.status === 'Rejected') {
        actionHtml = '<span style="color:#e53935; font-size:12px;"><i class="fas fa-times-circle"></i> Đã từ chối</span>';
      } else {
        actionHtml = '<span style="color:var(--text-light); font-size:12px;"><i class="fas fa-clock"></i> Chờ duyệt</span>';
      }

      return `
        <tr>
          <td><strong>${l.employee_name || 'Nhân viên'}</strong> (${l.employee_id})</td>
          <td><span class="badge badge-dept">${l.leave_type}</span></td>
          <td>${l.start_date ? new Date(l.start_date).toLocaleDateString('vi-VN') : ''} -> ${l.end_date ? new Date(l.end_date).toLocaleDateString('vi-VN') : ''}</td>
          <td><strong>${l.days_count} ngày</strong></td>
          <td>${l.reason || ''}</td>
          <td><span class="badge badge-status probation">${l.current_step}</span></td>
          <td>${statusBadge}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.approve-leave-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const res = await API.approveLeave(id);
        if (res.success) {
          showToast(res.message, 'success');
          loadLeaveRequests();
        } else {
          showToast(res.message || 'Lỗi duyệt phép', 'error');
        }
      });
    });

    document.querySelectorAll('.reject-leave-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!confirm('Bạn có chắc chắn muốn từ chối đơn xin nghỉ phép này?')) return;
        const id = e.currentTarget.getAttribute('data-id');
        const res = await API.rejectLeave(id);
        if (res.success) {
          showToast(res.message, 'success');
          loadLeaveRequests();
        } else {
          showToast(res.message || 'Lỗi từ chối đơn phép', 'error');
        }
      });
    });
  }

  async function loadPayroll() {
    applyRbacUI(Auth.currentUser);
    const res = await API.getPayroll();
    const tbody = document.getElementById('payrollTableBody');
    if (!tbody || !res.success) return;

    state.payroll = res.data;
    const isHrOrAdmin = Auth.currentUser && (Auth.currentUser.role === 'Admin' || Auth.currentUser.role === 'HR');
    const myEmpId = Auth.currentUser ? Auth.currentUser.employeeId : null;

    tbody.innerHTML = res.data.map(p => {
      const isMyRecord = (p.employee_id === myEmpId);
      const allowView = isHrOrAdmin || isMyRecord;

      return `
        <tr>
          <td><strong>${p.employee_name}</strong> (${p.employee_id})</td>
          <td><span class="badge badge-dept">${p.month_year}</span></td>
          <td>${allowView ? formatCurrency(p.basic_salary) : '****** ₫'}</td>
          <td>${allowView ? formatCurrency(p.allowance) : '****** ₫'}</td>
          <td>${allowView ? formatCurrency(p.tax) : '****** ₫'}</td>
          <td>${allowView ? formatCurrency(p.insurance) : '****** ₫'}</td>
          <td><strong style="color: var(--fpt-green); font-size: 15px;">${allowView ? formatCurrency(p.net_salary) : '****** ₫'}</strong></td>
          <td>
            ${allowView ? `
              <button class="btn-secondary view-payslip-btn" data-id="${p.id}" style="padding: 4px 10px; font-size: 11px;">
                <i class="fas fa-eye"></i> Xem Payslip
              </button>
            ` : '<span style="color:var(--text-light); font-size:12px;"><i class="fas fa-lock"></i> Bảo mật</span>'}
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.view-payslip-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const res = await API.getPayslip(id);
        if (res.success && res.data) {
          showPayslipModal(res.data);
        }
      });
    });
  }

  function showPayslipModal(p) {
    const modal = document.getElementById('payslipModal');
    const content = document.getElementById('payslipContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="border: 2px solid var(--border-color); padding: 20px; border-radius: 8px; font-family: sans-serif;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid var(--primary-fpt); padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h2 style="color: var(--primary-fpt); font-size: 20px; font-weight: 800;">FPT SOFTWARE</h2>
            <div style="font-size: 12px; color: var(--text-muted);">PHIẾU LƯƠNG NHÂN VIÊN - KỲ ${p.month_year}</div>
          </div>
          <div style="text-align: right; font-size: 12px;">
            <div>Mã NV: <strong>${p.employee_id}</strong></div>
            <div>Họ tên: <strong>${p.employee_name}</strong></div>
            <div>FSU: <strong>${p.department}</strong></div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 8px 0;">1. Lương cơ bản</td>
            <td style="text-align: right; font-weight: 700;">${formatCurrency(p.basic_salary)}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 8px 0;">2. Phụ cấp công việc & ăn trưa</td>
            <td style="text-align: right; font-weight: 700;">${formatCurrency(p.allowance)}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 8px 0;">3. Thưởng hiệu suất (Incentive)</td>
            <td style="text-align: right; font-weight: 700;">${formatCurrency(p.bonus)}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 8px 0; color: var(--fpt-red);">4. Khấu trừ Thuế TNCN (10%)</td>
            <td style="text-align: right; color: var(--fpt-red); font-weight: 700;">-${formatCurrency(p.tax)}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 8px 0; color: var(--fpt-red);">5. Khấu trừ Bảo hiểm bắt buộc (10.5%)</td>
            <td style="text-align: right; color: var(--fpt-red); font-weight: 700;">-${formatCurrency(p.insurance)}</td>
          </tr>
          <tr style="background: var(--bg-input); font-size: 16px; font-weight: 800;">
            <td style="padding: 12px 8px; color: var(--fpt-green);">THỰC NHẬN (NET SALARY)</td>
            <td style="padding: 12px 8px; text-align: right; color: var(--fpt-green);">${formatCurrency(p.net_salary)}</td>
          </tr>
        </table>
      </div>
    `;

    modal.classList.add('active');
    document.getElementById('closePayslipBtn').onclick = () => modal.classList.remove('active');
  }

  async function loadPerformanceReviews() {
    applyRbacUI(Auth.currentUser);
    const res = await API.getPerformanceReviews();
    const tbody = document.getElementById('performanceTableBody');
    if (!tbody || !res.success) return;

    tbody.innerHTML = res.data.map(r => `
      <tr>
        <td><strong>${r.employee_name}</strong> (${r.employee_id})</td>
        <td><span class="badge badge-dept">${r.review_period}</span></td>
        <td>${r.communication_score}/10</td>
        <td>${r.technical_score}/10</td>
        <td>${r.teamwork_score}/10</td>
        <td>${r.leadership_score}/10</td>
        <td><strong>${r.kpi_score} / 100</strong></td>
        <td><span class="badge badge-status active">${r.rating}</span></td>
        <td>${r.comments || ''}</td>
      </tr>
    `).join('');
  }

  async function loadCourses() {
    applyRbacUI(Auth.currentUser);
    const res = await API.getCourses();
    const container = document.getElementById('coursesContainer');
    if (container && res.success) {
      if (res.data.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); grid-column: 1 / -1; text-align: center;">Chưa có khóa đào tạo nào.</p>';
      } else {
        container.innerHTML = res.data.map(c => `
          <div class="stat-card" style="flex-direction: column; align-items: flex-start; gap: 10px;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
              <span class="badge badge-dept"><i class="fas fa-clock"></i> ${c.duration || 'N/A'}</span>
              <span class="badge badge-status active">${c.certificate_name ? 'Chứng chỉ' : 'Khóa học'}</span>
            </div>
            <h3 style="font-size: 16px; font-weight: 800;">${c.title}</h3>
            <p style="font-size: 12px; color: var(--text-muted);"><i class="fas fa-chalkboard-teacher"></i> Giảng viên: <strong>${c.trainer || 'Chưa cập nhật'}</strong></p>
            <p style="font-size: 12px; color: var(--text-light);">${c.description || ''}</p>
            <button class="btn-primary enroll-course-btn" data-id="${c.id}" style="margin-top: 10px; width: 100%; justify-content: center; font-size: 12px;">
              <i class="fas fa-pen-alt"></i> Đăng ký tham gia
            </button>
          </div>
        `).join('');

        container.querySelectorAll('.enroll-course-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const res = await API.enrollCourse(id);
            if (res.success) {
              showToast(res.message, 'success');
              loadTrainingResults();
            } else {
              showToast(res.message || 'Lỗi đăng ký khóa học', 'error');
            }
          });
        });
      }
    }

    await loadTrainingResults();
  }

  async function loadTrainingResults() {
    const resultsTbody = document.getElementById('trainingResultsTableBody');
    if (!resultsTbody) return;

    const res = await API.getTrainingResults();
    if (!res.success || !res.data || res.data.length === 0) {
      resultsTbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-light); padding: 20px;">Chưa có dữ liệu kết quả đào tạo.</td></tr>`;
      return;
    }

    resultsTbody.innerHTML = res.data.map((r, index) => {
      const statusBadge = r.status === 'Completed'
        ? '<span class="badge badge-status active">Đã hoàn thành</span>'
        : '<span class="badge badge-status probation">Đang học</span>';
      return `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${r.employee_name || r.employee_id}</strong></td>
          <td><span class="badge badge-dept">${r.department || 'N/A'}</span></td>
          <td><strong>${r.course_title}</strong></td>
          <td>${r.trainer || 'N/A'}</td>
          <td>${r.certificate_name || 'N/A'}</td>
          <td>${statusBadge}</td>
          <td><strong style="color: var(--primary-fpt);">${r.score !== null ? r.score : 0}/100</strong></td>
        </tr>
      `;
    }).join('');
  }

  async function loadRecruitment() {
    applyRbacUI(Auth.currentUser);
    const res = await API.getCandidates();
    const tbody = document.getElementById('recruitmentTableBody');
    if (!tbody || !res.success) return;

    const isHrOrAdmin = Auth.currentUser && (Auth.currentUser.role === 'Admin' || Auth.currentUser.role === 'HR');

    tbody.innerHTML = res.data.map(c => `
      <tr>
        <td><strong>${c.full_name}</strong></td>
        <td>${c.email} | ${c.phone || ''}</td>
        <td><span class="badge badge-dept">${c.position_applied}</span></td>
        <td><span class="badge badge-status probation">${c.stage}</span></td>
        <td>${c.interviewer || ''}</td>
        <td>${c.notes || ''}</td>
        <td>
          ${isHrOrAdmin ? `
            <select class="change-stage-select" data-id="${c.id}" style="padding: 4px 8px; font-size: 11px; border-radius: 4px; border: 1px solid var(--border-color);">
              <option value="Candidate" ${c.stage === 'Candidate' ? 'selected' : ''}>Hồ sơ mới</option>
              <option value="Phone Screen" ${c.stage === 'Phone Screen' ? 'selected' : ''}>Phỏng vấn HR</option>
              <option value="Tech Interview" ${c.stage === 'Tech Interview' ? 'selected' : ''}>Phỏng vấn Tech</option>
              <option value="Offer" ${c.stage === 'Offer' ? 'selected' : ''}>Offer</option>
              <option value="Hired" ${c.stage === 'Hired' ? 'selected' : ''}>Đã tuyển dụng</option>
            </select>
          ` : '<span style="font-size:12px; color:var(--text-light);"><i class="fas fa-eye"></i> Xem</span>'}
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.change-stage-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const stage = e.currentTarget.value;
        const res = await API.updateCandidateStage(id, stage);
        if (res.success) {
          showToast(res.message, 'success');
          loadRecruitment();
        }
      });
    });
  }

  async function loadAssets() {
    applyRbacUI(Auth.currentUser);
    const res = await API.getAssets();
    const tbody = document.getElementById('assetsTableBody');
    if (!tbody || !res.success) return;

    state.assets = res.data;
    const isHrOrAdmin = Auth.currentUser && (Auth.currentUser.role === 'Admin' || Auth.currentUser.role === 'HR');

    tbody.innerHTML = res.data.map(a => `
      <tr>
        <td><strong>${a.asset_code}</strong></td>
        <td>${a.name}</td>
        <td><span class="badge badge-dept">${a.category}</span></td>
        <td><code>${a.serial_number || 'N/A'}</code></td>
        <td>${a.assigned_to ? `<strong>${a.assigned_to}</strong>` : '<span style="color:var(--text-light);">Chưa cấp</span>'}</td>
        <td><span class="badge badge-status ${a.status === 'Assigned' ? 'active' : 'probation'}">${a.status}</span></td>
        <td>
          ${isHrOrAdmin ? (
            a.status === 'Assigned' 
              ? `<button class="btn-secondary revoke-asset-btn" data-id="${a.id}" style="padding: 4px 8px; font-size: 11px;"><i class="fas fa-undo"></i> Thu hồi</button>` 
              : `<button class="btn-primary assign-this-asset-btn" data-id="${a.id}" style="padding: 4px 8px; font-size: 11px;"><i class="fas fa-hand-holding"></i> Cấp phát</button>`
          ) : '<i class="fas fa-lock"></i>'}
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.revoke-asset-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Xác nhận thu hồi thiết bị này về kho?')) {
          const res = await API.revokeAsset(id);
          if (res.success) {
            showToast(res.message, 'success');
            loadAssets();
          }
        }
      });
    });

    document.querySelectorAll('.assign-this-asset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        populateAssetSelect('assignAssetSelect');
        populateEmployeeSelect('assignAssetEmpSelect');
        const assetSel = document.getElementById('assignAssetSelect');
        if (assetSel) assetSel.value = id;
        document.getElementById('assignAssetModal')?.classList.add('active');
      });
    });
  }

  async function loadNotifications() {
    const res = await API.getNotifications();
    const container = document.getElementById('notificationsList');
    if (!container || !res.success) return;

    const notifBadge = document.getElementById('notifBadge');
    if (notifBadge) notifBadge.textContent = res.unreadCount || 0;

    if (!res.data || res.data.length === 0) {
      container.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 28px; text-align: center; color: var(--text-muted);">
          <i class="fas fa-bell-slash" style="font-size: 28px; margin-bottom: 10px; display: block; color: var(--text-light);"></i>
          Không có thông báo mới nào.
        </div>
      `;
      return;
    }

    container.innerHTML = res.data.map(n => `
      <div style="background: var(--bg-card); border: 1px solid ${!n.is_read ? 'var(--primary-fpt)' : 'var(--border-color)'}; border-radius: 8px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="font-size: 14px; font-weight: 700; color: var(--primary-fpt);"><i class="fas fa-info-circle"></i> ${n.title}</h4>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${n.message}</p>
          <span style="font-size: 11px; color: var(--text-light); margin-top: 6px; display: inline-block;">${new Date(n.created_at).toLocaleString('vi-VN')}</span>
        </div>
        <div>
          ${!n.is_read ? `
            <button class="btn-primary mark-single-read-btn" data-id="${n.id}" style="padding: 5px 12px; font-size: 12px;">
              <i class="fas fa-check"></i> Đánh dấu đã đọc
            </button>
          ` : '<span class="badge" style="background: var(--bg-input);">Đã đọc</span>'}
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.mark-single-read-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const r = await API.markNotificationRead(id);
        if (r.success) {
          loadNotifications();
        }
      });
    });

    const markAllBtn = document.getElementById('markAllNotificationsReadBtn');
    if (markAllBtn) {
      markAllBtn.onclick = async () => {
        const r = await API.markAllNotificationsRead();
        if (r.success) {
          showToast(r.message, 'success');
          loadNotifications();
        } else {
          showToast(r.message || 'Lỗi cập nhật thông báo', 'error');
        }
      };
    }
  }

  async function loadProfile() {
    applyRbacUI(Auth.currentUser);

    // Fetch fresh user data from server
    let user = Auth.currentUser;
    const userRes = await API.getCurrentUser();
    if (userRes.success && userRes.data) {
      user = userRes.data;
      Auth.currentUser = user;
      localStorage.setItem('fsoft_user', JSON.stringify(user));
      Auth.updateUI(user);
    }

    if (!user) return;

    // Header Profile Elements
    const avatarEl = document.getElementById('profileHeaderAvatar');
    if (avatarEl) {
      avatarEl.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`;
    }
    const fullNameEl = document.getElementById('profileHeaderFullName');
    if (fullNameEl) fullNameEl.textContent = user.fullName || user.username || '--';

    const roleBadgeEl = document.getElementById('profileHeaderRoleBadge');
    if (roleBadgeEl) roleBadgeEl.textContent = user.role || 'Employee';

    const usernameEl = document.getElementById('profileHeaderUsername');
    if (usernameEl) usernameEl.textContent = `@${user.username}`;

    const empIdEl = document.getElementById('profileHeaderEmpId');
    if (empIdEl) empIdEl.textContent = user.employeeId || '--';

    const deptEl = document.getElementById('profileHeaderDept');
    if (deptEl) deptEl.textContent = user.department || 'FSOFT';

    const levelEl = document.getElementById('profileHeaderLevel');
    if (levelEl) levelEl.textContent = user.level || 'Middle';

    const joinDateEl = document.getElementById('profileHeaderJoinDate');
    if (joinDateEl) {
      joinDateEl.textContent = user.joinDate || '15/01/2026';
    }

    // Form inputs
    const inputFullName = document.getElementById('profileInputFullName');
    if (inputFullName) inputFullName.value = user.fullName || '';

    const inputEmail = document.getElementById('profileInputEmail');
    if (inputEmail) inputEmail.value = user.email || '';

    const inputPhone = document.getElementById('profileInputPhone');
    if (inputPhone) inputPhone.value = user.phone || '';

    const selectGender = document.getElementById('profileSelectGender');
    if (selectGender) selectGender.value = user.gender || 'Nam';

    const inputBirthday = document.getElementById('profileInputBirthday');
    if (inputBirthday) inputBirthday.value = user.birthday || '';

    const inputPosition = document.getElementById('profileInputPosition');
    if (inputPosition) inputPosition.value = user.position || user.role || '';

    const inputAddress = document.getElementById('profileInputAddress');
    if (inputAddress) inputAddress.value = user.address || '';

    // Admin utilities (PostgreSQL connection check + Audit logs)
    if (user.role === 'Admin') {
      const res = await API.getDbStatus();
      const card = document.getElementById('postgresStatusCard');
      if (card) {
        if (res.success) {
          card.innerHTML = `
            <div style="color: var(--fpt-green); font-weight: 700; font-size: 13px; margin-top: 6px;">
              <i class="fas fa-check-circle"></i> PostgreSQL Database đang kết nối hoạt động bình thường!
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              CSDL: <strong>${res.data?.database || 'fsoft_db'}</strong> | Host: localhost:5432 | Độ trễ: <strong>${res.data?.latencyMs || 0}ms</strong>
            </div>
          `;
        } else {
          card.innerHTML = `
            <div style="color: var(--fpt-red); font-weight: 700; font-size: 13px; margin-top: 6px;">
              <i class="fas fa-exclamation-triangle"></i> Lỗi kết nối PostgreSQL: ${escapeHtml(res.message)}
            </div>
          `;
        }
      }

      const auditLogsTbody = document.getElementById('auditLogsTableBody');
      if (auditLogsTbody) {
        const logsRes = await API.getAuditLogs();
        if (logsRes.success && logsRes.data && logsRes.data.length > 0) {
          auditLogsTbody.innerHTML = logsRes.data.map(log => {
            const actionBadge = log.action === 'LOGIN'
              ? '<span class="badge badge-status active">LOGIN</span>'
              : (log.action === 'CHANGE_PASSWORD' ? '<span class="badge badge-status probation">SECURITY</span>' : '<span class="badge badge-dept">' + escapeHtml(log.action) + '</span>');
            const timeStr = log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : 'Vừa xong';
            return `
              <tr>
                <td>${timeStr}</td>
                <td><strong>${escapeHtml(log.username || 'System')}</strong></td>
                <td>${actionBadge}</td>
                <td>${escapeHtml(log.entity || 'General')}</td>
                <td>${escapeHtml(log.details || '')}</td>
              </tr>
            `;
          }).join('');
        } else {
          auditLogsTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-light); padding: 16px;">Chưa có nhật ký hoạt động nào.</td></tr>`;
        }
      }
    }
  }

  // Backward compatibility
  async function loadSettings() {
    await loadProfile();
  }

  function formatCurrency(amount) {
    const num = Math.max(0, parseFloat(amount) || 0);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
