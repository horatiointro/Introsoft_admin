import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  PieChart,
  AlertCircle,
  ArrowUpRight,
  Maximize2,
  Building2,
  Layers,
  ShieldCheck,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Customer, Application, CompanyScopeFilter } from '../types';
import { TileDetailModal, TileDetailData } from './TileDetailModal';
import { getTileDetailData } from '../data/tileDetailData';

interface FinOpsViewProps {
  customers: Customer[];
  applications?: Application[];
  scopeFilter?: CompanyScopeFilter;
  onScopeChange?: (newScope: CompanyScopeFilter) => void;
}

export const FinOpsView: React.FC<FinOpsViewProps> = ({
  customers,
  applications = [],
  scopeFilter: externalScope,
  onScopeChange: externalOnScopeChange
}) => {
  const [internalScope, setInternalScope] = useState<CompanyScopeFilter>({
    tenantId: 'all',
    appId: 'all',
    scopeName: 'Total Company View'
  });

  const scopeFilter = externalScope || internalScope;
  const setScopeFilter = externalOnScopeChange || setInternalScope;

  const [selectedTileDetail, setSelectedTileDetail] = useState<TileDetailData | null>(null);
  const [currencyMode, setCurrencyMode] = useState<'USD' | 'ZAR'>('USD');
  const zarRate = 18.25;

  const selectedTenant = customers.find(c => c.id === scopeFilter.tenantId);
  const filteredApps = scopeFilter.tenantId === 'all'
    ? applications
    : applications.filter(a => a.customerId === scopeFilter.tenantId);

  // Scoped calculations
  const scopedCustomers = scopeFilter.tenantId === 'all'
    ? customers
    : customers.filter(c => c.id === scopeFilter.tenantId);

  const totalSpendUsd = scopedCustomers.reduce((sum, c) => sum + (c.currentSpendUsd || c.monthlySpendUsd || 0), 0);
  const totalBudgetUsd = scopedCustomers.reduce((sum, c) => sum + (c.monthlyBudgetUsd || 15000), 0);
  const budgetUtilization = totalBudgetUsd > 0 ? (totalSpendUsd / totalBudgetUsd) * 100 : 0;
  const freeTierSavingsUsd = scopeFilter.tenantId === 'all' ? 420.15 : (420.15 / (customers.length || 1));

  const formatCurrency = (amountUsd: number) => {
    if (currencyMode === 'ZAR') {
      return `R${(amountUsd * zarRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ZAR`;
    }
    return `$${amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleTileClick = (title: string, value: string | number, category?: any) => {
    setSelectedTileDetail(getTileDetailData(title, value, category || 'FinOps & Cost'));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Tile Detail Inspector Modal */}
      <TileDetailModal
        data={selectedTileDetail}
        onClose={() => setSelectedTileDetail(null)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
              Financial Cloud Architecture
            </span>
            <span className="text-xs text-blue-400 font-mono">ZAR / USD Dual Currency Engine (1 USD = R{zarRate} ZAR)</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">AI FinOps & Enterprise Cost Management</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Real-time tracking of AI provider token burn, tenant cost allocation, budget ceiling actions, and free-tier savings.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-2 bg-[#181c2b] border border-[#283046] p-1 rounded-lg">
          <button
            onClick={() => setCurrencyMode('USD')}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
              currencyMode === 'USD' ? 'bg-blue-600 text-white shadow-sm' : 'text-[#8890a6] hover:text-white'
            }`}
          >
            USD ($)
          </button>
          <button
            onClick={() => setCurrencyMode('ZAR')}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
              currencyMode === 'ZAR' ? 'bg-amber-600 text-white shadow-sm' : 'text-[#8890a6] hover:text-white'
            }`}
          >
            ZAR (R)
          </button>
        </div>
      </div>

      {/* Global Hierarchical View Scope Section */}
      <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#222636]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white shadow-md shadow-amber-600/30 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Global Hierarchical View Scope
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {scopeFilter.tenantId === 'all' ? 'CONSOLIDATED FINANCIAL FLEET' : `SCOPED TENANT: ${selectedTenant?.name || scopeFilter.tenantId}`}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5">
                FinOps Active Scope: {scopeFilter.scopeName || 'Total Company View'}
              </h2>
            </div>
          </div>

          {/* Scope Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#181c2b] border border-[#283046] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-[#8890a6] uppercase">Tenant Scope</span>
                <select
                  value={scopeFilter.tenantId}
                  onChange={e => {
                    const tId = e.target.value;
                    setScopeFilter({
                      tenantId: tId,
                      appId: 'all',
                      scopeName: tId === 'all' ? 'Total Company View' : customers.find(c => c.id === tId)?.name
                    });
                  }}
                  className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
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

            {scopeFilter.tenantId !== 'all' && (
              <button
                onClick={() => setScopeFilter({ tenantId: 'all', appId: 'all', scopeName: 'Total Company View' })}
                className="px-2.5 py-1.5 rounded-lg bg-[#181c28] hover:bg-[#22283a] border border-[#283046] text-amber-400 text-xs font-mono flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Scope
              </button>
            )}
          </div>
        </div>

        {/* Quick Scope Path & Highlights */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#8890a6] overflow-x-auto pb-1">
          <span className="text-white font-bold">Scope Path:</span>
          <span>Introsoft Holding (Root)</span>
          <ArrowRight className="w-3 h-3 text-[#555e78]" />
          <span className={scopeFilter.tenantId !== 'all' ? 'text-amber-400 font-bold' : 'text-[#8890a6]'}>
            {selectedTenant?.name || 'All Enterprise Subsidiaries & Clients'}
          </span>
          {scopeFilter.appId !== 'all' && (
            <>
              <ArrowRight className="w-3 h-3 text-[#555e78]" />
              <span className="text-purple-400 font-bold">
                {applications.find(a => a.id === scopeFilter.appId)?.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* FinOps KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => handleTileClick('Month-to-Date Spend', formatCurrency(totalSpendUsd), 'FinOps & Cost')}
          className="bg-[#12141c] border border-[#222636] hover:border-amber-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#77809a] uppercase font-semibold block">
              {scopeFilter.tenantId === 'all' ? 'Total Platform MTD Burn' : 'Scoped Tenant MTD Burn'}
            </span>
            <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-amber-400" />
          </div>
          <span className="text-2xl font-bold text-white font-mono mt-1 block">
            {formatCurrency(totalSpendUsd)}
          </span>
          <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
            {currencyMode === 'USD' ? `≈ R${(totalSpendUsd * zarRate).toFixed(2)} ZAR` : `$${totalSpendUsd.toFixed(2)} USD`}
          </span>
        </div>

        <div
          onClick={() => handleTileClick('Forecast Monthly', formatCurrency(totalBudgetUsd), 'FinOps & Cost')}
          className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#77809a] uppercase font-semibold block">
              {scopeFilter.tenantId === 'all' ? 'Combined Tenant Budgets' : 'Scoped Tenant Budget Ceiling'}
            </span>
            <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-blue-400" />
          </div>
          <span className="text-2xl font-bold text-blue-400 font-mono mt-1 block">
            {formatCurrency(totalBudgetUsd)}
          </span>
          <span className="text-[10px] text-blue-300 font-mono mt-0.5 block">Allocation Ceiling</span>
        </div>

        <div
          onClick={() => handleTileClick('Budget Used', `${budgetUtilization.toFixed(1)}%`, 'FinOps & Cost')}
          className="bg-[#12141c] border border-[#222636] hover:border-emerald-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#77809a] uppercase font-semibold block">Budget Utilization</span>
            <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-emerald-400" />
          </div>
          <span className="text-2xl font-bold text-emerald-400 font-mono mt-1 block">
            {budgetUtilization.toFixed(1)}%
          </span>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
            {budgetUtilization > 90 ? 'Ceiling Warning' : 'Optimal Burn Rate'}
          </span>
        </div>

        <div
          onClick={() => handleTileClick('Free Tier Savings', formatCurrency(freeTierSavingsUsd), 'FinOps & Cost')}
          className="bg-[#12141c] border border-[#222636] hover:border-purple-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#77809a] uppercase font-semibold block">Free Tier Savings</span>
            <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-purple-400" />
          </div>
          <span className="text-2xl font-bold text-purple-400 font-mono mt-1 block">
            {formatCurrency(freeTierSavingsUsd)}
          </span>
          <span className="text-[10px] text-purple-300 font-mono mt-0.5 block">Ollama GPU Local Efficiency</span>
        </div>
      </div>

      {/* Tenant Cost Allocation Ledger */}
      <div className="bg-[#12141c] border border-[#222636] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#222636] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            {scopeFilter.tenantId === 'all'
              ? 'Tenant Cost Allocation & Budget Ceiling Ledger (All Tenants)'
              : `Scoped Tenant Cost Ledger: ${selectedTenant?.name}`}
          </h3>
          <span className="text-xs font-mono text-[#8890a6]">
            Showing {scopedCustomers.length} Scoped Organization{scopedCustomers.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161924] text-[10px] uppercase font-mono text-[#77809a] border-b border-[#222636]">
                <th className="p-3.5">Tenant Name</th>
                <th className="p-3.5">Contract Terms</th>
                <th className="p-3.5">MTD Spend ({currencyMode})</th>
                <th className="p-3.5">Monthly Budget</th>
                <th className="p-3.5">100% Budget Action</th>
                <th className="p-3.5 text-right">Burn Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222636] text-xs">
              {scopedCustomers.map(cust => {
                const spend = cust.currentSpendUsd || cust.monthlySpendUsd || 0;
                const budget = cust.monthlyBudgetUsd || 15000;
                const burnPct = (spend / budget) * 100;
                return (
                  <tr key={cust.id} className="hover:bg-[#181c28] transition-colors">
                    <td className="p-3.5 font-semibold text-white flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {cust.name}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-[#8890a6]">
                      {cust.contractTerms?.billingTerms?.toUpperCase() || 'NET 30'} • {cust.contractTerms?.currency || 'USD'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white">
                      {formatCurrency(spend)}
                    </td>
                    <td className="p-3.5 font-mono text-blue-400 font-semibold">
                      {formatCurrency(budget)}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-amber-300">
                      {cust.contractTerms?.budgetActionOn100Percent?.replace(/_/g, ' ') || 'switch cheaper model'}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        burnPct > 90
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {burnPct.toFixed(1)}% BURN
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
