import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import {
  MessageSquare, Send, Bot, User, Sparkles, Loader2,
  Trash2, X, ChevronRight, HelpCircle, ArrowUpRight
} from 'lucide-react';
import { renderInlineFormatting } from './SummaryViewer';

export default function VideoChatDrawer({ videoId, transcript = '', title = '', isDrawer = false, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your **Synapse Video Tutor**. I've indexed the full transcript of **"${title || 'this video'}"**.\n\nAsk me anything about concepts, formulas, specific examples, or ask me to explain something in simpler terms!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    'Summarize the core premise in 3 bullet points',
    'Give a simple beginner analogy for the main concept',
    'What common mistakes or pitfalls were mentioned?',
    'What are the key terms and formulas discussed?',
  ];

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Format history without system greeting
      const history = newMessages
        .slice(1, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.chatWithVideo(videoId, query, history, transcript);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply || 'No response generated.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Unable to answer:** ${err.message || 'Please ensure you are signed in and try again.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation cleared. What else would you like to explore about **"${title || 'this lecture'}"**?`,
      },
    ]);
  };

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isDrawer ? '100%' : '650px',
        background: 'var(--bg-surface)',
        borderRadius: isDrawer ? 0 : 10,
        border: isDrawer ? 'none' : '1px solid var(--border)',
        boxShadow: isDrawer ? 'none' : 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0b326f, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Ask Video AI
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
              ● Grounded in Lecture Transcript
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleClear}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            title="Clear Chat History"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
          {isDrawer && onClose && (
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '6px 8px', borderRadius: '50%' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--bg-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: 12,
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '80%' : '88%',
                flexDirection: isUser ? 'row-reverse' : 'row',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: isUser ? 'var(--primary)' : '#0b326f',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {isUser ? <User size={14} /> : <Bot size={15} />}
              </div>

              <div
                style={{
                  background: isUser ? 'var(--primary)' : 'var(--bg-surface)',
                  color: isUser ? '#ffffff' : 'var(--text-primary)',
                  padding: '14px 18px',
                  borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  border: isUser ? 'none' : '1px solid var(--border)',
                  fontSize: '0.92rem',
                  lineHeight: 1.65,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {isUser ? msg.content : renderInlineFormatting(msg.content)}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#0b326f',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bot size={15} />
            </div>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                padding: '12px 18px',
                borderRadius: '4px 16px 16px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
              }}
            >
              <Loader2 size={16} className="animate-spin" color="var(--primary)" />
              <span>Analyzing transcript and generating answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pills (Only visible when chat has <= 2 messages) */}
      {messages.length <= 2 && (
        <div
          style={{
            padding: '10px 20px',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
          }}
        >
          {quickPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Sparkles size={11} color="var(--primary)" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <input
          id="ask-video-ai-input"
          type="text"
          placeholder="Ask anything about the video lecture..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid var(--border-strong)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            outline: 'none',
          }}
        />

        <button
          id="send-video-ai-btn"
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{
            padding: '12px 20px',
            borderRadius: 8,
            opacity: !input.trim() || loading ? 0.6 : 1,
            cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span>Send</span>
        </button>
      </div>
    </div>
  );

  if (isDrawer) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(480px, 100vw)',
          background: 'var(--bg-surface)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.25)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
