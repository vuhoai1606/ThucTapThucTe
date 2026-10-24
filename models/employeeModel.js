const db = require('../config/database');
const bcrypt = require('bcryptjs');

const EmployeeModel = {
  formatRow(row) {
    if (!row) return null;
    return {
      id: row.employee_id || `FSOFT${String(row.id).padStart(3, '0')}`,
      userId: row.id,
      username: row.username,
      fullName: row.full_name,
      birthday: row.birthday ? new Date(row.birthday).toISOString().split('T')[0] : null,
      gender: row.gender || 'Nam',
      email: row.email,
      phone: row.phone || '',
      address: row.address || '',
      citizenId: row.citizen_id || '',
      avatar: row.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(row.full_name)}`,
      department: row.department || 'GAT',
      position: row.position || 'Developer',
      role: row.role || 'Employee',
      level: row.level || 'Middle',
      status: row.status || 'Active',
      joinDate: row.join_date ? new Date(row.join_date).toISOString().split('T')[0] : null,
      salary: Math.max(0, parseFloat(row.salary) || 0),
      cvUrl: row.cv_url || '',
      contractUrl: row.contract_url || '',
      certificateUrl: row.certificate_url || '',
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async findAll({ search, department, status, level, sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
    let query = `SELECT * FROM users WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (LOWER(full_name) LIKE $${paramCount} OR LOWER(COALESCE(employee_id, '')) LIKE $${paramCount} OR LOWER(email) LIKE $${paramCount} OR LOWER(COALESCE(position, '')) LIKE $${paramCount} OR LOWER(username) LIKE $${paramCount})`;
      params.push(`%${search.toLowerCase()}%`);
      paramCount++;
    }

    if (department && department !== 'ALL') {
      query += ` AND department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (status && status !== 'ALL') {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (level && level !== 'ALL') {
      query += ` AND level = $${paramCount}`;
      params.push(level);
      paramCount++;
    }

    const validColumns = {
      name: 'full_name',
      salary: 'salary',
      joinDate: 'join_date',
      id: 'id',
      created_at: 'created_at'
    };

    const targetSortCol = validColumns[sortBy] || 'created_at';
    const targetOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${targetSortCol} ${targetOrder}`;

    const res = await db.query(query, params);
    return res.rows.map(this.formatRow);
  },

  async findById(id) {
    const res = await db.query(`SELECT * FROM users WHERE employee_id = $1 OR id::text = $1 OR LOWER(username) = LOWER($1)`, [id]);
    return res.rows.length > 0 ? this.formatRow(res.rows[0]) : null;
  },

  async generateNextId() {
    const res = await db.query(`SELECT employee_id FROM users WHERE employee_id LIKE 'FSOFT%'`);
    let maxNum = 0;

    res.rows.forEach(row => {
      if (row.employee_id) {
        const num = parseInt(row.employee_id.replace('FSOFT', ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `FSOFT${nextNum.toString().padStart(3, '0')}`;
  },

  async create(data) {
    const newId = data.id || await this.generateNextId();
    const username = data.username || (data.email ? data.email.split('@')[0] : `user_${newId.toLowerCase()}`);
    const defaultPassword = data.password || '123456';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const avatar = data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.fullName)}`;

    const query = `
      INSERT INTO users (
        employee_id, username, password_hash, email, full_name, role, department, position, level, salary,
        phone, avatar, gender, birthday, address, citizen_id, join_date, status,
        cv_url, contract_url, certificate_url, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, true)
      RETURNING *;
    `;

    const params = [
      newId,
      username,
      passwordHash,
      data.email,
      data.fullName,
      data.role || 'Employee',
      data.department || 'GAT',
      data.position || data.role || 'Developer',
      data.level || 'Middle',
      Math.max(0, parseFloat(data.salary) || 0),
      data.phone || '',
      avatar,
      data.gender || 'Nam',
      data.birthday || null,
      data.address || '',
      data.citizenId || '',
      data.joinDate || new Date(),
      data.status || 'Active',
      data.cvUrl || '',
      data.contractUrl || '',
      data.certificateUrl || ''
    ];

    const res = await db.query(query, params);
    return this.formatRow(res.rows[0]);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    const columnMapping = {
      fullName: 'full_name',
      username: 'username',
      role: 'role',
      birthday: 'birthday',
      gender: 'gender',
      email: 'email',
      phone: 'phone',
      address: 'address',
      citizenId: 'citizen_id',
      avatar: 'avatar',
      department: 'department',
      position: 'position',
      level: 'level',
      status: 'status',
      joinDate: 'join_date',
      salary: 'salary',
      cvUrl: 'cv_url',
      contractUrl: 'contract_url',
      certificateUrl: 'certificate_url'
    };

    Object.keys(columnMapping).forEach(key => {
      if (data[key] !== undefined) {
        let val = data[key];
        if (key === 'salary') val = Math.max(0, parseFloat(val) || 0);
        fields.push(`${columnMapping[key]} = $${paramIndex}`);
        params.push(val);
        paramIndex++;
      }
    });

    if (fields.length === 0) return await this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE employee_id = $${paramIndex} OR id::text = $${paramIndex} OR LOWER(username) = LOWER($${paramIndex})
      RETURNING *;
    `;

    const res = await db.query(query, params);
    return res.rows.length > 0 ? this.formatRow(res.rows[0]) : null;
  },

  async delete(id) {
    const res = await db.query(`DELETE FROM users WHERE employee_id = $1 OR id::text = $1 RETURNING *`, [id]);
    return res.rows.length > 0 ? this.formatRow(res.rows[0]) : null;
  }
};

module.exports = EmployeeModel;
