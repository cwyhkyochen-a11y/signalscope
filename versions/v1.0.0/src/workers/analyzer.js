const db = require('../db');

async function analyzePendingContents() {
  // Find contents without signals
  const rows = db.prepare(`
    SELECT c.*, p.name as person_name
    FROM contents c
    LEFT JOIN signals s ON c.id = s.content_id
    LEFT JOIN people p ON c.person_id = p.id
    WHERE s.id IS NULL
    LIMIT 10
  `).all();

  if (!rows.length) return;

  const templateRow = db.prepare('SELECT id, template FROM prompt_templates WHERE is_default = 1').get();
  if (!templateRow) { console.error('[analyzer] No default prompt template found'); return; }

  for (const content of rows) {
    let prompt = templateRow.template;
    prompt = prompt.replace(/\{source_type\}/g, content.source_type || 'unknown');
    prompt = prompt.replace(/\{person_name\}/g, content.person_name || 'Unknown');
    prompt = prompt.replace(/\{title\}/g, content.title || '');
    prompt = prompt.replace(/\{body\}/g, (content.body || '').slice(0, 8000));

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
          INSERT INTO signals (content_id, person_id, summary, stance, confidence, score, keywords, reasoning, prompt_template_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          content.id,
          content.person_id,
          result.summary || null,
          result.stance || 'neutral',
          result.confidence || 0.5,
          result.score || 5,
          JSON.stringify(result.keywords || []),
          result.reasoning || null,
          templateRow.id
        );

        console.log(`[analyzer] Analyzed content ${content.id}: ${result.stance} (${result.score}/10)`);
        break;
      } catch (e) {
        retries--;
        console.error(`[analyzer] Failed for content ${content.id} (${retries} retries left):`, e.message);
        if (retries === 0) {
          console.error(`[analyzer] Giving up on content ${content.id}`);
        }
      }
    }
  }
}

module.exports = { analyzePendingContents };
