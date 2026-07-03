const fs = require('fs');
const path = require('path');

const VECTOR_STORE_PATH = path.join(__dirname, '../vectorstore/store.json');

/**
 * Simple in-memory + file-persisted vector store using cosine similarity
 */
class SimpleVectorStore {
  constructor() {
    this.documents = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(VECTOR_STORE_PATH)) {
        const data = fs.readFileSync(VECTOR_STORE_PATH, 'utf-8');
        this.documents = JSON.parse(data);
        console.log(`📂 Loaded ${this.documents.length} chunks from vector store`);
      }
    } catch (e) {
      this.documents = [];
    }
  }

  save() {
    fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(this.documents), 'utf-8');
  }

  addDocuments(docs) {
    this.documents.push(...docs);
    this.save();
  }

  removeByFileName(fileName) {
    this.documents = this.documents.filter(d => d.metadata.fileName !== fileName);
    this.save();
  }

  cosineSimilarity(vecA, vecB) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  similaritySearch(queryEmbedding, topK = 5) {
    if (this.documents.length === 0) return [];
    const scored = this.documents.map(doc => ({
      ...doc,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  getDocumentList() {
    const fileMap = {};
    this.documents.forEach(doc => {
      const { fileName, uploadedAt, originalName } = doc.metadata;
      if (!fileMap[fileName]) {
        fileMap[fileName] = { fileName, originalName, uploadedAt, chunkCount: 0 };
      }
      fileMap[fileName].chunkCount++;
    });
    return Object.values(fileMap);
  }

  getStats() {
    return {
      totalChunks: this.documents.length,
      documents: this.getDocumentList().length,
    };
  }
}

// Singleton instance
const vectorStore = new SimpleVectorStore();
module.exports = vectorStore;
