const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/settings - Get all settings grouped by category
router.get('/', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT category, key, value, updated_at FROM settings ORDER BY category, key').all();
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = {};
    grouped[row.category][row.key] = row.value || '';
  }
  res.json(grouped);
}));

// PUT /api/settings - Update settings (batch)
router.put('/', asyncHandler(async (req, res) => {
  const settings = req.body;
  const upsert = db.prepare(
    'INSERT INTO settings (category, key, value) VALUES (?, ?, ?) ON CONFLICT(category, key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP'
  );
  const txn = db.transaction(() => {
    for (const [category, keys] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(keys)) {
        upsert.run(category, key, value, value);
      }
    }
  });
  txn();
  res.json({ success: true });
}));

// GET /api/settings/llm - Get LLM config for quick access
router.get('/llm', asyncHandler(async (req, res) => {
  const config = {};
  const rows = db.prepare("SELECT key, value FROM settings WHERE category = 'llm'").all();
  for (const r of rows) config[r.key] = r.value || '';
  res.json(config);
}));

// GET /api/settings/platforms - Get platform configs
router.get('/platforms', asyncHandler(async (req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings WHERE category = 'platforms'").all();
  const config = {};
  for (const r of rows) config[r.key] = r.value || '';
  res.json(config);
}));

module.exports = router;
