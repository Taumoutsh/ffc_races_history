import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    is_admin: false
  });
  const [createLoading, setCreateLoading] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      setError('Failed to load users');
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
      setError(error.response?.data?.error || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await axios.delete(`/auth/users/${userId}`);
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`/auth/users/${userId}`, {
        is_active: !currentStatus
      });
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
        <div>Loading users...</div>
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
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>👥 User Management</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              background: 'linear-gradient(45deg, #28a745, #20c997)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.6rem 1.2rem',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
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
            <span>Add User</span>
          </button>
          
          {showCreateForm && (
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                background: 'linear-gradient(45deg, #dc3545, #c82333)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.6rem 1.2rem',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
              }}
            >
              <span style={{ fontSize: '1rem' }}>✕</span>
              <span>Cancel</span>
            </button>
          )}
        </div>
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

      {showCreateForm && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Create New User</h3>
          <form onSubmit={handleCreateUser}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter username"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter password (min 6 characters)"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createForm.is_admin}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                  style={{ marginRight: '0.5rem' }}
                />
                Admin privileges
              </label>
            </div>
            <button
              type="submit"
              disabled={createLoading}
              style={{
                background: createLoading ? 'rgba(108, 117, 125, 0.3)' : 'linear-gradient(45deg, #007bff, #0056b3)',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                color: 'white',
                fontWeight: 'bold',
                cursor: createLoading ? 'not-allowed' : 'pointer',
                opacity: createLoading ? 0.7 : 1
              }}
            >
              {createLoading ? '⏳ Creating...' : '✅ Create User'}
            </button>
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
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Username</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Admin</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Last Login</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
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
                      {user.id === currentUser.id && ' (You)'}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {user.is_admin ? '👑' : '👤'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{
                    background: user.is_active ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)',
                    border: user.is_active ? '1px solid rgba(40, 167, 69, 0.5)' : '1px solid rgba(220, 53, 69, 0.5)',
                    borderRadius: '12px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.8rem'
                  }}>
                    {user.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
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
                      title={user.id === currentUser.id ? 'Cannot modify your own status' : ''}
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
                      title={user.id === currentUser.id ? 'Cannot delete your own account' : ''}
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
          No users found
        </div>
      )}
    </div>
  );
}

export default UserManagement;