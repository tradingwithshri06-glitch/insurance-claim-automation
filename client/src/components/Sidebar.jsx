import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  FileSpreadsheet,
  CheckSquare,
  Search,
  DollarSign,
  ShieldAlert,
  Users,
  History,
  Bell,
  Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Sidebar = () => {
  const { user, isPolicyholder, isOfficer, isInvestigator, isApprover, isFinance, isAdmin } = useAuth();

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
      isActive
        ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-5rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Core Navigation */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            {(isPolicyholder || isAdmin) && (
              <NavLink to="/claims/new" className={navItemClass}>
                <FilePlus2 className="w-4 h-4" />
                <span>Submit New Claim</span>
              </NavLink>
            )}

            <NavLink to="/claims" end className={navItemClass}>
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isPolicyholder ? 'My Claims' : 'All Claims'}</span>
            </NavLink>

            <NavLink to="/policies" className={navItemClass}>
              <Shield className="w-4 h-4" />
              <span>{isPolicyholder ? 'My Policies' : 'Policies'}</span>
            </NavLink>
          </nav>
        </div>

        {/* Staff Workspaces (Conditional based on role) */}
        {!isPolicyholder && (
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Staff Workspaces
            </p>
            <nav className="space-y-1">
              {(isOfficer || isAdmin) && (
                <NavLink to="/claims?status=Submitted" className={navItemClass}>
                  <CheckSquare className="w-4 h-4" />
                  <span>Review Queue</span>
                </NavLink>
              )}

              {(isInvestigator || isAdmin) && (
                <NavLink to="/claims?status=Under%20Investigation" className={navItemClass}>
                  <Search className="w-4 h-4" />
                  <span>Investigations</span>
                </NavLink>
              )}

              {(isApprover || isAdmin) && (
                <NavLink to="/claims?status=Under%20Review" className={navItemClass}>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Approvals Desk</span>
                </NavLink>
              )}

              {(isFinance || isAdmin) && (
                <NavLink to="/claims?status=Settlement%20Pending" className={navItemClass}>
                  <DollarSign className="w-4 h-4" />
                  <span>Settlements Desk</span>
                </NavLink>
              )}
            </nav>
          </div>
        )}

        {/* System Administration */}
        {isAdmin && (
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              System Admin
            </p>
            <nav className="space-y-1">
              <NavLink to="/admin/users" className={navItemClass}>
                <Users className="w-4 h-4" />
                <span>Users & Roles</span>
              </NavLink>

              <NavLink to="/audit" className={navItemClass}>
                <History className="w-4 h-4" />
                <span>Audit Logs</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* Personal */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Personal
          </p>
          <nav className="space-y-1">
            <NavLink to="/notifications" className={navItemClass}>
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Role Indicator Footer Card */}
      <div className="pt-4 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Session</p>
          <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{user?.fullName}</p>
          <p className="text-[11px] text-brand-600 font-semibold">{user?.role}</p>
        </div>
      </div>
    </aside>
  );
};

