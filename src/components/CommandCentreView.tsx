import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  DollarSign,
  Zap,
  Building2,
  AlertTriangle,
  Server,
  TrendingUp,
  Cpu,
  Lock,
  ArrowUpRight,
  BarChart2,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Maximize2
} from 'lucide-react';
import { Customer, AIProvider, AuditLog, Incident } from '../types';
import { TileDetailModal, TileDetailData } from './TileDetailModal';
import { getTileDetailData } from '../data/tileDetailData';

interface CommandCentreViewProps {
  customers: Customer[];
  providers: AIProvider[];
  auditLogs: AuditLog[];
  incidents: Incident[];
  onNavigate: (tab: any) => void;
}

export const CommandCentreView: React.FC<CommandCentreViewProps> = ({
  customers,
  providers,
  auditLogs,
  incidents,
  onNavigate
}) => {
  const [selectedTileDetail, setSelectedTileDetail] = useState<TileDetailData | null>(null);

  const activeTenantsCount = customers.filter(c => c.status === 'active').length;
  const onlineProvidersCount = providers.filter(p => p.status === 'online').length;
  const totalSpend = customers.reduce((acc, c) => acc + c.currentSpendUsd, 0);
  const totalBudget = customers.reduce((acc, c) => acc + c.monthlyBudgetUsd, 0);
  const activeIncidents = incidents.filter(i => i.status !== 'resolved');

  const handleTileClick = (title: string, value: string | number, category?: any) => {
    const tileData = getTileDetailData(title, value, category);
    setSelectedTileDetail(tileData);
  };

  return (
    <div className="space-y-6">
      {/* Tile Detail Inspector Modal */}
      <TileDetailModal
        data={selectedTileDetail}
        onClose={() => setSelectedTileDetail(null)}
        onNavigate={onNavigate}
      />

      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-[#121624] via-[#161b2e] to-[#0f1320] border border-[#232a42] rounded-xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest">
                C-Suite Command Center
              </span>
              <span className="text-xs text-green-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Real-Time Telemetry (Click Any Tile to Inspect BOC/SOC Derivation)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Executive Control & Security Cockpit</h1>
            <p className="text-xs text-[#8890a6] mt-1">
              Unified CTO / CIO / CISO oversight across multi-tenant SLAs, AI throughput, financial burn, and statutory POPIA/GDPR guardrails. Click any tile below to inspect mathematical derivations, BOC/SOC root causes, and raw transaction streams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('sla_kpi_monitoring')}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
            >
              <Activity className="w-3.5 h-3.5" />
              SLA Drilldown Engine
            </button>
            <button
              onClick={() => onNavigate('reporting')}
              className="px-3.5 py-2 rounded-lg bg-[#1e2438] hover:bg-[#28304a] text-white text-xs font-medium border border-[#313a57] flex items-center gap-2 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Executive PDF Board Report
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Tiles Section 1: Service & Platform Availability */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#77809a] flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            1. Platform & Service Health
          </h2>
          <span className="text-[11px] font-mono text-blue-400">💡 Click any tile to inspect mathematical derivation & BOC/SOC root causes</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div
            onClick={() => handleTileClick('Platform Availability', '99.98%', 'Availability & Health')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Platform Availability</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">99.98%</div>
            <span className="text-[10px] text-emerald-500/80 font-mono mt-0.5 block">🟢 SLA Compliant</span>
          </div>

          <div
            onClick={() => handleTileClick('Active Tenants', `${activeTenantsCount} / ${customers.length}`, 'Availability & Health')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Active Tenants</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">{activeTenantsCount} / {customers.length}</div>
            <span className="text-[10px] text-[#8890a6] mt-0.5 block">Enterprise Multi-tenant</span>
          </div>

          <div
            onClick={() => handleTileClick('Connected Apps', '12 Apps', 'Availability & Health')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Connected Apps</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">12 Apps</div>
            <span className="text-[10px] text-blue-400 font-mono mt-0.5 block">Production Scoped</span>
          </div>

          <div
            onClick={() => handleTileClick('Requests / Min', '2,840 RPM', 'AI Operations & Latency')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Requests / Min</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-blue-400 font-mono mt-1">2,840 RPM</div>
            <span className="text-[10px] text-[#8890a6] mt-0.5 block">Peak Capacity: 10,000</span>
          </div>

          <div
            onClick={() => handleTileClick('Requests Today', '48,420', 'AI Operations & Latency')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Requests Today</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">48,420</div>
            <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">+14.2% vs yesterday</span>
          </div>

          <div
            onClick={() => handleTileClick('Concurrent Reqs', '142', 'AI Operations & Latency')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Concurrent Reqs</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-indigo-400 font-mono mt-1">142</div>
            <span className="text-[10px] text-[#8890a6] mt-0.5 block">Active Socket Ingest</span>
          </div>

          <div
            onClick={() => handleTileClick('Queue Depth', '2 msgs', 'Availability & Health')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Queue Depth</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">2 msgs</div>
            <span className="text-[10px] text-emerald-500/80 font-mono mt-0.5 block">Zero Bottleneck</span>
          </div>
        </div>
      </div>

      {/* Real-Time Tiles Section 2: AI Operations & Latency Performance */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#77809a] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            2. AI Operations & Telemetry Performance
          </h2>
          <span className="text-[11px] font-mono text-[#555e78]">7 Active Providers Interconnected</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div
            onClick={() => handleTileClick('Provider Health', `${onlineProvidersCount} / ${providers.length}`, 'AI Operations & Latency')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Provider Health</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">{onlineProvidersCount} / {providers.length}</div>
            <span className="text-[10px] text-[#8890a6] mt-0.5 block">Ollama / Groq / Gemini</span>
          </div>

          <div
            onClick={() => handleTileClick('Model Availability', '28 Models', 'AI Operations & Latency')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Model Availability</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">28 Models</div>
            <span className="text-[10px] text-blue-400 font-mono mt-0.5 block">100% Online Tiers</span>
          </div>

          <div
            onClick={() => handleTileClick('Average Latency', '245 ms', 'AI Operations & Latency')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Average Latency</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">245 ms</div>
            <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">Target ≤ 500ms</span>
          </div>

          <div
            onClick={() => handleTileClick('P95 Latency', '412 ms', 'AI Operations & Latency')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">P95 Latency</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">412 ms</div>
            <span className="text-[10px] text-emerald-500/80 font-mono mt-0.5 block">SLA ≤ 800ms Target</span>
          </div>

          <div
            onClick={() => handleTileClick('P99 Latency', '1.20 s', 'AI Operations & Latency')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">P99 Latency</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-1">1.20 s</div>
            <span className="text-[10px] text-[#8890a6] mt-0.5 block">Target ≤ 2.0s</span>
          </div>

          <div
            onClick={() => handleTileClick('Throughput', '450 tok/s', 'AI Operations & Latency')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Throughput</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-purple-400 font-mono mt-1">450 tok/s</div>
            <span className="text-[10px] text-[#8890a6] mt-0.5 block">Groq LPU Accelerated</span>
          </div>

          <div
            onClick={() => handleTileClick('Fallback Rate', '0.8%', 'AI Operations & Latency')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Fallback Rate</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">0.8%</div>
            <span className="text-[10px] text-emerald-500/80 font-mono mt-0.5 block">Auto Rerouted</span>
          </div>
        </div>
      </div>

      {/* Real-Time Tiles Section 3: Financial FinOps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#77809a] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            3. Financial FinOps & Cost Controls
          </h2>
          <span className="text-[11px] font-mono text-[#555e78]">Currency Default: ZAR / USD Dual Display</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div
            onClick={() => handleTileClick('Today\'s AI Spend', '$48.20', 'FinOps & Cost')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Today's AI Spend</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">$48.20</div>
            <span className="text-[10px] text-amber-400/90 font-mono mt-0.5 block">≈ R867.60 ZAR</span>
          </div>

          <div
            onClick={() => handleTileClick('Month-to-Date Spend', `$${totalSpend.toFixed(2)}`, 'FinOps & Cost')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Month-to-Date Spend</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">${totalSpend.toFixed(2)}</div>
            <span className="text-[10px] text-amber-400/90 font-mono mt-0.5 block">≈ R{(totalSpend * 18.2).toFixed(0)} ZAR</span>
          </div>

          <div
            onClick={() => handleTileClick('Forecast Monthly', `$${(totalSpend * 1.15).toFixed(2)}`, 'FinOps & Cost')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Forecast Monthly</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-indigo-400 font-mono mt-1">${(totalSpend * 1.15).toFixed(2)}</div>
            <span className="text-[10px] text-[#8890a6] mt-0.5 block">Within Allocation</span>
          </div>

          <div
            onClick={() => handleTileClick('Cost / Request', '$0.00012', 'FinOps & Cost')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Cost / Request</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">$0.00012</div>
            <span className="text-[10px] text-[#8890a6] mt-0.5 block">Avg per execution</span>
          </div>

          <div
            onClick={() => handleTileClick('Cost / 1K Tokens', '$0.00018', 'FinOps & Cost')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Cost / 1K Tokens</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">$0.00018</div>
            <span className="text-[10px] text-emerald-500/80 font-mono mt-0.5 block">Optimal Hybrid</span>
          </div>

          <div
            onClick={() => handleTileClick('Free Tier Savings', '$420.15', 'FinOps & Cost')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Free Tier Savings</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-purple-400 font-mono mt-1">$420.15</div>
            <span className="text-[10px] text-purple-300 font-mono mt-0.5 block">Ollama + Groq Free</span>
          </div>

          <div
            onClick={() => handleTileClick('Budget Used', `${((totalSpend / totalBudget) * 100).toFixed(1)}%`, 'FinOps & Cost')}
            className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#77809a] uppercase font-semibold">Budget Used</span>
              <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-lg font-bold text-blue-400 font-mono mt-1">{((totalSpend / totalBudget) * 100).toFixed(1)}%</div>
            <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">Ceiling: ${totalBudget}</span>
          </div>
        </div>
      </div>

      {/* Real-Time Tiles Section 4 & 5: Security SOC & Statutory POPIA/GDPR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Security Operations Centre (SOC) */}
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#222636]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-white">Security Operations Centre (SOC)</h3>
            </div>
            <button
              onClick={() => onNavigate('sec_ops')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              SOC Portal <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div
              onClick={() => handleTileClick('Threats Deflected', '142', 'SOC & Security')}
              className="bg-[#181c28] p-3 rounded-lg border border-[#283046] hover:border-red-500/50 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#77809a] uppercase font-semibold block">Threats Deflected</span>
                <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-red-400" />
              </div>
              <span className="text-base font-bold text-emerald-400 font-mono">142</span>
            </div>

            <div
              onClick={() => handleTileClick('PII Incidents Scrubbed', '1,240', 'SOC & Security')}
              className="bg-[#181c28] p-3 rounded-lg border border-[#283046] hover:border-blue-500/50 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#77809a] uppercase font-semibold block">PII Scrubbed</span>
                <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400" />
              </div>
              <span className="text-base font-bold text-blue-400 font-mono">1,240</span>
            </div>

            <div
              onClick={() => handleTileClick('Prompt Injections', '38', 'SOC & Security')}
              className="bg-[#181c28] p-3 rounded-lg border border-[#283046] hover:border-purple-500/50 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#77809a] uppercase font-semibold block">Injections Blocked</span>
                <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-purple-400" />
              </div>
              <span className="text-base font-bold text-purple-400 font-mono">38</span>
            </div>
          </div>

          <div className="bg-[#161a26] rounded-lg p-3 border border-[#242c40] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#8890a6]">
              <span>Auth Failure Anomalies:</span>
              <span className="text-white font-mono font-semibold">4 (Blocked)</span>
            </div>
            <div className="flex justify-between text-[#8890a6]">
              <span>Overall Gateway Threat Rating:</span>
              <span className="text-emerald-400 font-mono font-bold">LOW RISK (0.02)</span>
            </div>
          </div>
        </div>

        {/* Regulatory Compliance (POPIA / GDPR) */}
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#222636]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">POPIA & GDPR Statutory Compliance</h3>
            </div>
            <button
              onClick={() => onNavigate('compliance')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              Compliance Suite <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div
              onClick={() => handleTileClick('POPIA Score', '98% Compliant', 'POPIA & Compliance')}
              className="bg-[#181c28] p-3 rounded-lg border border-[#283046] hover:border-emerald-500/50 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#77809a] uppercase font-semibold block">POPIA Score</span>
                <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-emerald-400" />
              </div>
              <span className="text-base font-bold text-emerald-400 font-mono">98% Compliant</span>
            </div>

            <div
              onClick={() => handleTileClick('GDPR Score', '96% Compliant', 'POPIA & Compliance')}
              className="bg-[#181c28] p-3 rounded-lg border border-[#283046] hover:border-emerald-500/50 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#77809a] uppercase font-semibold block">GDPR Score</span>
                <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-emerald-400" />
              </div>
              <span className="text-base font-bold text-emerald-400 font-mono">96% Compliant</span>
            </div>

            <div
              onClick={() => handleTileClick('DSARs Outstanding', '2 Open', 'POPIA & Compliance')}
              className="bg-[#181c28] p-3 rounded-lg border border-[#283046] hover:border-amber-500/50 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#77809a] uppercase font-semibold block">DSARs Open</span>
                <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-amber-400" />
              </div>
              <span className="text-base font-bold text-amber-400 font-mono">2 Open</span>
            </div>
          </div>

          <div className="bg-[#161a26] rounded-lg p-3 border border-[#242c40] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#8890a6]">
              <span>Section 72 Cross-Border Transfers:</span>
              <span className="text-emerald-400 font-mono font-medium">Adequacy Enforced</span>
            </div>
            <div className="flex justify-between text-[#8890a6]">
              <span>Zero Retention Buffering:</span>
              <span className="text-emerald-400 font-mono font-medium">Active (Memory Only)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Incidents & Operational Ticker */}
      <div className="bg-[#12141c] border border-[#222636] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222636]">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Active Platform Incidents & SLA Impact Log
          </h3>
          <button
            onClick={() => onNavigate('incidents')}
            className="text-xs text-blue-400 hover:underline"
          >
            Manage Incidents & PIRs →
          </button>
        </div>

        {incidents.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#666666]">
            No open or active platform incidents detected.
          </div>
        ) : (
          <div className="space-y-2">
            {incidents.slice(0, 3).map(inc => (
              <div
                key={inc.id}
                className="p-3 rounded-lg bg-[#181c28] border border-[#262f44] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      inc.severity === 'P1_CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : inc.severity === 'P2_HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {inc.severity.replace('_', ' ')}
                  </span>
                  <div>
                    <h4 className="font-semibold text-white">{inc.title}</h4>
                    <p className="text-[11px] text-[#8890a6] mt-0.5">{inc.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
                  <span className="text-[#8890a6]">Cmdr: {inc.commander}</span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      inc.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {inc.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
