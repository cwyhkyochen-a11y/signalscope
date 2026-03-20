const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const db = require('../db');
const { analyzeContent } = require('../workers/analyzer');
const { cleanText } = require('../lib/llm');
const { asyncHandler } = require('../middleware/errorHandler');

// Lazy-load pdf-parse to avoid DOMMatrix error on startup
let pdfParse = null;
function getPdfParse() {
  if (!pdfParse) pdfParse = require('pdf-parse');
  return pdfParse;
}

// Setup multer storage for uploads
const uploadDir = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_'))
});
const upload = multer({ storage });

// GET /api/upload/file/:filename — serve uploaded PDF
router.get('/file/:filename', asyncHandler(async (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.download(filePath);
}));

function extractFromHtml(html, url) {
  const $ = cheerio.load(html);
  let siteSpecific = '';

  if (url && url.includes('mp.weixin.qq.com')) {
    const wxContent = $('#js_content').text();
    if (wxContent && wxContent.replace(/\s+/g, ' ').trim().length > 50) {
      siteSpecific = wxContent.replace(/\s+/g, ' ').trim();
    }
    const wxTitle = $('#activity-name').text()?.trim() || $('title').text()?.trim() || '';
    return { title: wxTitle, body: siteSpecific || '' };
  }

  let readabilityText = '';
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const collapsed = (article?.textContent || '').replace(/\s+/g, ' ').trim();
    if (collapsed.length > 100) readabilityText = collapsed;
  } catch (e) { /* ignore */ }

  const $c = cheerio.load(html);
  $c('script, style, nav, header, footer, aside, iframe, noscript, svg, link, meta').remove();
  $c('[class*="nav"], [class*="header"], [class*="footer"], [class*="sidebar"], [class*="menu"], [class*="comment"], [class*="related"]').remove();
  let cheerioText = '';
  const selectors = ['article', '[class*="article"]', '[class*="content"]', '[class*="post"]', 'main', '[role="main"]'];
  for (const sel of selectors) {
    const el = $c(sel);
    if (el.length > 0) {
      cheerioText = el.text().replace(/\s+/g, ' ').trim();
      if (cheerioText.length > 100) break;
    }
  }
  if (cheerioText.length <= 100) cheerioText = $c('body').text().replace(/\s+/g, ' ').trim();

  return { title: $c('title').text()?.trim() || url || '', body: readabilityText.length >= cheerioText.length ? readabilityText : cheerioText };
}

// POST /api/upload/pdf
router.post('/pdf', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const data = fs.readFileSync(req.file.path);
  let parsed;
  try {
    parsed = await getPdfParse()(data);
  } catch (parseErr) {
    const msg = parseErr.message || '';
    if (msg.includes('password') || msg.includes('encrypted')) return res.status(422).json({ error: 'PDF is password-protected and cannot be processed' });
    if (msg.includes('Invalid PDF') || msg.includes('bad XRef')) return res.status(422).json({ error: 'Invalid or corrupted PDF file. Please try a different file.' });
    return res.status(422).json({ error: 'Failed to parse PDF', details: msg.slice(0, 200) });
  }
  const rawText = parsed.text || '';
  const cleaned = await cleanText(rawText, 'pdf');
  const personId = req.body.person_id || null;
  const stmt = db.prepare('INSERT INTO contents (title, body, source_type, external_id, person_id, url) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(req.file.originalname, cleaned, 'pdf', req.file.filename, personId, null);
  const content = db.prepare('SELECT c.*, p.name as person_name FROM contents c LEFT JOIN people p ON c.person_id = p.id WHERE c.id = ?').get(info.lastInsertRowid);
  if (content) analyzeContent(content).catch(e => console.error('[upload] Analysis failed:', e.message));
  res.json({ contentId: info.lastInsertRowid, filename: req.file.filename });
}));

// POST /api/upload/url
router.post('/url', asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    }
  });
  const html = await response.text();
  const extracted = extractFromHtml(html, url);
  let rawText = extracted.body || '';
  if (rawText.length < 50) return res.status(422).json({ error: 'Could not extract content from URL', url });
  const cleaned = await cleanText(rawText, 'webpage');
  const body = cleaned.length > 15000 ? cleaned.slice(0, 15000) + '\n\n[Content truncated]' : cleaned;
  const personId = req.body.person_id || null;
  const stmt = db.prepare('INSERT INTO contents (title, body, source_type, external_id, person_id, url) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(extracted.title || url, body, 'manual', url, personId, url);
  const content = db.prepare('SELECT c.*, p.name as person_name FROM contents c LEFT JOIN people p ON c.person_id = p.id WHERE c.id = ?').get(info.lastInsertRowid);
  if (content) analyzeContent(content).catch(e => console.error('[upload] Analysis failed:', e.message));
  res.json({ contentId: info.lastInsertRowid });
}));

// DELETE /api/upload/:id — delete uploaded content + associated signal + PDF file
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid ID' });
  const content = db.prepare('SELECT source_type, external_id FROM contents WHERE id = ?').get(id);
  if (!content) return res.status(404).json({ error: 'Content not found' });
  db.prepare('DELETE FROM signals WHERE content_id = ?').run(id);
  db.prepare('DELETE FROM contents WHERE id = ?').run(id);
  if (content.source_type === 'pdf' && content.external_id) {
    const filePath = path.join(uploadDir, content.external_id);
    if (fs.existsSync(filePath)) try { fs.unlinkSync(filePath); } catch (e) { console.error('[upload] Failed to delete file:', e.message); }
  }
  res.json({ success: true, deleted: id });
}));

module.exports = router;
