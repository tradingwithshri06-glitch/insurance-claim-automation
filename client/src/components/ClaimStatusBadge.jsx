import React from 'react';

const statusConfig = {
  'Draft': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  'Submitted': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Under Review': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Needs Correction': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Under Investigation': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Approved': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Rejected': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'Settlement Pending': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Settled': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Closed': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' }
};

export const ClaimStatusBadge = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} shadow-sm`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {status}
    </span>
  );
};

