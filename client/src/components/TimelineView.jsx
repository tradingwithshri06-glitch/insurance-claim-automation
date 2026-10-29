import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, FileText, XCircle, DollarSign, UserCheck } from 'lucide-react';

export const TimelineView = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        No workflow actions recorded yet.
      </div>
    );
  }

  const getIcon = (action = '', status = '') => {
    if (action.includes('Approved') || status === 'Approved') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (action.includes('Rejected') || status === 'Rejected') {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    if (action.includes('Investigation') || status === 'Under Investigation') {
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    }
    if (action.includes('Settlement') || status === 'Settled' || status === 'Settlement Pending') {
      return <DollarSign className="w-4 h-4 text-teal-600" />;
    }
    if (action.includes('Review') || status === 'Under Review') {
      return <UserCheck className="w-4 h-4 text-indigo-600" />;
    }
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {timeline.map((item, idx) => (
        <div key={item._id || idx} className="relative group">
          {/* Dot / Icon marker */}
          <div className="absolute -left-[27px] top-1 p-1 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center">
            {getIcon(item.action, item.status)}
          </div>

          <div className="bg-slate-50/80 border border-slate-200/60 rounded-lg p-3 hover:bg-slate-100/60 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">{item.action}</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(item.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {item.changedBy && (
              <div className="mt-1 text-xs text-slate-500">
                By <span className="font-medium text-slate-700">{item.changedBy.fullName || 'User'}</span>
                {item.changedBy.role && (
                  <span className="ml-1 text-[11px] text-slate-400">({item.changedBy.role})</span>
                )}
              </div>
            )}

            {item.comment && (
              <p className="mt-2 text-xs text-slate-600 bg-white border border-slate-200/60 rounded p-2 italic">
                "{item.comment}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

