const db = require('../db');

async function generateDailySummaries() {
  const today = new Date().toISOString().split('T')[0];

  // Find people who have contents today with signals, but no daily summary yet
  const people = db.prepare(`
    SELECT DISTINCT p.id, p.name
    FROM people p
    JOIN contents c ON c.person_id = p.id
    LEFT JOIN signals s ON s.content_id = c.id
    LEFT JOIN daily_person_summaries dps ON dps.person_id = p.id AND dps.date = ?
    WHERE date(c.created_at) = ? AND s.id IS NOT NULL AND dps.id IS NULL
  `).all(today, today);

  if (!people.length) return;

  // Get the day-summary prompt template
  const tmpl = db.prepare('SELECT id, template FROM prompt_templates WHERE name = ?').get('Day Summary');
  if (!tmpl) { console.error('[day-summary] No day-summary template found'); return; }

  for (const person of people) {
    // Get all contents with signals for this person today
    const contents = db.prepare(`
      SELECT c.id, c.title, c.source_type, c.body, s.summary, s.stance, s.score
      FROM contents c
      JOIN signals s ON s.content_id = c.id
      WHERE c.person_id = ? AND date(c.created_at) = ?
      ORDER BY c.created_at DESC
    `).all(person.id, today);

    if (contents.length === 0) continue;

    // Build contents list for prompt
    const contentsList = contents.map((c, i) =>
      `${i + 1}. [${c.source_type}] ${c.title || '(无标题)'}\n   观点摘要: ${c.summary || '无'}\n   立场: ${c.stance || 'neutral'} (评分: ${c.score || '-'}/10)`
    ).join('\n\n');

    let prompt = tmpl.template;
    prompt = prompt.replace(/\{person_name\}/g, person.name);
    prompt = prompt.replace(/\{date\}/g, today);
    prompt = prompt.replace(/\{content_count\}/g, String(contents.length));
    prompt = prompt.replace(/\{contents_list\}/g, contentsList);

    let retries = 2;
    while (retries > 0) {
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
          }),
        });

        const data = await resp.json();
        if (!data.choices || !data.choices[0]) {
          throw new Error('Invalid OpenAI response: ' + JSON.stringify(data));
        }

        let text = data.choices[0].message.content.trim();
        if (text.startsWith('```')) {
          text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const result = JSON.parse(text);

        db.prepare(`
          INSERT OR REPLACE INTO daily_person_summaries (person_id, date, overall_stance, overall_score, summary, reasoning, content_count)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          person.id,
          today,
          result.overall_stance || 'neutral',
          result.overall_score || 5,
          result.summary || null,
          result.reasoning || null,
          contents.length
        );

        console.log(`[day-summary] ${person.name} (${today}): ${result.overall_stance} (${result.overall_score}/10)`);
        break;
      } catch (e) {
        retries--;
        console.error(`[day-summary] Failed for ${person.name} (${retries} retries left):`, e.message);
        if (retries === 0) {
          console.error(`[day-summary] Giving up on ${person.name}`);
        }
      }
    }
  }
}

module.exports = { generateDailySummaries };
