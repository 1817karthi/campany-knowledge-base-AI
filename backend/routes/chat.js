const express = require('express');
const router = express.Router();
const { generateEmbedding, generateAnswer } = require('../utils/gemini');
const vectorStore = require('../utils/vectorStore');

// POST /api/chat
router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const stats = vectorStore.getStats();
  if (stats.totalChunks === 0) {
    return res.json({
      answer: "📂 The knowledge base is empty. Please upload some company documents (PDF, Word, or TXT) first, then I'll be able to answer your questions!",
      sources: [],
    });
  }

  try {
    console.log(`💬 Query: "${message}"`);

    // 1. Embed the query
    const queryEmbedding = await generateEmbedding(message);

    // 2. Retrieve top-K relevant chunks
    const topChunks = vectorStore.similaritySearch(queryEmbedding, 5);
    console.log(`🔍 Retrieved ${topChunks.length} relevant chunks`);

    if (topChunks.length === 0 || topChunks[0].score < 0.3) {
      return res.json({
        answer: "I couldn't find relevant information in the uploaded documents. Please try rephrasing your question, or contact HR directly for assistance.",
        sources: [],
      });
    }

    // 3. Generate answer using Gemini
    const answer = await generateAnswer(message, topChunks);

    // 4. Deduplicate sources
    const sourceSet = new Set();
    const sources = topChunks
      .filter(c => {
        if (!sourceSet.has(c.metadata.originalName)) {
          sourceSet.add(c.metadata.originalName);
          return true;
        }
        return false;
      })
      .map(c => ({ name: c.metadata.originalName, score: Math.round(c.score * 100) }));

    res.json({ answer, sources });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: `Failed to generate answer: ${error.message}` });
  }
});

module.exports = router;
