import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import axios from 'axios';

function UserManagement({ onClose }) {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    is_admin: false
  });
  const [messageForm, setMessageForm] = useState({
    title: '',
    content: '',
    message_type: 'info'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    loadUsers();
    loadMessages();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/auth/users');
      setUsers(response.data);
    } catch (err) {
      setError(t('admin.failedToLoadUsers') || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      await axios.post('/auth/users', createForm);
      setCreateForm({ username: '', password: '', is_admin: false });
      setShowCreateForm(false);
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.error || (t('admin.failedToCreateUser') || 'Failed to create user'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(t('admin.confirmDeleteUser', { username }) || `Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await axios.delete(`/auth/users/${userId}`);
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.error || (t('admin.failedToDeleteUser') || 'Failed to delete user'));
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`/auth/users/${userId}`, {
        is_active: !currentStatus
      });
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.error || (t('admin.failedToUpdateUserStatus') || 'Failed to update user status'));
    }
  };

  const loadMessages = async () => {
    try {
      setMessagesLoading(true);
      const response = await axios.get('/admin/messages');
      setMessages(response.data);
    } catch (err) {
      setError(t('admin.failedToLoadMessages') || 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleCreateMessage = async (e) => {
    e.preventDefault();
    setMessageLoading(true);
    setError('');

    try {
      await axios.post('/admin/messages', messageForm);
      setMessageForm({ title: '', content: '', message_type: 'info' });
      setShowMessageForm(false);
      loadMessages();
    } catch (error) {
      setError(error.response?.data?.error || (t('admin.failedToCreateMessage') || 'Failed to create message'));
    } finally {
      setMessageLoading(false);
    }
  };

  const handleUpdateMessage = async (e) => {
    e.preventDefault();
    setMessageLoading(true);
    setError('');

    try {
      await axios.put(`/admin/messages/${editingMessage.id}`, messageForm);
      setMessageForm({ title: '', content: '', message_type: 'info' });
      setEditingMessage(null);
      setShowMessageForm(false);
      loadMessages();
    } catch (error) {
      setError(error.response?.data?.error || (t('admin.failedToUpdateMessage') || 'Failed to update message'));
    } finally {
      setMessageLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId, title) => {
    if (!confirm(t('admin.confirmDeleteMessage', { title }) || `Are you sure you want to delete message "${title}"?`)) {
      return;
    }

    try {
      await axios.delete(`/admin/messages/${messageId}`);
      loadMessages();
    } catch (error) {
      setError(error.response?.data?.error || (t('admin.failedToDeleteMessage') || 'Failed to delete message'));
    }
  };

  const toggleMessageStatus = async (messageId, currentStatus) => {
    try {
      await axios.put(`/admin/messages/${messageId}`, {
        is_active: !currentStatus
      });
      loadMessages();
    } catch (error) {
      setError(error.response?.data?.error || (t('admin.failedToUpdateMessageStatus') || 'Failed to update message status'));
    }
  };

  const startEditMessage = (message) => {
    setEditingMessage(message);
    setMessageForm({
      title: message.title,
      content: message.content,
      message_type: message.message_type
    });
    setShowMessageForm(true);
  };

  const cancelMessageForm = () => {
    setShowMessageForm(false);
    setEditingMessage(null);
    setMessageForm({ title: '', content: '', message_type: 'info' });
  };

  if (loading && messagesLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
        <div>{t('admin.loading') || 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: '1.5rem',
      margin: '1rem',
      color: 'white'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>⚙️ {t('admin.administration') || 'Administration'}</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeTab === 'users' && (
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                background: 'linear-gradient(45deg, #28a745, #20c997)',
                border: 'none',
                borderRadius: '12px',
                padding: window.innerWidth < 768 ? '0.6rem' : '0.6rem 1.2rem',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                minWidth: '44px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
              }}
            >
              <span style={{ fontSize: '1rem' }}>➕</span>
              {window.innerWidth >= 768 && <span>{t('admin.addUser') || 'Add User'}</span>}
            </button>
          )}

          {activeTab === 'messages' && (
            <button
              onClick={() => setShowMessageForm(true)}
              style={{
                background: 'linear-gradient(45deg, #28a745, #20c997)',
                border: 'none',
                borderRadius: '12px',
                padding: window.innerWidth < 768 ? '0.6rem' : '0.6rem 1.2rem',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                minWidth: '44px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
              }}
            >
              <span style={{ fontSize: '1rem' }}>➕</span>
              {window.innerWidth >= 768 && <span>{t('admin.addMessage') || 'Add Message'}</span>}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(45deg, #6c757d, #495057)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.6rem 1.2rem',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(108, 117, 125, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(108, 117, 125, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(108, 117, 125, 0.3)';
            }}
          >
            <span style={{ fontSize: '1rem' }}>✕</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            background: activeTab === 'users' ? 'rgba(255, 255, 255, 0.2)' : 'none',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            padding: '0.75rem 1.5rem',
            color: 'white',
            fontWeight: activeTab === 'users' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderBottom: activeTab === 'users' ? '2px solid #007bff' : '2px solid transparent'
          }}
        >
          👥 {t('admin.users') || 'Users'}
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          style={{
            background: activeTab === 'messages' ? 'rgba(255, 255, 255, 0.2)' : 'none',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            padding: '0.75rem 1.5rem',
            color: 'white',
            fontWeight: activeTab === 'messages' ? 'bold' : 'normal',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderBottom: activeTab === 'messages' ? '2px solid #007bff' : '2px solid transparent'
          }}
        >
          📢 {t('admin.messages') || 'Messages'}
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(220, 53, 69, 0.2)',
          border: '1px solid rgba(220, 53, 69, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1rem',
          color: '#ff6b7a'
        }}>
          {error}
        </div>
      )}

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <>
          {showCreateForm && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: 'clamp(1.5rem, 3vw, 2rem)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            margin: '0 0 clamp(1.5rem, 3vw, 2rem) 0',
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            fontWeight: '700',
            color: 'white',
            letterSpacing: '-0.025em'
          }}>{t('admin.createNewUser') || 'Create New User'}</h3>
          <form onSubmit={handleCreateUser}>
            <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'white'
              }}>{t('admin.username') || 'Username'}</label>
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: 'clamp(0.75rem, 2vw, 1rem)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  boxSizing: 'border-box',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                placeholder={t('admin.enterUsername') || 'Enter username'}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              />
            </div>
            <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'white'
              }}>{t('admin.password') || 'Password'}</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: 'clamp(0.75rem, 2vw, 1rem)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  boxSizing: 'border-box',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                placeholder={t('admin.enterPassword') || 'Enter password (min 6 characters)'}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              />
            </div>
            <div style={{ marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                <input
                  type="checkbox"
                  checked={createForm.is_admin}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                  style={{
                    marginRight: '0.75rem',
                    width: '1.25rem',
                    height: '1.25rem',
                    cursor: 'pointer'
                  }}
                />
                {t('admin.adminPrivileges') || 'Admin privileges'}
              </label>
            </div>
            <div style={{
              display: 'flex',
              gap: 'clamp(0.75rem, 2vw, 1rem)',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  background: 'linear-gradient(45deg, #dc3545, #c82333)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                }}
              >
                <span>✕</span>
                <span>{t('admin.cancel') || 'Cancel'}</span>
              </button>

              <button
                type="submit"
                disabled={createLoading}
                style={{
                  background: createLoading ?
                    'rgba(108, 117, 125, 0.3)' :
                    'linear-gradient(45deg, #007bff, #0056b3)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: createLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: createLoading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!createLoading) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <span>{createLoading ? '⏳' : '✅'}</span>
                <span>{createLoading ? (t('admin.creating') || 'Creating...') : (t('admin.createUser') || 'Create User')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '1rem'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('admin.username') || 'Username'}</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('admin.admin') || 'Admin'}</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('admin.status') || 'Status'}</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('admin.lastLogin') || 'Last Login'}</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('admin.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      background: user.id === currentUser.id ? 'rgba(40, 167, 69, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      border: user.id === currentUser.id ? '1px solid rgba(40, 167, 69, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      {user.username}
                      {user.id === currentUser.id && ` (${t('admin.you') || 'You'})`}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {user.is_admin ? '👑' : '👤'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{
                    fontSize: '1.2rem'
                  }}>
                    {user.is_active ? '✅' : '❌'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
                  {user.last_login ? (
                    <div>
                      <div>{new Date(user.last_login + 'Z').toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {new Date(user.last_login + 'Z').toLocaleTimeString('fr-FR', {
                          timeZone: 'Europe/Paris',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ) : (t('admin.never') || 'Never')}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      disabled={user.id === currentUser.id}
                      style={{
                        background: user.is_active ? 'rgba(255, 193, 7, 0.3)' : 'rgba(40, 167, 69, 0.3)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.3rem 0.6rem',
                        color: 'white',
                        fontSize: '0.8rem',
                        cursor: user.id === currentUser.id ? 'not-allowed' : 'pointer',
                        opacity: user.id === currentUser.id ? 0.5 : 1
                      }}
                      title={user.id === currentUser.id ? (t('admin.cannotModifyOwnStatus') || 'Cannot modify your own status') : ''}
                    >
                      {user.is_active ? '⏸️' : '▶️'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={user.id === currentUser.id}
                      style={{
                        background: 'rgba(220, 53, 69, 0.3)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.3rem 0.6rem',
                        color: 'white',
                        fontSize: '0.8rem',
                        cursor: user.id === currentUser.id ? 'not-allowed' : 'pointer',
                        opacity: user.id === currentUser.id ? 0.5 : 1
                      }}
                      title={user.id === currentUser.id ? (t('admin.cannotDeleteOwnAccount') || 'Cannot delete your own account') : ''}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

          {users.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              {t('admin.noUsersFound') || 'No users found'}
            </div>
          )}
        </>
      )}

      {/* Messages Tab Content */}
      {activeTab === 'messages' && (
        <>
          {showMessageForm && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: 'clamp(1.5rem, 3vw, 2rem)',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                margin: '0 0 clamp(1.5rem, 3vw, 2rem) 0',
                fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                fontWeight: '700',
                color: 'white',
                letterSpacing: '-0.025em'
              }}>
                {editingMessage ? (t('admin.editMessage') || 'Edit Message') : (t('admin.createNewMessage') || 'Create New Message')}
              </h3>
              <form onSubmit={editingMessage ? handleUpdateMessage : handleCreateMessage}>
                <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white'
                  }}>{t('admin.title') || 'Title'}</label>
                  <input
                    type="text"
                    value={messageForm.title}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: 'clamp(0.75rem, 2vw, 1rem)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      boxSizing: 'border-box',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    placeholder={t('admin.enterTitle') || 'Enter message title'}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
                <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white'
                  }}>{t('admin.content') || 'Content'}</label>
                  <textarea
                    value={messageForm.content}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                    required
                    rows={4}
                    style={{
                      width: '100%',
                      padding: 'clamp(0.75rem, 2vw, 1rem)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      boxSizing: 'border-box',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder={t('admin.enterContent') || 'Enter message content'}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
                <div style={{ marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white'
                  }}>{t('admin.messageType') || 'Message Type'}</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={messageForm.message_type}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, message_type: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: 'clamp(0.75rem, 2vw, 1rem)',
                        paddingRight: '3rem',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        boxSizing: 'border-box',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        appearance: 'none',
                        cursor: 'pointer',
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <option value="info" style={{ background: '#333', color: 'white' }}>ℹ️ {t('admin.info') || 'Info'}</option>
                      <option value="success" style={{ background: '#333', color: 'white' }}>✅ {t('admin.success') || 'Success'}</option>
                      <option value="warning" style={{ background: '#333', color: 'white' }}>⚠️ {t('admin.warning') || 'Warning'}</option>
                      <option value="error" style={{ background: '#333', color: 'white' }}>❌ {t('admin.error') || 'Error'}</option>
                    </select>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: 'clamp(0.75rem, 2vw, 1rem)',
                  justifyContent: 'flex-end',
                  alignItems: 'center'
                }}>
                  <button
                    type="button"
                    onClick={cancelMessageForm}
                    style={{
                      background: 'linear-gradient(45deg, #dc3545, #c82333)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                    }}
                  >
                    <span>✕</span>
                    <span>{t('admin.cancel') || 'Cancel'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={messageLoading}
                    style={{
                      background: messageLoading ?
                        'rgba(108, 117, 125, 0.3)' :
                        'linear-gradient(45deg, #007bff, #0056b3)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: messageLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: messageLoading ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!messageLoading) {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <span>{messageLoading ? '⏳' : (editingMessage ? '💾' : '✅')}</span>
                    <span>
                      {messageLoading ?
                        (editingMessage ? (t('admin.updating') || 'Updating...') : (t('admin.creating') || 'Creating...')) :
                        (editingMessage ? (t('admin.updateMessage') || 'Update Message') : (t('admin.createMessage') || 'Create Message'))
                      }
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '1rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>{t('admin.title') || 'Title'}</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('admin.type') || 'Type'}</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('admin.status') || 'Status'}</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('admin.createdBy') || 'Created By'}</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('admin.updatedAt') || 'Last Updated'}</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('admin.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(message => (
                  <tr key={message.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{ padding: '0.75rem', maxWidth: '200px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{message.title}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {message.content}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {message.message_type === 'info' && 'ℹ️'}
                      {message.message_type === 'success' && '✅'}
                      {message.message_type === 'warning' && '⚠️'}
                      {message.message_type === 'error' && '❌'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {message.is_active ? '✅' : '❌'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
                      {message.created_by_username || 'Unknown'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
                      {message.updated_at ? new Date(message.updated_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => startEditMessage(message)}
                          style={{
                            background: 'rgba(255, 193, 7, 0.3)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => toggleMessageStatus(message.id, message.is_active)}
                          style={{
                            background: message.is_active ? 'rgba(255, 193, 7, 0.3)' : 'rgba(40, 167, 69, 0.3)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {message.is_active ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id, message.title)}
                          style={{
                            background: 'rgba(220, 53, 69, 0.3)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {messages.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              {t('admin.noMessagesFound') || 'No messages found'}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UserManagement;