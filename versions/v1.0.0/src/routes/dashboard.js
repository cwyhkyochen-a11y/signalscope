const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard
router.get('/', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const todayCount = db.prepare(`
    SELECT COUNT(*) as cnt FROM contents WHERE date(created_at) = ?
  `).get(today).cnt;

  const stanceRows = db.prepare(`
    SELECT s.stance, COUNT(*) as cnt FROM signals s
    JOIN contents c ON s.content_id = c.id
    WHERE date(c.created_at) = ?
    GROUP BY s.stance
  `).all(today);
  const stanceBreakdown = { bullish: 0, bearish: 0, neutral: 0 };
  stanceRows.forEach(r => { if (r.stance) stanceBreakdown[r.stance] = r.cnt; });

  const topSignals = db.prepare(`
    SELECT s.id, s.summary, s.stance, s.score, s.reasoning, p.name as person_name
    FROM signals s
    JOIN contents c ON s.content_id = c.id
    LEFT JOIN people p ON s.person_id = p.id
    WHERE date(c.created_at) >= date('now', '-6 days')
    ORDER BY s.score DESC LIMIT 5
  `).all();

  const contents = db.prepare(`
    SELECT c.*, p.name as person_name, s.stance, s.score, s.summary
    FROM contents c
    LEFT JOIN people p ON c.person_id = p.id
    LEFT JOIN signals s ON c.id = s.content_id
    WHERE date(c.created_at) = ?
    ORDER BY c.created_at DESC
  `).all(today);

  // Last 7 days trend
  const trends = db.prepare(`
    SELECT date(c.created_at) as date, AVG(s.score) as avg_score, COUNT(c.id) as count
    FROM contents c
    LEFT JOIN signals s ON c.id = s.content_id
    WHERE date(c.created_at) >= date('now', '-6 days')
    GROUP BY date(c.created_at)
    ORDER BY date
  `).all();

  // People snapshot
  const peopleSnapshot = db.prepare(`
    SELECT p.id, p.name, p.avatar,
      (SELECT s2.stance FROM signals s2 JOIN contents c2 ON s2.content_id = c2.id
       WHERE c2.person_id = p.id ORDER BY c2.created_at DESC LIMIT 1) as latest_stance,
      (SELECT s2.summary FROM signals s2 JOIN contents c2 ON s2.content_id = c2.id
       WHERE c2.person_id = p.id ORDER BY c2.created_at DESC LIMIT 1) as latest_summary,
      (SELECT AVG(s3.score) FROM signals s3 JOIN contents c3 ON s3.content_id = c3.id
       WHERE c3.person_id = p.id AND date(c3.created_at) >= date('now', '-6 days')) as avg_score_7d
    FROM people p
  `).all();

  res.json({
    today_count: todayCount,
    stance_breakdown: stanceBreakdown,
    top_signals: topSignals,
    contents,
    trends,
    people_snapshot: peopleSnapshot,
  });
});

module.exports = router;
