import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { claimService } from '../services/claimService';
import { StatCard } from '../components/StatCard';
import { ClaimStatusBadge } from '../components/ClaimStatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Filter,
  Calendar
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, isPolicyholder, isOfficer, isInvestigator, isApprover, isFinance, isAdmin } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'ALL') {
        params.category = categoryFilter;
      }
      const res = await claimService.getDashboardStats(params);
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [categoryFilter]);

  if (loading && !stats) {
    return <LoadingSpinner label="Calculating real-time database metrics..." size="lg" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md mb-3 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Role: {user?.role} Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
            {isPolicyholder
              ? 'Manage your active insurance policies, submit new claims, and track live status transitions from review to settlement.'
              : `Review pending items, verify submitted documentation, and execute role-authorized transitions across the insurance workflow.`}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {(isPolicyholder || isAdmin) && (
              <Link
                to="/claims/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg transition"
              >
                <PlusCircle className="w-4 h-4" />
                Submit New Claim
              </Link>
            )}
            <Link
              to="/claims"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition"
            >
              <FileText className="w-4 h-4" />
              {isPolicyholder ? 'View My Claims' : 'Browse All Claims'}
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient opacity-10 pointer-events-none"></div>
      </div>

      {/* Category filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-brand-600" />
          <span>Filter Real Database Statistics by Category:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['ALL', 'Motor Insurance', 'Home & Property Insurance'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition ${
                categoryFilter === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Claims"
          value={stats?.totalClaims || 0}
          subtitle={`Claimed: $${(stats?.totalClaimedAmount || 0).toLocaleString()}`}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Under Review / Queue"
          value={stats?.underReview || 0}
          subtitle={`${stats?.submitted || 0} awaiting assignment`}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Approved Claims"
          value={stats?.approved || 0}
          subtitle={`${stats?.rejected || 0} rejected`}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Settled Disbursements"
          value={`$${(stats?.totalSettledAmount || 0).toLocaleString()}`}
          subtitle={`${stats?.settled || 0} claims fully disbursed`}
          icon={DollarSign}
          color="teal"
        />
      </div>

      {/* Secondary Status Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitted</span>
          <p className="text-xl font-extrabold text-blue-600 mt-1">{stats?.submitted || 0}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Needs Info</span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">{stats?.needsCorrection || 0}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Flagged Risk</span>
          <p className="text-xl font-extrabold text-rose-600 mt-1">{stats?.flaggedClaims || 0}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Payout</span>
          <p className="text-xl font-extrabold text-purple-600 mt-1">{stats?.settlementPending || 0}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settled</span>
          <p className="text-xl font-extrabold text-teal-600 mt-1">{stats?.settled || 0}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rejected</span>
          <p className="text-xl font-extrabold text-red-600 mt-1">{stats?.rejected || 0}</p>
        </div>
      </div>

      {/* Role-Specific Action Spotlight */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isPolicyholder ? 'Quick Actions for Policyholder' : 'Staff Operational Queues'}
            </h3>
            <p className="text-xs text-slate-500">Authorized actions according to your assigned domain role.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isPolicyholder && (
            <>
              <Link
                to="/claims/new"
                className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition group bg-slate-50/50"
              >
                <PlusCircle className="w-6 h-6 text-brand-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-slate-900">File a New Claim</h4>
                <p className="text-[11px] text-slate-500 mt-1">Submit accident details and upload damage photos.</p>
              </Link>
              <Link
                to="/policies"
                className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition group bg-slate-50/50"
              >
                <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-slate-900">My Insurance Policies</h4>
                <p className="text-[11px] text-slate-500 mt-1">Review active vehicles, deductibles and coverage limits.</p>
              </Link>
              <Link
                to="/claims?status=Needs%20Correction"
                className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition group bg-slate-50/50"
              >
                <AlertTriangle className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-slate-900">Action Required Claims</h4>
                <p className="text-[11px] text-slate-500 mt-1">Provide missing documents requested by the claims officer.</p>
              </Link>
            </>
          )}

          {(isOfficer || isAdmin) && (
            <Link
              to="/claims?status=Submitted"
              className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition group bg-slate-50/50"
            >
              <Clock className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-xs font-bold text-slate-900">Claims Officer Intake</h4>
              <p className="text-[11px] text-slate-500 mt-1">Verify submitted documents and assign claims for review.</p>
            </Link>
          )}

          {(isInvestigator || isAdmin) && (
            <Link
              to="/claims?status=Under%20Investigation"
              className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition group bg-slate-50/50"
            >
              <AlertTriangle className="w-6 h-6 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-xs font-bold text-slate-900">Special Investigations</h4>
              <p className="text-[11px] text-slate-500 mt-1">Examine flagged claims and record investigative findings.</p>
            </Link>
          )}

          {(isApprover || isAdmin) && (
            <Link
              to="/claims?status=Under%20Review"
              className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition group bg-slate-50/50"
            >
              <CheckCircle className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-xs font-bold text-slate-900">Approvals Desk</h4>
              <p className="text-[11px] text-slate-500 mt-1">Issue official approval or rejection decisions with reasons.</p>
            </Link>
          )}

          {(isFinance || isAdmin) && (
            <Link
              to="/claims?status=Settlement%20Pending"
              className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition group bg-slate-50/50"
            >
              <DollarSign className="w-6 h-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-xs font-bold text-slate-900">Finance & Disbursements</h4>
              <p className="text-[11px] text-slate-500 mt-1">Disburse approved settlements and record payment references.</p>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Claim Activity</h3>
            <p className="text-xs text-slate-500">Live records from the database ordered by recent status change.</p>
          </div>
          <Link
            to="/claims"
            className="text-xs font-bold text-brand-600 hover:text-brand-800 inline-flex items-center gap-1"
          >
            View All Claims <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-6 py-3">Claim Reference</th>
                <th className="px-6 py-3">Policy & Vehicle</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Claimed Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {stats?.recentActivity?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No claim records found in the database.
                  </td>
                </tr>
              ) : (
                stats?.recentActivity?.map((claim) => (
                  <tr key={claim._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 font-bold text-brand-600">
                      <Link to={`/claims/${claim._id}`} className="hover:underline">
                        {claim.claimReference}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800">{claim.policyId?.policyNumber || 'N/A'}</p>
                      <p className="text-[11px] text-slate-400">
                        {claim.policyId?.vehicleDetails?.make
                          ? `${claim.policyId.vehicleDetails.make} ${claim.policyId.vehicleDetails.model}`
                          : claim.category}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{claim.category}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      ${claim.claimedAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <ClaimStatusBadge status={claim.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/claims/${claim._id}`}
                        className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-800"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

