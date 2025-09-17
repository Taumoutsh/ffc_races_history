import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function MessagePanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Initial load with loading indicator
      loadMessages(true);

      // Set up auto-refresh every 20 seconds (without loading indicator)
      const interval = setInterval(() => {
        loadMessages(false);
      }, 20000); // 20 seconds

      // Cleanup interval on component unmount or when auth changes
      return () => {
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, authLoading]);

  const loadMessages = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await axios.get('/messages');
      setMessages(response.data);
    } catch (error) {
      console.error('MessagePanel: Failed to load messages:', error);
      setMessages([]);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };


  const getMessageIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getMessageColors = (type) => {
    switch (type) {
      case 'warning':
        return {
          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 159, 0, 0.1))',
          border: 'rgba(255, 193, 7, 0.8)',
          leftBorder: '#ffc107',
          text: '#b45309',
          iconBackground: 'rgba(255, 193, 7, 0.2)'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.15), rgba(239, 68, 68, 0.1))',
          border: 'rgba(220, 53, 69, 0.8)',
          leftBorder: '#dc3545',
          text: '#991b1b',
          iconBackground: 'rgba(220, 53, 69, 0.2)'
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))',
          border: 'rgba(34, 197, 94, 0.8)',
          leftBorder: '#22c55e',
          text: '#14532d',
          iconBackground: 'rgba(34, 197, 94, 0.2)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))',
          border: 'rgba(59, 130, 246, 0.8)',
          leftBorder: '#3b82f6',
          text: '#1e3a8a',
          iconBackground: 'rgba(59, 130, 246, 0.2)'
        };
    }
  };

  // All messages are displayed (no dismiss functionality)
  const activeMessages = messages;


  // Don't show anything if not authenticated
  if (!isAuthenticated || authLoading) {
    return null;
  }

  if (loading) {
    return (
      <div style={{
        width: '100%',
        marginTop: 'clamp(0.75rem, 2vw, 1rem)',
        padding: 'clamp(0.75rem, 2vw, 1rem)',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <span style={{
          color: '#3b82f6',
          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
          fontWeight: '500'
        }}>🔄 Loading messages...</span>
      </div>
    );
  }

  if (activeMessages.length === 0) {
    return null;
  }

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
      marginTop: 'clamp(0.75rem, 2vw, 1rem)'
    }}>
      {activeMessages.map(message => {
        const colors = getMessageColors(message.message_type);
        return (
          <div
            key={message.id}
            style={{
              background: `${colors.background}, rgba(255, 255, 255, 0.9)`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '1rem',
              boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px ${colors.border}`,
              border: `2px solid ${colors.border}`,
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              animation: 'slideInDown 0.3s ease-out',
              position: 'relative',
              borderLeft: `6px solid ${colors.leftBorder}`
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.5rem, 1.5vw, 0.75rem)'
            }}>
              <div style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                flexShrink: 0,
                background: colors.iconBackground,
                borderRadius: '50%',
                width: 'clamp(2rem, 4vw, 2.5rem)',
                height: 'clamp(2rem, 4vw, 2.5rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${colors.leftBorder}`
              }}>
                {getMessageIcon(message.message_type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                  margin: '0 0 clamp(0.125rem, 0.5vw, 0.25rem) 0',
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  fontWeight: '700',
                  color: colors.text,
                  wordBreak: 'break-word',
                  letterSpacing: '-0.025em'
                }}>
                  {message.title}
                </h4>

                <p style={{
                  margin: 0,
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  lineHeight: '1.6',
                  color: colors.text,
                  wordBreak: 'break-word',
                  opacity: 0.8
                }}>
                  {message.content}
                </p>

                {message.updated_at && (
                  <div style={{
                    fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
                    color: colors.text,
                    marginTop: 'clamp(0.25rem, 1vw, 0.5rem)',
                    fontWeight: '500',
                    opacity: 0.6
                  }}>
                    📅 {t('messages.lastUpdated') || 'Last updated'}: {new Date(message.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes slideInDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default MessagePanel;