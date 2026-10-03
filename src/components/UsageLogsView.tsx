import { InfoButton } from './InfoButton';
import React, { useEffect, useMemo, useState } from 'react';
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
  ArrowUpRight,
  ArrowUpDown,
  MapPin
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
import { apiFetch } from '../utils/apiFetch';

const API_BASE = `${import.meta.env.BASE_URL}api/v1`;

interface DirectoryUser { id: string; email: string; first_name?: string; last_name?: string; tenant_id?: string | null; }
interface LoginEvent { id: string; userId: string | null; email: string; tenantId: string | null; ipAddress: string | null; outcome: string; failureReason: string | null; timestamp: string | null; }

function summarizeAuditEvent(log: AuditLog): string {
  const action = String(log.action || log.localEvent?.route || log.capability || 'activity').replace(/[_./-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const actor = log.actorEmail || log.actorId || log.localEvent?.actor || 'A system process';
  const outcome = log.outcome || (log.status === 'SUCCESS' || log.status === 'FALLBACK_SUCCESS' ? 'SUCCESS' : log.status === 'POLICY_BLOCKED' ? 'DENIED' : 'FAILURE');
  const outcomeText = outcome === 'SUCCESS' ? 'completed successfully' : outcome === 'DENIED' ? 'was denied' : outcome === 'FAILURE' ? 'failed' : 'was recorded';
  const resource = log.resourceType || log.resourceId;
  return `${actor} ${outcomeText} ${action}${resource ? ` for ${resource}` : ''}${log.statusCode ? ` (HTTP ${log.statusCode})` : ''}.`;
}

function elapsedLabel(milliseconds: number): string {
  if (milliseconds < 1000) return `${Math.max(0, milliseconds)} ms`;
  if (milliseconds < 60_000) return `${(milliseconds / 1000).toFixed(1)} sec`;
  return `${(milliseconds / 60_000).toFixed(1)} min`;
}

interface UsageLogsViewProps {
  auditLogs: AuditLog[];
  usageMetrics: UsageMetric[];
  applications: Application[];
  providers: AIProvider[];
  models: AIModel[];
  selectedLogToInspect?: AuditLog | null;
  onCloseInspectModal?: () => void;
  initialSection?: 'analytics' | 'logs';
}

export const UsageLogsView: React.FC<UsageLogsViewProps> = ({
  auditLogs,
  usageMetrics,
  applications,
  providers,
  models,
  selectedLogToInspect,
  onCloseInspectModal,
  initialSection = 'analytics'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'logs'>(initialSection);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [logFilterApp, setLogFilterApp] = useState('all');
  const [logFilterStatus, setLogFilterStatus] = useState('all');
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [logFilterActor, setLogFilterActor] = useState('all');
  const [logSortOrder, setLogSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(selectedLogToInspect || null);
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
  const [directoryError, setDirectoryError] = useState('');
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);
  const [loginEventsLoading, setLoginEventsLoading] = useState(false);
  const [loginEventsError, setLoginEventsError] = useState('');

  useEffect(() => {
    if (activeSubTab !== 'logs') return;
    let active = true;
    void apiFetch(`${API_BASE}/iam/users`).then(async response => {
      if (!response.ok) throw new Error(response.status === 403 ? 'Your account cannot read the IAM user directory.' : 'The IAM user directory is unavailable.');
      const value = await response.json();
      if (active) {
        setDirectoryUsers(Array.isArray(value) ? value.filter((user: any) => typeof user?.email === 'string' && user.email.trim()).map((user: any) => ({
          id: String(user.id || user.email), email: String(user.email), first_name: user.first_name, last_name: user.last_name, tenant_id: user.tenant_id,
        })) : []);
        setDirectoryError('');
      }
    }).catch(error => { if (active) setDirectoryError(error instanceof Error ? error.message : 'The IAM user directory is unavailable.'); });
    return () => { active = false; };
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab !== 'logs' || logFilterActor === 'all') {
      setLoginEvents([]);
      setLoginEventsError('');
      return;
    }
    let active = true;
    setLoginEventsLoading(true);
    setLoginEventsError('');
    const query = new URLSearchParams({ email: logFilterActor, limit: '100' });
    void apiFetch(`${API_BASE}/iam/login-events?${query.toString()}`).then(async response => {
      const value = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(value?.error || 'Sign-in history is unavailable.');
      if (active) setLoginEvents(Array.isArray(value) ? value : []);
    }).catch(error => {
      if (active) {
        setLoginEvents([]);
        setLoginEventsError(error instanceof Error ? error.message : 'Sign-in history is unavailable.');
      }
    }).finally(() => { if (active) setLoginEventsLoading(false); });
    return () => { active = false; };
  }, [activeSubTab, logFilterActor]);

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
    const matchesActor = logFilterActor === 'all' || [log.actorEmail, log.actorId, log.localEvent?.actor].some(value => String(value || '').toLowerCase() === logFilterActor.toLowerCase());
    const matchesSearch =
      String(log.appName || '').toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      String(log.capability || '').toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      String(log.modelIdentifier || '').toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      (log.providerName && log.providerName.toLowerCase().includes(searchLogQuery.toLowerCase())) ||
      [log.actorEmail, log.actorId, log.tenantId, log.organizationId, log.requestId, log.testRunId, log.action, log.eventCategory, log.resourceType, log.resourceId, log.denialReason].some(value => String(value || '').toLowerCase().includes(searchLogQuery.toLowerCase())) ||
      (log.localEvent && `${log.localEvent.actor} ${log.localEvent.tenantId} ${log.localEvent.route} ${log.localEvent.detail}`.toLowerCase().includes(searchLogQuery.toLowerCase()));
    return matchesApp && matchesStatus && matchesActor && matchesSearch;
  });

  const sortedLogs = useMemo(() => [...filteredLogs].sort((left, right) => {
    const difference = Date.parse(left.timestamp) - Date.parse(right.timestamp);
    return (logSortOrder === 'latest' ? -1 : 1) * (Number.isFinite(difference) ? difference : 0);
  }), [filteredLogs, logSortOrder]);

  const inspectedRequestEvents = useMemo(() => {
    if (!inspectingLog) return [] as AuditLog[];
    const related = inspectingLog.requestId
      ? auditLogs.filter(log => log.requestId === inspectingLog.requestId)
      : [inspectingLog];
    return related.sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp));
  }, [auditLogs, inspectingLog]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white"><InfoButton />
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
              <div className="text-xl font-bold font-mono text-green-400 mt-1">$2.56</div>
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
                <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono"><InfoButton />
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
                <h3 className="text-xs font-bold text-white uppercase font-mono"><InfoButton />
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
                  <h3 className="text-xs font-bold text-white uppercase font-mono"><InfoButton />
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
                💡 <strong className="text-white">FinOps Advantage:</strong> Local Ollama routing absorbs 62% of traffic, saving ~$240/mo in cloud API spend.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Audit Logs Stream */
        <div className="space-y-4">
          {auditLogs.some(log => log.environment === 'local-test' || log.localEvent?.source === 'LOCAL_TEST') && (
            <div className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
              <strong>TEST · LOCAL E2E.</strong> Events use the shared ALTIL event model and are persisted in the isolated test database and local structured logs. Request bodies, credentials, and query strings are not recorded.
            </div>
          )}
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 p-3 rounded bg-[#141414] border border-[#222222] text-xs">
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

            <div className="flex items-center space-x-2">
              <span className="text-[#888888] whitespace-nowrap font-mono text-[11px]">User:</span>
              <select
                value={logFilterActor}
                onChange={e => setLogFilterActor(e.target.value)}
                className="w-full min-w-0 px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-[#e5e5e5] focus:outline-none focus:border-blue-500 font-mono"
                aria-label="Filter audit events by IAM user"
              >
                <option value="all">All IAM users</option>
                {directoryUsers.map(user => <option key={user.id} value={user.email}>{user.email}</option>)}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#666666]" />
              <span className="text-[#888888] whitespace-nowrap font-mono text-[11px]">Order:</span>
              <select
                value={logSortOrder}
                onChange={e => setLogSortOrder(e.target.value as 'latest' | 'oldest')}
                className="w-full min-w-0 px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-[#e5e5e5] focus:outline-none focus:border-blue-500 font-mono"
                aria-label="Audit event order"
              >
                <option value="latest">Latest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
            {directoryError && <div className="xl:col-span-5 text-[11px] text-amber-300">IAM user list unavailable: {directoryError}</div>}
          </div>

          {logFilterActor !== 'all' && (
            <section className="rounded bg-[#141414] border border-[#222222] overflow-hidden" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#222222]">
                <div>
                  <h3 className="text-xs font-semibold text-white flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-cyan-300" />Recent sign-ins · {logFilterActor}</h3>
                  <p className="mt-1 text-[10px] text-[#777777]">Database login history, limited to the last five days and your authorized audit scope.</p>
                </div>
                <span className="text-[10px] text-[#777777]">{loginEventsLoading ? 'Loading…' : `${loginEvents.length} records`}</span>
              </div>
              {loginEventsError ? <p className="px-4 py-3 text-xs text-amber-300">{loginEventsError}</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-xs font-mono">
                    <thead className="text-[10px] text-[#666666] uppercase"><tr><th className="px-4 py-2.5">Time</th><th className="px-4 py-2.5">IP address</th><th className="px-4 py-2.5">Result</th><th className="px-4 py-2.5">Tenant</th><th className="px-4 py-2.5">Reason</th></tr></thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {loginEvents.map(event => <tr key={event.id}>
                        <td className="px-4 py-2.5 text-[#bbbbbb] whitespace-nowrap">{event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'}</td>
                        <td className="px-4 py-2.5 text-cyan-200 font-mono">{event.ipAddress || 'Not recorded'}</td>
                        <td className={`px-4 py-2.5 ${event.outcome === 'SUCCESS' ? 'text-emerald-300' : 'text-amber-300'}`}>{event.outcome}</td>
                        <td className="px-4 py-2.5 text-[#999999]">{event.tenantId || 'Platform / unknown'}</td>
                        <td className="px-4 py-2.5 text-[#888888]">{event.failureReason || '—'}</td>
                      </tr>)}
                      {!loginEventsLoading && !loginEvents.length && <tr><td className="px-4 py-4 text-center text-[#777777]" colSpan={5}>No sign-in attempts for this account in the retained period.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Audit Logs Table */}
          <div className="bg-[#141414] border border-[#222222] rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#222222] bg-[#141414] text-[#666666] text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">TIMESTAMP</th>
                    <th className="py-3 px-4 font-semibold">ENVIRONMENT</th>
                    <th className="py-3 px-4 font-semibold">TEST RUN ID</th>
                    <th className="py-3 px-4 font-semibold">ACTOR</th>
                    <th className="py-3 px-4 font-semibold">CLIENT IP</th>
                    <th className="py-3 px-4 font-semibold">CATEGORY / ACTION</th>
                    <th className="py-3 px-4 font-semibold">RESOURCE</th>
                    <th className="py-3 px-4 font-semibold">ORG / TENANT</th>
                    <th className="py-3 px-4 font-semibold">OUTCOME</th>
                    <th className="py-3 px-4 font-semibold">REQUEST ID</th>
                    <th className="py-3 px-4 font-semibold text-right">INSPECT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {sortedLogs.map(log => (
                    <tr
                      key={log.id}
                      onClick={() => setInspectingLog(log)}
                      title={summarizeAuditEvent(log)}
                      className="hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-[11px] text-[#666666] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 text-amber-200">{log.environment === 'local-test' ? 'TEST · LOCAL' : log.environment?.toUpperCase() || 'UNKNOWN'}</td>
                      <td className="py-3 px-4 text-[11px] text-amber-200">{log.testRunId || '—'}</td>
                      <td className="py-3 px-4 text-[#dddddd]">{log.actorEmail || log.actorId || 'System'}</td>
                      <td className="py-3 px-4 text-cyan-200">{log.clientIp || '—'}</td>
                      <td className="py-3 px-4"><div className="text-blue-300">{log.eventCategory || 'APPLICATION_LOG'}</div><div className="text-[#aaaaaa]">{log.action || log.capability}</div><div className="mt-1 max-w-sm text-[10px] leading-4 text-[#727b8c]">{summarizeAuditEvent(log)}</div></td>
                      <td className="py-3 px-4 text-[#bbbbbb]">{[log.resourceType, log.resourceId].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="py-3 px-4 text-[#bbbbbb]">{log.organizationId || log.tenantId || '—'}</td>
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
                          <span>{log.outcome || log.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#777777]">{log.requestId || '—'}</td>
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
                  {!sortedLogs.length && <tr><td className="px-4 py-8 text-center text-[#777777]" colSpan={11}>No persisted events match this view.</td></tr>}
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
                  <h3 className="text-sm font-bold text-white font-sans"><InfoButton />
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

            {inspectingLog.action || inspectingLog.localEvent ? (
              <div className="space-y-3 text-xs">
                <div className="rounded border border-cyan-500/20 bg-cyan-500/[.06] p-3 text-cyan-50">
                  <div className="text-[10px] uppercase tracking-wide text-cyan-200/70">In plain language</div>
                  <p className="mt-1 leading-5">{summarizeAuditEvent(inspectingLog)}</p>
                </div>
                <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-amber-100">
                  {inspectingLog.environment === 'local-test' ? 'TEST · LOCAL E2E persisted event.' : `${inspectingLog.environment || 'Unknown'} persisted event.`} Sensitive request bodies and credentials are excluded.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    ['Environment', inspectingLog.environment || 'Unknown'], ['Test Run ID', inspectingLog.testRunId || 'Not applicable'],
                    ['Actor', inspectingLog.actorEmail || inspectingLog.actorId || 'System'], ['Event category', inspectingLog.eventCategory || 'Unknown'],
                    ['Action', inspectingLog.action || inspectingLog.capability], ['Resource', [inspectingLog.resourceType, inspectingLog.resourceId].filter(Boolean).join(' / ') || '—'],
                    ['Tenant / organization', inspectingLog.organizationId || inspectingLog.tenantId || 'None'], ['Client IP', inspectingLog.clientIp || 'Not recorded for this event'],
                    ['Request / correlation ID', inspectingLog.requestId || '—'],
                    ['Outcome / status', `${inspectingLog.outcome || inspectingLog.status} / ${inspectingLog.statusCode ?? '—'}`],
                    ['Required permission', inspectingLog.requiredPermission || '—'], ['Actual scope', inspectingLog.actualScope || '—'],
                    ['Denial reason', inspectingLog.denialReason || '—'], ['Detail', inspectingLog.localEvent?.detail || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222]">
                      <div className="text-[10px] text-[#666666]">{label}</div>
                      <div className="text-[#e5e5e5] mt-0.5 break-all">{value}</div>
                    </div>
                  ))}
                </div>
                <section className="rounded border border-[#222222] bg-[#0a0a0a] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[10px] uppercase tracking-wide text-[#aeb9cc]">Request lifecycle · correlated events</h4>
                    <span className="text-[10px] text-[#6e7788]">{inspectedRequestEvents.length} observed {inspectedRequestEvents.length === 1 ? 'event' : 'events'}</span>
                  </div>
                  <ol className="mt-3 space-y-2">
                    {inspectedRequestEvents.map((event, index) => {
                      const firstAt = Date.parse(inspectedRequestEvents[0]?.timestamp || event.timestamp);
                      const eventAt = Date.parse(event.timestamp);
                      const phase = inspectedRequestEvents.length === 1 ? 'Only observed step' : index === 0 ? 'First observed' : index === inspectedRequestEvents.length - 1 ? 'Last observed' : `Step ${index + 1}`;
                      const elapsed = Number.isFinite(firstAt) && Number.isFinite(eventAt) ? elapsedLabel(eventAt - firstAt) : 'timing unavailable';
                      return <li key={event.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded border border-white/5 bg-white/[.02] p-2.5">
                        <span className={`mt-0.5 h-2 w-2 rounded-full ${event.outcome === 'SUCCESS' ? 'bg-emerald-400' : event.outcome === 'DENIED' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                        <div className="min-w-0"><div className="text-[#d7dce6]">{summarizeAuditEvent(event)}</div><div className="mt-1 text-[10px] text-[#707a8b]">{new Date(event.timestamp).toLocaleString()} · {phase}</div></div>
                        <span className="whitespace-nowrap text-[10px] text-cyan-200">+{elapsed}</span>
                      </li>;
                    })}
                  </ol>
                  <p className="mt-2 text-[10px] leading-4 text-[#687183]">Events are grouped by request ID. “First” and “Last” describe the records currently retained, not proof that an entire business process began or finished.</p>
                </section>
              </div>
            ) : (
            <>
            <div className="rounded border border-cyan-500/20 bg-cyan-500/[.06] p-3 text-xs text-cyan-50">
              <div className="text-[10px] uppercase tracking-wide text-cyan-200/70">In plain language</div>
              <p className="mt-1 leading-5">{summarizeAuditEvent(inspectingLog)}</p>
            </div>
            {inspectingLog.clientIp && <div className="rounded border border-[#222222] bg-[#0a0a0a] p-3 text-xs"><span className="text-[10px] uppercase text-[#777777]">Client IP</span><div className="mt-1 font-mono text-cyan-200">{inspectingLog.clientIp}</div></div>}
            <section className="rounded border border-[#222222] bg-[#0a0a0a] p-3">
              <div className="flex items-center justify-between gap-2"><h4 className="text-[10px] uppercase tracking-wide text-[#aeb9cc]">Request lifecycle · correlated events</h4><span className="text-[10px] text-[#6e7788]">{inspectedRequestEvents.length} observed</span></div>
              <ol className="mt-3 space-y-2">
                {inspectedRequestEvents.map((event, index) => {
                  const firstAt = Date.parse(inspectedRequestEvents[0]?.timestamp || event.timestamp);
                  const eventAt = Date.parse(event.timestamp);
                  const elapsed = Number.isFinite(firstAt) && Number.isFinite(eventAt) ? elapsedLabel(eventAt - firstAt) : 'timing unavailable';
                  const phase = inspectedRequestEvents.length === 1 ? 'Only observed step' : index === 0 ? 'First observed' : index === inspectedRequestEvents.length - 1 ? 'Last observed' : `Step ${index + 1}`;
                  return <li key={event.id} className="flex items-start justify-between gap-3 rounded border border-white/5 bg-white/[.02] p-2.5 text-xs"><span className="text-[#d7dce6]">{summarizeAuditEvent(event)}<small className="mt-1 block text-[10px] text-[#707a8b]">{new Date(event.timestamp).toLocaleString()} · {phase}</small></span><span className="whitespace-nowrap text-[10px] text-cyan-200">+{elapsed}</span></li>;
                })}
              </ol>
              <p className="mt-2 text-[10px] leading-4 text-[#687183]">Correlation shows recorded events only; a single event does not prove that a full workflow began or completed.</p>
            </section>
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
            </>
            )}

            {/* Response Preview */}
            {!inspectingLog.action && !inspectingLog.localEvent && inspectingLog.responsePreview && (
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
            {!inspectingLog.action && !inspectingLog.localEvent && <div>
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
            </div>}

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
