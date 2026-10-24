const db = require('../config/database');

const ProjectModel = {
  formatRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      clientName: row.client_name || '',
      country: row.country || 'Japan',
      department: row.department,
      pmName: row.pm_name || '',
      leaderName: row.leader_name || '',
      startDate: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : null,
      endDate: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : null,
      status: row.status,
      budget: parseFloat(row.budget) || 0,
      technology: row.technology || '',
      description: row.description || '',
      progress: row.progress || 0,
      createdAt: row.created_at
    };
  },

  async findAll({ search, department, status } = {}) {
    let query = `SELECT * FROM projects WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (LOWER(name) LIKE $${paramCount} OR LOWER(id) LIKE $${paramCount} OR LOWER(client_name) LIKE $${paramCount})`;
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

    query += ` ORDER BY created_at DESC`;

    const res = await db.query(query, params);
    return res.rows.map(this.formatRow);
  },

  async findById(id) {
    const res = await db.query(`SELECT * FROM projects WHERE id = $1`, [id]);
    return res.rows.length > 0 ? this.formatRow(res.rows[0]) : null;
  },

  async generateNextId(dept) {
    const prefix = `PRJ-${dept || 'GAT'}-`;
    const res = await db.query(`SELECT id FROM projects WHERE id LIKE $1`, [`${prefix}%`]);
    let maxNum = 0;

    res.rows.forEach(row => {
      const num = parseInt(row.id.replace(prefix, ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    });

    const nextNum = maxNum + 1;
    return `${prefix}${nextNum.toString().padStart(2, '0')}`;
  },

  async create(data) {
    const newId = data.id || await this.generateNextId(data.department);
    const query = `
      INSERT INTO projects (
        id, name, client_name, country, department, pm_name, leader_name,
        start_date, end_date, status, budget, technology, description, progress
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const params = [
      newId,
      data.name,
      data.clientName || '',
      data.country || 'Japan',
      data.department,
      data.pmName || '',
      data.leaderName || '',
      data.startDate || null,
      data.endDate || null,
      data.status || 'In Progress',
      data.budget || 0,
      data.technology || '',
      data.description || '',
      data.progress || 0
    ];

    const res = await db.query(query, params);
    return this.formatRow(res.rows[0]);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    const columnMapping = {
      name: 'name',
      clientName: 'client_name',
      country: 'country',
      department: 'department',
      pmName: 'pm_name',
      leaderName: 'leader_name',
      startDate: 'start_date',
      endDate: 'end_date',
      status: 'status',
      budget: 'budget',
      technology: 'technology',
      description: 'description',
      progress: 'progress'
    };

    Object.keys(columnMapping).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${columnMapping[key]} = $${paramIndex}`);
        params.push(data[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) return await this.findById(id);

    params.push(id);

    const query = `
      UPDATE projects
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const res = await db.query(query, params);
    return res.rows.length > 0 ? this.formatRow(res.rows[0]) : null;
  },

  async delete(id) {
    const res = await db.query(`DELETE FROM projects WHERE id = $1 RETURNING *`, [id]);
    return res.rows.length > 0 ? this.formatRow(res.rows[0]) : null;
  }
};

module.exports = ProjectModel;
