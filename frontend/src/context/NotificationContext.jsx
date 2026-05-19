import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchLogs } from '../services/alertService';
import { fetchScenarios } from '../services/cameraService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const lastProcessedId = useRef(null);
  const isFirstLoad = useRef(true);
  const scenarioMapRef = useRef({});

  // Load scenario name map once on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) return;

    fetchScenarios()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.scenarios || [];
        const map = {};
        list.forEach((s) => { if (s.key) map[s.key] = s.name; });
        scenarioMapRef.current = map;
      })
      .catch(() => {});
  }, []);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [{ ...notification, id }, ...prev].slice(0, 5));
    
    // Auto remove after 8 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const pollAlerts = useCallback(async () => {
    const user = localStorage.getItem('user');
    if (!user) return;

    try {
      // Fetch latest 5 alerts from the last 1 hour
      const logs = await fetchLogs({ hours: 1, limit: 5 });
      if (!Array.isArray(logs) || logs.length === 0) return;

      const alerts = logs.filter(log => log.is_alert);
      if (alerts.length === 0) return;

      // On first load, just set the reference point
      if (isFirstLoad.current) {
        lastProcessedId.current = alerts[0].id;
        isFirstLoad.current = false;
        return;
      }

      // Find new alerts since last check
      const newAlerts = [];
      for (const alert of alerts) {
        if (alert.id === lastProcessedId.current) break;
        newAlerts.push(alert);
      }

      if (newAlerts.length > 0) {
        const nameMap = scenarioMapRef.current;
        newAlerts.reverse().forEach(alert => {
          const friendlyName = nameMap[alert.scenario_key] || alert.scenario_key.replace(/_/g, ' ');
          addNotification({
            type: 'alert',
            severity: alert.severity,
            title: friendlyName,
            message: alert.metadata_json?.detail || `Critical event detected on Camera #${alert.camera_id}`,
            cameraId: alert.camera_id,
            timestamp: alert.timestamp,
            logId: alert.id
          });
        });
        lastProcessedId.current = alerts[0].id;
      }
    } catch (err) {
      console.error('Failed to poll alerts:', err);
    }
  }, [addNotification]);

  useEffect(() => {
    pollAlerts(); // Initial check
    const interval = setInterval(pollAlerts, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [pollAlerts]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
