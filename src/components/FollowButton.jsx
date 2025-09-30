import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import axios from 'axios';

const FollowButton = ({ cyclistUciId, cyclistName, onFollowChange }) => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [isFollowed, setIsFollowed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check follow status when component mounts or cyclist changes
  useEffect(() => {
    if (cyclistUciId && token) {
      checkFollowStatus();
    }
  }, [cyclistUciId, token]);

  const checkFollowStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const response = await axios.get(`/cyclists/${cyclistUciId}/follow-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFollowed(response.data.is_followed);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!cyclistUciId || !token || isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowed) {
        // Unfollow
        await axios.delete(`/cyclists/${cyclistUciId}/unfollow`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowed(false);
      } else {
        // Follow
        await axios.post(`/cyclists/${cyclistUciId}/follow`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowed(true);
      }

      // Notify parent component if callback provided
      if (onFollowChange) {
        onFollowChange(isFollowed);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <button
        disabled
        style={{
          padding: window.innerWidth < 768
          ? 'clamp(6px, 2vw, 8px)'
          : 'clamp(6px, 2vw, 8px) clamp(8px, 3vw, 12px)',
          background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'not-allowed',
          fontSize: 'clamp(12px, 3vw, 14px)',
          fontWeight: '700',
          minWidth: window.innerWidth < 768 ? '36px' : 'auto',
        width: window.innerWidth < 768 ? '36px' : 'auto',
          opacity: 0.7
        }}
      >
        {window.innerWidth < 768 ? '⏳' : `⏳ ${t('ui.loading') || 'Loading'}...`}
      </button>
    );
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      style={{
        padding: window.innerWidth < 768
          ? 'clamp(6px, 2vw, 8px)'
          : 'clamp(6px, 2vw, 8px) clamp(8px, 3vw, 12px)',
        background: isFollowed
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: 'clamp(12px, 3vw, 14px)',
        fontWeight: '700',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        minWidth: window.innerWidth < 768 ? '36px' : 'auto',
        width: window.innerWidth < 768 ? '36px' : 'auto',
        opacity: isLoading ? 0.7 : 1
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = isFollowed
            ? '0 8px 25px -8px rgba(239, 68, 68, 0.4)'
            : '0 8px 25px -8px rgba(16, 185, 129, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {isLoading
        ? (window.innerWidth < 768 ? '⏳' : `⏳ ${t('ui.loading') || 'Loading'}...`)
        : isFollowed
          ? (window.innerWidth < 768 ? '➖' : `➖ ${t('ui.unfollow') || 'Unfollow'}`)
          : (window.innerWidth < 768 ? '📋' : `📋 ${t('ui.follow') || 'Follow'}`)
      }
    </button>
  );
};

export default FollowButton;