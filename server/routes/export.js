const express = require('express');
const router = express.Router();
const { filesStore } = require('../config/store');
const { exportToJpg, exportToTiff, exportToPdf } = require('../services/exportService');

router.post('/', async (req, res) => {
  try {
    const { fileIds, format, quality } = req.body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'fileIds array required' });
    }

    const validFormats = ['pdf', 'tiff', 'jpg'];
    const targetFormat = validFormats.includes(format) ? format : 'pdf';
    const q = Math.min(Math.max(parseInt(quality, 10) || 80, 1), 100);

    async function exportSingleFile(file) {
      if (targetFormat === 'jpg') return exportToJpg(file.path, file._id, q);
      if (targetFormat === 'tiff') return exportToTiff(file.path, file._id, q);
      return exportToPdf(file.path, file.type, file._id);
    }

    if (fileIds.length === 1) {
      const file = filesStore.getById(fileIds[0]);
      if (!file) return res.status(404).json({ error: 'File not found' });

      const result = await exportSingleFile(file);
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.displayName}.${result.extension}"`);
      res.send(result.buffer);
    } else {
      const results = [];
      for (const id of fileIds) {
        const file = filesStore.getById(id);
        if (!file) continue;

        const result = await exportSingleFile(file);
        results.push({
          name: `${file.displayName}.${result.extension}`,
          mimeType: result.mimeType,
          data: result.buffer.toString('base64'),
        });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'No files found' });
      }

      res.json({ files: results });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
