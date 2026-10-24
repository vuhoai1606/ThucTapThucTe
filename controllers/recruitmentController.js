const db = require('../config/database');

const RecruitmentController = {
  // GET /api/recruitment/candidates
  async getCandidates(req, res, next) {
    try {
      const { stage } = req.query;
      let query = `SELECT * FROM recruitment_candidates WHERE 1=1`;
      const params = [];
      if (stage) {
        query += ` AND stage = $1`;
        params.push(stage);
      }
      query += ` ORDER BY id DESC`;
      const result = await db.query(query, params);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/recruitment/candidates
  async createCandidate(req, res, next) {
    try {
      const { full_name, email, phone, position_applied, interviewer, notes } = req.body;
      const result = await db.query(
        `INSERT INTO recruitment_candidates (full_name, email, phone, position_applied, stage, interviewer, notes)
         VALUES ($1, $2, $3, $4, 'Candidate', $5, $6) RETURNING *`,
        [full_name, email, phone, position_applied, interviewer || 'HR Specialist', notes || '']
      );
      res.status(201).json({ success: true, message: 'Thêm ứng viên thành công!', data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/recruitment/candidates/:id/stage
  async updateStage(req, res, next) {
    try {
      const { stage, notes } = req.body;
      const result = await db.query(
        `UPDATE recruitment_candidates SET stage = $1, notes = COALESCE($2, notes) WHERE id = $3 RETURNING *`,
        [stage, notes, req.params.id]
      );
      res.json({ success: true, message: `Chuyển trạng thái tuyển dụng sang ${stage}!`, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = RecruitmentController;
