/**
 * Modal Popup Controller Module
 */
export const Modal = {
  modalElement: null,
  formElement: null,
  titleElement: null,

  init() {
    this.modalElement = document.getElementById('employeeModal');
    this.formElement = document.getElementById('employeeForm');
    this.titleElement = document.getElementById('modalTitle');
  },

  open(employee = null) {
    if (!this.modalElement || !this.formElement) return;

    this.formElement.reset();

    if (employee) {
      if (this.titleElement) this.titleElement.textContent = `Chỉnh sửa nhân viên (${employee.id})`;
      document.getElementById('empFullName').value = employee.fullName || '';
      document.getElementById('empEmail').value = employee.email || '';
      document.getElementById('empPhone').value = employee.phone || '';
      document.getElementById('empDepartment').value = employee.department || 'GAT';
      document.getElementById('empRole').value = employee.position || employee.role || '';
      document.getElementById('empSalary').value = employee.salary || '';
      const levelSel = document.getElementById('empLevel');
      if (levelSel) levelSel.value = employee.level || 'Middle';
      const roleSel = document.getElementById('empSystemRole');
      if (roleSel) roleSel.value = employee.role || 'Employee';
    } else {
      if (this.titleElement) this.titleElement.textContent = 'Thêm mới nhân viên FSOFT';
      const roleSel = document.getElementById('empSystemRole');
      if (roleSel) roleSel.value = 'Employee';
    }

    this.modalElement.classList.add('active');
  },

  close() {
    if (this.modalElement) {
      this.modalElement.classList.remove('active');
    }
  }
};
