import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockease_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // On first load, if a token is saved, confirm it's still valid and refresh user info.
  useEffect(() => {
    const token = localStorage.getItem('stockease_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('stockease_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData) {
    localStorage.setItem('stockease_token', token);
    localStorage.setItem('stockease_user', JSON.stringify(userData));
    setUser(userData);
  }

  function updateUser(partial) {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem('stockease_user', JSON.stringify(next));
      return next;
    });
  }

  function logout() {
    localStorage.removeItem('stockease_token');
    localStorage.removeItem('stockease_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
