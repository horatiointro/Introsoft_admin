import React, { useState } from 'react';
import {
  X,
  Activity,
  ShieldCheck,
  Lock,
  DollarSign,
  Cpu,
  Server,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Info,
  Layers,
  ChevronRight,
  Database,
  Search,
  CheckCircle2,
  Clock,
  Terminal,
  FileText,
  Sliders,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Zap,
  Filter
} from 'lucide-react';
import { ProvenanceBadge } from './ProvenanceBadge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export interface TileDetailData {
  id: string;
  title: string;
  value: string | number;
  subValue?: string;
  category: 'Availability & Health' | 'AI Operations & Latency' | 'FinOps & Cost' | 'SOC & Security' | 'POPIA & Compliance';
  status: 'optimal' | 'warning' | 'critical' | 'info';
  
  // Derivation & Math
  formula: string;
  derivationMethod: string;
  dataSources: string[];
  lastCalculatedAt: string;

  // BOC (Business Operations) Perspective
  bocImpact: {
    businessUnit: string;
    financialRiskExposure: string;
    slaPenaltyRisk: string;
    operationalStatus: string;
    summary: string;
  };

  // SOC (Security Operations) Perspective
  socTelemetry: {
    threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    activeControlsEnforced: string[];
    piiAuditStatus: string;
    statutoryComplianceSeal: string;
    rawSecurityEvents24h: number;
  };

  // Level 1 Visual Trends
  timeSeriesTrend: Array<{ time: string; value: number; baseline: number; threshold?: number }>;
  breakdownByDimension: Array<{ name: string; count: number; percentage: number; color?: string }>;

  // Level 2 Raw Logs & Sub-Components
  rawTelemetryLogs: Array<{
    timestamp: string;
    eventId: string;
    tenantCode: string;
    sourceIp: string;
    gatewayRoute: string;
    status: string;
    latencyMs: number;
    tokensUsed: number;
    costUsd: number;
    securityGuardrail: string;
    detail: string;
  }>;
}

interface TileDetailModalProps {
  data: TileDetailData | null;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export const TileDetailModal: React.FC<TileDetailModalProps> = ({
  data,
  onClose,
  onNavigate
}) => {
  const [drillLevel, setDrillLevel] = useState<'level1_summary' | 'level2_raw_logs' | 'level3_boc_soc'>('level1_summary');
  const [logFilter, setLogFilter] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  if (!data) return null;

  const filteredLogs = data.rawTelemetryLogs.filter(log =>
    log.tenantCode.toLowerCase().includes(logFilter.toLowerCase()) ||
    log.gatewayRoute.toLowerCase().includes(logFilter.toLowerCase()) ||
    log.eventId.toLowerCase().includes(logFilter.toLowerCase()) ||
    log.detail.toLowerCase().includes(logFilter.toLowerCase())
  );

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-[#10131e] border border-[#232a42] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#151928] border-b border-[#232a42] p-5 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                data.category === 'SOC & Security' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                data.category === 'FinOps & Cost' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                data.category === 'POPIA & Compliance' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {data.category}
              </span>
              <span className="text-xs font-mono text-[#8890a6]">ID: {data.id}</span>
              <ProvenanceBadge
                type={
                  data.category === 'Availability & Health' || data.category === 'SOC & Security'
                    ? 'LIVE'
                    : data.category === 'FinOps & Cost'
                    ? 'CALCULATED'
                    : 'DERIVED'
                }
                source={data.dataSources?.[0] || 'MariaDB telemetry'}
                size="xs"
              />
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Calculated {data.lastCalculatedAt}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {data.title}
              <span className="text-2xl font-mono text-emerald-400 font-extrabold ml-2">
                {data.value}
              </span>
              {data.subValue && (
                <span className="text-xs font-mono text-[#8890a6] font-normal">
                  ({data.subValue})
                </span>
              )}
            </h2>
            <p className="text-xs text-[#8890a6]">
              Mathematical derivation, Business Operations (BOC) impact, Security (SOC) telemetry, and raw event logs.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1e2438] hover:bg-[#28304a] text-[#8890a6] hover:text-white border border-[#2e3754] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drill-Down Navigation Bar */}
        <div className="bg-[#131724] border-b border-[#232a42] px-5 py-2.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setDrillLevel('level1_summary')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                drillLevel === 'level1_summary'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white bg-[#1a2032]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              1. Metric Derivation & Trends
            </button>
            <button
              onClick={() => setDrillLevel('level3_boc_soc')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                drillLevel === 'level3_boc_soc'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white bg-[#1a2032]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              2. BOC & SOC Deep-Dive
            </button>
            <button
              onClick={() => setDrillLevel('level2_raw_logs')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                drillLevel === 'level2_raw_logs'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white bg-[#1a2032]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              3. Raw Telemetry Logs ({data.rawTelemetryLogs.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPayload}
              className="px-2.5 py-1.5 rounded-lg bg-[#1c2236] hover:bg-[#252d48] border border-[#2b3554] text-xs font-mono text-blue-300 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied JSON' : 'Export JSON'}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* LEVEL 1: DERIVATION FORMULA, TREND GRAPH, AND DIMENSIONAL BREAKDOWN */}
          {drillLevel === 'level1_summary' && (
            <div className="space-y-6">
              {/* Formula & Derivation Logic Card */}
              <div className="bg-[#151928] border border-[#232a42] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#232a42] pb-2">
                  <h3 className="text-xs font-bold font-mono text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    How This Summary Metric Is Mathematically Derived
                  </h3>
                  <span className="text-[10px] font-mono text-[#77809a]">Engine: Real-time Ingestion Pipeline</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#10131e] p-3 rounded-lg border border-[#1e253a] space-y-2">
                    <span className="text-[10px] text-[#77809a] font-mono uppercase block">Derivation Formula</span>
                    <div className="font-mono text-xs text-amber-300 font-bold bg-[#090b12] p-2.5 rounded border border-[#1a2032] overflow-x-auto">
                      {data.formula}
                    </div>
                  </div>

                  <div className="bg-[#10131e] p-3 rounded-lg border border-[#1e253a] space-y-2 text-xs font-mono">
                    <span className="text-[10px] text-[#77809a] font-mono uppercase block">Calculation Method</span>
                    <p className="text-[#8890a6] leading-relaxed">{data.derivationMethod}</p>
                    <div className="pt-1 flex flex-wrap gap-1">
                      {data.dataSources.map((ds, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#182033] text-blue-300 text-[10px] border border-[#242f4c]">
                          Source: {ds}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Series Trend Chart */}
              <div className="bg-[#151928] border border-[#232a42] p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Historical Trend & Performance Envelope
                    </h3>
                    <p className="text-xs text-[#8890a6]">24-hour recorded values against target SLA baseline.</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                    Target Baseline Met
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.timeSeriesTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#8890a6', fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#8890a6', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#181c28', borderColor: '#283046', borderRadius: '12px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="value" name="Observed Metric" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                      <Line type="monotone" dataKey="baseline" name="Target Baseline" stroke="#10b981" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                      {data.timeSeriesTrend[0]?.threshold !== undefined && (
                        <Line type="monotone" dataKey="threshold" name="SLA Ceiling Limit" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Breakdown by Dimension (e.g., Tenant, Model, Gateway) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#151928] border border-[#232a42] p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Dimensional Composition Breakdown
                  </h3>
                  <div className="space-y-2 font-mono text-xs">
                    {data.breakdownByDimension.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#8890a6]">{item.name}</span>
                          <span className="text-white font-bold">{item.count.toLocaleString()} ({item.percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-[#10131e] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: item.color || '#3b82f6'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Next Drill Action Button */}
                <div className="bg-[#151928] border border-[#232a42] p-5 rounded-xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Ready for Deep BOC & SOC Telemetry?
                    </h3>
                    <p className="text-xs text-[#8890a6] mt-1 leading-relaxed">
                      Inspect business impact risk models, financial penalty exposure, security threat vectors, and raw audit logs for this specific tile.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setDrillLevel('level3_boc_soc')}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Inspect BOC & SOC Governance <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDrillLevel('level2_raw_logs')}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#1e2438] hover:bg-[#28304a] text-purple-300 font-bold text-xs border border-[#313a57] flex items-center justify-center gap-2 transition-colors"
                    >
                      <Terminal className="w-4 h-4" />
                      View {data.rawTelemetryLogs.length} Raw Transaction Event Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 2: BOC (BUSINESS OPERATIONS) & SOC (SECURITY OPERATIONS) DRILL-DOWN */}
          {drillLevel === 'level3_boc_soc' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BOC (Business Operations Centre) View */}
                <div className="bg-[#151928] border border-[#232a42] p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#232a42]">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="text-sm font-bold text-white">Business Operations Centre (BOC) Impact</h3>
                        <p className="text-[11px] text-[#8890a6]">Commercial, SLA, and financial risk evaluation.</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      {data.bocImpact.operationalStatus}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="bg-[#10131e] p-3 rounded-lg border border-[#1e253a]">
                      <span className="text-[#77809a] text-[10px] block uppercase">Business Context</span>
                      <p className="text-white mt-1 leading-relaxed">{data.bocImpact.summary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#10131e] p-3 rounded-lg border border-[#1e253a]">
                        <span className="text-[#77809a] text-[10px] block uppercase">Primary Impact Unit</span>
                        <span className="text-blue-300 font-bold block mt-0.5">{data.bocImpact.businessUnit}</span>
                      </div>
                      <div className="bg-[#10131e] p-3 rounded-lg border border-[#1e253a]">
                        <span className="text-[#77809a] text-[10px] block uppercase">SLA Credit Risk</span>
                        <span className="text-emerald-400 font-bold block mt-0.5">{data.bocImpact.slaPenaltyRisk}</span>
                      </div>
                    </div>

                    <div className="bg-[#10131e] p-3 rounded-lg border border-[#1e253a]">
                      <span className="text-[#77809a] text-[10px] block uppercase">Financial Burn Risk Exposure</span>
                      <span className="text-amber-300 font-bold block mt-0.5">{data.bocImpact.financialRiskExposure}</span>
                    </div>
                  </div>
                </div>

                {/* SOC (Security Operations Centre) View */}
                <div className="bg-[#151928] border border-[#232a42] p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#232a42]">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-red-400" />
                      <div>
                        <h3 className="text-sm font-bold text-white">Security Operations Centre (SOC) Telemetry</h3>
                        <p className="text-[11px] text-[#8890a6]">Guardrail enforcement & threat intelligence.</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      data.socTelemetry.threatLevel === 'NONE' || data.socTelemetry.threatLevel === 'LOW'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      Threat: {data.socTelemetry.threatLevel}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="bg-[#10131e] p-3 rounded-lg border border-[#1e253a]">
                      <span className="text-[#77809a] text-[10px] block uppercase">Statutory POPIA/GDPR Seal</span>
                      <span className="text-emerald-400 font-bold block mt-0.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        {data.socTelemetry.statutoryComplianceSeal}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#10131e] p-3 rounded-lg border border-[#1e253a]">
                        <span className="text-[#77809a] text-[10px] block uppercase">24h Security Events</span>
                        <span className="text-purple-300 font-bold block mt-0.5">{data.socTelemetry.rawSecurityEvents24h.toLocaleString()} Events</span>
                      </div>
                      <div className="bg-[#10131e] p-3 rounded-lg border border-[#1e253a]">
                        <span className="text-[#77809a] text-[10px] block uppercase">PII Scrubbing Status</span>
                        <span className="text-blue-300 font-bold block mt-0.5">{data.socTelemetry.piiAuditStatus}</span>
                      </div>
                    </div>

                    <div className="bg-[#10131e] p-3 rounded-lg border border-[#1e253a]">
                      <span className="text-[#77809a] text-[10px] block uppercase">Active Guardrails Enforced</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {data.socTelemetry.activeControlsEnforced.map((ctrl, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-[#1c2438] text-emerald-300 text-[10px] border border-[#273452]">
                            ✓ {ctrl}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 3: RAW TRANSACTION TELEMETRY LOGS */}
          {drillLevel === 'level2_raw_logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#151928] p-4 rounded-xl border border-[#232a42]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Raw Gateway Transaction Audit Stream</h3>
                    <p className="text-xs text-[#8890a6]">Individual real-time events contributing to this summary metric.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#77809a] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter logs by route, tenant, IP..."
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      className="bg-[#10131e] border border-[#232a42] text-xs text-white rounded-lg pl-8 pr-3 py-1.5 font-mono focus:outline-none focus:border-blue-500 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Log Table */}
              <div className="bg-[#151928] border border-[#232a42] rounded-xl overflow-hidden font-mono text-xs">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0f121d] text-[#77809a] text-[10px] uppercase border-b border-[#232a42] sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Event ID</th>
                        <th className="py-2.5 px-3">Tenant</th>
                        <th className="py-2.5 px-3">Route & Model</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Latency</th>
                        <th className="py-2.5 px-3 text-right">Tokens</th>
                        <th className="py-2.5 px-3">Guardrail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e253a] text-[11px]">
                      {filteredLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-[#1a2032] transition-colors">
                          <td className="py-2 px-3 text-[#8890a6] whitespace-nowrap">{log.timestamp}</td>
                          <td className="py-2 px-3 text-blue-400 font-bold whitespace-nowrap">{log.eventId}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{log.tenantCode}</td>
                          <td className="py-2 px-3 text-white max-w-[200px] truncate">{log.gatewayRoute}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-amber-300">{log.latencyMs}ms</td>
                          <td className="py-2 px-3 text-right text-purple-300">{log.tokensUsed}</td>
                          <td className="py-2 px-3 text-[#8890a6]">{log.securityGuardrail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#151928] border-t border-[#232a42] p-4 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-[#77809a]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Telemetry verified by ALTIL Gateway SOC & BOC Sentinel v4.2</span>
          </div>

          <div className="flex items-center gap-3">
            {onNavigate && (
              <button
                onClick={() => {
                  onClose();
                  if (data.category === 'SOC & Security') onNavigate('sec_ops');
                  else if (data.category === 'FinOps & Cost') onNavigate('finops');
                  else if (data.category === 'POPIA & Compliance') onNavigate('compliance');
                  else onNavigate('sla_kpi_monitoring');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                Go to Dedicated Module View <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#1e2438] hover:bg-[#28304a] text-[#8890a6] hover:text-white border border-[#2e3754] transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
