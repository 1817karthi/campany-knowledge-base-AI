import ReactMarkdown from 'react-markdown';

const formatTime = (date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

function TypingIndicator() {
  return (
    <div className="message ai-message typing-indicator">
      <div className="message-avatar">🤖</div>
      <div className="typing-bubble">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

function UserMessage({ text, timestamp }) {
  return (
    <div className="message user-message">
      <div className="message-avatar">👤</div>
      <div className="message-content">
        <div className="message-bubble">{text}</div>
        <p className="message-time">{formatTime(timestamp)}</p>
      </div>
    </div>
  );
}

function AIMessage({ text, sources, timestamp }) {
  return (
    <div className="message ai-message">
      <div className="message-avatar">🤖</div>
      <div className="message-content">
        <div className="message-bubble">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
        {sources && sources.length > 0 && (
          <div className="message-sources">
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Sources:</span>
            {sources.map((s) => (
              <span className="source-badge" key={s.name} title={`${s.score}% match`}>
                📎 {s.name}
              </span>
            ))}
          </div>
        )}
        <p className="message-time">{formatTime(timestamp)}</p>
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isLoading, onSuggestionClick }) {
  const suggestions = [
    { icon: '🏖️', text: 'Leave policy?' },
    { icon: '💰', text: 'Salary structure?' },
    { icon: '🩺', text: 'Health insurance benefits?' },
    { icon: '📋', text: 'HR rules and conduct?' },
  ];

  const isWelcome = messages.length === 0;

  return (
    <div className="chat-area" id="chat-messages">
      {isWelcome ? (
        <div className="welcome-screen">
          <div className="welcome-logo">🏢</div>
          <div>
            <h1 className="welcome-title">Company Knowledge Base</h1>
            <p className="welcome-subtitle">
              Your AI-powered HR assistant. Upload company documents and ask anything about leave policies, benefits, HR rules, and more.
            </p>
          </div>
          <div className="welcome-cards">
            {suggestions.map((s) => (
              <button
                key={s.text}
                className="welcome-card"
                onClick={() => onSuggestionClick(s.text)}
                id={`welcome-suggestion-${s.text.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="welcome-card-icon">{s.icon}</div>
                <div className="welcome-card-text">{s.text}</div>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            ← Upload documents using the sidebar to get started
          </p>
        </div>
      ) : (
        <>
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <UserMessage key={msg.id} text={msg.text} timestamp={msg.timestamp} />
            ) : (
              <AIMessage key={msg.id} text={msg.text} sources={msg.sources} timestamp={msg.timestamp} />
            )
          )}
          {isLoading && <TypingIndicator />}
        </>
      )}
    </div>
  );
}
