import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/api/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            setToken(storedToken);
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error('Session verification failed', err);
          handleLogout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.success && res.data.token) {
        const { token: userToken, user: userData } = res.data;
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, message: 'Invalid response format' };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message: errMsg };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
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
