# 🏢 Company Knowledge Base ⭐⭐⭐⭐⭐

An AI-powered RAG (Retrieval-Augmented Generation) application that lets employees upload company documents and ask HR-related questions.

---

## ✨ Features

- 📤 Upload **PDF**, **Word (.docx)**, and **TXT** documents
- 🧠 AI-powered answers using **Google Gemini**
- 🔍 Semantic search with **vector embeddings**
- 💬 Beautiful dark-mode chat interface
- 📚 Manage your knowledge base (add/remove docs)
- 💡 Quick question suggestions for common HR queries

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| Styling | Vanilla CSS (dark glassmorphism) |
| Backend | Node.js + Express.js |
| AI | Google Gemini (text-embedding-004 + gemini-1.5-flash) |
| Vector Store | Custom cosine-similarity JSON store |
| File Parsing | pdf-parse + mammoth |

---

## 🚀 Setup & Running

### 1. Prerequisites
- Node.js 18+
- A **Google Gemini API Key** ([Get one free here](https://aistudio.google.com/app/apikey))

### 2. Backend Setup

```bash
cd backend
# Add your Gemini API key to .env
notepad .env
# Start the server
npm start
```

The backend runs on **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend
npm run dev
```

The frontend runs on **http://localhost:5173**

---

## 🔑 Environment Variables

Create/edit `backend/.env`:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
```

---

## 📖 How to Use

1. **Start both servers** (backend + frontend)
2. **Open** http://localhost:5173 in your browser
3. **Upload** a company document (PDF, Word, TXT) using the sidebar
4. **Ask** questions like:
   - "What is the leave policy?"
   - "How many days of sick leave do employees get?"
   - "What are the company benefits?"
5. The AI answers based **strictly** on the uploaded documents

---

## 📁 Project Structure

```
company knowledge base/
├── backend/
│   ├── routes/
│   │   ├── upload.js      # File upload & indexing
│   │   ├── chat.js        # RAG query pipeline
│   │   └── documents.js   # Document management
│   ├── utils/
│   │   ├── gemini.js      # Gemini AI client
│   │   ├── vectorStore.js # In-memory vector store
│   │   └── documentParser.js # PDF/Word text extraction
│   ├── uploads/           # Stored document files
│   ├── vectorstore/       # Persisted embeddings (JSON)
│   ├── server.js
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── ChatWindow.jsx
    │   │   ├── ChatInput.jsx
    │   │   └── Toast.jsx
    │   ├── App.jsx
    │   ├── api.js
    │   └── index.css
    └── vite.config.js
```
