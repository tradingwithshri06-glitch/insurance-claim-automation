import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { History, Search, Filter, ShieldCheck, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [userEmailSearch, setUserEmailSearch] = useState('');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (resourceFilter !== 'ALL') params.resourceType = resourceFilter;
      if (userEmailSearch.trim()) params.userEmail = userEmailSearch.trim();

      const res = await adminService.getAuditLogs(params);
      if (res.success) {
        setLogs(res.logs || []);
        setTotalCount(res.total || 0);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter, resourceFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const handleReset = () => {
    setActionFilter('ALL');
    setResourceFilter('ALL');
    setUserEmailSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Audit & Compliance Log</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable audit records of sensitive operations, workflow transitions, role modifications, and payments.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={userEmailSearch}
              onChange={(e) => setUserEmailSearch(e.target.value)}
              placeholder="Search by user email..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              <option value="ALL">All Resource Types</option>
              <option value="Claim">Claim</option>
              <option value="User">User</option>
              <option value="Policy">Policy</option>
              <option value="Document">Document</option>
              <option value="Settlement">Settlement</option>
              <option value="Auth">Auth</option>
              <option value="System">System</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Total Records: <strong>{totalCount}</strong></span>
          <span>Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong></span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Querying audit records..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No audit log records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">User & Role</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">IP Address</th>
                  <th className="px-5 py-3">Details / Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{log.userEmail}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">{log.userRole}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {log.resourceType}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="text-[11px] text-slate-600 truncate font-mono bg-slate-50 border border-slate-100 p-1 rounded" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
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
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

