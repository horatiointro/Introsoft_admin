import React from 'react';
import { Building2, Layers, Filter, CheckCircle2, ChevronDown, RefreshCw, Smartphone, Plus } from 'lucide-react';
import { CompanyScopeFilter, Customer, Application } from '../types';

interface ScopeHeaderBarProps {
  scopeFilter: CompanyScopeFilter;
  onScopeChange: (newScope: CompanyScopeFilter) => void;
  customers: Customer[];
  applications: Application[];
  activeIncidentsCount?: number;
  scopedSpendUsd?: number;
  onNavigateToTenants?: () => void;
}

export const ScopeHeaderBar: React.FC<ScopeHeaderBarProps> = ({
  scopeFilter,
  onScopeChange,
  customers,
  applications,
  activeIncidentsCount = 0,
  scopedSpendUsd = 1482.40,
  onNavigateToTenants
}) => {
  const selectedTenant = customers.find(c => c.id === scopeFilter.tenantId);
  const filteredApps = scopeFilter.tenantId === 'all'
    ? applications
    : applications.filter(a => a.customerId === scopeFilter.tenantId);

  const selectedApp = applications.find(a => a.id === scopeFilter.appId);

  const handleTenantSelect = (tenantId: string) => {
    onScopeChange({
      tenantId,
      appId: 'all',
      scopeName: tenantId === 'all' ? 'Total Company View' : customers.find(c => c.id === tenantId)?.name
    });
  };

  const handleAppSelect = (appId: string) => {
    onScopeChange({
      ...scopeFilter,
      appId,
      scopeName: appId === 'all'
        ? (scopeFilter.tenantId === 'all' ? 'Total Company View' : selectedTenant?.name)
        : selectedApp?.name
    });
  };

  const handleResetToTotalCompany = () => {
    onScopeChange({
      tenantId: 'all',
      appId: 'all',
      scopeName: 'Total Company View'
    });
  };

  return (
    <div className="bg-[#12141c] border border-[#222636] rounded-xl p-4 shadow-xl">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Scope Title & Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <Building2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                Global Hierarchical View Scope
              </span>

              {/* Dynamic Scope Badge */}
              {scopeFilter.tenantId === 'all' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  TOTAL COMPANY VIEW (ALL TENANTS)
                </span>
              ) : scopeFilter.appId === 'all' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  TENANT SCOPE: {selectedTenant?.name || scopeFilter.tenantId}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  APP SCOPE: {selectedApp?.name || scopeFilter.appId}
                </span>
              )}
            </div>

            <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2 mt-0.5">
              <span>{selectedApp?.name || selectedTenant?.name || 'All Organizations & Enterprise Applications'}</span>
              {scopeFilter.tenantId !== 'all' && (
                <button
                  onClick={handleResetToTotalCompany}
                  className="text-[10px] font-mono text-blue-400 hover:text-blue-300 underline flex items-center gap-1 ml-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset to Company View
                </button>
              )}
            </h2>
          </div>
        </div>

        {/* Drill-down Scope Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tenant Selector & Quick Onboard */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-[#181c2b] border border-[#283046] px-3 py-1.5 rounded-lg">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-[#8890a6] uppercase">Tenant / Customer</span>
                <select
                  value={scopeFilter.tenantId}
                  onChange={e => handleTenantSelect(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-2"
                >
                  <option value="all" className="bg-[#12141c] text-white">Total Company (All Tenants)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#12141c] text-white">
                      {c.name} ({c.tier || 'Enterprise'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {onNavigateToTenants && (
              <button
                id="scope-bar-onboard-tenant-btn"
                onClick={onNavigateToTenants}
                className="px-2.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 shrink-0"
                title="Open Tenant Directory & Onboard New Enterprise Tenant"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Manage Tenants</span>
              </button>
            )}
          </div>

          {/* Application Selector */}
          <div className="flex items-center space-x-2 bg-[#181c2b] border border-[#283046] px-3 py-1.5 rounded-lg">
            <Layers className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-[#8890a6] uppercase">Application</span>
              <select
                value={scopeFilter.appId}
                onChange={e => handleAppSelect(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-[#12141c] text-white">All Applications ({filteredApps.length})</option>
                {filteredApps.map(a => (
                  <option key={a.id} value={a.id} className="bg-[#12141c] text-white">
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scoped Metric Summary Cards */}
          <div className="hidden sm:flex items-center space-x-3 pl-3 border-l border-[#283046]">
            <div className="text-right">
              <div className="text-[9px] font-mono text-[#8890a6] uppercase">Active Incidents</div>
              <div className={`text-xs font-mono font-bold ${activeIncidentsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {activeIncidentsCount} P1/P2 Active
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] font-mono text-[#8890a6] uppercase">Monthly AI Spend</div>
              <div className="text-xs font-mono font-bold text-amber-400">
                ${scopedSpendUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
