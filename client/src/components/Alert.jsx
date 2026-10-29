import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const Alert = ({ type = 'info', message, title, onClose, className = '' }) => {
  if (!message && !title) return null;

  const styles = {
    info: {
      bg: 'bg-blue-50/90 border-blue-200 text-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />
    },
    success: {
      bg: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
    },
    warning: {
      bg: 'bg-amber-50/90 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
    },
    error: {
      bg: 'bg-red-50/90 border-red-200 text-red-900',
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
    }
  };

  const current = styles[type] || styles.info;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${current.bg} ${className}`}>
      {current.icon}
      <div className="flex-1 text-xs leading-relaxed">
        {title && <p className="font-bold text-sm mb-0.5">{title}</p>}
        {message}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

