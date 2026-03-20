const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// CRUD for sources
router.get('/', asyncHandler(async (req, res) => {
  const sources = db.prepare(`
    SELECT s.*, p.name as person_name
    FROM sources s
    LEFT JOIN people p ON s.person_id = p.id
    ORDER BY s.created_at DESC
  `).all();
  res.json(sources);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const source = db.prepare(`
    SELECT s.*, p.name as person_name
    FROM sources s
    LEFT JOIN people p ON s.person_id = p.id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!source) return res.status(404).json({ error: 'Not found' });
  res.json(source);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { person_id, type, config, poll_interval_min } = req.body;
  const stmt = db.prepare(
    'INSERT INTO sources (person_id, type, config, poll_interval_min) VALUES (?, ?, ?, ?)'
  );
  const info = stmt.run(person_id, type, JSON.stringify(config || {}), poll_interval_min || 30);
  db.prepare('INSERT INTO tasks (source_id, status, next_run_at) VALUES (?, ?, ?)').run(
    info.lastInsertRowid, 'active', new Date().toISOString()
  );
  res.status(201).json({ id: info.lastInsertRowid });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { person_id, type, config, poll_interval_min, is_active } = req.body;
  const stmt = db.prepare(
    'UPDATE sources SET person_id = ?, type = ?, config = ?, poll_interval_min = ?, is_active = ? WHERE id = ?'
  );
  const info = stmt.run(
    person_id, type, JSON.stringify(config || {}), poll_interval_min || 30,
    is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id
  );
  res.json({ changes: info.changes });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM tasks WHERE source_id = ?').run(req.params.id);
  const stmt = db.prepare('DELETE FROM sources WHERE id = ?');
  const info = stmt.run(req.params.id);
  res.json({ changes: info.changes });
}));

// Manual sync trigger
router.post('/:id/sync', asyncHandler(async (req, res) => {
  const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(req.params.id);
  if (!source) return res.status(404).json({ error: 'Source not found' });
  db.prepare('UPDATE sources SET last_polled_at = ? WHERE id = ?').run(new Date().toISOString(), source.id);
  db.prepare('INSERT INTO tasks (source_id, status, next_run_at) VALUES (?, ?, ?)').run(
    source.id, 'active', new Date().toISOString()
  );
  res.json({ success: true, message: 'Sync triggered' });
}));

module.exports = router;
