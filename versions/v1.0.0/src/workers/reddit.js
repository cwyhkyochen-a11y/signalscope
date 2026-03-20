const RSSParser = require('rss-parser');
const db = require('../db');
const parser = new RSSParser();

async function syncSource(source) {
  const config = JSON.parse(source.config || '{}');
  const { subreddit } = config;
  if (!subreddit) { console.error('[reddit] No subreddit in config'); return; }

  try {
    const feed = await parser.parseURL(`https://www.reddit.com/r/${subreddit}/.rss`);
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO contents (person_id, source_id, source_type, external_id, title, body, url, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    db.transaction(() => {
      for (const item of (feed.items || [])) {
        insertStmt.run(
          source.person_id,
          source.id,
          'reddit',
          item.link || item.guid,
          item.title || '',
          item.contentSnippet || item.content || '',
          item.link || null,
          item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
        );
        count++;
      }
    })();

    console.log(`[reddit] Synced source ${source.id}: ${count} items`);
  } catch (e) {
    console.error(`[reddit] Error syncing source ${source.id}:`, e.message);
    throw e;
  }
}

module.exports = { syncSource };
