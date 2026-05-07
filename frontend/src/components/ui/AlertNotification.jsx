import React from 'react';
import { Siren, X, ExternalLink, ShieldAlert, AlertTriangle, Info, Bell, Check, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const severityConfig = {
  Critical: {
    icon: ShieldAlert,
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    shadow: 'shadow-danger/20',
    pulse: 'animate-pulse'
  },
  High: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    shadow: 'shadow-warning/20',
    pulse: ''
  },
  Medium: {
    icon: Info,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    shadow: 'shadow-accent/20',
    pulse: ''
  },
  Low: {
    icon: Bell,
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
    shadow: 'shadow-success/20',
    pulse: ''
  },
  success: {
    icon: Check,
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
    shadow: 'shadow-success/20',
    pulse: ''
  },
  info: {
    icon: Info,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    shadow: 'shadow-accent/20',
    pulse: ''
  }
};

const Toast = ({ notification }) => {
  const { removeNotification } = useNotifications();
  const navigate = useNavigate();
  const { canView } = useAuth();
  const config = severityConfig[notification.severity] || severityConfig[notification.type] || severityConfig.Medium;
  const Icon = config.icon;
  const hasVaultAccess = canView('vault');

  const handleView = () => {
    removeNotification(notification.id);
    if (hasVaultAccess) {
      navigate('/vault');
    }
  };

  return (
    <div 
      className={`w-80 sm:w-96 bg-card border ${config.border} rounded-xl shadow-2xl ${config.shadow} p-4 flex gap-4 animate-in slide-in-from-right duration-300 pointer-events-auto group relative overflow-hidden`}
    >
      {/* Tint Overlay */}
      <div className={`absolute inset-0 ${config.bg} pointer-events-none`} />
      {/* Background glow for critical alerts */}
      {notification.severity === 'Critical' && (
        <div className="absolute inset-0 bg-danger/5 animate-pulse -z-10" />
      )}

      <div className={`w-12 h-12 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center shrink-0 ${config.pulse}`}>
        <Icon className={`w-6 h-6 ${config.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
            {notification.severity ? `${notification.severity} Alert` : 'System Notification'}
          </span>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="text-text-gray hover:text-text-dark transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        
        <h4 className="text-sm font-black text-text-dark mt-1 truncate tracking-tight uppercase">
          {notification.title}
        </h4>
        
        <p className="text-[11px] font-semibold text-text-gray mt-1 leading-relaxed line-clamp-2">
          {notification.message}
        </p>

        <div className="flex items-center justify-between mt-3">
          {notification.type === 'alert' || notification.severity ? (
            <>
              <span className="text-[10px] font-bold text-text-gray/60 uppercase">
                CAM-{notification.cameraId} • {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button 
                onClick={handleView}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  hasVaultAccess 
                    ? 'bg-card hover:bg-surface border-border text-text-dark cursor-pointer' 
                    : 'bg-surface/50 border-border/50 text-text-gray/50 cursor-not-allowed'
                }`}
                disabled={!hasVaultAccess}
                title={!hasVaultAccess ? 'You do not have access to Activity Vault' : ''}
              >
                {hasVaultAccess ? <ExternalLink size={10} /> : <Lock size={10} />}
                {hasVaultAccess ? 'View Detail' : 'Restricted'}
              </button>
            </>
          ) : (
            <span className="text-[10px] font-bold text-text-gray/60 uppercase">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 transition-all duration-[8000ms] w-0 group-hover:w-full" style={{ width: '100%' }} />
    </div>
  );
};

export const AlertNotificationContainer = () => {
  const { notifications } = useNotifications();

  return (
    <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
      {notifications.map(n => (
        <Toast key={n.id} notification={n} />
      ))}
    </div>
  );
};
