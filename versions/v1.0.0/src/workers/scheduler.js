const cron = require('node-cron');
const db = require('../db');
const { analyzePendingContents } = require('./analyzer');
const substackWorker = require('./substack');
const twitterWorker = require('./twitter');
const redditWorker = require('./reddit');

function start() {
  console.log('[scheduler] Started - checking every minute');

  cron.schedule('* * * * *', async () => {
    const now = new Date().toISOString();
    const dueTasks = db.prepare(`
      SELECT t.*, s.type, s.config, s.poll_interval_min, s.person_id
      FROM tasks t
      JOIN sources s ON t.source_id = s.id
      WHERE t.status = 'active' AND (t.next_run_at IS NULL OR t.next_run_at <= ?)
        AND s.is_active = 1
    `).all(now);

    for (const task of dueTasks) {
      try {
        console.log(`[scheduler] Running task ${task.id} (source type: ${task.type})`);

        const source = {
          id: task.source_id,
          person_id: task.person_id,
          type: task.type,
          config: task.config,
        };

        switch (task.type) {
          case 'substack_rss':
            await substackWorker.syncSource(source);
            break;
          case 'twitter':
            await twitterWorker.syncSource(source);
            break;
          case 'reddit_rss':
            await redditWorker.syncSource(source);
            break;
          default:
            console.warn(`[scheduler] Unknown source type: ${task.type}`);
        }

        const nextRun = new Date(Date.now() + (task.poll_interval_min || 30) * 60 * 1000).toISOString();
        db.prepare('UPDATE tasks SET last_run_at = ?, next_run_at = ?, error_count = 0 WHERE id = ?')
          .run(now, nextRun, task.id);
        db.prepare('UPDATE sources SET last_polled_at = ? WHERE id = ?').run(now, task.source_id);
      } catch (e) {
        console.error(`[scheduler] Task ${task.id} failed:`, e.message);
        db.prepare('UPDATE tasks SET error_count = error_count + 1, last_error = ? WHERE id = ?')
          .run(e.message, task.id);
      }
    }

    try {
      await analyzePendingContents();
    } catch (e) {
      console.error('[scheduler] Analyzer error:', e.message);
    }
  });
}

module.exports = { start };
