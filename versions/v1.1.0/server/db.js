const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'signalscope.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bio TEXT,
    avatar TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER REFERENCES people(id),
    type TEXT NOT NULL,
    config TEXT NOT NULL DEFAULT '{}',
    poll_interval_min INTEGER DEFAULT 30,
    last_polled_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER REFERENCES people(id),
    source_id INTEGER REFERENCES sources(id),
    source_type TEXT NOT NULL,
    external_id TEXT,
    title TEXT,
    body TEXT,
    url TEXT,
    published_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0,
    UNIQUE(source_type, external_id)
  );

  CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER REFERENCES contents(id),
    person_id INTEGER REFERENCES people(id),
    summary TEXT,
    stance TEXT,
    confidence REAL,
    score INTEGER,
    keywords TEXT,
    reasoning TEXT,
    prompt_template_id INTEGER REFERENCES prompt_templates(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prompt_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER REFERENCES sources(id),
    status TEXT DEFAULT 'active',
    last_run_at TEXT,
    next_run_at TEXT,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_person_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER REFERENCES people(id),
    date TEXT NOT NULL,
    overall_stance TEXT,
    overall_score REAL,
    summary TEXT,
    reasoning TEXT,
    content_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person_id, date)
  );
`);

// Seed default admin
const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!admin) {
  const hash = bcrypt.hashSync('Admin@2024', 10);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
}

// Seed default prompt template
const tmpl = db.prepare('SELECT id FROM prompt_templates WHERE is_default = 1').get();
if (!tmpl) {
  const template = `You are an investment signal analyst. Analyze the following content and extract key viewpoints.

Source: {source_type}
Author: {person_name}
Title: {title}
Content: {body}

Return ONLY valid JSON (no markdown):
{"summary":"one-sentence summary (max 50 chars)","stance":"bullish | bearish | neutral","confidence":0.0-1.0,"score":1-10,"keywords":["kw1","kw2"],"reasoning":"reasoning (max 100 chars)"}`;
  db.prepare('INSERT INTO prompt_templates (name, description, template, is_default) VALUES (?, ?, ?, 1)').run('Default', 'Default signal analysis template', template);
}

// Seed day-summary prompt template
const dayTmpl = db.prepare('SELECT id FROM prompt_templates WHERE name = ?').get('Day Summary');
if (!dayTmpl) {
  const dayTemplate = `你是一个投资信号分析师。请综合分析以下某位 KOL 今日的所有内容，给出整体判断。

KOL: {person_name}
日期: {date}
今日内容（共 {content_count} 条）:

{contents_list}

请综合所有内容，返回严格 JSON（不要加 markdown 格式）：
{"overall_stance":"bullish | bearish | neutral","overall_score":1-10,"summary":"一段话概括此人今日的整体观点和关键论点（200字以内）","reasoning":"综合判断依据（100字以内）"}`;
  db.prepare('INSERT INTO prompt_templates (name, description, template, is_default) VALUES (?, ?, ?, 0)').run('Day Summary', 'Daily person comprehensive analysis template', dayTemplate);
}

module.exports = db;
