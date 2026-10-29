import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="p-4 rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <FileQuestion className="w-12 h-12" />
      </div>
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">404 - Page Not Found</h1>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        The requested page or claim resource does not exist or may have been archived.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
};

