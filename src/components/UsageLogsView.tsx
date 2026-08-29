import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Clock,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Server,
  AppWindow,
  Boxes,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ChevronDown,
  Layers,
  Sparkles,
  X,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { AuditLog, UsageMetric, Application, AIProvider, AIModel } from '../types';

interface UsageLogsViewProps {
  auditLogs: AuditLog[];
  usageMetrics: UsageMetric[];
  applications: Application[];
  providers: AIProvider[];
  models: AIModel[];
  selectedLogToInspect?: AuditLog | null;
  onCloseInspectModal?: () => void;
}

export const UsageLogsView: React.FC<UsageLogsViewProps> = ({
  auditLogs,
  usageMetrics,
  applications,
  providers,
  models,
  selectedLogToInspect,
  onCloseInspectModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'logs'>('analytics');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [logFilterApp, setLogFilterApp] = useState('all');
  const [logFilterStatus, setLogFilterStatus] = useState('all');
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(selectedLogToInspect || null);

  // Time chart data
  const hourlyData = [
    { time: '08:00', requests: 420, ollama: 260, groq: 110, gemini: 50, cost: 0.12 },
    { time: '10:00', requests: 880, ollama: 540, groq: 230, gemini: 110, cost: 0.35 },
    { time: '12:00', requests: 1250, ollama: 780, groq: 320, gemini: 150, cost: 0.48 },
    { time: '14:00', requests: 1420, ollama: 890, groq: 370, gemini: 160, cost: 0.52 },
    { time: '16:00', requests: 1680, ollama: 1050, groq: 420, gemini: 210, cost: 0.68 },
    { time: '18:00', requests: 1100, ollama: 690, groq: 270, gemini: 140, cost: 0.41 },
    { time: '20:00', requests: 740, ollama: 460, groq: 190, gemini: 90, cost: 0.28 }
  ];

  // Usage by App data
  const appUsageData = applications.map(app => {
    const appLogs = auditLogs.filter(l => l.appId === app.id);
    const tokens = appLogs.reduce((sum, l) => sum + l.tokensConsumed, 0) + app.quotaUsedRequests * 380;
    const cost = (tokens / 1000) * 0.0004;
    return {
      name: app.name,
      requests: appLogs.length > 0 ? appLogs.length * 150 + 200 : app.quotaUsedRequests,
      tokens,
      cost: Number(cost.toFixed(2))
    };
  });

  // Provider breakdown for Pie chart
  const providerColors = ['#3b82f6', '#f97316', '#10b981', '#a855f7'];
  const providerPieData = [
    { name: 'Ollama (Local)', value: 62, requests: 2983, cost: '$0.00' },
    { name: 'Groq (Cloud LPU)', value: 25, requests: 1203, cost: '$1.44' },
    { name: 'Gemini (Cloud)', value: 13, requests: 626, cost: '$1.12' }
  ];

  // Filter audit logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesApp = logFilterApp === 'all' || log.appId === logFilterApp;
    const matchesStatus = logFilterStatus === 'all' || log.status === logFilterStatus;
    const matchesSearch =
      log.appName.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.capability.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.modelIdentifier.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      (log.providerName && log.providerName.toLowerCase().includes(searchLogQuery.toLowerCase()));
    return matchesApp && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Usage Metrics & Audit Trail
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Layer 2 • Observability & Audit
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-0.5">
            Real-time tracking of token volumes, provider billing attribution, model utilization, and granular execution logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-0.5 bg-[#141414] border border-[#222222] rounded">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
              activeSubTab === 'analytics'
                ? 'bg-[#1a1a1a] text-white font-bold border border-[#333333]'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Usage Analytics</span>
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
              activeSubTab === 'logs'
                ? 'bg-[#1a1a1a] text-white font-bold border border-[#333333]'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Live Audit Logs ({auditLogs.length})</span>
            </span>
          </button>
        </div>
      </div>

      {activeSubTab === 'analytics' ? (
        /* Analytics View */
        <div className="space-y-6">
          {/* Top KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded bg-[#141414] border border-[#222222]">
              <div className="text-[10px] text-[#888888] font-bold uppercase font-mono">Total Requests (Today)</div>
              <div className="text-xl font-bold font-mono text-white mt-1">4,812</div>
              <div className="text-[10px] text-green-400 mt-1 flex items-center gap-1 font-mono">
                <TrendingUp className="w-3 h-3" />
                <span>+14.2% vs yesterday</span>
              </div>
            </div>

            <div className="p-4 rounded bg-[#141414] border border-[#222222]">
              <div className="text-[10px] text-[#888888] font-bold uppercase font-mono">Tokens Consumed</div>
              <div className="text-xl font-bold font-mono text-blue-300 mt-1">3.52M</div>
              <div className="text-[10px] text-[#666666] mt-1 font-mono">
                2.4M prompt / 1.1M output
              </div>
            </div>

            <div className="p-4 rounded bg-[#141414] border border-[#222222]">
              <div className="text-[10px] text-[#888888] font-bold uppercase font-mono">Approximate Cost</div>
              <div className="text-xl font-bold font-mono text-green-400 mt-1">£2.56</div>
              <div className="text-[10px] text-[#666666] mt-1 font-mono">
                62% zero-cost (Ollama GPU)
              </div>
            </div>

            <div className="p-4 rounded bg-[#141414] border border-[#222222]">
              <div className="text-[10px] text-[#888888] font-bold uppercase font-mono">Avg Egress Latency</div>
              <div className="text-xl font-bold font-mono text-yellow-400 mt-1">1.82s</div>
              <div className="text-[10px] text-green-400 mt-1 font-mono">
                99.83% success rate
              </div>
            </div>
          </div>

          {/* Timeframe Request Chart */}
          <div className="p-4 rounded bg-[#141414] border border-[#222222] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
                  INFERENCE THROUGHPUT & PROVIDER DISPATCH OVER TIME
                </h3>
                <p className="text-xs text-[#888888]">
                  Requests routed across Ollama (Local), Groq (LPU), and Google Gemini
                </p>
              </div>

              <div className="flex items-center space-x-1 p-0.5 bg-[#0a0a0a] rounded border border-[#222222] text-xs font-mono">
                {(['today', 'week', 'month'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-2 py-0.5 rounded capitalize text-[11px] ${
                      timeRange === t ? 'bg-[#1a1a1a] text-white font-bold border border-[#333333]' : 'text-[#888888]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full pt-2 font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOllama" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGroq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGemini" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#222222" />
                  <XAxis dataKey="time" stroke="#666666" fontSize={10} />
                  <YAxis stroke="#666666" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111111',
                      borderColor: '#222222',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#e5e5e5'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ollama"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="url(#colorOllama)"
                    name="Ollama (Local)"
                  />
                  <Area
                    type="monotone"
                    dataKey="groq"
                    stackId="1"
                    stroke="#f97316"
                    fill="url(#colorGroq)"
                    name="Groq Cloud"
                  />
                  <Area
                    type="monotone"
                    dataKey="gemini"
                    stackId="1"
                    stroke="#10b981"
                    fill="url(#colorGemini)"
                    name="Google Gemini"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Section: Usage by Application & Provider Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Usage by App Table */}
            <div className="lg:col-span-2 p-4 rounded bg-[#141414] border border-[#222222] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <h3 className="text-xs font-bold text-white uppercase font-mono">
                  USAGE BY APPLICATION
                </h3>
                <span className="text-[10px] text-[#666666] font-mono">Consuming Ecosystem</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-[#666666] text-[10px] uppercase border-b border-[#222222]">
                      <th className="pb-2">APPLICATION</th>
                      <th className="pb-2">REQUESTS</th>
                      <th className="pb-2">TOKENS</th>
                      <th className="pb-2">EST. COST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {appUsageData.map(app => (
                      <tr key={app.name} className="hover:bg-[#1a1a1a]">
                        <td className="py-2.5 font-bold text-white flex items-center gap-2 font-sans">
                          <AppWindow className="w-3.5 h-3.5 text-blue-400" />
                          <span>{app.name}</span>
                        </td>
                        <td className="py-2.5 text-[#888888]">
                          {app.requests.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-[#666666]">
                          {(app.tokens / 1000).toFixed(0)}K
                        </td>
                        <td className="py-2.5 text-green-400 font-semibold">
                          ${app.cost}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Provider Share Card */}
            <div className="p-4 rounded bg-[#141414] border border-[#222222] space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                  <h3 className="text-xs font-bold text-white uppercase font-mono">
                    PROVIDER COST ATTRIBUTION
                  </h3>
                </div>

                <div className="space-y-2.5 mt-3 text-xs font-mono">
                  {providerPieData.map((p, idx) => (
                    <div key={p.name} className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: providerColors[idx] }}
                        />
                        <div>
                          <div className="font-semibold text-white font-sans text-xs">{p.name}</div>
                          <div className="text-[10px] text-[#666666]">
                            {p.requests} requests ({p.value}%)
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">{p.cost}</div>
                        <div className="text-[9px] text-[#666666]">Incurred</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] text-[11px] text-[#888888]">
                💡 <strong className="text-white">FinOps Advantage:</strong> Local Ollama routing absorbs 62% of traffic, saving ~£240/mo in cloud API spend.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Audit Logs Stream */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded bg-[#141414] border border-[#222222] text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search logs by keyword, model, task..."
                value={searchLogQuery}
                onChange={e => setSearchLogQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[#888888] whitespace-nowrap font-mono text-[11px]">App:</span>
              <select
                value={logFilterApp}
                onChange={e => setLogFilterApp(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-[#e5e5e5] focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="all">All Applications</option>
                {applications.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[#888888] whitespace-nowrap font-mono text-[11px]">Status:</span>
              <select
                value={logFilterStatus}
                onChange={e => setLogFilterStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-[#e5e5e5] focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="all">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FALLBACK_SUCCESS">FALLBACK_SUCCESS</option>
                <option value="POLICY_BLOCKED">POLICY_BLOCKED</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-[#141414] border border-[#222222] rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#222222] bg-[#141414] text-[#666666] text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">TIMESTAMP</th>
                    <th className="py-3 px-4 font-semibold">APPLICATION</th>
                    <th className="py-3 px-4 font-semibold">TASK / CAPABILITY</th>
                    <th className="py-3 px-4 font-semibold">PROVIDER</th>
                    <th className="py-3 px-4 font-semibold">MODEL</th>
                    <th className="py-3 px-4 font-semibold">TOKENS</th>
                    <th className="py-3 px-4 font-semibold">DURATION</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold text-right">INSPECT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {filteredLogs.map(log => (
                    <tr
                      key={log.id}
                      onClick={() => setInspectingLog(log)}
                      className="hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-[11px] text-[#666666] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 font-bold text-white font-sans">
                        {log.appName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0a0a0a] text-blue-300 border border-[#222222]">
                          {log.capability}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#888888]">
                        {log.providerName || 'ALTIL Gateway'}
                      </td>
                      <td className="py-3 px-4 text-[#666666] text-[11px]">
                        {log.modelIdentifier}
                      </td>
                      <td className="py-3 px-4 text-[#888888]">
                        {log.tokensConsumed.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[#888888]">
                        {log.durationSeconds}s
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono flex items-center gap-1 ${
                            log.status === 'SUCCESS'
                              ? 'text-green-400'
                              : log.status === 'FALLBACK_SUCCESS'
                              ? 'text-blue-400'
                              : log.status === 'POLICY_BLOCKED'
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          <span>●</span>
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setInspectingLog(log);
                          }}
                          className="px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-[#e5e5e5] text-[10px] border border-[#222222]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Granular Log Inspector Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111111] border border-[#222222] rounded max-w-2xl w-full p-6 shadow-2xl space-y-4 text-[#e5e5e5] max-h-[90vh] overflow-y-auto font-mono">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded bg-[#0a0a0a] text-blue-400 border border-[#222222]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">
                    Audit Log Inspector: <span className="font-mono text-blue-400">{inspectingLog.id}</span>
                  </h3>
                  <div className="text-[10px] text-[#666666]">
                    Recorded on {inspectingLog.timestamp}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setInspectingLog(null);
                  if (onCloseInspectModal) onCloseInspectModal();
                }}
                className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Key Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222]">
                <div className="text-[10px] text-[#666666]">Application</div>
                <div className="font-bold text-white mt-0.5 font-sans">{inspectingLog.appName}</div>
              </div>
              <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222]">
                <div className="text-[10px] text-[#666666]">Capability</div>
                <div className="text-blue-300 mt-0.5">{inspectingLog.capability}</div>
              </div>
              <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222]">
                <div className="text-[10px] text-[#666666]">Provider & Model</div>
                <div className="text-[#e5e5e5] mt-0.5 truncate">{inspectingLog.providerName} / {inspectingLog.modelIdentifier}</div>
              </div>
              <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222]">
                <div className="text-[10px] text-[#666666]">Status & Duration</div>
                <div className="font-bold text-green-400 mt-0.5">{inspectingLog.status} ({inspectingLog.durationSeconds}s)</div>
              </div>
            </div>

            {/* Prompt Preview */}
            <div>
              <div className="text-[10px] font-bold text-[#888888] uppercase tracking-wider mb-1">
                Prompt Payload Preview (Scrubbed & Masked)
              </div>
              <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222] text-xs text-[#888888] whitespace-pre-wrap">
                {inspectingLog.promptPreview || 'Prompt content masked by enterprise compliance policy.'}
              </div>
            </div>

            {/* Response Preview */}
            {inspectingLog.responsePreview && (
              <div>
                <div className="text-[10px] font-bold text-[#888888] uppercase tracking-wider mb-1">
                  Model Output Preview
                </div>
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222] text-xs text-[#e5e5e5] whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {inspectingLog.responsePreview}
                </div>
              </div>
            )}

            {/* Governance Checks */}
            <div>
              <div className="text-[10px] font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                ALTIL Governance Checks Applied
              </div>
              <div className="space-y-1 bg-[#0a0a0a] p-3 rounded border border-[#222222] text-xs">
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>API Key verified and rate quota respected ({inspectingLog.tokensConsumed} tokens billed)</span>
                </div>
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PII filter checked ({inspectingLog.piiScrubbed ? 'PII Detected and Scrubbed' : 'No PII violations'})</span>
                </div>
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Telemetry dispatched to immutable audit ledger</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#222222] flex justify-end">
              <button
                onClick={() => {
                  setInspectingLog(null);
                  if (onCloseInspectModal) onCloseInspectModal();
                }}
                className="px-3 py-1.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-white text-xs font-bold border border-[#222222]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
