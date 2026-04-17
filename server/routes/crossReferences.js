const express = require('express');
const router = express.Router();
const { crossRefsStore, filesStore } = require('../config/store');

function populateFileFields(ref) {
  const source = filesStore.getById(ref.sourceFileId);
  const target = filesStore.getById(ref.targetFileId);
  return {
    ...ref,
    sourceFileId: source
      ? { _id: source._id, filename: source.filename, displayName: source.displayName, type: source.type }
      : ref.sourceFileId,
    targetFileId: target
      ? { _id: target._id, filename: target.filename, displayName: target.displayName, type: target.type }
      : ref.targetFileId,
  };
}

router.get('/:fileId', (req, res) => {
  try {
    const fileId = req.params.fileId;
    const refs = crossRefsStore.getAll(
      (r) => r.sourceFileId === fileId || r.targetFileId === fileId
    );
    res.json(refs.map(populateFileFields));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { sourceFileId, targetFileId, label } = req.body;
    if (!sourceFileId || !targetFileId) {
      return res.status(400).json({ error: 'sourceFileId and targetFileId required' });
    }

    const existing = crossRefsStore.findOne(
      (r) =>
        (r.sourceFileId === sourceFileId && r.targetFileId === targetFileId) ||
        (r.sourceFileId === targetFileId && r.targetFileId === sourceFileId)
    );
    if (existing) return res.status(409).json({ error: 'Cross reference already exists' });

    const ref = crossRefsStore.create({ sourceFileId, targetFileId, label: label || '' });
    res.status(201).json(ref);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const ref = crossRefsStore.deleteById(req.params.id);
    if (!ref) return res.status(404).json({ error: 'Cross reference not found' });
    res.json({ message: 'Cross reference deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
