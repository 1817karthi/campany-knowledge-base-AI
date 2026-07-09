import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { ToastContainer } from './components/Toast';
import Auth from './components/Auth';
import { sendMessage, fetchDocuments, deleteDocument, getMe } from './api';
import './index.css';

let messageIdCounter = 0;
const newId = () => `msg-${++messageIdCounter}`;

let toastIdCounter = 0;
const newToastId = () => `toast-${++toastIdCounter}`;

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [toasts, setToasts] = useState([]);
  const chatEndRef = useRef(null);

  const addToast = useCallback((message, type = 'info') => {
    const id = newToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticating(false);
      return;
    }

    getMe()
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error('Session check failed:', err);
        localStorage.removeItem('token');
        addToast('Session expired. Please sign in again.', 'info');
      })
      .finally(() => {
        setIsAuthenticating(false);
      });
  }, [addToast]);

  // Load existing documents when authenticated
  useEffect(() => {
    if (!user) return;
    fetchDocuments()
      .then((res) => {
        setDocuments(res.data.documents || []);
        setStats(res.data.stats);
      })
      .catch(() => {
        addToast('Could not retrieve documents. Is the backend server running?', 'error');
      });
  }, [user, addToast]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleAuthSuccess = useCallback((userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setMessages([]);
    setDocuments([]);
    setStats(null);
    addToast('Logged out successfully.', 'info');
  }, [addToast]);

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

  // Loading Screen while authenticating on boot
  if (isAuthenticating) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner"></div>
        <p>Verifying session...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="app-layout auth-layout">
        <Auth onAuthSuccess={handleAuthSuccess} addToast={addToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        stats={stats}
        user={user}
        onLogout={handleLogout}
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

