import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { ToastContainer } from './components/Toast';
import { sendMessage, fetchDocuments, deleteDocument } from './api';
import './index.css';

let messageIdCounter = 0;
const newId = () => `msg-${++messageIdCounter}`;

let toastIdCounter = 0;
const newToastId = () => `toast-${++toastIdCounter}`;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [toasts, setToasts] = useState([]);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load existing documents on mount
  useEffect(() => {
    fetchDocuments()
      .then((res) => {
        setDocuments(res.data.documents || []);
        setStats(res.data.stats);
      })
      .catch(() => {
        addToast('Could not connect to the backend. Is the server running?', 'error');
      });
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = newToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleDocumentUploaded = useCallback((data) => {
    addToast(`✅ "${data.originalName}" indexed with ${data.chunksIndexed} chunks!`, 'success');
    // Refresh document list
    fetchDocuments().then((res) => {
      setDocuments(res.data.documents || []);
      setStats(res.data.stats);
    });
  }, [addToast]);

  const handleDocumentDeleted = useCallback(async (fileName) => {
    try {
      await deleteDocument(fileName);
      const doc = documents.find(d => d.fileName === fileName);
      addToast(`"${doc?.originalName || fileName}" removed from knowledge base.`, 'info');
      const res = await fetchDocuments();
      setDocuments(res.data.documents || []);
      setStats(res.data.stats);
    } catch (err) {
      addToast('Failed to delete document.', 'error');
    }
  }, [documents, addToast]);

  const handleSend = useCallback(async (text) => {
    if (isLoading) return;

    const userMsg = {
      id: newId(),
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await sendMessage(text);
      const aiMsg = {
        id: newId(),
        role: 'ai',
        text: res.data.answer,
        sources: res.data.sources || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errText = err.response?.data?.error || 'Something went wrong. Please try again.';
      const errMsg = {
        id: newId(),
        role: 'ai',
        text: `❌ Error: ${errText}`,
        sources: [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
      addToast(errText, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, addToast]);

  const handleSuggestionClick = useCallback((text) => {
    handleSend(text);
  }, [handleSend]);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        stats={stats}
        onDocumentUploaded={handleDocumentUploaded}
        onDocumentDeleted={handleDocumentDeleted}
        onSuggestionClick={handleSuggestionClick}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="app-header">
          <div className="header-brand">
            <div className="header-logo">🏢</div>
            <div>
              <span className="header-title">Company Knowledge Base</span>
              <span className="header-subtitle">AI-Powered HR Assistant</span>
            </div>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="stat-dot" />
              <span>AI Online</span>
            </div>
            {stats && (
              <div className="header-stat">
                📚 {stats.documents} docs · {stats.totalChunks} chunks
              </div>
            )}
          </div>
        </header>

        {/* Chat */}
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onSuggestionClick={handleSuggestionClick}
        />
        <div ref={chatEndRef} />

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>

      {/* Toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
