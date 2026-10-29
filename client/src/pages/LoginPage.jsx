import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn, Loader2, Sparkles, AlertCircle, Shield } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    location.search.includes('expired=true')
      ? 'Your session has expired. Please sign in again.'
      : ''
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts helper
  const demoAccounts = [
    { role: 'Policyholder', email: 'policyholder@insurance.demo', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
    { role: 'Claims Officer', email: 'officer@insurance.demo', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { role: 'Investigator', email: 'investigator@insurance.demo', color: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
    { role: 'Approver', email: 'approver@insurance.demo', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
    { role: 'Finance Staff', email: 'finance@insurance.demo', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
    { role: 'Administrator', email: 'admin@insurance.demo', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  ];

  const handleQuickFill = (accEmail) => {
    setEmail(accEmail);
    setPassword('Password123!');
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to Your Account</h2>
        <p className="text-xs text-slate-500 mt-1">Enter your credentials to access your insurance claims portal.</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@insurance.demo"
            className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">Password</label>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      {/* Demo Credentials Quick Switcher */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold text-slate-900">One-Click Demonstration Logins:</span>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">
          Select a role to autofill demonstration credentials (seeded password: <code>Password123!</code>):
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {demoAccounts.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleQuickFill(acc.email)}
              className={`p-2 rounded-lg text-left text-xs font-semibold border border-transparent transition ${acc.color}`}
            >
              <div className="leading-tight">{acc.role}</div>
              <div className="text-[10px] opacity-75 font-normal truncate">{acc.email.split('@')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don’t have a policyholder account?{' '}
        <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
          Register as Policyholder
        </Link>
      </div>
    </div>
  );
};

