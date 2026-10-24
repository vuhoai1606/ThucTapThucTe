const db = require('../config/database');

const PayrollController = {
  // GET /api/payroll
  async getAll(req, res, next) {
    try {
      const userRole = req.user ? req.user.role : 'Employee';
      const userEmpId = req.user ? req.user.employeeId : null;
      const { month_year } = req.query;
      let targetEmpId = req.query.employee_id;

      // Regular employees can only view their own payroll records
      if (userRole === 'Employee') {
        targetEmpId = userEmpId;
      }

      let query = `
        SELECT p.*, e.full_name as employee_name, e.department, e.position 
        FROM payroll p 
        LEFT JOIN employees e ON p.employee_id = e.id 
        WHERE 1=1
      `;
      const params = [];
      let count = 1;

      if (month_year) {
        query += ` AND p.month_year = $${count}`;
        params.push(month_year);
        count++;
      }

      if (targetEmpId) {
        query += ` AND p.employee_id = $${count}`;
        params.push(targetEmpId);
        count++;
      }

      query += ` ORDER BY p.month_year DESC, e.full_name ASC`;
      const result = await db.query(query, params);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/payroll/generate (Auto-calculate monthly payroll)
  async generateMonthlyPayroll(req, res, next) {
    try {
      const now = new Date();
      const currentMonthYear = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      const monthYear = req.body.month_year || currentMonthYear;

      const empRes = await db.query(`SELECT * FROM employees WHERE status = 'Active'`);
      const employees = empRes.rows;

      let generatedCount = 0;
      for (const emp of employees) {
        const basicSalary = parseFloat(emp.salary) || 20000000;
        const allowance = 2000000; // Fixed FSOFT lunch & tech allowance
        const otPay = 0;
        const bonus = 1000000; // Monthly performance incentive
        const tax = Math.round(basicSalary * 0.1); // Personal income tax est 10%
        const insurance = Math.round(basicSalary * 0.105); // Insurance 10.5%
        const netSalary = Math.max(0, basicSalary + allowance + otPay + bonus - tax - insurance);

        await db.query(`
          INSERT INTO payroll (employee_id, month_year, basic_salary, allowance, ot_pay, bonus, tax, insurance, net_salary, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Approved')
          ON CONFLICT (employee_id, month_year) 
          DO UPDATE SET 
            basic_salary = EXCLUDED.basic_salary, 
            allowance = EXCLUDED.allowance,
            ot_pay = EXCLUDED.ot_pay,
            bonus = EXCLUDED.bonus,
            tax = EXCLUDED.tax,
            insurance = EXCLUDED.insurance,
            net_salary = EXCLUDED.net_salary,
            status = EXCLUDED.status
        `, [emp.id, monthYear, basicSalary, allowance, otPay, bonus, tax, insurance, netSalary]);
        generatedCount++;
      }

      res.json({
        success: true,
        message: `Đã tự động tính toán và tạo phiếu lương cho ${generatedCount} nhân viên kỳ ${monthYear}!`
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/payroll/:id (View individual payslip JSON)
  async getPayslip(req, res, next) {
    try {
      const query = `
        SELECT p.*, e.full_name as employee_name, e.department, e.position, e.email, e.join_date 
        FROM payroll p 
        LEFT JOIN employees e ON p.employee_id = e.id 
        WHERE p.id = $1
      `;
      const result = await db.query(query, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy Phiếu lương!' });
      }

      const payslip = result.rows[0];
      const userRole = req.user ? req.user.role : 'Employee';
      const userEmpId = req.user ? req.user.employeeId : null;

      // Prevent regular employees from reading other people's payslips
      if (userRole === 'Employee' && payslip.employee_id !== userEmpId) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem phiếu lương của nhân viên khác!' });
      }

      res.json({ success: true, data: payslip });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = PayrollController;
