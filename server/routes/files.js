const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { filesStore, annotationsStore, crossRefsStore } = require('../config/store');
const { generateImageThumbnail, generateTiffThumbnail, getTiffPageCount, getPdfPageCount } = require('../services/thumbnailService');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

const MIME_TYPES = {
  pdf: 'application/pdf',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

const SUPPORTED_EXTENSIONS = ['pdf', 'tiff', 'tif', 'jpg', 'jpeg'];

function normalizeType(ext) {
  ext = ext.toLowerCase();
  if (ext === 'jpeg') return 'jpg';
  if (ext === 'tif') return 'tiff';
  return ext;
}

router.post('/scan', async (req, res) => {
  try {
    if (!fs.existsSync(ASSETS_DIR)) {
      fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }
    const diskFiles = fs.readdirSync(ASSETS_DIR);
    const existingFiles = filesStore.getAll();
    const existingPaths = new Set(existingFiles.map((f) => f.path));
    let added = 0;
    let maxOrder = existingFiles.reduce((max, f) => Math.max(max, f.sortOrder || 0), 0);

    for (const filename of diskFiles) {
      const ext = filename.split('.').pop().toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

      const filePath = path.join(ASSETS_DIR, filename);
      if (existingPaths.has(filePath)) continue;

      const stat = fs.statSync(filePath);
      const type = normalizeType(ext);
      let pageCount = 1;

      if (type === 'pdf') {
        pageCount = await getPdfPageCount(filePath);
      } else if (type === 'tiff') {
        pageCount = await getTiffPageCount(filePath);
      }

      maxOrder++;
      filesStore.create({
        filename,
        displayName: filename.replace(/\.[^/.]+$/, ''),
        type,
        path: filePath,
        pageCount,
        sortOrder: maxOrder,
        size: stat.size,
      });
      added++;
    }

    res.json({ message: `Scanned assets folder. Added ${added} new file(s).`, added });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const files = filesStore.getAll();
    files.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const file = filesStore.getById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/content', (req, res) => {
  try {
    const file = filesStore.getById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (!fs.existsSync(file.path)) return res.status(404).json({ error: 'File not found on disk' });

    const ext = file.filename.split('.').pop().toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    fs.createReadStream(file.path).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/thumbnail/:page', async (req, res) => {
  try {
    const file = filesStore.getById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const pageIndex = parseInt(req.params.page, 10) || 0;
    let thumbBuffer;

    if (file.type === 'tiff') {
      thumbBuffer = await generateTiffThumbnail(file.path, pageIndex);
    } else if (file.type === 'jpg') {
      thumbBuffer = await generateImageThumbnail(file.path);
    } else if (file.type === 'pdf') {
      thumbBuffer = await generateImageThumbnail(
        path.join(__dirname, '..', 'assets', 'pdf-placeholder.png')
      );
    }

    if (!thumbBuffer) return res.status(500).json({ error: 'Could not generate thumbnail' });

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(thumbBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const file = filesStore.getById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    annotationsStore.deleteMany((a) => a.fileId === file._id);
    crossRefsStore.deleteMany((r) => r.sourceFileId === file._id || r.targetFileId === file._id);
    filesStore.deleteById(req.params.id);

    res.json({ message: 'File and related data deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batch-delete', (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });

    const idSet = new Set(ids);
    annotationsStore.deleteMany((a) => idSet.has(a.fileId));
    crossRefsStore.deleteMany((r) => idSet.has(r.sourceFileId) || idSet.has(r.targetFileId));
    const result = filesStore.deleteMany((f) => idSet.has(f._id));

    res.json({ message: `Deleted ${result.deletedCount} file(s)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/reorder', (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Array of {id, sortOrder} required' });

    const updates = items.map((item) => ({ id: item.id, changes: { sortOrder: item.sortOrder } }));
    filesStore.bulkUpdate(updates);
    res.json({ message: 'Reorder complete' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
