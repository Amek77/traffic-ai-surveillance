import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user details from localStorage', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, name, role } = response.data.data;
      
      const userObj = { name, email, role };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);
      return { success: true };
    } catch (error) {
      console.warn('Backend login request failed, checking local credentials for offline preview:', error);
      
      // Local fallback for offline preview
      const isTestAdmin = email === 'admin@traffic.gov.in' && password === 'admin123';
      const isTestOfficer = email === 'officer@traffic.gov.in' && password === 'officer123';
      
      if (isTestAdmin || isTestOfficer) {
        const userObj = {
          name: isTestAdmin ? 'System Administrator' : 'Traffic Operator',
          email,
          role: isTestAdmin ? 'Admin' : 'Operator'
        };
        localStorage.setItem('token', 'mock-jwt-session-token');
        localStorage.setItem('user', JSON.stringify(userObj));
        setUser(userObj);
        return { success: true };
      }
      
      const message = error.response?.data?.message || 'Invalid email or password';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
