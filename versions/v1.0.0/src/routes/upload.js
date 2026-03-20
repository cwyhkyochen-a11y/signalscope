const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const db = require('../db');

// Lazy-load pdf-parse to avoid DOMMatrix error on startup
let pdfParse = null;
function getPdfParse() {
  if (!pdfParse) pdfParse = require('pdf-parse');
  return pdfParse;
}

// Setup multer storage for uploads
const uploadDir = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// POST /api/upload/pdf
router.post('/pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const data = fs.readFileSync(req.file.path);
  const parsed = await getPdfParse()(data);
  // Insert into contents
  const personId = req.body.person_id || null;
  const stmt = db.prepare('INSERT INTO contents (title, body, source_type, external_id, person_id, url) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(req.file.originalname, parsed.text, 'pdf', req.file.filename, personId, null);
  res.json({ contentId: info.lastInsertRowid });
});

// POST /api/upload/url
router.post('/url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('title').text() || url;
    const body = $('body').text();
    const personId = req.body.person_id || null;
    const stmt = db.prepare('INSERT INTO contents (title, body, source_type, external_id, person_id, url) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(title, body, 'manual', url, personId, url);
    res.json({ contentId: info.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch URL', details: e.message });
  }
});

module.exports = router;
