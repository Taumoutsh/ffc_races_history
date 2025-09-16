import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios base URL - use relative URLs for nginx proxy
const getApiBaseUrl = () => {
  // Check for explicit API URL override
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // For development, check if we're on localhost and use direct API port
  const currentHost = window.location.hostname;
  if ((currentHost === 'localhost' || currentHost === '127.0.0.1') && import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }

  // For production/docker, use relative URL (nginx will proxy)
  return '/api';
};

axios.defaults.baseURL = getApiBaseUrl();

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // Configure axios to include auth token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get('/auth/verify');
          setUser(response.data.user);
        } catch (error) {
          // Token is invalid, remove it
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login', {
        username,
        password
      });

      const { user, token } = response.data;
      
      // Set axios authorization header immediately to prevent race conditions
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setToken(token);
      localStorage.setItem('auth_token', token);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post('/auth/logout');
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}