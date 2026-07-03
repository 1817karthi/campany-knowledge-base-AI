const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate text embeddings using Gemini embedding model
 */
async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple texts in parallel (batched)
 */
async function generateEmbeddingsBatch(texts, batchSize = 5) {
  const results = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(t => generateEmbedding(t)));
    results.push(...batchResults);
    // Small delay to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return results;
}

/**
 * Generate an AI answer using retrieved context chunks
 */
async function generateAnswer(query, contextChunks) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const context = contextChunks
    .map((chunk, i) => `[Source ${i + 1} - ${chunk.metadata.originalName}]:\n${chunk.pageContent}`)
    .join('\n\n---\n\n');

  const prompt = `You are a helpful HR assistant for a company. Your job is to answer employee questions based ONLY on the company documents provided below.

COMPANY DOCUMENTS:
${context}

EMPLOYEE QUESTION: ${query}

INSTRUCTIONS:
- Answer ONLY based on the provided documents. 
- If the answer is not in the documents, say: "I couldn't find specific information about this in the uploaded company documents. Please contact HR directly."
- Be friendly, clear, and professional.
- Cite which document your answer comes from (e.g., "According to [Document Name]...").
- Format your response with proper line breaks for readability.

YOUR ANSWER:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { generateEmbedding, generateEmbeddingsBatch, generateAnswer };
