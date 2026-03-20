const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET all signals
router.get('/', asyncHandler(async (req, res) => {
  const signals = db.prepare(`
    SELECT s.*, p.name as person_name, c.title as content_title
    FROM signals s
    LEFT JOIN people p ON s.person_id = p.id
    LEFT JOIN contents c ON s.content_id = c.id
    ORDER BY s.created_at DESC
  `).all();
  res.json(signals);
}));

// GET dates with data (for Timeline date list)
router.get('/dates', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 60;
  const today = new Date().toISOString().split('T')[0];

  const rows = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as content_count
    FROM contents
    WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY date(created_at)
    ORDER BY date(created_at) DESC
  `).all(days);

  const hasToday = rows.some(r => r.date === today);

  let todayStatus = null;
  const sourceCount = db.prepare("SELECT COUNT(*) as cnt FROM sources WHERE is_active = 1").get().cnt;
  const todayContents = db.prepare("SELECT COUNT(*) as cnt FROM contents WHERE date(created_at) = ?").get(today).cnt;
  const lastPoll = db.prepare("SELECT MAX(last_polled_at) as last FROM sources").get();
  todayStatus = {
    date: today,
    active_sources: sourceCount,
    content_count: todayContents,
    last_poll: lastPoll?.last || null,
  };

  res.json({
    dates: rows.map(r => ({ date: r.date, content_count: r.content_count })),
    today: todayStatus,
  });
}));

// GET daily summary
router.get('/daily-summary', asyncHandler(async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const stanceRows = db.prepare(`
    SELECT s.stance, COUNT(*) as count
    FROM signals s
    JOIN contents c ON s.content_id = c.id
    WHERE date(c.created_at) = ?
    GROUP BY s.stance
  `).all(targetDate);
  const stance_breakdown = { bullish: 0, bearish: 0, neutral: 0 };
  stanceRows.forEach(r => { if (r.stance) stance_breakdown[r.stance] = r.count; });

  const topSignals = db.prepare(`
    SELECT s.id, s.summary, s.stance, s.score, s.reasoning, p.name as person_name
    FROM signals s
    JOIN contents c ON s.content_id = c.id
    LEFT JOIN people p ON s.person_id = p.id
    WHERE date(c.created_at) = ?
    ORDER BY s.score DESC LIMIT 5
  `).all(targetDate);

  const personRows = db.prepare(`
    SELECT p.id, p.name,
      SUM(CASE WHEN s.stance = 'bullish' THEN 1 ELSE 0 END) as bullish,
      SUM(CASE WHEN s.stance = 'bearish' THEN 1 ELSE 0 END) as bearish,
      SUM(CASE WHEN s.stance = 'neutral' THEN 1 ELSE 0 END) as neutral,
      COUNT(s.id) as signal_count
    FROM people p
    LEFT JOIN contents c ON p.id = c.person_id AND date(c.created_at) = ?
    LEFT JOIN signals s ON c.id = s.content_id
    GROUP BY p.id, p.name
  `).all(targetDate);

  const totalContents = db.prepare(`SELECT COUNT(*) as cnt FROM contents WHERE date(created_at) = ?`).get(targetDate).cnt;

  // Stance changes
  const yesterday = new Date(new Date(targetDate).getTime() - 86400000).toISOString().split('T')[0];
  const todayStances = db.prepare(`
    SELECT p.name as person, s.stance, COUNT(*) as cnt
    FROM signals s JOIN contents c ON s.content_id = c.id JOIN people p ON s.person_id = p.id
    WHERE date(c.created_at) = ? GROUP BY p.name, s.stance
  `).all(targetDate);
  const yesterdayStances = db.prepare(`
    SELECT p.name as person, s.stance, COUNT(*) as cnt
    FROM signals s JOIN contents c ON s.content_id = c.id JOIN people p ON s.person_id = p.id
    WHERE date(c.created_at) = ? GROUP BY p.name, s.stance
  `).all(yesterday);

  function getDominant(rows) {
    const map = {};
    rows.forEach(r => {
      if (!map[r.person]) map[r.person] = {};
      map[r.person][r.stance] = r.cnt;
    });
    const result = {};
    for (const [person, stances] of Object.entries(map)) {
      result[person] = Object.entries(stances).sort((a, b) => b[1] - a[1])[0][0];
    }
    return result;
  }
  const todayDominant = getDominant(todayStances);
  const yesterdayDominant = getDominant(yesterdayStances);
  const stanceChanges = [];
  for (const [person, stance] of Object.entries(todayDominant)) {
    if (yesterdayDominant[person] && yesterdayDominant[person] !== stance) {
      stanceChanges.push({ person, from: yesterdayDominant[person], to: stance });
    }
  }

  const personDailySummaries = db.prepare(`
    SELECT dps.*, p.name as person_name
    FROM daily_person_summaries dps JOIN people p ON dps.person_id = p.id
    WHERE dps.date = ?
  `).all(targetDate);

  res.json({
    date: targetDate,
    total_contents: totalContents,
    stance_breakdown,
    top_signals: topSignals,
    person_summaries: personRows,
    stance_changes: stanceChanges,
    person_daily_summaries: personDailySummaries,
  });
}));

module.exports = router;
