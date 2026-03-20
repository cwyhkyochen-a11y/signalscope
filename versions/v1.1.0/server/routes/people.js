const express = require('express');
const router = express.Router();
const db = require('../db');

// CRUD for people
router.get('/', (req, res) => {
  const people = db.prepare('SELECT * FROM people').all();
  res.json(people);
});
router.get('/:id', (req, res) => {
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Not found' });
  res.json(person);
});
router.post('/', (req, res) => {
  const { name, bio, tags } = req.body;
  const stmt = db.prepare('INSERT INTO people (name, bio, tags) VALUES (?, ?, ?)');
  const info = stmt.run(name, bio || null, tags || null);
  res.status(201).json({ id: info.lastInsertRowid });
});
router.put('/:id', (req, res) => {
  const { name, bio, tags } = req.body;
  const stmt = db.prepare('UPDATE people SET name = ?, bio = ?, tags = ? WHERE id = ?');
  const info = stmt.run(name, bio || null, tags || null, req.params.id);
  res.json({ changes: info.changes });
});
router.delete('/:id', (req, res) => {
  // Cascade delete: tasks → sources → signals → contents → daily_summaries → person
  const sources = db.prepare('SELECT id FROM sources WHERE person_id = ?').all(req.params.id);
  const sourceIds = sources.map(s => s.id);
  if (sourceIds.length) {
    db.prepare(`DELETE FROM tasks WHERE source_id IN (${sourceIds.map(() => '?').join(',')})`).run(...sourceIds);
    db.prepare(`DELETE FROM sources WHERE id IN (${sourceIds.map(() => '?').join(',')})`).run(...sourceIds);
  }
  db.prepare('DELETE FROM signals WHERE person_id = ?').run(req.params.id);
  db.prepare('DELETE FROM contents WHERE person_id = ?').run(req.params.id);
  db.prepare('DELETE FROM daily_person_summaries WHERE person_id = ?').run(req.params.id);
  const stmt = db.prepare('DELETE FROM people WHERE id = ?');
  const info = stmt.run(req.params.id);
  res.json({ changes: info.changes });
});

// Get contents for a person
router.get('/:id/contents', (req, res) => {
  const contents = db.prepare('SELECT * FROM contents WHERE person_id = ?').all(req.params.id);
  res.json(contents);
});

// Get signals for a person (aggregated counts + latest signals)
router.get('/:id/signals', (req, res) => {
  const rows = db.prepare(`
    SELECT s.stance, s.summary, s.score, s.reasoning, s.created_at, c.title as content_title
    FROM signals s
    JOIN contents c ON s.content_id = c.id
    WHERE c.person_id = ?
    ORDER BY s.created_at DESC
  `).all(req.params.id);

  const counts = { bullish: 0, bearish: 0, neutral: 0 };
  rows.forEach(r => { if (r.stance) counts[r.stance]++; });

  res.json({ ...counts, signals: rows });
});

// Get daily summaries for a person (comprehensive analysis trends)
router.get('/:id/daily-summaries', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const summaries = db.prepare(`
    SELECT * FROM daily_person_summaries
    WHERE person_id = ?
    ORDER BY date DESC
    LIMIT ?
  `).all(req.params.id, days);
  res.json(summaries);
});

module.exports = router;
