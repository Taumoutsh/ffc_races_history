import React, { useState, useRef, useEffect } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

const BurgerMenu = ({ showAdminPanel, setShowAdminPanel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen &&
          menuRef.current &&
          !menuRef.current.contains(event.target) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  const handleAdminPanel = () => {
    setIsOpen(false);
    setShowAdminPanel(!showAdminPanel);
  };

  return (
    <>
      {/* Burger Button */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={`burger-button ${isOpen ? 'open' : 'closed'}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '44px',
          height: '44px',
          background: isOpen ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.9)',
          border: isOpen ? '1px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          zIndex: 1001,
          outline: 'none'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          transition: 'all 0.2s ease-in-out',
          position: 'relative',
          width: '20px',
          height: '16px'
        }}>
          <span style={{
            width: '20px',
            height: '2px',
            background: '#3b82f6',
            borderRadius: '2px',
            transition: 'all 0.2s ease-in-out',
            position: 'absolute',
            top: isOpen ? '7px' : '0px',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transformOrigin: 'center'
          }} />
          <span style={{
            width: '20px',
            height: '2px',
            background: '#3b82f6',
            borderRadius: '2px',
            transition: 'all 0.2s ease-in-out',
            position: 'absolute',
            top: '7px',
            opacity: isOpen ? 0 : 1,
            transform: 'scaleX(1)'
          }} />
          <span style={{
            width: '20px',
            height: '2px',
            background: '#3b82f6',
            borderRadius: '2px',
            transition: 'all 0.2s ease-in-out',
            position: 'absolute',
            top: isOpen ? '7px' : '14px',
            transform: isOpen ? 'rotate(-45deg)' : 'rotate(0deg)',
            transformOrigin: 'center'
          }} />
        </div>
      </button>

      {/* Menu Panel */}
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-320px',
          width: '320px',
          height: '100vh',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isOpen ? '-10px 0 25px rgba(0, 0, 0, 0.15)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(226, 232, 240, 0.6)'
        }}
      >
        {/* Menu Header */}
        <div style={{
          padding: '2rem 1.5rem 1rem',
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ⚙️ {t('admin.menu') || 'Menu'}
          </h3>
        </div>

        {/* Menu Content */}
        <div style={{
          flex: 1,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* User Info Section */}
          <div style={{
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <h4 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1e40af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              👤 {t('admin.userInfo') || 'User Info'}
            </h4>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              {user?.username}
            </div>
            {isAdmin && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'linear-gradient(45deg, #8b5cf6, #a855f7)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                👑 Admin
              </div>
            )}
          </div>

          {/* Language Switcher Section */}
          <div style={{
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <h4 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#047857',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              🌍 {t('ui.language') || 'Language'}
            </h4>
            <LanguageSwitcher />
          </div>

          {/* Admin Panel Button */}
          {isAdmin && (
            <button
              onClick={handleAdminPanel}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 12px -2px rgba(139, 92, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px -1px rgba(139, 92, 246, 0.3)';
              }}
            >
              ⚙️ {showAdminPanel ? (t('admin.closeAdmin') || 'Close Admin') : (t('admin.adminPanel') || 'Admin Panel')}
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 12px -2px rgba(239, 68, 68, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(239, 68, 68, 0.3)';
            }}
          >
            🚪 {t('admin.logout') || 'Logout'}
          </button>
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .burger-button.closed:hover {
          background: rgba(59, 130, 246, 0.1) !important;
          border-color: #3b82f6 !important;
        }

        .burger-button.open:hover {
          background: rgba(59, 130, 246, 0.2) !important;
          border-color: #2563eb !important;
        }
      `}</style>
    </>
  );
};

export default BurgerMenu;