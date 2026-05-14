import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchPermissions as apiFetchPermissions } from '../services/authService';
import { useSystem } from './SystemContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { sessionTimeout } = useSystem();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({});
  const timeoutRef = useRef(null);

  const fetchPermissions = async (activeToken) => {
    if (!activeToken) {
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
      if (err.message.includes('401')) {
        logout();
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setPermissions({});
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Force a redirect to clear any background polling or stale state
    window.location.href = '/login';
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (token) {
        const expiryMin = sessionTimeout || 60;
        timeoutRef.current = setTimeout(() => {
            console.log("Session expired due to inactivity.");
            logout();
        }, expiryMin * 60 * 1000);
    }
  };

  useEffect(() => {
    resetTimer();
  }, [sessionTimeout]);

  useEffect(() => {
    const initializeSession = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser && token) {
        setUser(JSON.parse(savedUser));
        await fetchPermissions(token);
        resetTimer();
      } else {
        setPermissions({});
      }
      setLoading(false);
    };
    initializeSession();

    // Activity listeners for session timeout
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
        events.forEach(event => window.removeEventListener(event, resetTimer));
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [token, sessionTimeout]); // Added sessionTimeout to sync listeners

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

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    fetchPermissions(userToken);
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
