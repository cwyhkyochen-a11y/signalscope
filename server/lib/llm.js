const db = require('../db');

/**
 * Get LLM config from DB settings, with env var fallback.
 */
function getLLMConfig() {
  const rows = db.prepare("SELECT key, value FROM settings WHERE category = 'llm'").all();
  const config = {};
  for (const row of rows) config[row.key] = row.value || '';
  return {
    baseUrl: config.base_url || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: config.api_key || process.env.OPENAI_API_KEY,
    model: config.model_name || process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
}

/**
 * Get the text cleanup prompt template from DB.
 * Falls back to a default if not found.
 */
function getCleanupPrompt() {
  const row = db.prepare("SELECT template FROM prompt_templates WHERE name = 'Text Cleanup' LIMIT 1").get();
  if (row) return row.template;
  // Fallback default
  return `You are a text extraction assistant. Clean the following text extracted from a {source_type}.

Instructions:
1. Remove all HTML/markup artifacts, navigation, ads, footers, sidebars
2. Extract only meaningful article/content text
3. Preserve all factual information, quotes, data points, viewpoints
4. Use clean paragraphs with proper formatting
5. If the text is already clean, return it as-is

Return ONLY the cleaned text. No JSON, no commentary.

---
{content}
---`;
}

/**
 * Clean raw extracted text using LLM.
 */
async function cleanText(rawText, sourceType) {
  const { baseUrl, apiKey, model } = getLLMConfig();
  if (!apiKey) {
    console.warn('[llm] No API key configured, skipping cleanup');
    return rawText;
  }

  let prompt = getCleanupPrompt();
  prompt = prompt.replace(/\{source_type\}/g, sourceType || 'unknown');
  prompt = prompt.replace(/\{content\}/g, rawText.slice(0, 12000));

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
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(60000),
    });

    const data = await resp.json();
    if (!data.choices || !data.choices[0]) {
      console.error('[llm] Invalid response:', JSON.stringify(data).slice(0, 200));
      return rawText;
    }

    return data.choices[0].message.content.trim();
  } catch (e) {
    console.error('[llm] Cleanup failed:', e.message);
    return rawText;
  }
}

module.exports = { getLLMConfig, cleanText };
