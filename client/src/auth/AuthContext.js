import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE = '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get stored tokens
  const getToken = () => localStorage.getItem('token');
  const getRefreshToken = () => localStorage.getItem('refreshToken');

  // Store tokens
  const setTokens = (token, refreshToken) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  };

  // Clear tokens
  const clearTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  // Refresh token
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data.token, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      const storedUser = localStorage.getItem('user');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else if (response.status === 401) {
          // Try refresh
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            // Retry
            const retryResponse = await fetch(`${API_BASE}/auth/me`, {
              headers: { 'Authorization': `Bearer ${getToken()}` },
            });
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
            } else {
              clearTokens();
            }
          } else {
            clearTokens();
          }
        }
      } catch (err) {
        // Use stored user if offline
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [refreshAccessToken]);

  // Register
  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setTokens(data.token, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Login
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setTokens(data.token, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore errors
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Update failed');
      }

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      setTokens(data.token, data.refreshToken);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin',
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    getToken,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;