const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { extractText, chunkText } = require('../utils/documentParser');
const { generateEmbeddingsBatch } = require('../utils/gemini');
const vectorStore = require('../utils/vectorStore');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  const allowedExts = ['.pdf', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word (.docx), and TXT files are supported'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// POST /api/upload
router.post('/', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const fileName = req.file.filename;
  const originalName = req.file.originalname;

  try {
    console.log(`📄 Processing: ${originalName}`);

    // 1. Extract text from document
    const rawText = await extractText(filePath, req.file.mimetype);
    if (!rawText || rawText.trim().length < 20) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Could not extract text from the document. It may be empty or scanned.' });
    }

    // 2. Split into chunks
    const chunks = chunkText(rawText);
    console.log(`✂️  Split into ${chunks.length} chunks`);

    if (chunks.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Document appears to be empty after processing.' });
    }

    // 3. Generate embeddings for all chunks
    console.log(`🧠 Generating embeddings for ${chunks.length} chunks...`);
    const embeddings = await generateEmbeddingsBatch(chunks);

    // 4. Store in vector store
    const uploadedAt = new Date().toISOString();
    const documents = chunks.map((chunk, i) => ({
      pageContent: chunk,
      embedding: embeddings[i],
      metadata: { fileName, originalName, uploadedAt, chunkIndex: i },
    }));

    vectorStore.addDocuments(documents);
    console.log(`✅ Successfully indexed ${documents.length} chunks from ${originalName}`);

    res.json({
      message: 'Document uploaded and indexed successfully!',
      fileName,
      originalName,
      chunksIndexed: documents.length,
      uploadedAt,
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: `Failed to process document: ${error.message}` });
  }
});

module.exports = router;
