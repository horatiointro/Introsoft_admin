import { InfoButton } from './InfoButton';
import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  CheckCircle2,
  Calendar,
  Share2,
  Building2,
  Layers,
  ShieldCheck,
  DollarSign,
  Activity,
  Filter,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Printer
} from 'lucide-react';
import { ExecutiveReport, Customer, Application, CompanyScopeFilter } from '../types';

interface ExecutiveReportsViewProps {
  reports: ExecutiveReport[];
  customers?: Customer[];
  applications?: Application[];
  scopeFilter?: CompanyScopeFilter;
  onScopeChange?: (newScope: CompanyScopeFilter) => void;
}

export const ExecutiveReportsView: React.FC<ExecutiveReportsViewProps> = ({
  reports,
  customers = [],
  applications = [],
  scopeFilter: externalScope,
  onScopeChange: externalOnScopeChange
}) => {
  // Local or external scope state
  const [internalScope, setInternalScope] = useState<CompanyScopeFilter>({
    tenantId: 'all',
    appId: 'all',
    scopeName: 'Total Company View'
  });

  const scopeFilter = externalScope || internalScope;
  const setScopeFilter = externalOnScopeChange || setInternalScope;

  const [selectedPeriod, setSelectedPeriod] = useState<'current_month' | 'previous_month' | 'ytd' | 'custom'>('current_month');
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'sla_audit' | 'finops_board_pack' | 'ciso_threat_intel' | 'compliance_dossier'>('all');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  const selectedTenant = customers.find(c => c.id === scopeFilter.tenantId);
  const selectedApp = applications.find(a => a.id === scopeFilter.appId);

  const filteredApps = scopeFilter.tenantId === 'all'
    ? applications
    : applications.filter(a => a.customerId === scopeFilter.tenantId);

  // Scoped metrics
  const scopedSpend = scopeFilter.tenantId === 'all'
    ? customers.reduce((sum, c) => sum + (c.currentSpendUsd || c.monthlySpendUsd || 0), 0)
    : (selectedTenant?.currentSpendUsd || selectedTenant?.monthlySpendUsd || 0);

  const scopedBudget = scopeFilter.tenantId === 'all'
    ? customers.reduce((sum, c) => sum + (c.monthlyBudgetUsd || 15000), 0)
    : (selectedTenant?.monthlyBudgetUsd || 15000);

  const scopedUptime = scopeFilter.tenantId === 'all'
    ? 99.98
    : (selectedTenant?.slaTier === 'mission_critical' ? 99.99 : 99.95);

  const handleDownload = (title: string, format: string) => {
    setDownloadSuccessMsg(`Generated & downloaded ${format.toUpperCase()}: "${title}" for scope: ${scopeFilter.scopeName || 'Total Company'}`);
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  const handleGenerateScopedReport = () => {
    setIsGeneratingCustom(true);
    setTimeout(() => {
      setIsGeneratingCustom(false);
      setDownloadSuccessMsg(`Custom Board Pack successfully compiled for ${scopeFilter.scopeName || 'Total Company View'}`);
      setTimeout(() => setDownloadSuccessMsg(null), 4000);
    }, 1000);
  };

  // Filter reports
  const displayReports = reports.filter(r => {
    if (reportTypeFilter !== 'all' && r.type !== reportTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              C-Suite Board Deliverables
            </span>
            <span className="text-xs text-emerald-400 font-mono">Automated PDF / CSV / Board Decks</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight"><InfoButton />Executive Reports & Audit Deliverables</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Download monthly SLA audit summaries, FinOps board packs, CISO threat intelligence briefings, and statutory POPIA/GDPR compliance packs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload("Consolidated Monthly Audit Package", "ZIP")}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Full Package (ZIP)
          </button>
        </div>
      </div>

      {/* Global Hierarchical View Scope Section */}
      <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#222636]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Global Hierarchical View Scope
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {scopeFilter.tenantId === 'all' ? 'CONSOLIDATED ENTERPRISE' : `TENANT: ${selectedTenant?.name || scopeFilter.tenantId}`}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5"><InfoButton />
                Executive Reporting Scope Context: {scopeFilter.scopeName || 'Total Company View'}
              </h2>
            </div>
          </div>

          {/* Quick Scope Switcher Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Tenant Select */}
            <div className="bg-[#181c2b] border border-[#283046] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
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
                  <option value="all" className="bg-[#12141c] text-white">Total Company View (Consolidated)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#12141c] text-white">
                      {c.name} ({c.tier || 'Enterprise'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Application Select */}
            <div className="bg-[#181c2b] border border-[#283046] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-[#8890a6] uppercase">Application Scope</span>
                <select
                  value={scopeFilter.appId}
                  onChange={e => {
                    const aId = e.target.value;
                    setScopeFilter({
                      ...scopeFilter,
                      appId: aId,
                      scopeName: aId === 'all'
                        ? (scopeFilter.tenantId === 'all' ? 'Total Company View' : selectedTenant?.name)
                        : applications.find(a => a.id === aId)?.name
                    });
                  }}
                  className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#12141c] text-white">All Scoped Applications ({filteredApps.length})</option>
                  {filteredApps.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#12141c] text-white">
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset */}
            {scopeFilter.tenantId !== 'all' && (
              <button
                onClick={() => setScopeFilter({ tenantId: 'all', appId: 'all', scopeName: 'Total Company View' })}
                className="px-2.5 py-1.5 rounded-lg bg-[#181c28] hover:bg-[#22283a] border border-[#283046] text-blue-400 text-xs font-mono flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Scope
              </button>
            )}
          </div>
        </div>

        {/* Hierarchical Scope Breakdown Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="bg-[#161a26] border border-[#242c40] p-3 rounded-lg">
            <span className="text-[10px] font-mono text-[#77809a] uppercase block">Scoped Monthly Burn</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-bold text-amber-400 font-mono">
                ${scopedSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-mono text-[#8890a6]">
                of ${scopedBudget.toLocaleString()} cap
              </span>
            </div>
          </div>

          <div className="bg-[#161a26] border border-[#242c40] p-3 rounded-lg">
            <span className="text-[10px] font-mono text-[#77809a] uppercase block">Scoped SLA Adherence</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-bold text-emerald-400 font-mono">{scopedUptime}%</span>
              <span className="text-[10px] font-mono text-emerald-400">100% Target Met</span>
            </div>
          </div>

          <div className="bg-[#161a26] border border-[#242c40] p-3 rounded-lg">
            <span className="text-[10px] font-mono text-[#77809a] uppercase block">Hierarchy Level</span>
            <div className="flex items-baseline gap-1 mt-0.5 text-xs font-mono text-white">
              <span className="font-bold text-blue-400">
                {scopeFilter.tenantId === 'all' ? 'Holding Group (L1)' : 'Subsidiary (L2)'}
              </span>
              <span className="text-[#8890a6] truncate">
                {scopeFilter.appId !== 'all' ? ' > App (L3)' : ''}
              </span>
            </div>
          </div>

          <div className="bg-[#161a26] border border-[#242c40] p-3 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#77809a] uppercase block">Audit Sign-off</span>
              <span className="text-xs font-mono font-bold text-white">ISO 27001 / SOC 2 Type II</span>
            </div>
            <button
              onClick={handleGenerateScopedReport}
              disabled={isGeneratingCustom}
              className="px-2.5 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-mono font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              {isGeneratingCustom ? 'Compiling...' : 'Compile Scope'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {downloadSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 text-emerald-300 text-xs font-mono animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccessMsg}</span>
        </div>
      )}

      {/* Filters & Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#77809a] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Report Type:
          </span>
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'sla_audit', label: 'SLA Audits' },
            { id: 'finops_board_pack', label: 'FinOps Packs' },
            { id: 'ciso_threat_intel', label: 'CISO Intel' },
            { id: 'compliance_dossier', label: 'Compliance Dossiers' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setReportTypeFilter(f.id as any)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                reportTypeFilter === f.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-[#181c28] text-[#8890a6] hover:text-white border border-[#283046]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#77809a]">Reporting Cycle:</span>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value as any)}
            className="bg-[#181c28] border border-[#283046] rounded-md px-2.5 py-1 text-white text-xs font-mono focus:outline-none"
          >
            <option value="current_month">Current Month (September 2026)</option>
            <option value="previous_month">Previous Month (August 2026)</option>
            <option value="ytd">YTD Consolidated (2026)</option>
            <option value="custom">Custom Executive Audit Range</option>
          </select>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayReports.map(rep => {
          // Adapt title if scoped to tenant
          const scopedTitle = scopeFilter.tenantId === 'all'
            ? rep.title
            : `${rep.title} - [${selectedTenant?.name || scopeFilter.tenantId}]`;

          return (
            <div key={rep.id} className="bg-[#12141c] border border-[#222636] hover:border-[#38425d] rounded-xl p-5 space-y-4 flex flex-col justify-between transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">
                    {rep.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-[#666666] font-mono">{rep.period}</span>
                </div>
                
                <h3 className="text-sm font-bold text-white leading-snug"><InfoButton />{scopedTitle}</h3>
                <p className="text-xs text-[#8890a6] flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#666666]" />
                  Generated: {rep.generatedAt}
                </p>

                <div className="bg-[#161a26] border border-[#242c40] rounded-lg p-3 space-y-1.5 mt-3 text-xs">
                  {Object.entries(rep.summaryMetrics).map(([key, val]) => (
                    <div key={key} className="flex justify-between font-mono">
                      <span className="text-[#77809a]">{key}:</span>
                      <span className="text-white font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#222636] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDownload(scopedTitle, "PDF")}
                  className="flex-1 py-1.5 rounded bg-[#181c28] hover:bg-[#22283a] border border-[#283046] text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  PDF Brief
                </button>
                <button
                  onClick={() => handleDownload(scopedTitle, "CSV")}
                  className="flex-1 py-1.5 rounded bg-[#181c28] hover:bg-[#22283a] border border-[#283046] text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  CSV Data
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
