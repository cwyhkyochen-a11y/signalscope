const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all prompt templates
router.get('/', (req, res) => {
  const templates = db.prepare('SELECT * FROM prompt_templates').all();
  res.json(templates);
});

// Get one template
router.get('/:id', (req, res) => {
  const tmpl = db.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(req.params.id);
  if (!tmpl) return res.status(404).json({ error: 'Not found' });
  res.json(tmpl);
});

// Create new template
router.post('/', (req, res) => {
  const { name, template } = req.body;
  const stmt = db.prepare('INSERT INTO prompt_templates (name, template) VALUES (?, ?)');
  const info = stmt.run(name, template);
  res.status(201).json({ id: info.lastInsertRowid });
});

// Update template
router.put('/:id', (req, res) => {
  const { name, template } = req.body;
  const stmt = db.prepare('UPDATE prompt_templates SET name = ?, template = ? WHERE id = ?');
  const info = stmt.run(name, template, req.params.id);
  res.json({ changes: info.changes });
});

// Delete
router.delete('/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM prompt_templates WHERE id = ?');
  const info = stmt.run(req.params.id);
  res.json({ changes: info.changes });
});

module.exports = router;
