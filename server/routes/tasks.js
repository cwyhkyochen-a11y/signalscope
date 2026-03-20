const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all tasks
router.get('/', asyncHandler(async (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, s.type as source_type, s.config, p.name as person_name
    FROM tasks t
    LEFT JOIN sources s ON t.source_id = s.id
    LEFT JOIN people p ON s.person_id = p.id
    ORDER BY t.created_at DESC
  `).all();
  res.json(tasks);
}));

// Update task status or fields
router.put('/:id', asyncHandler(async (req, res) => {
  const { status, next_run_at } = req.body;
  const stmt = db.prepare('UPDATE tasks SET status = ?, next_run_at = ? WHERE id = ?');
  const info = stmt.run(status, next_run_at || null, req.params.id);
  res.json({ changes: info.changes });
}));

// Run a task immediately
router.post('/:id/run', asyncHandler(async (req, res) => {
  const stmt = db.prepare('UPDATE tasks SET status = ?, next_run_at = CURRENT_TIMESTAMP WHERE id = ?');
  const info = stmt.run('queued', req.params.id);
  res.json({ changes: info.changes });
}));

module.exports = router;
