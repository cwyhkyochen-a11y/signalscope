const db = require('../db');

async function syncSource(source) {
  const config = JSON.parse(source.config || '{}');
  const { bearer_token, username } = config;
  if (!bearer_token || !username) {
    console.error('[twitter] Missing bearer_token or username in config');
    return;
  }

  try {
    const userResp = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}`,
      { headers: { Authorization: `Bearer ${bearer_token}` } }
    );
    const userData = await userResp.json();
    if (!userData.data) { console.error('[twitter] User not found:', username); return; }

    const tweetsResp = await fetch(
      `https://api.twitter.com/2/users/${userData.data.id}/tweets?max_results=50&tweet_fields=created_at`,
      { headers: { Authorization: `Bearer ${bearer_token}` } }
    );
    const tweetsData = await tweetsResp.json();
    if (!tweetsData.data) { console.log('[twitter] No tweets found'); return; }

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO contents (person_id, source_id, source_type, external_id, title, body, url, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    db.transaction(() => {
      for (const tweet of tweetsData.data) {
        insertStmt.run(
          source.person_id,
          source.id,
          'twitter',
          tweet.id,
          `@${username}`,
          tweet.text,
          `https://twitter.com/${username}/status/${tweet.id}`,
          tweet.created_at || new Date().toISOString()
        );
        count++;
      }
    })();

    console.log(`[twitter] Synced source ${source.id}: ${count} tweets`);
  } catch (e) {
    console.error(`[twitter] Error syncing source ${source.id}:`, e.message);
    throw e;
  }
}

module.exports = { syncSource };
