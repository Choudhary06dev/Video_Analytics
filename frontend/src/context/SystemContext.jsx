import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchSystemSettings } from '../services/settingsService';

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    clusterSync: true,
    publicEnrollment: true
  });
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const data = await fetchSystemSettings();
      if (data) {
        setSettings({
          maintenanceMode: data.maintenance_mode || data.maintenanceMode || false,
          debugMode: data.debug_mode || data.debugMode || false,
          clusterSync: data.cluster_sync !== undefined ? (data.cluster_sync || data.clusterSync) : true,
          publicEnrollment: data.public_enrollment !== undefined ? (data.public_enrollment || data.publicEnrollment) : true
        });
      }
    } catch (err) {
      console.error("SystemContext: Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();

    // Set up polling to check for updates (e.g., maintenance mode ending)
    const interval = setInterval(refreshSettings, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Apply debug mode to body globally
  useEffect(() => {
    if (settings.debugMode) {
      document.body.classList.add('debug-mode-active');
    } else {
      document.body.classList.remove('debug-mode-active');
    }
  }, [settings.debugMode]);

  return (
    <SystemContext.Provider value={{ ...settings, refreshSettings, loading }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);
