import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchPermissions as apiFetchPermissions } from '../services/authService';
import { useSystem } from './SystemContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { sessionTimeout } = useSystem();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({});
  const timeoutRef = useRef(null);

  const fetchPermissions = async (isLoggedIn) => {
    if (!isLoggedIn) {
      setPermissions({});
      return;
    }
    try {
      const data = await apiFetchPermissions();
      setPermissions(data?.permissions || {});
    } catch (err) {
      console.error("AuthContext: Permission sync failed:", err);
      setPermissions({});
      // If we get a 401 during initialization, we should clear the state
      if (err.message && err.message.includes('401')) {
        logout();
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setPermissions({});
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Force a redirect to clear any background polling or stale state
    window.location.href = '/login';
  };

  useEffect(() => {
    const initializeSession = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        await fetchPermissions(true);
      } else {
        setPermissions({});
      }
      setLoading(false);
    };
    initializeSession();
  }, []);

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

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    fetchPermissions(true);
  };

  const updateProfile = (updatedFields) => {
    const newData = { ...user, ...updatedFields };
    setUser(newData);
    localStorage.setItem('user', JSON.stringify(newData));
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, permissions, canView, canEdit, canDelete, login, logout, updateProfile, isAuthenticated: !!user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
