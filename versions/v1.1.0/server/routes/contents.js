const express = require('express');
const router = express.Router();
const db = require('../db');

function buildFilters(query) {
  const clauses = [];
  const params = [];
  if (query.date) {
    clauses.push('date(c.created_at) = ?');
    params.push(query.date);
  }
  if (query.person) {
    clauses.push('c.person_id = ?');
    params.push(query.person);
  }
  if (query.source) {
    clauses.push('c.source_type = ?');
    params.push(query.source);
  }
  if (query.stance) {
    clauses.push('s.stance = ?');
    params.push(query.stance);
  }
  if (query.q) {
    clauses.push('(c.title LIKE ? OR c.body LIKE ?)');
    const like = `%${query.q}%`;
    params.push(like, like);
  }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  return { where, params };
}

// GET /api/contents
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const { where, params } = buildFilters(req.query);
  const rows = db.prepare(`
    SELECT c.*, p.name as person_name, s.stance, s.score, s.summary
    FROM contents c
    LEFT JOIN people p ON c.person_id = p.id
    LEFT JOIN signals s ON c.id = s.content_id
    ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);
  res.json({ page, limit, data: rows });
});

// GET /api/contents/:id
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT c.*, p.name as person_name, s.stance, s.score, s.summary, s.reasoning, s.keywords
    FROM contents c
    LEFT JOIN people p ON c.person_id = p.id
    LEFT JOIN signals s ON c.id = s.content_id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST /api/contents/:id/reanalyze
router.post('/:id/reanalyze', (req, res) => {
  const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(req.params.id);
  if (!content) return res.status(404).json({ error: 'Not found' });
  // Delete existing signal so analyzer picks it up
  db.prepare('DELETE FROM signals WHERE content_id = ?').run(req.params.id);
  res.json({ success: true, message: 'Content marked for reanalysis' });
});

module.exports = router;
