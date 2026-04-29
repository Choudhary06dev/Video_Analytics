import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ActivityVault() {
  const { isDark } = useTheme();
  
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '40px 20px',
      background: isDark ? '#0f0f23' : '#f8fafc',
    }}>
      <div style={{
        textAlign: 'center',
        color: isDark ? '#94a3b8' : '#64748b',
        fontSize: '14px',
        fontWeight: '500',
        padding: '16px 24px',
        background: isDark ? 'linear-gradient(135deg, #1e1b4b, #0f0f23)' : 'linear-gradient(135deg, #ffffff, #f8fafc)',
        borderRadius: '12px',
        border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.1)'}`,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        © 2026 Video Analytics Solutions. All rights reserved.
      </div>
    </div>
  );
}

