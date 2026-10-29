import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 selection:bg-brand-500 selection:text-white">
      {/* Top Demo Notice */}
      <div className="fixed top-0 inset-x-0 bg-amber-500/10 border-b border-amber-200/50 py-1.5 text-center text-xs text-amber-900 font-medium">
        🛡️ Insurance Claim Automation Demonstration System • Simulated Sample Data Only
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mt-6">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/25">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Insur<span className="text-brand-600">Flow</span>
          </span>
        </Link>
        <p className="mt-2 text-xs font-medium text-slate-500">
          Automated End-to-End Insurance Claim & Settlement Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

