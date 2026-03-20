const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/', asyncHandler(async (req, res) => {
  res.json(db.prepare('SELECT * FROM prompt_templates').all());
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const tmpl = db.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(req.params.id);
  if (!tmpl) return res.status(404).json({ error: 'Not found' });
  res.json(tmpl);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, template } = req.body;
  res.status(201).json({ id: db.prepare('INSERT INTO prompt_templates (name, template) VALUES (?, ?)').run(name, template).lastInsertRowid });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { name, template } = req.body;
  res.json({ changes: db.prepare('UPDATE prompt_templates SET name = ?, template = ? WHERE id = ?').run(name, template, req.params.id).changes });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  res.json({ changes: db.prepare('DELETE FROM prompt_templates WHERE id = ?').run(req.params.id).changes });
}));

module.exports = router;
