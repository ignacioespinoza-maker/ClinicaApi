import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackAlertProps {
  type: AlertType;
  message: string;
  title?: string;
  onClose?: () => void;
}

export const FeedbackAlert: React.FC<FeedbackAlertProps> = ({
  type,
  message,
  title,
  onClose,
}) => {
  const isAssertive = type === 'error' || type === 'warning';

  const icons = {
    success: <CheckCircle2 className="alert-icon text-success" aria-hidden="true" size={20} />,
    error: <AlertCircle className="alert-icon text-danger" aria-hidden="true" size={20} />,
    warning: <AlertTriangle className="alert-icon text-warning" aria-hidden="true" size={20} />,
    info: <Info className="alert-icon text-info" aria-hidden="true" size={20} />,
  };

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      className={`alert-box alert-${type}`}
    >
      <div className="alert-content">
        <span className="alert-icon-wrapper">{icons[type]}</span>
        <div className="alert-text">
          {title && <strong className="alert-title">{title}</strong>}
          <p className="alert-message">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="alert-close-btn"
          aria-label="Cerrar notificación"
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
