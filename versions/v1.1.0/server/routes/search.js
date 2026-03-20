const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/search
router.get('/', (req, res) => {
  const { q, person, from, to, source, stance } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  const clauses = ['(c.title LIKE ? OR c.body LIKE ?)'];
  const params = [`%${q}%`, `%${q}%`];

  if (person) { clauses.push('c.person_id = ?'); params.push(person); }
  if (from) { clauses.push('c.published_at >= ?'); params.push(from); }
  if (to) { clauses.push('c.published_at <= ?'); params.push(to); }
  if (source) { clauses.push('c.source_type = ?'); params.push(source); }
  if (stance) { clauses.push('s.stance = ?'); params.push(stance); }

  const where = 'WHERE ' + clauses.join(' AND ');
  const rows = db.prepare(`
    SELECT c.id, c.title, c.body, c.source_type, c.external_id, c.url, c.published_at,
           p.name as person_name, s.stance, s.score, s.summary
    FROM contents c
    LEFT JOIN people p ON c.person_id = p.id
    LEFT JOIN signals s ON c.id = s.content_id
    ${where}
    ORDER BY c.published_at DESC
    LIMIT 100
  `).all(...params);

  res.json(rows);
});

module.exports = router;
