const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all people
router.get('/', asyncHandler(async (req, res) => {
  const people = db.prepare('SELECT * FROM people').all();
  res.json(people);
}));

// Get one person with full details
router.get('/:id', asyncHandler(async (req, res) => {
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Not found' });
  res.json(person);
}));

// Create person
router.post('/', asyncHandler(async (req, res) => {
  const { name, bio, tags } = req.body;
  const stmt = db.prepare('INSERT INTO people (name, bio, tags) VALUES (?, ?, ?)');
  const info = stmt.run(name, bio || '', tags || '');
  res.json({ id: info.lastInsertRowid });
}));

// Update person
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, bio, tags } = req.body;
  const stmt = db.prepare('UPDATE people SET name = ?, bio = ?, tags = ? WHERE id = ?');
  stmt.run(name, bio || '', tags || '', req.params.id);
  res.json({ success: true });
}));

// Delete person (cascade: tasks → sources → signals → contents → daily_summaries → person)
router.delete('/:id', asyncHandler(async (req, res) => {
  const sourceIds = db.prepare('SELECT id FROM sources WHERE person_id = ?').all(req.params.id).map(s => s.id);
  if (sourceIds.length > 0) {
    db.prepare(`DELETE FROM tasks WHERE source_id IN (${sourceIds.map(() => '?').join(',')})`).run(...sourceIds);
    db.prepare(`DELETE FROM sources WHERE id IN (${sourceIds.map(() => '?').join(',')})`).run(...sourceIds);
  }
  db.prepare('DELETE FROM signals WHERE person_id = ?').run(req.params.id);
  db.prepare('DELETE FROM contents WHERE person_id = ?').run(req.params.id);
  db.prepare('DELETE FROM daily_person_summaries WHERE person_id = ?').run(req.params.id);
  db.prepare('DELETE FROM people WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// Get contents for a person
router.get('/:id/contents', asyncHandler(async (req, res) => {
  const contents = db.prepare('SELECT * FROM contents WHERE person_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(contents);
}));

// Get signals for a person (aggregated counts + latest signals)
router.get('/:id/signals', asyncHandler(async (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, c.title, c.source_type, c.created_at as content_created_at
    FROM signals s
    JOIN contents c ON s.content_id = c.id
    WHERE s.person_id = ?
    ORDER BY s.created_at DESC
  `).all(req.params.id);
  const agg = db.prepare(`
    SELECT stance, COUNT(*) as count FROM signals WHERE person_id = ? GROUP BY stance
  `).all(req.params.id);
  res.json({ aggregated: agg, signals: rows });
}));

// Get daily summaries for a person (comprehensive analysis trends)
router.get('/:id/summaries', asyncHandler(async (req, res) => {
  const summaries = db.prepare(`
    SELECT * FROM daily_person_summaries WHERE person_id = ? ORDER BY date DESC
  `).all(req.params.id);
  res.json(summaries);
}));

module.exports = router;
