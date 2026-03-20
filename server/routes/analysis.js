const express = require('express');
const router = express.Router();
const db = require('../db');
const { getLLMConfig } = require('../lib/llm');
const { asyncHandler } = require('../middleware/errorHandler');

// Global analysis lock — only one analysis runs at a time
let analysisRunning = false;

// List analysis records
router.get('/records', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const rows = db.prepare(`
    SELECT id, title, prompt, content_ids, result, status, error_msg, created_at
    FROM analysis_records ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  res.json(rows.map(r => ({ ...r, content_ids: JSON.parse(r.content_ids || '[]') })));
}));

// Get single record
router.get('/records/:id', asyncHandler(async (req, res) => {
  const row = db.prepare('SELECT * FROM analysis_records WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Record not found' });
  res.json({ ...row, content_ids: JSON.parse(row.content_ids || '[]') });
}));

// Delete record
router.delete('/records/:id', asyncHandler(async (req, res) => {
  const result = db.prepare('DELETE FROM analysis_records WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Record not found' });
  res.json({ success: true });
}));

// Run analysis on selected content items
router.post('/run', asyncHandler(async (req, res) => {
  const { content_ids, prompt } = req.body;
  if (!content_ids || !content_ids.length) return res.status(400).json({ error: 'Please select at least one content item' });
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Please provide an analysis prompt' });

  // Concurrency check
  if (analysisRunning) {
    return res.status(409).json({ error: 'An analysis is already running. Please wait for it to complete.' });
  }

  // Fetch selected contents
  const placeholders = content_ids.map(() => '?').join(',');
  const contents = db.prepare(`
    SELECT c.id, c.title, c.body, c.source_type, c.url, c.person_id, c.created_at,
           p.name as person_name,
           s.summary, s.stance, s.score, s.confidence
    FROM contents c
    LEFT JOIN people p ON c.person_id = p.id
    LEFT JOIN signals s ON s.content_id = c.id
    WHERE c.id IN (${placeholders})
    ORDER BY c.created_at DESC
  `).all(...content_ids);

  if (!contents.length) return res.status(400).json({ error: 'Selected content items not found' });

  const dates = [...new Set(contents.map(c => c.created_at?.slice(0, 10)))].sort();
  const title = dates.length === 1
    ? `${dates[0]} — ${contents.length} items`
    : `${dates[0]}~${dates[dates.length-1]} — ${contents.length} items`;

  const info = db.prepare(
    'INSERT INTO analysis_records (title, prompt, content_ids, status) VALUES (?, ?, ?, ?)'
  ).run(title, prompt.trim(), JSON.stringify(content_ids), 'running');
  const recordId = info.lastInsertRowid;

  // Check LLM config
  const { baseUrl, apiKey, model } = getLLMConfig();
  if (!apiKey) {
    db.prepare('UPDATE analysis_records SET status = ?, error_msg = ? WHERE id = ?')
      .run('failed', 'No LLM API key configured', recordId);
    return res.json({ id: recordId, status: 'failed', error: 'No LLM API key configured' });
  }

  // Build LLM prompt
  const contentsList = contents.map((c, i) => {
    let meta = `[${i+1}] ${c.source_type}`;
    if (c.person_name) meta += ` | ${c.person_name}`;
    if (c.stance) meta += ` | ${c.stance} (${c.score}/10)`;
    meta += ` | ${c.title || '(untitled)'}`;
    return `${meta}\n${(c.body || '').slice(0, 2000)}`;
  }).join('\n\n---\n\n');

  const fullPrompt = `${prompt.trim()}

---
Analyze the following ${contents.length} content items:

${contentsList}
---`;

  // Respond immediately
  res.json({ id: recordId, status: 'running' });

  // Run async with concurrency lock
  analysisRunning = true;
  try {
    const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(120000),
    });

    const data = await resp.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid LLM response: ' + JSON.stringify(data).slice(0, 200));
    }

    db.prepare('UPDATE analysis_records SET status = ?, result = ? WHERE id = ?')
      .run('completed', data.choices[0].message.content.trim(), recordId);
  } catch (e) {
    console.error('[analysis] Failed:', e.message);
    db.prepare('UPDATE analysis_records SET status = ?, error_msg = ? WHERE id = ?')
      .run('failed', e.message.slice(0, 500), recordId);
  } finally {
    analysisRunning = false;
  }
}));

module.exports = router;
