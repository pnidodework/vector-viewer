const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const filesRouter = require('./routes/files');
const annotationsRouter = require('./routes/annotations');
const crossReferencesRouter = require('./routes/crossReferences');
const exportRouter = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/api/files', filesRouter);
app.use('/api/annotations', annotationsRouter);
app.use('/api/cross-references', crossReferencesRouter);
app.use('/api/export', exportRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
