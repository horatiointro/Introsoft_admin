import React, { useState } from 'react';
import {
  LineChart,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Building2,
  DollarSign,
  TrendingUp,
  Sliders,
  ShieldAlert,
  ArrowUpRight,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Activity,
  FileCheck,
  RefreshCw,
  Download,
  ShieldCheck,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart as ReLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { Customer, TenantSlaProfile as SlaProfile, KpiDefinition } from '../types';
import { TileDetailModal, TileDetailData } from './TileDetailModal';
import { getTileDetailData } from '../data/tileDetailData';

interface SlaKpiMonitoringViewProps {
  customers: Customer[];
  slaProfiles: SlaProfile[];
  kpis: KpiDefinition[];
  onUpdateSlaProfile?: (profile: SlaProfile) => void;
}

// Mock time-series generators for expanded tenant details
const generateTenantUptimeData = (targetPercent: number = 99.95) => {
  const days = 30;
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    // Simulate a minor dip on day 12 and 22
    let uptime = 100 - Math.random() * 0.04;
    if (day === 12) uptime = 99.82;
    if (day === 22) uptime = 99.91;
    return {
      day: `Day ${day}`,
      uptime: Number(uptime.toFixed(3)),
      target: targetPercent
    };
  });
};

const generateTenantLatencyData = (targetMs: number = 800) => {
  const hours = 24;
  return Array.from({ length: hours }, (_, i) => {
    const hour = `${i.toString().padStart(2, '0')}:00`;
    const baseP50 = 120 + Math.random() * 40;
    const baseP95 = 300 + Math.random() * 120;
    const baseP99 = 480 + Math.random() * 180;
    return {
      hour,
      p50: Math.round(baseP50),
      p95: Math.round(baseP95),
      p99: Math.round(baseP99),
      target: targetMs
    };
  });
};

const generateTenantVolumeData = () => {
  return Array.from({ length: 12 }, (_, i) => {
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i];
    return {
      month,
      requestsK: Math.round(250 + Math.random() * 400),
      tokensM: Number((1.2 + Math.random() * 3.5).toFixed(2))
    };
  });
};

export const SlaKpiMonitoringView: React.FC<SlaKpiMonitoringViewProps> = ({
  customers,
  slaProfiles,
  kpis
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [selectedSlaId, setSelectedSlaId] = useState<string>('all');
  const [selectedTileDetail, setSelectedTileDetail] = useState<TileDetailData | null>(null);
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);
  const [activeExpandedTab, setActiveExpandedTab] = useState<'charts' | 'targets' | 'credits' | 'incidents'>('charts');
  const [issuedCredits, setIssuedCredits] = useState<Record<string, number>>({});

  const filteredCustomers = selectedTenantId === 'all' 
    ? customers 
    : customers.filter(c => c.id === selectedTenantId);

  const handleTileClick = (title: string, value: string | number, category?: any) => {
    setSelectedTileDetail(getTileDetailData(title, value, category || 'Platform Health'));
  };

  const toggleExpandTenant = (tenantId: string) => {
    if (expandedTenantId === tenantId) {
      setExpandedTenantId(null);
    } else {
      setExpandedTenantId(tenantId);
      setActiveExpandedTab('charts');
    }
  };

  const handleAddCredit = (tenantId: string, amount: number) => {
    setIssuedCredits(prev => ({
      ...prev,
      [tenantId]: (prev[tenantId] || 0) + amount
    }));
  };

  return (
    <div className="space-y-6">
      {/* Tile Detail Inspector Modal */}
      <TileDetailModal
        data={selectedTileDetail}
        onClose={() => setSelectedTileDetail(null)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              Configuration-Driven Engine
            </span>
            <span className="text-xs text-emerald-400 font-mono">Live KPI Evaluation</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Service Level & KPI Monitoring Dashboard</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Real-time evaluation of SLA compliance, P95/P99 latencies, RTO/RPO targets, and automated penalty credit calculations per tenant. Click any scorecard row to expand detailed telemetry graphs.
          </p>
        </div>

        {/* Filter selectors */}
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#666666] block mb-1">Select Tenant</label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-[#181c28] border border-[#283046] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="all">All Tenants ({customers.length})</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[#666666] block mb-1">Filter SLA Tier</label>
            <select
              value={selectedSlaId}
              onChange={(e) => setSelectedSlaId(e.target.value)}
              className="bg-[#181c28] border border-[#283046] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="all">All SLA Profiles ({slaProfiles.length})</option>
              {slaProfiles.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global KPI Target Evaluation Matrix */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#77809a] mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          Active Service Level KPI Engine Controls (Click card for detail inspection)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(kpi => (
            <div
              key={kpi.id}
              onClick={() => handleTileClick(kpi.name, `${kpi.currentValue} ${kpi.unit}`, 'Platform Health')}
              className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-4 rounded-xl space-y-3 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  {kpi.name}
                  <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400" />
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    kpi.status === 'within_target'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : kpi.status === 'warning'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {kpi.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-bold text-white font-mono">{kpi.currentValue}</span>
                  <span className="text-xs text-[#8890a6] font-mono ml-1">{kpi.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#666666] block">Target Threshold</span>
                  <span className="text-xs text-blue-400 font-mono font-semibold">
                    {kpi.targetValue} {kpi.unit}
                  </span>
                </div>
              </div>

              <div className="w-full bg-[#1e2230] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (kpi.currentValue / kpi.targetValue) * 100)}%`
                  }}
                />
              </div>

              <p className="text-[11px] text-[#77809a] leading-tight">{kpi.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant-by-Tenant SLA Performance Ledger with Interactive Expansion */}
      <div className="bg-[#12141c] border border-[#222636] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#222636] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Tenant SLA & KPI Profile Scorecards
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                Interactive Telemetry
              </span>
            </h3>
            <p className="text-xs text-[#8890a6] mt-0.5">
              Live telemetry aggregated per tenant according to their contractual Service Tier. <strong className="text-blue-300">Click any row to expand full details, graphs, and SLA credit calculations.</strong>
            </p>
          </div>
          <div className="text-xs font-mono text-[#8890a6]">
            Showing {filteredCustomers.length} active tenant scorecards
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161924] text-[10px] uppercase font-mono text-[#77809a] border-b border-[#222636]">
                <th className="p-3.5 w-8"></th>
                <th className="p-3.5">Tenant Organization</th>
                <th className="p-3.5">Service Tier</th>
                <th className="p-3.5">Availability (Target / Actual)</th>
                <th className="p-3.5">Response Time (P95 Target / Actual)</th>
                <th className="p-3.5">P1 / P2 Response SLA</th>
                <th className="p-3.5">RTO / RPO</th>
                <th className="p-3.5">Accrued Credits</th>
                <th className="p-3.5 text-right">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222636] text-xs">
              {filteredCustomers.map(cust => {
                const sla = cust.slaProfile;
                const kpi = cust.kpiProfile;
                const isCompliant = (kpi?.availabilityPercent || 100) >= (sla?.availabilityTargetPercent || 99.9);
                const isExpanded = expandedTenantId === cust.id;
                const totalAccruedCredits = (kpi?.serviceCreditsAccruedUsd || 0) + (issuedCredits[cust.id] || 0);

                const uptimeData = generateTenantUptimeData(sla?.availabilityTargetPercent || 99.95);
                const latencyData = generateTenantLatencyData(sla?.p95LatencyMsTarget || 800);
                const volumeData = generateTenantVolumeData();

                return (
                  <React.Fragment key={cust.id}>
                    {/* Primary Scorecard Row */}
                    <tr
                      onClick={() => toggleExpandTenant(cust.id)}
                      className={`hover:bg-[#181c28] transition-colors cursor-pointer ${
                        isExpanded ? 'bg-[#181c28] border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <td className="p-3.5 text-[#666666]">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-blue-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#8890a6] hover:text-white" />
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {cust.name}
                          <span className="text-[10px] text-blue-400 font-mono font-normal">
                            (Click to {isExpanded ? 'collapse' : 'expand'})
                          </span>
                        </div>
                        <div className="text-[10px] text-[#77809a] font-mono">{cust.id} • {cust.country}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {cust.serviceTier || cust.tier}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="text-emerald-400 font-bold">{kpi?.availabilityPercent || 99.98}%</div>
                        <div className="text-[10px] text-[#77809a]">Target: ≥ {sla?.availabilityTargetPercent || 99.95}%</div>
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="text-white font-semibold">{kpi?.p95LatencyMs || 412} ms</div>
                        <div className="text-[10px] text-[#77809a]">Target: ≤ {sla?.p95LatencyMsTarget || 800} ms</div>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-[#8890a6]">
                        <div>P1: <span className="text-white">{sla?.p1ResponseMinutes || 15}m</span></div>
                        <div>P2: <span className="text-white">{sla?.p2ResponseMinutes || 30}m</span></div>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-[#8890a6]">
                        <div>RTO: <span className="text-white">{sla?.rtoHours || 1}h</span></div>
                        <div>RPO: <span className="text-white">{sla?.rpoMinutes || 15}m</span></div>
                      </td>

                      <td className="p-3.5 font-mono font-semibold text-emerald-400">
                        ${totalAccruedCredits}.00
                      </td>

                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                            isCompliant
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {isCompliant ? 'PASSING' : 'BREACH'}
                        </span>
                      </td>
                    </tr>

                    {/* EXPANDED TELEMETRY & GRAPH DETAILS PANEL */}
                    {isExpanded && (
                      <tr className="bg-[#0e1017]">
                        <td colSpan={9} className="p-6 border-b border-[#283046]">
                          <div className="space-y-6">
                            {/* Expanded Panel Navigation & Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1e2230]">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    {cust.name} ({cust.id})
                                  </span>
                                  <span className="text-xs font-mono text-emerald-400">
                                    {sla?.name || 'Enterprise Platinum Tier'}
                                  </span>
                                </div>
                                <h4 className="text-base font-bold text-white tracking-tight">
                                  Tenant SLA Telemetry, Latency Distribution & Penalty Ledger
                                </h4>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex bg-[#161924] p-1 rounded-lg border border-[#222636]">
                                  <button
                                    onClick={() => setActiveExpandedTab('charts')}
                                    className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                                      activeExpandedTab === 'charts'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-[#8890a6] hover:text-white'
                                    }`}
                                  >
                                    Graphs & Telemetry
                                  </button>
                                  <button
                                    onClick={() => setActiveExpandedTab('targets')}
                                    className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                                      activeExpandedTab === 'targets'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-[#8890a6] hover:text-white'
                                    }`}
                                  >
                                    Target Evaluation
                                  </button>
                                  <button
                                    onClick={() => setActiveExpandedTab('credits')}
                                    className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                                      activeExpandedTab === 'credits'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-[#8890a6] hover:text-white'
                                    }`}
                                  >
                                    Penalty Math
                                  </button>
                                  <button
                                    onClick={() => setActiveExpandedTab('incidents')}
                                    className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                                      activeExpandedTab === 'incidents'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-[#8890a6] hover:text-white'
                                    }`}
                                  >
                                    Outage History
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleTileClick(`${cust.name} SLA Profile`, `${kpi?.availabilityPercent || 99.98}%`, 'Platform Health')}
                                  className="px-2.5 py-1.5 bg-[#1e2230] hover:bg-[#283046] text-white rounded text-xs font-mono flex items-center gap-1"
                                >
                                  <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                                  Full Modal
                                </button>
                              </div>
                            </div>

                            {/* TAB 1: GRAPHS & TELEMETRY */}
                            {activeExpandedTab === 'charts' && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* 30-Day Availability & Uptime Trend Chart */}
                                <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-xs font-bold text-white flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-emerald-400" />
                                        30-Day Availability & Uptime Curve (%)
                                      </h5>
                                      <p className="text-[10px] text-[#8890a6]">
                                        Actual daily availability vs Contractual SLA Target ({sla?.availabilityTargetPercent || 99.95}%)
                                      </p>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-emerald-400">
                                      {kpi?.availabilityPercent || 99.98}% Avg
                                    </span>
                                  </div>

                                  <div className="h-52 w-full pt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={uptimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                          <linearGradient id={`uptimeGrad-${cust.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222636" />
                                        <XAxis dataKey="day" stroke="#555e78" tick={{ fontSize: 9 }} interval={4} />
                                        <YAxis domain={[99.7, 100]} stroke="#555e78" tick={{ fontSize: 9 }} />
                                        <Tooltip
                                          contentStyle={{ backgroundColor: '#161924', borderColor: '#283046', borderRadius: '8px', fontSize: '11px' }}
                                        />
                                        <ReferenceLine y={sla?.availabilityTargetPercent || 99.95} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'SLA Target', fill: '#ef4444', fontSize: 10 }} />
                                        <Area type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill={`url(#uptimeGrad-${cust.id})`} />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                {/* 24-Hour Latency Distribution (P50, P95, P99) */}
                                <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-xs font-bold text-white flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-400" />
                                        24-Hour Latency Profile (P50, P95, P99 ms)
                                      </h5>
                                      <p className="text-[10px] text-[#8890a6]">
                                        Response latency percentiles vs Max Target ({sla?.p95LatencyMsTarget || 800} ms)
                                      </p>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-blue-400">
                                      P95: {kpi?.p95LatencyMs || 412} ms
                                    </span>
                                  </div>

                                  <div className="h-52 w-full pt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <ReLineChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222636" />
                                        <XAxis dataKey="hour" stroke="#555e78" tick={{ fontSize: 9 }} interval={3} />
                                        <YAxis stroke="#555e78" tick={{ fontSize: 9 }} />
                                        <Tooltip
                                          contentStyle={{ backgroundColor: '#161924', borderColor: '#283046', borderRadius: '8px', fontSize: '11px' }}
                                        />
                                        <ReferenceLine y={sla?.p95LatencyMsTarget || 800} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Target Max', fill: '#f59e0b', fontSize: 10 }} />
                                        <Line type="monotone" dataKey="p50" name="P50 Latency" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                                        <Line type="monotone" dataKey="p95" name="P95 Latency" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="p99" name="P99 Latency" stroke="#ec4899" strokeWidth={1.5} dot={false} />
                                      </ReLineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                {/* Annual Gateway Volume & Token Consumption */}
                                <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-3 lg:col-span-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-xs font-bold text-white flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-purple-400" />
                                        Monthly Request Volume (k) & Token Consumption (M)
                                      </h5>
                                      <p className="text-[10px] text-[#8890a6]">
                                        Aggregated gateway throughput processed for tenant applications
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-mono">
                                      <span className="text-purple-400">Total Tokens: 24.8M</span>
                                      <span className="text-blue-400">Total API Calls: 4.2M</span>
                                    </div>
                                  </div>

                                  <div className="h-44 w-full pt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222636" />
                                        <XAxis dataKey="month" stroke="#555e78" tick={{ fontSize: 9 }} />
                                        <YAxis stroke="#555e78" tick={{ fontSize: 9 }} />
                                        <Tooltip
                                          contentStyle={{ backgroundColor: '#161924', borderColor: '#283046', borderRadius: '8px', fontSize: '11px' }}
                                        />
                                        <Bar dataKey="requestsK" name="API Requests (Thousands)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: TARGET EVALUATION MATRIX */}
                            {activeExpandedTab === 'targets' && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-2">
                                  <span className="text-[10px] uppercase font-mono text-[#8890a6]">Availability Target</span>
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-mono font-bold text-emerald-400">
                                      {kpi?.availabilityPercent || 99.98}%
                                    </span>
                                    <span className="text-xs text-[#8890a6] font-mono">
                                      Target: ≥ {sla?.availabilityTargetPercent || 99.95}%
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#8890a6]">
                                    Status: <span className="text-emerald-400 font-bold">PASSING (+0.03% margin)</span>
                                  </div>
                                </div>

                                <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-2">
                                  <span className="text-[10px] uppercase font-mono text-[#8890a6]">P95 Response Latency</span>
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-mono font-bold text-blue-400">
                                      {kpi?.p95LatencyMs || 412} ms
                                    </span>
                                    <span className="text-xs text-[#8890a6] font-mono">
                                      Target: ≤ {sla?.p95LatencyMsTarget || 800} ms
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#8890a6]">
                                    Status: <span className="text-emerald-400 font-bold">PASSING (388 ms headroom)</span>
                                  </div>
                                </div>

                                <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-2">
                                  <span className="text-[10px] uppercase font-mono text-[#8890a6]">P1 Incident MTTR</span>
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-mono font-bold text-purple-400">
                                      11 mins
                                    </span>
                                    <span className="text-xs text-[#8890a6] font-mono">
                                      Target: ≤ {sla?.p1ResponseMinutes || 15} mins
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#8890a6]">
                                    Status: <span className="text-emerald-400 font-bold">PASSING (4 min margin)</span>
                                  </div>
                                </div>

                                <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-2">
                                  <span className="text-[10px] uppercase font-mono text-[#8890a6]">RTO (Recovery Time)</span>
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-mono font-bold text-amber-400">
                                      12 mins
                                    </span>
                                    <span className="text-xs text-[#8890a6] font-mono">
                                      Target: ≤ {sla?.rtoHours || 1} hour
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#8890a6]">
                                    Status: <span className="text-emerald-400 font-bold">PASSING (Failover Tested)</span>
                                  </div>
                                </div>

                                <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-2">
                                  <span className="text-[10px] uppercase font-mono text-[#8890a6]">RPO (Data Loss Target)</span>
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-mono font-bold text-cyan-400">
                                      2 mins
                                    </span>
                                    <span className="text-xs text-[#8890a6] font-mono">
                                      Target: ≤ {sla?.rpoMinutes || 15} mins
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#8890a6]">
                                    Status: <span className="text-emerald-400 font-bold">PASSING (WAL Streaming)</span>
                                  </div>
                                </div>

                                <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-2">
                                  <span className="text-[10px] uppercase font-mono text-[#8890a6]">POPIA / GDPR Escrow</span>
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-2xl font-mono font-bold text-emerald-400">
                                      VERIFIED
                                    </span>
                                    <span className="text-xs text-[#8890a6] font-mono">
                                      Audit: 2026-Q2
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#8890a6]">
                                    Status: <span className="text-emerald-400 font-bold">Encrypted & Sovereign</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 3: PENALTY CREDIT MATH LEDGER */}
                            {activeExpandedTab === 'credits' && (
                              <div className="bg-[#12141c] border border-[#222636] p-5 rounded-xl space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222636] pb-4">
                                  <div>
                                    <h5 className="text-xs font-bold text-white flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-emerald-400" />
                                      Automated SLA Penalty Credit Derivation Engine
                                    </h5>
                                    <p className="text-[10px] text-[#8890a6] mt-0.5">
                                      Formula: Credit = Monthly Service Base Fee × Breach Severity Multiplier × Downtime Multiplier
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <span className="text-[10px] text-[#8890a6] block">Total Accrued Penalty Rebate</span>
                                      <span className="text-xl font-mono font-bold text-emerald-400">
                                        ${totalAccruedCredits}.00 USD
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleAddCredit(cust.id, 100)}
                                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold shadow-lg shadow-emerald-600/20 transition-colors"
                                    >
                                      + Issue $100 Credit
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                                  <div className="bg-[#181c28] p-3 rounded-lg border border-[#283046]">
                                    <span className="text-[10px] text-[#77809a] block uppercase">Monthly Contract Base</span>
                                    <span className="text-sm font-bold text-white">${sla?.monthlyFeeUsd || 2500}.00 / mo</span>
                                  </div>
                                  <div className="bg-[#181c28] p-3 rounded-lg border border-[#283046]">
                                    <span className="text-[10px] text-[#77809a] block uppercase">Contract Breach Threshold</span>
                                    <span className="text-sm font-bold text-amber-400">&lt; {sla?.availabilityTargetPercent || 99.95}% Uptime</span>
                                  </div>
                                  <div className="bg-[#181c28] p-3 rounded-lg border border-[#283046]">
                                    <span className="text-[10px] text-[#77809a] block uppercase">Penalty Credit Rate</span>
                                    <span className="text-sm font-bold text-blue-400">10% Fee Rebate per 0.1% Breach</span>
                                  </div>
                                </div>

                                <div className="p-3 bg-[#181c28] rounded-lg border border-[#283046] text-xs space-y-1">
                                  <div className="text-white font-bold flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5 text-blue-400" />
                                    Statutory Service Credit Guarantee Statement
                                  </div>
                                  <p className="text-[#8890a6] text-[11px] leading-relaxed">
                                    Credits accrued during a billing cycle are automatically applied to the subsequent monthly invoice as a line item deduction. Service credits do not expire and may be refunded via wire transfer upon tenant contract termination.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* TAB 4: OUTAGE & INCIDENT HISTORY */}
                            {activeExpandedTab === 'incidents' && (
                              <div className="bg-[#12141c] border border-[#222636] rounded-xl overflow-hidden space-y-0">
                                <div className="p-4 border-b border-[#222636] flex items-center justify-between">
                                  <h5 className="text-xs font-bold text-white flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                                    Tenant Incident, Outage & Root Cause Log (Last 90 Days)
                                  </h5>
                                  <span className="text-[10px] font-mono text-[#8890a6]">2 Recorded Events</span>
                                </div>

                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-[#161924] text-[10px] uppercase font-mono text-[#77809a] border-b border-[#222636]">
                                      <th className="p-3">Event ID</th>
                                      <th className="p-3">Timestamp</th>
                                      <th className="p-3">Severity</th>
                                      <th className="p-3">Affected Component</th>
                                      <th className="p-3">Downtime</th>
                                      <th className="p-3">Root Cause</th>
                                      <th className="p-3 text-right">PIR Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#222636]">
                                    <tr className="hover:bg-[#181c28]">
                                      <td className="p-3 font-mono text-blue-400 font-bold">INC-2026-0812</td>
                                      <td className="p-3 font-mono text-[#8890a6]">2026-08-12 14:22 UTC</td>
                                      <td className="p-3">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                                          P1 CRITICAL
                                        </span>
                                      </td>
                                      <td className="p-3 text-white font-medium">Gemini Gateway Proxy</td>
                                      <td className="p-3 font-mono text-amber-400">12 mins</td>
                                      <td className="p-3 text-[#8890a6]">Upstream Vertex AI API rate limit throttle surge</td>
                                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">COMPLETED</td>
                                    </tr>
                                    <tr className="hover:bg-[#181c28]">
                                      <td className="p-3 font-mono text-blue-400 font-bold">INC-2026-0704</td>
                                      <td className="p-3 font-mono text-[#8890a6]">2026-07-04 09:10 UTC</td>
                                      <td className="p-3">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                          P2 MAJOR
                                        </span>
                                      </td>
                                      <td className="p-3 text-white font-medium">Vector Store Index</td>
                                      <td className="p-3 font-mono text-amber-400">4 mins</td>
                                      <td className="p-3 text-[#8890a6]">Secondary replica failover sync delay</td>
                                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">COMPLETED</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

