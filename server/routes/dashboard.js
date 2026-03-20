const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/dashboard
router.get('/', asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const todayCount = db.prepare('SELECT COUNT(*) as count FROM contents WHERE date(created_at) = ?').get(today);
  const stanceRows = db.prepare('SELECT stance, COUNT(*) as count FROM signals GROUP BY stance').all();
  const topSignals = db.prepare(`
    SELECT s.*, c.title, c.source_type, p.name as person_name
    FROM signals s
    JOIN contents c ON s.content_id = c.id
    LEFT JOIN people p ON s.person_id = p.id
    ORDER BY s.score DESC, s.created_at DESC LIMIT 5
  `).all();
  const contents = db.prepare(`
    SELECT c.*, p.name as person_name, s.stance, s.score, s.summary
    FROM contents c
    LEFT JOIN people p ON c.person_id = p.id
    LEFT JOIN signals s ON c.id = s.content_id
    ORDER BY c.created_at DESC LIMIT 10
  `).all();
  const trends = db.prepare(`
    SELECT date(c.created_at) as date, COUNT(*) as count, AVG(s.score) as avg_score
    FROM contents c LEFT JOIN signals s ON c.id = s.content_id
    WHERE c.created_at >= ? GROUP BY date(c.created_at) ORDER BY date
  `).all(sevenDaysAgo);
  const peopleSnapshot = db.prepare(`
    SELECT p.id, p.name,
      (SELECT s.stance FROM signals s WHERE s.person_id = p.id ORDER BY s.created_at DESC LIMIT 1) as latest_stance,
      (SELECT s.summary FROM signals s WHERE s.person_id = p.id ORDER BY s.created_at DESC LIMIT 1) as latest_summary,
      (SELECT AVG(s2.score) FROM signals s2 WHERE s2.person_id = p.id AND s2.created_at >= ?) as avg_score_7d
    FROM people p
  `).all(sevenDaysAgo);

  res.json({
    today: { date: today, contentCount: todayCount.count },
    stanceCounts: stanceRows,
    topSignals,
    recentContents: contents,
    trends,
    peopleSnapshot,
  });
}));

module.exports = router;
