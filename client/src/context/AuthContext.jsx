import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for saved session
    const savedToken = localStorage.getItem('parkmate_token');
    const savedUser = localStorage.getItem('parkmate_user');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify token with backend
        api.get('/auth/me')
          .then(res => {
            if (res.data.success) {
              setUser(res.data.user);
              localStorage.setItem('parkmate_user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            // Token expired or invalid
            logout();
          })
          .finally(() => setLoading(false));
      } catch {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token, user: loggedUser } = res.data;
      localStorage.setItem('parkmate_token', token);
      localStorage.setItem('parkmate_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (name, email, phone, password, confirmPassword) => {
    const res = await api.post('/auth/register', { name, email, phone, password, confirmPassword });
    if (res.data.success) {
      const { token, user: registeredUser } = res.data;
      localStorage.setItem('parkmate_token', token);
      localStorage.setItem('parkmate_user', JSON.stringify(registeredUser));
      setUser(registeredUser);
      return registeredUser;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const updateProfile = async (name, phone) => {
    const res = await api.put('/auth/profile', { name, phone });
    if (res.data.success) {
      const updatedUser = res.data.user;
      localStorage.setItem('parkmate_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    }
    throw new Error(res.data.message || 'Update failed');
  };

  const logout = () => {
    localStorage.removeItem('parkmate_token');
    localStorage.removeItem('parkmate_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      updateProfile,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
