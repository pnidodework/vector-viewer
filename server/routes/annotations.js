const express = require('express');
const router = express.Router();
const { annotationsStore } = require('../config/store');

router.get('/:fileId', (req, res) => {
  try {
    const annotations = annotationsStore.getAll((a) => a.fileId === req.params.fileId);
    annotations.sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
    res.json(annotations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const annotation = annotationsStore.create(req.body);
    res.status(201).json(annotation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const annotation = annotationsStore.update(req.params.id, req.body);
    if (!annotation) return res.status(404).json({ error: 'Annotation not found' });
    res.json(annotation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const annotation = annotationsStore.deleteById(req.params.id);
    if (!annotation) return res.status(404).json({ error: 'Annotation not found' });
    res.json({ message: 'Annotation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batch', (req, res) => {
  try {
    const { upserts, deletes } = req.body;
    const results = { created: 0, updated: 0, deleted: 0 };

    if (upserts && Array.isArray(upserts)) {
      for (const item of upserts) {
        if (item._id) {
          annotationsStore.upsert(item._id, item);
          results.updated++;
        } else {
          annotationsStore.create(item);
          results.created++;
        }
      }
    }

    if (deletes && Array.isArray(deletes)) {
      const deleteSet = new Set(deletes);
      const result = annotationsStore.deleteMany((a) => deleteSet.has(a._id));
      results.deleted = result.deletedCount;
    }

    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
