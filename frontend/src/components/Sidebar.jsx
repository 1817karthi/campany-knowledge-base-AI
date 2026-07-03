import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadDocument } from '../api';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
};

const getDocIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return { icon: '📄', cls: 'pdf' };
  if (ext === 'docx') return { icon: '📝', cls: 'docx' };
  return { icon: '📃', cls: 'txt' };
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Sidebar({ documents, onDocumentUploaded, onDocumentDeleted, onSuggestionClick, stats }) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setUploadStatus('❌ File type not supported. Use PDF, DOCX, or TXT.');
      setTimeout(() => setUploadStatus(''), 4000);
      return;
    }
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setUploadStatus(`⏳ Processing "${file.name}"...`);

    try {
      const res = await uploadDocument(file);
      setUploadStatus(`✅ "${file.name}" indexed (${res.data.chunksIndexed} chunks)`);
      onDocumentUploaded(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setUploadStatus(`❌ ${msg}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(''), 6000);
    }
  }, [onDocumentUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: uploading,
  });

  const suggestions = [
    '🏖️ Leave policy?',
    '💰 Salary & benefits?',
    '🕐 Working hours?',
    '🩺 Health insurance?',
    '📋 HR rules?',
    '🏠 Work from home policy?',
  ];

  return (
    <aside className="sidebar">
      {/* Upload Section */}
      <div className="sidebar-section">
        <p className="sidebar-section-title">📤 Upload Documents</p>

        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} id="file-upload-input" />
          <span className="dropzone-icon">{isDragActive ? '📂' : '☁️'}</span>
          <div className="dropzone-text">
            <strong>{isDragActive ? 'Drop it here!' : 'Drag & Drop files'}</strong>
            or click to browse
          </div>
          <div className="dropzone-formats">
            <span className="format-badge">PDF</span>
            <span className="format-badge">DOCX</span>
            <span className="format-badge">TXT</span>
          </div>
        </div>

        {uploadStatus && (
          <div className="upload-progress" style={{ marginTop: 10 }}>
            <p className="progress-text">{uploadStatus}</p>
            {uploading && (
              <div className="progress-bar-wrapper">
                <div className="progress-bar" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="sidebar-section" style={{ borderBottom: 'none', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '12px 16px' }}>
        <p className="sidebar-section-title">
          📚 Knowledge Base
          {stats && (
            <span style={{ marginLeft: 'auto', color: 'var(--accent-secondary)', fontWeight: 500 }}>
              {stats.documents} docs
            </span>
          )}
        </p>
        <div className="docs-list">
          {documents.length === 0 ? (
            <div className="empty-docs">
              <span className="empty-icon">🗄️</span>
              No documents yet.<br />Upload your company policies, HR guides, or any documents to get started.
            </div>
          ) : (
            documents.map((doc) => {
              const { icon, cls } = getDocIcon(doc.originalName);
              return (
                <div className="doc-item" key={doc.fileName}>
                  <div className={`doc-icon ${cls}`}>{icon}</div>
                  <div className="doc-info">
                    <p className="doc-name" title={doc.originalName}>{doc.originalName}</p>
                    <p className="doc-meta">{doc.chunkCount} chunks · {formatDate(doc.uploadedAt)}</p>
                  </div>
                  <button
                    className="doc-delete"
                    title="Remove from knowledge base"
                    onClick={() => onDocumentDeleted(doc.fileName)}
                    id={`delete-doc-${doc.fileName}`}
                  >
                    🗑️
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="suggestions">
        <p className="sidebar-section-title" style={{ marginBottom: 8 }}>💡 Quick Questions</p>
        {suggestions.map((s) => (
          <button
            key={s}
            className="suggestion-chip"
            onClick={() => onSuggestionClick(s.replace(/^[^\s]+\s/, ''))}
            id={`suggestion-${s.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {s}
          </button>
        ))}
      </div>
    </aside>
  );
}
