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
  const stmt = db.prepare('DELETE FROM people WHERE id = ?');
  const info = stmt.run(req.params.id);
  res.json({ changes: info.changes });
});

// Get contents for a person
router.get('/:id/contents', (req, res) => {
  const contents = db.prepare('SELECT * FROM contents WHERE person_id = ?').all(req.params.id);
  res.json(contents);
});

// Get signals for a person (through contents)
router.get('/:id/signals', (req, res) => {
  const signals = db.prepare(`
    SELECT s.* FROM signals s
    JOIN contents c ON s.content_id = c.id
    WHERE c.person_id = ?
  `).all(req.params.id);
  res.json(signals);
});

module.exports = router;
