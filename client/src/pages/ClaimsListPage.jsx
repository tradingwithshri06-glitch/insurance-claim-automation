import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { claimService } from '../services/claimService';
import { useAuth } from '../hooks/useAuth';
import { ClaimStatusBadge } from '../components/ClaimStatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Search,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export const ClaimsListPage = () => {
  const { isPolicyholder, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [category, setCategory] = useState(searchParams.get('category') || 'ALL');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page'), 10) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const params = {
        page,
        limit: 10
      };
      if (status !== 'ALL') params.status = status;
      if (category !== 'ALL') params.category = category;
      if (search.trim()) params.search = search.trim();

      const res = await claimService.getClaims(params);
      if (res.success) {
        setClaims(res.claims || []);
        setTotalPages(res.pages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch claims.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [status, category, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchClaims();
  };

  const handleResetFilters = () => {
    setStatus('ALL');
    setCategory('ALL');
    setSearch('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isPolicyholder ? 'My Insurance Claims' : 'Claims Processing Directory'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPolicyholder
              ? 'View all claims submitted under your policyholder account.'
              : 'Enterprise claims queue across all workflow stages with server-side access controls.'}
          </p>
        </div>

        {(isPolicyholder || isAdmin) && (
          <Link
            to="/claims/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Submit New Claim
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search text */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by claim reference (e.g. CLM-2026-...) or location..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Status selector */}
          <div className="w-full md:w-48">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Needs Correction">Needs Correction</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Settlement Pending">Settlement Pending</option>
              <option value="Settled">Settled</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Category selector */}
          <div className="w-full md:w-52">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="Motor Insurance">Motor Insurance</option>
              <option value="Home & Property Insurance">Home & Property</option>
              <option value="Commercial Insurance">Commercial</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Found <strong>{totalCount}</strong> matching claims</span>
          <span>Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong></span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Fetching matching claims..." />
          </div>
        ) : claims.length === 0 ? (
          <div className="py-16 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No claims match the specified criteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your filter or search keywords, or submit a new claim to begin the automation workflow.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-6 py-3">Claim Reference</th>
                  <th className="px-6 py-3">Policy Number</th>
                  {!isPolicyholder && <th className="px-6 py-3">Policyholder</th>}
                  <th className="px-6 py-3">Incident Date</th>
                  <th className="px-6 py-3">Claimed Amount</th>
                  <th className="px-6 py-3">Current Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {claims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-slate-50/60 transition group">
                    <td className="px-6 py-4 font-bold text-brand-600">
                      <Link to={`/claims/${claim._id}`} className="hover:underline flex items-center gap-1.5">
                        {claim.claimReference}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{claim.policyId?.policyNumber || 'N/A'}</p>
                      <p className="text-[11px] text-slate-400">{claim.category}</p>
                    </td>
                    {!isPolicyholder && (
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{claim.policyholderId?.fullName || 'N/A'}</p>
                        <p className="text-[11px] text-slate-400">{claim.policyholderId?.email}</p>
                      </td>
                    )}
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(claim.incidentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${claim.claimedAmount?.toLocaleString()}
                      {claim.approvedAmount !== null && (
                        <p className="text-[10px] font-semibold text-emerald-600">
                          Approved: ${claim.approvedAmount.toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ClaimStatusBadge status={claim.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/claims/${claim._id}`}
                        className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition"
                      >
                        Inspect Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

