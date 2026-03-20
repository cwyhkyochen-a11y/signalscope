const RSSParser = require('rss-parser');
const db = require('../db');
const parser = new RSSParser();

async function syncSource(source) {
  const config = JSON.parse(source.config || '{}');
  const { channel_id } = config;
  if (!channel_id) { console.error('[youtube] No channel_id in config'); return; }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel_id}`;

  try {
    const feed = await parser.parseURL(feedUrl);
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO contents (person_id, source_id, source_type, external_id, title, body, url, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    db.transaction(() => {
      for (const item of (feed.items || [])) {
        // YouTube RSS id format: yt:video:VIDEO_ID
        const videoId = (item.id || '').replace('yt:video:', '') || item.guid || item.link;
        insertStmt.run(
          source.person_id,
          source.id,
          'youtube',
          videoId,
          item.title || '',
          item.contentSnippet || item.content || '',
          item.link || null,
          item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
        );
        count++;
      }
    })();

    console.log(`[youtube] Synced source ${source.id}: ${count} videos`);
  } catch (e) {
    console.error(`[youtube] Error syncing source ${source.id}:`, e.message);
    throw e;
  }
}

module.exports = { syncSource };
