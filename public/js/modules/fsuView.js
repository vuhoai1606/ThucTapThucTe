/**
 * FSOFT HRMS - FSU & Organizational Management View Module
 */
export const FsuView = {
  api: null,
  toast: null,
  formatCurrency: null,
  currentUser: null,
  departmentsData: [],
  editingDeptId: null,

  init({ api, toast, formatCurrency, currentUser }) {
    this.api = api;
    this.toast = toast;
    this.formatCurrency = formatCurrency;
    this.currentUser = currentUser;

    this.bindEvents();
  },

  bindEvents() {
    // 1. Add Department Button
    const addBtn = document.getElementById('addDeptBtn');
    if (addBtn) {
      addBtn.onclick = () => this.openDeptFormModal(null);
    }

    // 2. Search Input Filter
    const searchInput = document.getElementById('deptSearchInput');
    if (searchInput) {
      searchInput.oninput = (e) => {
        const query = (e.target.value || '').trim().toLowerCase();
        this.filterDepartments(query);
      };
    }

    // 3. Close Detail Modal
    document.getElementById('closeDeptDetailModalBtn')?.addEventListener('click', () => {
      document.getElementById('deptDetailModal')?.classList.remove('active');
    });
    document.getElementById('closeDeptDetailModalFooterBtn')?.addEventListener('click', () => {
      document.getElementById('deptDetailModal')?.classList.remove('active');
    });
    document.getElementById('deptDetailModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'deptDetailModal') {
        e.target.classList.remove('active');
      }
    });

    // 4. Detail Modal Tabs Switching
    const tabEmployeesBtn = document.getElementById('tabBtnDeptEmployees');
    const tabProjectsBtn = document.getElementById('tabBtnDeptProjects');
    const tabEmployeesContent = document.getElementById('deptEmployeesTabContent');
    const tabProjectsContent = document.getElementById('deptProjectsTabContent');

    if (tabEmployeesBtn && tabProjectsBtn) {
      tabEmployeesBtn.onclick = () => {
        tabEmployeesBtn.classList.add('active');
        tabEmployeesBtn.style.borderBottomColor = 'var(--primary-fpt)';
        tabEmployeesBtn.style.color = 'var(--primary-fpt)';

        tabProjectsBtn.classList.remove('active');
        tabProjectsBtn.style.borderBottomColor = 'transparent';
        tabProjectsBtn.style.color = 'var(--text-muted)';

        if (tabEmployeesContent) tabEmployeesContent.style.display = 'block';
        if (tabProjectsContent) tabProjectsContent.style.display = 'none';
      };

      tabProjectsBtn.onclick = () => {
        tabProjectsBtn.classList.add('active');
        tabProjectsBtn.style.borderBottomColor = 'var(--primary-fpt)';
        tabProjectsBtn.style.color = 'var(--primary-fpt)';

        tabEmployeesBtn.classList.remove('active');
        tabEmployeesBtn.style.borderBottomColor = 'transparent';
        tabEmployeesBtn.style.color = 'var(--text-muted)';

        if (tabProjectsContent) tabProjectsContent.style.display = 'block';
        if (tabEmployeesContent) tabEmployeesContent.style.display = 'none';
      };
    }

    // 5. Add / Edit Department Form Modal
    document.getElementById('closeDeptFormModalBtn')?.addEventListener('click', () => {
      document.getElementById('deptFormModal')?.classList.remove('active');
    });
    document.getElementById('cancelDeptFormBtn')?.addEventListener('click', () => {
      document.getElementById('deptFormModal')?.classList.remove('active');
    });
    document.getElementById('deptFormModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'deptFormModal') {
        e.target.classList.remove('active');
      }
    });

    // 6. Submit Department Form
    const deptForm = document.getElementById('deptForm');
    if (deptForm) {
      deptForm.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
          id: document.getElementById('deptIdInput').value.trim().toUpperCase(),
          name: document.getElementById('deptNameInput').value.trim(),
          manager_name: document.getElementById('deptManagerInput').value.trim(),
          description: document.getElementById('deptDescInput').value.trim(),
          status: document.getElementById('deptStatusInput').value
        };

        if (!data.id || !data.name) {
          this.toast('Vui lòng nhập đầy đủ Mã FSU và Tên Đơn vị!', 'error');
          return;
        }

        let res;
        if (this.editingDeptId) {
          res = await this.api.updateDepartment(this.editingDeptId, data);
        } else {
          res = await this.api.createDepartment(data);
        }

        if (res.success) {
          this.toast(res.message || 'Lưu đơn vị FSU thành công!', 'success');
          document.getElementById('deptFormModal')?.classList.remove('active');
          this.loadDepartments();
        } else {
          this.toast(res.message || 'Lỗi khi lưu đơn vị FSU', 'error');
        }
      };
    }
  },

  async loadDepartments() {
    const res = await this.api.getDepartments();
    if (!res.success || !res.data) return;

    this.departmentsData = res.data;

    // Update Top Overview Stats
    const totalDepts = this.departmentsData.length;
    const totalEmps = this.departmentsData.reduce((sum, d) => sum + (parseInt(d.employee_count, 10) || 0), 0);
    const totalProjects = this.departmentsData.reduce((sum, d) => sum + (parseInt(d.project_count, 10) || 0), 0);
    const totalSalary = this.departmentsData.reduce((sum, d) => sum + (parseFloat(d.total_salary) || 0), 0);

    const statTotalDepts = document.getElementById('statTotalDepts');
    const statTotalDeptEmps = document.getElementById('statTotalDeptEmps');
    const statTotalDeptProjects = document.getElementById('statTotalDeptProjects');
    const statTotalDeptSalary = document.getElementById('statTotalDeptSalary');

    if (statTotalDepts) statTotalDepts.textContent = `${totalDepts} Khối`;
    if (statTotalDeptEmps) statTotalDeptEmps.textContent = `${totalEmps} Kỹ Sư`;
    if (statTotalDeptProjects) statTotalDeptProjects.textContent = `${totalProjects} Dự Án`;
    if (statTotalDeptSalary) statTotalDeptSalary.textContent = this.formatCurrency(totalSalary);

    this.renderCards(this.departmentsData);
  },

  renderCards(depts) {
    const container = document.getElementById('fsuContainer');
    if (!container) return;

    if (!depts.length) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <i class="fas fa-search" style="font-size: 32px; color: var(--text-light); margin-bottom: 12px; display: block;"></i>
          <p style="color: var(--text-muted); font-size: 14px;">Không tìm thấy Đơn vị FSU nào phù hợp.</p>
        </div>
      `;
      return;
    }

    const colorClasses = ['orange', 'blue', 'purple', 'green'];
    const isAdmin = this.currentUser && this.currentUser.role === 'Admin';
    const isHrOrAdmin = this.currentUser && (this.currentUser.role === 'Admin' || this.currentUser.role === 'HR');

    container.innerHTML = depts.map((d, index) => {
      const color = colorClasses[index % colorClasses.length];
      const empCount = parseInt(d.employee_count, 10) || 0;
      const projCount = parseInt(d.project_count, 10) || 0;
      const salary = parseFloat(d.total_salary) || 0;

      return `
        <div class="stat-card fsu-card-item" data-id="${d.id}" style="flex-direction: column; align-items: flex-start; gap: 14px; padding: 22px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative;">
          <!-- Top Row: Icon, Badge, Actions -->
          <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="stat-icon ${color}" style="width: 38px; height: 38px; font-size: 16px;">
                <i class="fas fa-building"></i>
              </div>
              <span class="badge badge-dept" style="font-size: 13px; font-weight: 800; letter-spacing: 0.5px;">${d.id}</span>
            </div>

            <div style="display: flex; gap: 6px;">
              ${isHrOrAdmin ? `
                <button class="btn-icon-action edit-dept-btn" data-id="${d.id}" title="Chỉnh sửa đơn vị" style="width: 28px; height: 28px; font-size: 11px;">
                  <i class="fas fa-pen"></i>
                </button>
              ` : ''}
              ${isAdmin ? `
                <button class="btn-icon-action delete delete-dept-btn" data-id="${d.id}" title="Xóa đơn vị" style="width: 28px; height: 28px; font-size: 11px;">
                  <i class="fas fa-trash"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Middle: Name, Manager, Desc -->
          <div>
            <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 4px; color: var(--text-main);">${d.name}</h3>
            <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
              <i class="fas fa-user-tie" style="color: var(--primary-fpt);"></i> Trưởng đơn vị: <strong style="color: var(--text-main);">${d.manager_name || 'Chưa phân công'}</strong>
            </div>
            <p style="font-size: 12px; color: var(--text-light); line-height: 1.5; margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${d.description || 'Đơn vị phần mềm chiến lược trực thuộc FPT Software.'}
            </p>
          </div>

          <!-- Stats Grid inside card -->
          <div style="width: 100%; padding-top: 12px; border-top: 1px solid var(--border-color); display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 12px;">
            <div>
              <span style="color: var(--text-muted); font-size: 11px;">Nhân sự:</span>
              <div style="font-weight: 800; font-size: 14px; color: var(--text-main);">${empCount} NV</div>
            </div>
            <div>
              <span style="color: var(--text-muted); font-size: 11px;">Dự án:</span>
              <div style="font-weight: 800; font-size: 14px; color: var(--primary-fpt);">${projCount} DA</div>
            </div>
            <div>
              <span style="color: var(--text-muted); font-size: 11px;">Quỹ lương:</span>
              <div style="font-weight: 800; font-size: 13px; color: var(--fpt-green);">${this.formatCurrency(salary)}</div>
            </div>
          </div>

          <!-- Bottom Action: Click to inspect -->
          <div style="width: 100%; margin-top: 2px;">
            <button class="btn-secondary view-dept-details-btn" data-id="${d.id}" style="width: 100%; justify-content: center; font-size: 12px; padding: 7px 12px; font-weight: 700;">
              <i class="fas fa-id-card"></i> Xem Chi Tiết & Thành Viên
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind card click & button clicks
    container.querySelectorAll('.fsu-card-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.edit-dept-btn') || e.target.closest('.delete-dept-btn')) {
          return;
        }
        const id = card.getAttribute('data-id');
        if (id) this.openDetailsModal(id);
      });
    });

    container.querySelectorAll('.view-dept-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.openDetailsModal(id);
      });
    });

    container.querySelectorAll('.edit-dept-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const dept = this.departmentsData.find(x => x.id === id);
        if (dept) this.openDeptFormModal(dept);
      });
    });

    container.querySelectorAll('.delete-dept-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm(`Xác nhận xóa đơn vị FSU "${id}"? Lưu ý: Không thể xóa nếu còn nhân sự hoặc dự án thuộc đơn vị!`)) {
          const res = await this.api.deleteDepartment(id);
          if (res.success) {
            this.toast(res.message || 'Xóa đơn vị thành công', 'success');
            this.loadDepartments();
          } else {
            this.toast(res.message || 'Lỗi khi xóa đơn vị', 'error');
          }
        }
      });
    });
  },

  filterDepartments(query) {
    if (!query) {
      this.renderCards(this.departmentsData);
      return;
    }
    const filtered = this.departmentsData.filter(d => 
      (d.id && d.id.toLowerCase().includes(query)) ||
      (d.name && d.name.toLowerCase().includes(query)) ||
      (d.manager_name && d.manager_name.toLowerCase().includes(query)) ||
      (d.description && d.description.toLowerCase().includes(query))
    );
    this.renderCards(filtered);
  },

  async openDetailsModal(deptId) {
    const modal = document.getElementById('deptDetailModal');
    if (!modal) return;

    modal.classList.add('active');

    // Reset view state
    document.getElementById('modalDeptName').textContent = `Đang tải chi tiết đơn vị ${deptId}...`;
    document.getElementById('modalDeptManager').textContent = '';
    document.getElementById('modalDeptDesc').textContent = '';
    document.getElementById('detailTotalEmps').textContent = '--';
    document.getElementById('detailActiveEmps').textContent = '--';
    document.getElementById('detailTotalProjects').textContent = '--';
    document.getElementById('detailTotalSalary').textContent = '--';

    const empTbody = document.getElementById('deptEmployeesTableBody');
    const projTbody = document.getElementById('deptProjectsTableBody');
    if (empTbody) empTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;"><i class="fas fa-spinner fa-spin"></i> Đang tải danh sách nhân sự...</td></tr>`;
    if (projTbody) projTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;"><i class="fas fa-spinner fa-spin"></i> Đang tải danh sách dự án...</td></tr>`;

    // Fetch details
    const res = await this.api.getDepartmentDetails(deptId);
    if (!res.success || !res.data) {
      this.toast(res.message || 'Không thể tải chi tiết đơn vị', 'error');
      modal.classList.remove('active');
      return;
    }

    const { department, employees, projects, stats } = res.data;

    // Fill Header & Stats
    document.getElementById('modalDeptName').innerHTML = `${department.name} <span class="badge badge-dept" style="margin-left: 8px; font-size: 13px;">${department.id}</span>`;
    document.getElementById('modalDeptManager').innerHTML = `<i class="fas fa-user-tie" style="color: var(--primary-fpt);"></i> Trưởng đơn vị: <strong>${department.manager_name || 'Chưa phân công'}</strong> | Trạng thái: <span class="badge badge-status active">${department.status || 'Active'}</span>`;
    document.getElementById('modalDeptDesc').textContent = department.description || 'Đơn vị phần mềm chiến lược trực thuộc FPT Software.';

    document.getElementById('detailTotalEmps').textContent = `${stats.totalEmployees} NV`;
    document.getElementById('detailActiveEmps').textContent = `${stats.activeEmployees} NV`;
    document.getElementById('detailTotalProjects').textContent = `${stats.totalProjects} Dự Án`;
    document.getElementById('detailTotalSalary').textContent = this.formatCurrency(stats.totalSalary);

    document.getElementById('tabEmpCount').textContent = employees.length;
    document.getElementById('tabProjCount').textContent = projects.length;

    // Render Employees Tab
    if (empTbody) {
      if (!employees.length) {
        empTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);"><i class="fas fa-user-slash"></i> Chưa có nhân viên nào trực thuộc đơn vị này.</td></tr>`;
      } else {
        empTbody.innerHTML = employees.map(emp => `
          <tr>
            <td>
              <div class="emp-profile-cell">
                <img src="${emp.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=FPT'}" class="emp-avatar" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=FPT'">
                <div>
                  <div class="emp-name">${emp.full_name}</div>
                  <div class="emp-id-sub">${emp.id}</div>
                </div>
              </div>
            </td>
            <td><strong>${emp.position || 'Developer'}</strong></td>
            <td><span class="badge" style="background: var(--bg-input);">${emp.level || 'Middle'}</span></td>
            <td>
              <div style="font-size: 12px;"><i class="fas fa-envelope"></i> ${emp.email}</div>
              ${emp.phone ? `<div class="emp-id-sub"><i class="fas fa-phone"></i> ${emp.phone}</div>` : ''}
            </td>
            <td>
              <span class="badge badge-status ${emp.status === 'Active' ? 'active' : 'probation'}">${emp.status === 'Active' ? 'Chính thức' : 'Thử việc'}</span>
            </td>
            <td><strong>${this.formatCurrency(emp.salary)}</strong></td>
          </tr>
        `).join('');
      }
    }

    // Render Projects Tab
    if (projTbody) {
      if (!projects.length) {
        projTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);"><i class="fas fa-folder-open"></i> Đơn vị hiện chưa có dự án nào đang chạy.</td></tr>`;
      } else {
        projTbody.innerHTML = projects.map(p => `
          <tr>
            <td><strong style="color: var(--primary-fpt);">${p.id}</strong></td>
            <td>
              <div style="font-weight: 700;">${p.name}</div>
              <div style="font-size: 11px; color: var(--text-muted);">Công nghệ: ${p.technology || 'C++, Java, React'}</div>
            </td>
            <td>${p.client_name || 'FSOFT'} (${p.country || 'Japan'})</td>
            <td><i class="fas fa-user-astronaut"></i> ${p.pm_name || 'PM'}</td>
            <td>
              <div style="font-size: 11px; font-weight: 700; margin-bottom: 2px;">${p.progress || 0}%</div>
              <div style="background: var(--bg-input); height: 6px; border-radius: 3px; width: 90px; overflow: hidden;">
                <div style="width: ${p.progress || 0}%; background: var(--primary-fpt); height: 100%;"></div>
              </div>
            </td>
            <td>
              <span class="badge badge-status ${p.status === 'Completed' ? 'active' : 'probation'}">${p.status || 'In Progress'}</span>
            </td>
          </tr>
        `).join('');
      }
    }
  },

  openDeptFormModal(dept = null) {
    const modal = document.getElementById('deptFormModal');
    if (!modal) return;

    this.editingDeptId = dept ? dept.id : null;
    const titleEl = document.getElementById('deptFormModalTitle');
    const idInput = document.getElementById('deptIdInput');
    const nameInput = document.getElementById('deptNameInput');
    const managerInput = document.getElementById('deptManagerInput');
    const descInput = document.getElementById('deptDescInput');
    const statusInput = document.getElementById('deptStatusInput');

    if (dept) {
      if (titleEl) titleEl.textContent = `Chỉnh sửa Đơn vị FSU: ${dept.id}`;
      if (idInput) {
        idInput.value = dept.id;
        idInput.disabled = true; // Cannot edit primary key
      }
      if (nameInput) nameInput.value = dept.name || '';
      if (managerInput) managerInput.value = dept.manager_name || '';
      if (descInput) descInput.value = dept.description || '';
      if (statusInput) statusInput.value = dept.status || 'Active';
    } else {
      if (titleEl) titleEl.textContent = 'Thêm mới Đơn vị FSU';
      if (idInput) {
        idInput.value = '';
        idInput.disabled = false;
      }
      if (nameInput) nameInput.value = '';
      if (managerInput) managerInput.value = '';
      if (descInput) descInput.value = '';
      if (statusInput) statusInput.value = 'Active';
    }

    modal.classList.add('active');
  }
};

