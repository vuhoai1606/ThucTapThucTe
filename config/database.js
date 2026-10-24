const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'fsoft_db',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL Pool Error:', err.message);
});

const createTablesSQL = `
  -- 1. BẢNG USERS TRUNG TÂM (Hợp nhất Tài khoản + Hồ sơ nhân sự + 4 Vai trò RBAC)
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) DEFAULT 'Employee', -- 'Admin', 'HR', 'Project Manager', 'Employee'
    employee_id VARCHAR(20) UNIQUE,
    department VARCHAR(50) DEFAULT 'GAT',
    position VARCHAR(100) DEFAULT 'Developer',
    level VARCHAR(30) DEFAULT 'Middle',
    salary NUMERIC(15, 2) DEFAULT 0 CHECK (salary >= 0),
    phone VARCHAR(20),
    avatar TEXT,
    gender VARCHAR(10) DEFAULT 'Nam',
    birthday DATE,
    address TEXT,
    citizen_id VARCHAR(20),
    join_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Active',
    cv_url TEXT,
    contract_url TEXT,
    certificate_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 2. REFRESH TOKENS (Quản lý phiên đăng nhập bảo mật)
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 3. PHÒNG BAN FSU (GAT, GST, DBS, GAM, HR)
  CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manager_name VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active'
  );

  -- 4. CHỨC DANH & BẬC LƯƠNG TIÊU CHUẨN (POSITIONS)
  CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    level VARCHAR(30) DEFAULT 'Middle',
    salary_grade VARCHAR(20) DEFAULT 'SG-03',
    description TEXT
  );

  -- 5. DỰ ÁN PHẦN MỀM (PROJECTS)
  CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    client_name VARCHAR(100),
    country VARCHAR(50) DEFAULT 'Japan',
    department VARCHAR(50) NOT NULL,
    pm_name VARCHAR(100),
    leader_name VARCHAR(100),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(30) DEFAULT 'In Progress',
    budget NUMERIC(15, 2) DEFAULT 0,
    technology TEXT,
    description TEXT,
    progress INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 6. PHÂN BỔ NGUỒN LỰC DỰ ÁN (PROJECT MEMBERS & WORKLOAD %)
  CREATE TABLE IF NOT EXISTS project_members (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(20) REFERENCES projects(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) NOT NULL,
    role_in_project VARCHAR(50),
    allocation_percentage INT CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    start_date DATE,
    end_date DATE
  );

  -- 7. QUY TRÌNH NGHỈ PHÉP (LEAVE REQUESTS WORKFLOW)
  CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    leave_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT DEFAULT 1,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'Pending PM',
    pm_approved BOOLEAN DEFAULT NULL,
    hr_approved BOOLEAN DEFAULT NULL,
    current_step VARCHAR(30) DEFAULT 'PM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 8. BẢNG LƯƠNG & PHIẾU LƯƠNG (PAYROLL & PAYSLIP)
  CREATE TABLE IF NOT EXISTS payroll (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    month_year VARCHAR(10) NOT NULL,
    basic_salary NUMERIC(15, 2) DEFAULT 0 CHECK (basic_salary >= 0),
    allowance NUMERIC(15, 2) DEFAULT 0,
    ot_pay NUMERIC(15, 2) DEFAULT 0,
    bonus NUMERIC(15, 2) DEFAULT 0,
    tax NUMERIC(15, 2) DEFAULT 0,
    insurance NUMERIC(15, 2) DEFAULT 0,
    net_salary NUMERIC(15, 2) DEFAULT 0 CHECK (net_salary >= 0),
    status VARCHAR(20) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_emp_month UNIQUE(employee_id, month_year)
  );

  -- 9. ĐÁNH GIÁ HIỆU SUẤT KPI (PERFORMANCE REVIEWS)
  CREATE TABLE IF NOT EXISTS performance_reviews (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    employee_name VARCHAR(100),
    reviewer_name VARCHAR(100),
    review_period VARCHAR(30),
    communication_score INT DEFAULT 8,
    technical_score INT DEFAULT 8,
    teamwork_score INT DEFAULT 8,
    leadership_score INT DEFAULT 8,
    kpi_score INT CHECK (kpi_score >= 0 AND kpi_score <= 100),
    rating VARCHAR(5),
    comments TEXT,
    review_date DATE DEFAULT CURRENT_DATE
  );

  -- 10. MA TRẬN KỸ NĂNG CÔNG NGHỆ (SKILLS & EMPLOYEE SKILLS)
  CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) DEFAULT 'Technical'
  );

  CREATE TABLE IF NOT EXISTS employee_skills (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
    level INT CHECK (level >= 1 AND level <= 5),
    years INT DEFAULT 1,
    last_updated DATE DEFAULT CURRENT_DATE,
    CONSTRAINT unique_emp_skill UNIQUE(employee_id, skill_id)
  );

  -- 11. ĐÀO TẠO & KHÓA HỌC (COURSES & TRAINING RESULTS)
  CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    trainer VARCHAR(100),
    duration VARCHAR(50),
    certificate_name VARCHAR(100),
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS training_results (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'In Progress',
    score INT DEFAULT 0,
    completion_date DATE
  );

  -- 12. BẢNG TÀI SẢN & CẤP PHÁT HỢP NHẤT (ASSETS)
  CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'Laptop',
    serial_number VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Available',
    assigned_to VARCHAR(20),
    assigned_date DATE,
    notes TEXT
  );

  -- 13. TUYỂN DỤNG ỨNG VIÊN (RECRUITMENT)
  CREATE TABLE IF NOT EXISTS recruitment_candidates (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    position_applied VARCHAR(100),
    stage VARCHAR(30) DEFAULT 'Candidate',
    interview_date TIMESTAMP,
    interviewer VARCHAR(100),
    notes TEXT
  );

  -- 14. THÔNG BÁO HỆ THỐNG (NOTIFICATIONS)
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 15. NHẬT KÝ KIỂM TRA BẢO MẬT (AUDIT LOGS)
  CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const migrationAlterSQL = `
  -- Dọn dẹp các bảng cũ / dư thừa không còn sử dụng
  DROP TABLE IF EXISTS attendance CASCADE;
  DROP TABLE IF EXISTS role_permissions CASCADE;
  DROP TABLE IF EXISTS permissions CASCADE;
  DROP TABLE IF EXISTS roles CASCADE;
  DROP TABLE IF EXISTS asset_assignments CASCADE;

  -- Ensure users table has all required columns
  ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT 'GAT';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(100) DEFAULT 'Developer';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS level VARCHAR(30) DEFAULT 'Middle';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS salary NUMERIC(15, 2) DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'Nam';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS citizen_id VARCHAR(20);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS cv_url TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS contract_url TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS certificate_url TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

  -- ĐẢM BẢO LƯƠNG KHÔNG BAO GIỜ ÂM
  UPDATE users SET salary = ABS(salary) WHERE salary < 0;
  UPDATE payroll SET basic_salary = ABS(basic_salary), net_salary = ABS(net_salary) WHERE basic_salary < 0 OR net_salary < 0;

  -- Ensure projects table has all required columns (khắc phục lỗi start_date does not exist)
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name VARCHAR(100);
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'Japan';
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS pm_name VARCHAR(100);
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS leader_name VARCHAR(100);
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC(15, 2) DEFAULT 0;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS technology TEXT;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;

  -- Ensure assets table has assigned_to column
  ALTER TABLE assets ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(20);
  ALTER TABLE assets ADD COLUMN IF NOT EXISTS assigned_date DATE;
  ALTER TABLE assets ADD COLUMN IF NOT EXISTS notes TEXT;

  -- Ensure performance_reviews has detail score columns
  ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS communication_score INT DEFAULT 8;
  ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS technical_score INT DEFAULT 8;
  ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS teamwork_score INT DEFAULT 8;
  ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS leadership_score INT DEFAULT 8;

  -- Ensure leave_requests table has pm_approved & hr_approved columns and 2-step workflow (PM -> HR)
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS pm_approved BOOLEAN DEFAULT NULL;
  ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS hr_approved BOOLEAN DEFAULT NULL;
  ALTER TABLE leave_requests ALTER COLUMN status SET DEFAULT 'Pending PM';
  ALTER TABLE leave_requests ALTER COLUMN current_step SET DEFAULT 'PM';
  UPDATE leave_requests SET status = 'Pending PM', current_step = 'PM' WHERE current_step = 'Leader' OR status = 'Pending Leader';

  -- Recreate view cleanly for backward compatibility
  DROP VIEW IF EXISTS employees CASCADE;
  CREATE VIEW employees AS 
    SELECT 
      COALESCE(employee_id, 'FSOFT' || LPAD(id::text, 3, '0')) as id,
      id as user_id,
      full_name,
      birthday,
      gender,
      phone,
      email,
      address,
      citizen_id,
      department,
      position,
      role,
      level,
      join_date,
      status,
      avatar,
      cv_url,
      contract_url,
      certificate_url,
      salary,
      created_at,
      updated_at
    FROM users;
`;

let isInitialized = false;

async function autoInitSchema() {
  if (isInitialized) return;
  try {
    const client = await pool.connect();
    try {
      console.log('🔄 Đang rà soát và đồng bộ hóa CSDL PostgreSQL...');
      await client.query(createTablesSQL);
      await client.query(migrationAlterSQL);

      // Seed 4 Core Role Accounts & All Employees as Users
      console.log('🔑 Nạp và cập nhật tài khoản vào bảng "users"...');
      const accounts = [
        { empId: 'FSOFT000', user: 'admin', pass: 'admin123', name: 'Quản trị viên FSOFT', role: 'Admin', email: 'admin@fpt.com', dept: 'HR', pos: 'System Admin', level: 'Manager', salary: 40000000 },
        { empId: 'FSOFT006', user: 'hr', pass: 'hr123', name: 'Trần Thị Hồng (HR)', role: 'HR', email: 'hr@fpt.com', dept: 'HR', pos: 'HR Specialist', level: 'Middle', salary: 18000000 },
        { empId: 'FSOFT001', user: 'pm', pass: 'pm123', name: 'Nguyễn Văn Hoàng (PM)', role: 'Project Manager', email: 'pm@fpt.com', dept: 'GAT', pos: 'Project Manager', level: 'Manager', salary: 35000000 },
        { empId: 'FSOFT003', user: 'employee', pass: 'emp123', name: 'Phạm Minh Developer', role: 'Employee', email: 'employee@fpt.com', dept: 'GAT', pos: 'Senior Developer', level: 'Senior', salary: 22000000 },
        { empId: 'FSOFT002', user: 'anhhd', pass: '123456', name: 'Hoàng Đức Anh', role: 'Employee', email: 'anhhd@fpt.com', dept: 'GAT', pos: 'Tech Lead', level: 'Lead', salary: 28000000 },
        { empId: 'FSOFT004', user: 'maitt', pass: '123456', name: 'Trần Thị Mai', role: 'Employee', email: 'maitt@fpt.com', dept: 'GST', pos: 'Solution Architect', level: 'Senior', salary: 32000000 },
        { empId: 'FSOFT005', user: 'tuanla', pass: '123456', name: 'Lê Anh Tuấn', role: 'Employee', email: 'tuanla@fpt.com', dept: 'DBS', pos: 'Fullstack Developer', level: 'Middle', salary: 20000000 }
      ];

      for (const acc of accounts) {
        const passHash = await bcrypt.hash(acc.pass, 10);
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(acc.name)}`;
        await client.query(`
          INSERT INTO users (username, email, password_hash, full_name, role, department, position, level, salary, avatar, employee_id, status, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Active', true)
          ON CONFLICT (username) 
          DO UPDATE SET 
            role = EXCLUDED.role,
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            department = EXCLUDED.department,
            position = EXCLUDED.position,
            level = EXCLUDED.level,
            avatar = EXCLUDED.avatar,
            employee_id = EXCLUDED.employee_id;
        `, [acc.user, acc.email, passHash, acc.name, acc.role, acc.dept, acc.pos, acc.level, acc.salary, avatar, acc.empId]);
      }

      // Seed Departments
      const deptCheck = await client.query(`SELECT COUNT(*) FROM departments`);
      if (parseInt(deptCheck.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO departments (id, name, manager_name, description) VALUES
            ('GAT', 'Global Automotive Technology (GAT)', 'Nguyễn Văn Hoàng', 'Phát triển phần mềm ô tô Autosar, Cockpit OS'),
            ('GST', 'Global Smart Technology (GST)', 'Trần Thị Mai', 'Giải pháp IoT, AI & Smart Factory'),
            ('DBS', 'Digital Banking Solutions (DBS)', 'Lê Anh Tuấn', 'Chuyển đổi số Ngân hàng & Tài chính'),
            ('GAM', 'Global Aerospace & Mechanical (GAM)', 'Đỗ Quang Minh', 'Hàng không vũ trụ & Điều khiển tự động'),
            ('HR', 'Human Resources Division', 'Trần Thị Hồng', 'Quản trị nhân sự & chính sách đãi ngộ')
          ON CONFLICT (id) DO NOTHING;
        `);
      }

      // Seed Positions (Khắc phục lỗi relation positions does not exist)
      const posCheck = await client.query(`SELECT COUNT(*) FROM positions`);
      if (parseInt(posCheck.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO positions (title, level, salary_grade, description) VALUES
            ('Software Engineer', 'Junior', 'SG-01', 'Lập trình viên sơ cấp'),
            ('Senior Developer', 'Senior', 'SG-03', 'Lập trình viên cấp cao'),
            ('Tech Lead', 'Lead', 'SG-04', 'Trưởng nhóm kỹ thuật'),
            ('Project Manager', 'Manager', 'SG-05', 'Quản lý dự án'),
            ('HR Specialist', 'Middle', 'SG-02', 'Chuyên viên nhân sự'),
            ('Solution Architect', 'Senior', 'SG-04', 'Kiến trúc sư giải pháp phần mềm')
          ON CONFLICT DO NOTHING;
        `);
      }

      // Seed Skills
      const skillCheck = await client.query(`SELECT COUNT(*) FROM skills`);
      if (parseInt(skillCheck.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO skills (name, category) VALUES
            ('Java', 'Programming'),
            ('.NET', 'Programming'),
            ('Python', 'Programming'),
            ('React', 'Frontend'),
            ('Angular', 'Frontend'),
            ('Docker', 'Cloud/DevOps'),
            ('AWS', 'Cloud/DevOps'),
            ('Azure', 'Cloud/DevOps'),
            ('JLPT', 'Language'),
            ('IELTS', 'Language')
          ON CONFLICT (name) DO NOTHING;
        `);
      }

      // Seed Employee Skills
      const empSkillCheck = await client.query(`SELECT COUNT(*) FROM employee_skills`);
      if (parseInt(empSkillCheck.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO employee_skills (employee_id, skill_id, level, years) VALUES
            ('FSOFT001', 1, 5, 6),
            ('FSOFT001', 6, 4, 4),
            ('FSOFT002', 1, 5, 5),
            ('FSOFT003', 4, 5, 4),
            ('FSOFT004', 3, 5, 5)
          ON CONFLICT DO NOTHING;
        `);
      }

      // Seed Projects
      const projCheck = await client.query(`SELECT COUNT(*) FROM projects`);
      if (parseInt(projCheck.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO projects (id, name, client_name, country, department, pm_name, leader_name, start_date, end_date, status, budget, technology, progress) VALUES
            ('PRJ-GAT-01', 'Autosar Adaptive Core V5', 'Toyota Motors', 'Japan', 'GAT', 'Nguyễn Văn Hoàng', 'Hoàng Đức Anh', '2026-01-01', '2026-12-31', 'In Progress', 500000, 'C++, Adaptive Autosar, Linux', 78),
            ('PRJ-GAT-02', 'Toyota Next-Gen Cockpit OS', 'Toyota Motors', 'Japan', 'GAT', 'Nguyễn Văn Hoàng', 'Hoàng Đức Anh', '2026-03-01', '2026-10-31', 'In Progress', 350000, 'Android Automotive, Qt, C++', 62),
            ('PRJ-GST-01', 'Smart Factory IoT Gateway', 'Bosch Global', 'Germany', 'GST', 'Trần Thị Mai', 'Trần Thị Mai', '2025-06-01', '2026-05-31', 'Completed', 280000, 'Python, MQTT, AWS IoT', 100)
          ON CONFLICT (id) DO NOTHING;
        `);
      }

      // Seed Sample Assets
      const assetCheck = await client.query(`SELECT COUNT(*) FROM assets`);
      if (parseInt(assetCheck.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO assets (asset_code, name, category, serial_number, status, assigned_to, assigned_date) VALUES
            ('AST-001', 'Dell Latitude 7420 i7 16GB', 'Laptop', 'SN-DELL-7420-01', 'Assigned', 'FSOFT003', '2026-01-15'),
            ('AST-002', 'MacBook Pro 14 M2 Pro 32GB', 'Laptop', 'SN-MBP-14-M2-02', 'Assigned', 'FSOFT001', '2026-02-01'),
            ('AST-003', 'Dell UltraSharp 27 4K U2723QE', 'Monitor', 'SN-DELL-U27-03', 'Available', NULL, NULL),
            ('AST-004', 'Lenovo ThinkPad P1 Gen 5', 'Workstation', 'SN-THINKPAD-P1-04', 'Available', NULL, NULL)
          ON CONFLICT (asset_code) DO NOTHING;
        `);
      }

      // Seed Sample Audit Logs
      const auditCheck = await client.query(`SELECT COUNT(*) FROM audit_logs`);
      if (parseInt(auditCheck.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO audit_logs (username, action, entity, details, ip_address) VALUES
            ('admin', 'SYSTEM_INIT', 'System', 'Hệ thống FSOFT HRMS khởi tạo thành công CSDL PostgreSQL', '127.0.0.1'),
            ('admin', 'LOGIN', 'Auth', 'Đăng nhập hệ thống quản trị', '127.0.0.1');
        `);
      }

      isInitialized = true;
      console.log('✅ Đã tối ưu hóa hoàn tất CSDL: Đồng bộ positions, projects, users không âm!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Lỗi khởi tạo CSDL PostgreSQL:', error.message);
  }
}

// Trigger auto init
autoInitSchema();

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  autoInitSchema
};
