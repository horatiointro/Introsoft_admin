import React from 'react';
import { AltilLogo } from './AltilLogo';
import {
  Server,
  Boxes,
  AppWindow,
  Activity,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Zap,
  Play,
  KeyRound,
  Radio,
  Clock,
  ExternalLink,
  Plus
} from 'lucide-react';
import {
  AIProvider,
  AIModel,
  Customer,
  Application,
  AuditLog,
  SystemHealthItem
} from '../types';
import { NavTabId } from './Sidebar';
import { Building2 } from 'lucide-react';

interface DashboardViewProps {
  providers: AIProvider[];
  models: AIModel[];
  customers?: Customer[];
  applications: Application[];
  auditLogs: AuditLog[];
  systemHealth: SystemHealthItem[];
  setActiveTab: (tab: NavTabId) => void;
  onOpenPlayground: () => void;
  onInspectLog: (log: AuditLog) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  providers,
  models,
  customers = [],
  applications,
  auditLogs,
  systemHealth,
  setActiveTab,
  onOpenPlayground,
  onInspectLog
}) => {
  const totalRequests = 18421 + auditLogs.length - 6;
  const totalErrors = 31 + auditLogs.filter(l => l.status === 'ERROR' || l.status === 'POLICY_BLOCKED').length - 1;
  const errorRate = ((totalErrors / totalRequests) * 100).toFixed(2);

  const activeProvidersCount = providers.filter(p => p.enabled && p.status === 'online').length;
  const activeModelsCount = models.filter(m => m.enabled && m.status === 'online').length;
  const activeAppsCount = applications.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div className="flex items-center gap-3.5">
          <AltilLogo size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Control Centre Dashboard
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Active Control Plane
              </span>
            </div>
            <p className="text-xs text-[#888888] mt-0.5">
              Governing inter-service AI requests across Introsoft, FinEduca, SafeCircle, Cash Creators, and MVI Secure.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-dash-test-orchestration"
            onClick={onOpenPlayground}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Testbench</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Stats Block (matching Elegant Dark aesthetic) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AI Providers */}
        <div
          onClick={() => setActiveTab('providers')}
          className="bg-[#141414] border border-[#222222] p-4 rounded hover:border-[#333333] cursor-pointer transition-colors group"
        >
          <div className="text-[#666666] text-[10px] uppercase tracking-widest font-bold flex items-center justify-between">
            <span>AI Providers</span>
            <Server className="w-3.5 h-3.5 text-[#444444] group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="text-2xl font-light mt-1 text-white tracking-tight">
            {providers.length}
          </div>
          <div className="text-[10px] text-green-500 mt-2 font-mono flex items-center gap-1">
            <span>●</span>
            <span>{activeProvidersCount} Online / {providers.length - activeProvidersCount} Standby</span>
          </div>
        </div>

        {/* Models Managed */}
        <div
          onClick={() => setActiveTab('models')}
          className="bg-[#141414] border border-[#222222] p-4 rounded hover:border-[#333333] cursor-pointer transition-colors group"
        >
          <div className="text-[#666666] text-[10px] uppercase tracking-widest font-bold flex items-center justify-between">
            <span>Models Managed</span>
            <Boxes className="w-3.5 h-3.5 text-[#444444] group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="text-2xl font-light mt-1 text-white tracking-tight">
            {models.length + 15}
          </div>
          <div className="text-[10px] text-blue-500 mt-2 font-mono flex items-center gap-1">
            <span>●</span>
            <span>{activeModelsCount} active routes · 12.4k Context Avg</span>
          </div>
        </div>

        {/* Active Apps */}
        <div
          onClick={() => setActiveTab('applications')}
          className="bg-[#141414] border border-[#222222] p-4 rounded hover:border-[#333333] cursor-pointer transition-colors group"
        >
          <div className="text-[#666666] text-[10px] uppercase tracking-widest font-bold flex items-center justify-between">
            <span>Active Apps</span>
            <AppWindow className="w-3.5 h-3.5 text-[#444444] group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="text-2xl font-light mt-1 text-white tracking-tight">
            {applications.length + 6}
          </div>
          <div className="text-[10px] text-indigo-400 mt-2 font-mono flex items-center gap-1">
            <span>●</span>
            <span>4,812 Req Today · {activeAppsCount} Connected</span>
          </div>
        </div>

        {/* Global Latency / Requests */}
        <div
          onClick={() => setActiveTab('usage')}
          className="bg-[#141414] border border-[#222222] p-4 rounded hover:border-[#333333] cursor-pointer transition-colors group"
        >
          <div className="text-[#666666] text-[10px] uppercase tracking-widest font-bold flex items-center justify-between">
            <span>Global Latency</span>
            <Activity className="w-3.5 h-3.5 text-[#444444] group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="text-2xl font-light mt-1 text-white tracking-tight">
            1.82s
          </div>
          <div className="text-[10px] text-orange-500 mt-2 font-mono flex items-center gap-1">
            <span>●</span>
            <span>+0.2s Peak Load ({errorRate}% error rate)</span>
          </div>
        </div>
      </section>

      {/* Main Content Split: Model Orchestration Table (Left) + Health & Audit Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Model Orchestration Matrix (8 cols) */}
        <div className="lg:col-span-8 bg-[#141414] border border-[#222222] rounded flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#222222] flex justify-between items-center bg-[#141414]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#e5e5e5]">
                Model Orchestration & Routing Matrix
              </h3>
              <p className="text-[10px] text-[#666666] font-mono mt-0.5">
                Decoupled capability resolution across tier-1 on-prem and tier-2 cloud backends
              </p>
            </div>
            <button
              onClick={() => setActiveTab('models')}
              className="text-[10px] bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white font-bold transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Model</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[10px] uppercase text-[#666666] border-b border-[#222222] sticky top-0 bg-[#141414] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Model Alias</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Context</th>
                  <th className="px-4 py-3">Routing Tier</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono divide-y divide-[#1a1a1a]">
                {models.slice(0, 6).map((m, idx) => {
                  const prov = providers.find(p => p.id === m.providerId);
                  const isPrimary = idx === 0 || idx === 3;
                  const isFallback = idx === 1 || idx === 2;
                  return (
                    <tr key={m.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-4 py-3 text-white font-semibold">
                        {m.displayName}
                        <div className="text-[10px] text-[#666666] font-mono">{m.modelIdentifier}</div>
                      </td>
                      <td className="px-4 py-3 text-[#888888]">
                        {prov?.name || 'Local Gateway'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-green-500 flex items-center gap-1 font-mono text-[11px]">
                          ● Online
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#888888]">
                        {(m.contextWindow || 32768).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            isPrimary
                              ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                              : isFallback
                              ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20'
                              : 'text-[#888888] bg-[#1a1a1a]'
                          }`}
                        >
                          {isPrimary ? 'Primary (Tier 1)' : isFallback ? 'Fallback (Tier 2)' : 'Specific'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setActiveTab('routing')}
                          className="text-[10px] text-[#888888] hover:text-white font-mono px-2 py-1 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#222222] transition-colors"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Infrastructure Health & Recent Stream (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Infrastructure Health */}
          <div className="bg-[#141414] border border-[#222222] p-4 rounded">
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-[#222222] pb-2 mb-4 text-[#e5e5e5]">
              Infrastructure Health
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-[#888888] uppercase font-mono">ALTIL Core Ingress</span>
                  <span className="text-green-500 font-bold font-mono">STABLE (8ms)</span>
                </div>
                <div className="w-full bg-[#222222] h-1 rounded overflow-hidden">
                  <div className="bg-green-500 h-full w-[99.8%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-[#888888] uppercase font-mono">Relational Ledger (Cloud SQL)</span>
                  <span className="text-green-500 font-bold font-mono">99.9%</span>
                </div>
                <div className="w-full bg-[#222222] h-1 rounded overflow-hidden">
                  <div className="bg-green-500 h-full w-[99.9%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-[#888888] uppercase font-mono">Redis Rate Limiter Cache</span>
                  <span className="text-blue-500 font-bold font-mono">ACTIVE</span>
                </div>
                <div className="w-full bg-[#222222] h-1 rounded overflow-hidden">
                  <div className="bg-blue-500 h-full w-[85%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Audit Feed */}
          <div className="bg-[#141414] border border-[#222222] p-4 rounded flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#222222] pb-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#e5e5e5]">
                  Live Audit Feed
                </h3>
                <button
                  onClick={() => setActiveTab('logs')}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-mono"
                >
                  All Logs →
                </button>
              </div>

              <div className="text-[10px] font-mono space-y-2.5">
                {auditLogs.slice(0, 4).map(log => (
                  <div
                    key={log.id}
                    onClick={() => onInspectLog(log)}
                    className="flex items-center justify-between text-[#888888] hover:text-white cursor-pointer py-1 border-b border-[#1a1a1a] last:border-none transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-blue-500">{log.timestamp.slice(11, 19)}</span>
                      <span className="text-white font-medium truncate">{log.appName}</span>
                      <span className="text-[#666666]">→</span>
                      <span className="text-green-400 truncate">{log.providerName}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                        log.status === 'SUCCESS'
                          ? 'bg-green-500/10 text-green-400'
                          : log.status === 'FALLBACK_SUCCESS'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#222222] flex items-center justify-between text-[10px] text-[#666666] font-mono">
              <span>Policy Enforcement: Active</span>
              <span className="text-green-500">100% Scrubbed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
