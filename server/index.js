const express = require('express');
const cors = require('cors');
const path = require('path');
const { authMiddleware } = require('./auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// CORS
const corsOrigins = process.env.CORS_ORIGINS || '';
app.use(cors({
  origin: corsOrigins ? corsOrigins.split(',') : true,
  credentials: true,
}));

app.use(express.json());

// Static files - serve from project root's public/ directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes without auth
app.use('/api/auth', require('./routes/auth'));

// Apply auth middleware for all other API routes
app.use('/api', authMiddleware);

// Protected routes
app.use('/api/people', require('./routes/people'));
app.use('/api/sources', require('./routes/sources'));
app.use('/api/contents', require('./routes/contents'));
app.use('/api/signals', require('./routes/signals'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/search', require('./routes/search'));
app.use('/api/analysis', require('./routes/analysis'));

// SPA fallback - serve index.html for non-API, non-static routes
const fs = require('fs');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf-8');
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.type('html').send(indexHtml);
});

// Global error handler (catches all unhandled errors from routes)
app.use(errorHandler);

// Start background scheduler
const scheduler = require('./workers/scheduler');
scheduler.start();

const PORT = process.env.PORT || 3020;
app.listen(PORT, () => {
  console.log(`SignalScope backend running on port ${PORT}`);
});

module.exports = app;
