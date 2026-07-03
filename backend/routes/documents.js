const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const vectorStore = require('../utils/vectorStore');

// GET /api/documents - list all indexed documents
router.get('/', (req, res) => {
  const docs = vectorStore.getDocumentList();
  const stats = vectorStore.getStats();
  res.json({ documents: docs, stats });
});

// DELETE /api/documents/:fileName - remove a document from the index
router.delete('/:fileName', (req, res) => {
  const { fileName } = req.params;
  const decodedFileName = decodeURIComponent(fileName);

  vectorStore.removeByFileName(decodedFileName);

  // Also remove the physical file
  const filePath = path.join(__dirname, '../uploads', decodedFileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({ message: `Document "${decodedFileName}" removed from knowledge base.` });
});

module.exports = router;
