import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchPermissions as apiFetchPermissions } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({});

  const fetchPermissions = async (activeToken) => {
    if (!activeToken) {
      setPermissions({});
      return;
    }
    try {
      const data = await apiFetchPermissions();
      setPermissions(data?.permissions || {});
    } catch (err) {
      setPermissions({});
    }
  };

  const canView = (moduleKey) => {
    if (!moduleKey) return true;
    const modulePerm = permissions[moduleKey];
    return !!modulePerm?.can_view;
  };

  const canEdit = (moduleKey) => {
    if (!moduleKey) return true;
    return !!permissions[moduleKey]?.can_edit;
  };

  const canDelete = (moduleKey) => {
    if (!moduleKey) return true;
    return !!permissions[moduleKey]?.can_delete;
  };

  useEffect(() => {
    const initializeSession = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser && token) {
        setUser(JSON.parse(savedUser));
        await fetchPermissions(token);
      } else {
        setPermissions({});
      }
      setLoading(false);
    };
    initializeSession();
  }, [token]);

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    fetchPermissions(userToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setPermissions({});
  };

  const updateProfile = (updatedFields) => {
    const newData = { ...user, ...updatedFields };
    setUser(newData);
    localStorage.setItem('user', JSON.stringify(newData));
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, permissions, canView, canEdit, canDelete, login, logout, updateProfile, isAuthenticated: !!token, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
