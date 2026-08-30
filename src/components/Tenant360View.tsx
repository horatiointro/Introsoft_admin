import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  Server,
  Activity,
  UserCheck,
  KeyRound,
  FileCheck,
  Database,
  BarChart3,
  Sliders,
  Layers,
  PieChart as PieChartIcon,
  TrendingUp,
  Cpu,
  Zap,
  CheckCircle,
  Eye,
  RefreshCw,
  Globe,
  Gauge,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Maximize2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { Customer, EntitlementQuota } from '../types';
import { initialEntitlements } from '../data/initialState';
import { TileDetailModal, TileDetailData } from './TileDetailModal';
import { getTileDetailData } from '../data/tileDetailData';

interface Tenant360ViewProps {
  customers: Customer[];
  selectedTenantId?: string;
  onSelectTenantId?: (id: string) => void;
  onNavigateToTenants?: () => void;
}

export const Tenant360View: React.FC<Tenant360ViewProps> = ({
  customers = [],
  selectedTenantId,
  onNavigateToTenants
}) => {
  // Mode: 'overall' (All Tenants Summary & Comparative Analytics) vs 'tenant_deepdive' (Single Tenant)
  const [viewMode, setViewMode] = useState<'overall' | 'tenant_deepdive'>('overall');
  const [activeTenantId, setActiveTenantId] = useState<string>(selectedTenantId || customers[0]?.id || 'cust-acme-fintech');
  const [configSubTab, setConfigSubTab] = useState<'capabilities' | 'commercial' | 'service' | 'security' | 'compliance' | 'entitlements' | 'scorecard'>('capabilities');
  const [timeHorizon, setTimeHorizon] = useState<'24h' | '7d' | '30d' | 'ytd'>('30d');
  const [selectedTileDetail, setSelectedTileDetail] = useState<TileDetailData | null>(null);

  const handleTileClick = (title: string, value: string | number, category?: any) => {
    setSelectedTileDetail(getTileDetailData(title, value, category || 'Platform Health'));
  };

  // Active tenant object safely resolved
  const tenant = customers.find(c => c.id === activeTenantId) || customers[0] || {
    id: 'cust-acme-fintech',
    name: 'Acme Financial Technologies',
    code: 'ACME',
    tier: 'enterprise',
    status: 'active',
    monthlySpendUsd: 3840.50,
    monthlyTokenUsage: 50000000,
    healthScore: 98
  };

  const entitlements: EntitlementQuota[] = initialEntitlements;

  // Custom weight adjusters for Health Scorecard
  const [domainWeights, setDomainWeights] = useState({
    availability: 20,
    performance: 15,
    security: 20,
    compliance: 15,
    finops: 10,
    support: 10,
    aiQuality: 10
  });

  // Calculate Weighted Health Score for active tenant
  const domainScores = [
    { domain: 'Availability', weight: domainWeights.availability, score: 99, status: 'optimal', details: '99.98% uptime achieved against 99.95% SLA target' },
    { domain: 'Performance', weight: domainWeights.performance, score: 96, status: 'optimal', details: 'P95 latency 245ms, well under <800ms limit' },
    { domain: 'Security', weight: domainWeights.security, score: 98, status: 'optimal', details: 'Zero prompt injection breaches; TLS 1.3 & AES-256 enforced' },
    { domain: 'Compliance', weight: domainWeights.compliance, score: 100, status: 'optimal', details: 'POPIA Section 72 & GDPR Article 45 cross-border consent active' },
    { domain: 'FinOps', weight: domainWeights.finops, score: 88, status: 'good', details: '25.6% budget remaining for current billing cycle' },
    { domain: 'Support', weight: domainWeights.support, score: 92, status: 'optimal', details: 'Average P1 response time 8 mins (<15m target)' },
    { domain: 'AI Quality', weight: domainWeights.aiQuality, score: 94, status: 'optimal', details: 'Hallucination rate 0.8% with Groq/Ollama multi-cloud fallback' }
  ];

  const tenantOverallScore = Math.round(
    domainScores.reduce((acc, curr) => acc + (curr.score * curr.weight) / 100, 0)
  );

  // Aggregated Overall Data across all tenants for the OVERALL VIEW
  const overallTenantsCount = customers.length || 5;
  const overallTotalSpendUsd = customers.reduce((sum, c) => sum + (c.monthlySpendUsd || 0), 0) || 28450;
  const overallTotalTokensM = (customers.reduce((sum, c) => sum + (c.monthlyTokenUsage || 0), 0) || 124800000) / 1000000;
  const overallAvgHealthScore = Math.round(
    customers.reduce((sum, c) => sum + (c.healthScore || 95), 0) / (customers.length || 1)
  );

  // Multi-Tenant Comparison Chart Data
  const tenantComparisonData = customers.map(c => ({
    name: c.name.length > 18 ? c.name.substring(0, 16) + '...' : c.name,
    code: c.code || c.id.substring(5, 10).toUpperCase(),
    spendUsd: Math.round(c.monthlySpendUsd || 3500),
    spendZar: Math.round((c.monthlySpendUsd || 3500) * 18.2),
    tokensM: Number(((c.monthlyTokenUsage || 25000000) / 1000000).toFixed(1)),
    health: c.healthScore || 95,
    p95Latency: c.kpiProfile?.p95LatencyMs || 280,
    availability: c.kpiProfile?.availabilityPercent || 99.98
  }));

  // Global Capability Radar Comparison (Overall)
  const globalCapabilityRadarData = [
    { capability: 'Availability SLA', target: 100, actual: 99.98, benchmark: 99.5 },
    { capability: 'Latency P95', target: 100, actual: 96.4, benchmark: 90.0 },
    { capability: 'POPIA Compliance', target: 100, actual: 100.0, benchmark: 95.0 },
    { capability: 'Security Guardrails', target: 100, actual: 98.2, benchmark: 92.0 },
    { capability: 'FinOps & Budgeting', target: 100, actual: 91.5, benchmark: 85.0 },
    { capability: 'Model Accuracy', target: 100, actual: 95.8, benchmark: 88.0 }
  ];

  // Token Distribution by Functional Capability (Donut Chart)
  const capabilityTokenDistribution = [
    { name: 'Clinical & Medical AI', value: 38.5, color: '#3b82f6' },
    { name: 'Fraud & Risk Analytics', value: 26.2, color: '#10b981' },
    { name: 'Customer Self-Service Chat', value: 18.4, color: '#8b5cf6' },
    { name: 'Document & OCR Processing', value: 11.1, color: '#f59e0b' },
    { name: 'Code & STEM Reasoner', value: 5.8, color: '#ec4899' }
  ];

  // 24-Hour Multi-Tenant Request Velocity & Latency
  const multiTenantHourlyVelocity = [
    { hour: '00:00', requests: 4200, latency: 180, errors: 2 },
    { hour: '04:00', requests: 2800, latency: 165, errors: 1 },
    { hour: '08:00', requests: 12400, latency: 240, errors: 5 },
    { hour: '12:00', requests: 18900, latency: 310, errors: 8 },
    { hour: '16:00', requests: 16200, latency: 275, errors: 6 },
    { hour: '20:00', requests: 8900, latency: 210, errors: 3 }
  ];

  // Tenant-Specific Functional Deployed Capabilities
  const tenantCapabilityFunctions: Record<string, any[]> = {
    'cust-acme-fintech': [
      { name: 'Financial Sentiment & Reasoner', model: 'GPT-4o Omnimodal', requests: '42,100 / day', tokens: '14.2M', latency: '210ms', uptime: '99.98%', status: 'Optimal', cost: '$1,420' },
      { name: 'Fraud Scoring & Anomalies', model: 'Groq Llama 3.3 70B', requests: '118,500 / day', tokens: '22.5M', latency: '85ms', uptime: '99.99%', status: 'Optimal', cost: '$380' },
      { name: 'Automated KYC Verification Agent', model: 'Gemini 2.5 Flash', requests: '28,400 / day', tokens: '8.1M', latency: '190ms', uptime: '99.95%', status: 'Optimal', cost: '$210' },
      { name: 'Statutory Compliance Auditor', model: 'Ollama Local Llama 3', requests: '15,200 / day', tokens: '5.2M', latency: '310ms', uptime: '100.0%', status: 'Optimal', cost: '$0 (Private)' }
    ],
    'cust-discovery': [
      { name: 'Clinical Decision Support System', model: 'GPT-4o Omnimodal', requests: '65,200 / day', tokens: '28.4M', latency: '195ms', uptime: '99.99%', status: 'Optimal', cost: '$2,840' },
      { name: 'Claims Pre-Authorization Engine', model: 'Groq Llama 3.3 70B', requests: '142,000 / day', tokens: '38.1M', latency: '92ms', uptime: '99.98%', status: 'Optimal', cost: '$610' },
      { name: 'Vitality Member Telehealth Bot', model: 'Gemini 2.5 Flash', requests: '48,100 / day', tokens: '12.3M', latency: '140ms', uptime: '99.95%', status: 'Optimal', cost: '$310' }
    ]
  };

  const activeTenantCapabilities = tenantCapabilityFunctions[tenant.id] || tenantCapabilityFunctions['cust-acme-fintech'];

  // COLORS
  const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Tile Detail Inspector Modal */}
      <TileDetailModal
        data={selectedTileDetail}
        onClose={() => setSelectedTileDetail(null)}
      />

      {/* Main Header & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
              Tenant 360 Diagnostic
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Multi-Tenant Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            {viewMode === 'overall' ? 'Overall Multi-Tenant Platform Summary' : `${tenant.name} (${tenant.code || 'TENANT'})`}
          </h1>
          <p className="text-xs text-[#8890a6]">
            {viewMode === 'overall'
              ? 'Aggregate 360-degree diagnostic matrix across all onboarded enterprise tenants, capability functions, financial spend, and statutory compliance.'
              : 'Detailed per-tenant capability breakdown, statutory POPIA/GDPR profiles, SLA targets, security guardrails, and weighted health scorecard.'}
          </p>
        </div>

        {/* Action Controls & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Selector Tabs */}
          <div className="bg-[#181c28] border border-[#283046] p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('overall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-1.5 ${
                viewMode === 'overall'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white hover:bg-[#202638]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Overall Diagnostic
            </button>
            <button
              onClick={() => setViewMode('tenant_deepdive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-1.5 ${
                viewMode === 'tenant_deepdive'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white hover:bg-[#202638]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Tenant Deep-Dive
            </button>
          </div>

          {/* Tenant Dropdown Selector (Active when in tenant_deepdive or to quick pick) */}
          <div className="flex items-center gap-2">
            <select
              value={activeTenantId}
              onChange={(e) => {
                setActiveTenantId(e.target.value);
                setViewMode('tenant_deepdive');
              }}
              className="bg-[#181c28] border border-[#283046] text-white text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 hover:border-[#384260] transition-colors"
            >
              <option value="" disabled>-- Choose Tenant --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tier ? c.tier.toUpperCase() : 'ENTERPRISE'})
                </option>
              ))}
            </select>

            {onNavigateToTenants && (
              <button
                id="tenant360-onboard-btn"
                onClick={onNavigateToTenants}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5 shrink-0"
              >
                + Onboard New Tenant
              </button>
            )}
          </div>

          {/* Time Horizon Selector */}
          <div className="flex items-center gap-1 bg-[#181c28] border border-[#283046] p-1 rounded-xl text-[11px] font-mono">
            {(['24h', '7d', '30d', 'ytd'] as const).map(h => (
              <button
                key={h}
                onClick={() => setTimeHorizon(h)}
                className={`px-2 py-1 rounded uppercase ${
                  timeHorizon === h ? 'bg-blue-500/30 text-blue-300 font-bold' : 'text-[#8890a6] hover:text-white'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FIRST VIEW: OVERALL MULTI-TENANT EXECUTIVE DIAGNOSTIC DASHBOARD      */}
      {/* ========================================================================= */}
      {viewMode === 'overall' && (
        <div className="space-y-6">
          {/* Top Multi-Tenant High-Level KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Active Tenants */}
            <div
              onClick={() => handleTileClick('Enterprise Tenants', `${overallTenantsCount} Active`, 'Platform Health')}
              className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-4 rounded-xl space-y-2 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between text-[#8890a6]">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Enterprise Tenants</span>
                <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-blue-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold font-mono text-white">{overallTenantsCount}</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">100% Active</span>
              </div>
              <div className="text-[11px] text-[#77809a] font-mono border-t border-[#1d2232] pt-1.5 flex justify-between">
                <span>Tier 0 Critical:</span>
                <span className="text-blue-400 font-bold">{overallTenantsCount} Organizations</span>
              </div>
            </div>

            {/* KPI 2: Aggregate Health Score */}
            <div
              onClick={() => handleTileClick('Platform Health Score', `${overallAvgHealthScore}/100`, 'Platform Health')}
              className="bg-[#12141c] border border-[#222636] hover:border-emerald-500/60 p-4 rounded-xl space-y-2 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between text-[#8890a6]">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Platform Health Score</span>
                <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold font-mono text-emerald-400">{overallAvgHealthScore}/100</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OPTIMAL
                </span>
              </div>
              <div className="text-[11px] text-[#77809a] font-mono border-t border-[#1d2232] pt-1.5 flex justify-between">
                <span>Avg SLA Target:</span>
                <span className="text-emerald-400 font-bold">99.98% Achieved</span>
              </div>
            </div>

            {/* KPI 3: Token Consumption */}
            <div
              onClick={() => handleTileClick('Total Token Volume', `${overallTotalTokensM.toFixed(1)}M`, 'AI Operations & Latency')}
              className="bg-[#12141c] border border-[#222636] hover:border-purple-500/60 p-4 rounded-xl space-y-2 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between text-[#8890a6]">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Total Token Volume</span>
                <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-purple-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold font-mono text-purple-300">{overallTotalTokensM.toFixed(1)}M</span>
                <span className="text-xs font-mono text-purple-400 font-bold">+18.4%</span>
              </div>
              <div className="text-[11px] text-[#77809a] font-mono border-t border-[#1d2232] pt-1.5 flex justify-between">
                <span>Avg Throughput:</span>
                <span className="text-purple-400 font-bold">1,820 T/sec</span>
              </div>
            </div>

            {/* KPI 4: Financial Spend */}
            <div
              onClick={() => handleTileClick('Month-to-Date Spend', `$${overallTotalSpendUsd.toLocaleString()}`, 'FinOps & Cost')}
              className="bg-[#12141c] border border-[#222636] hover:border-amber-500/60 p-4 rounded-xl space-y-2 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between text-[#8890a6]">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Monthly Spend (USD/ZAR)</span>
                <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-amber-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-amber-400">${overallTotalSpendUsd.toLocaleString()}</span>
                <span className="text-[11px] font-mono text-[#8890a6]">R{(overallTotalSpendUsd * 18.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="text-[11px] text-[#77809a] font-mono border-t border-[#1d2232] pt-1.5 flex justify-between">
                <span>Budget Ceiling:</span>
                <span className="text-amber-400 font-bold">34.2% Remaining</span>
              </div>
            </div>

            {/* KPI 5: POPIA & GDPR Statutory Parity */}
            <div
              onClick={() => handleTileClick('POPIA Score', '100%', 'POPIA & Compliance')}
              className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-4 rounded-xl space-y-2 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between text-[#8890a6]">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Statutory Compliance</span>
                <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-blue-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold font-mono text-blue-400">100%</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  SEC 72 & ART 45
                </span>
              </div>
              <div className="text-[11px] text-[#77809a] font-mono border-t border-[#1d2232] pt-1.5 flex justify-between">
                <span>PII Redaction:</span>
                <span className="text-blue-400 font-bold">0 Leaks / Zero Retention</span>
              </div>
            </div>
          </div>

          {/* GRAPHICAL DISPLAYS SECTION 1: Tenant Financial & Token Consumption Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart: Spend & Token Volume by Tenant */}
            <div
              onClick={() => handleTileClick('Multi-Tenant Financial Spend & Token Volume Breakdown', `$${overallTotalSpendUsd.toLocaleString()}`, 'FinOps & Cost')}
              className="lg:col-span-2 bg-[#12141c] border border-[#222636] hover:border-blue-500/50 p-5 rounded-2xl space-y-4 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Multi-Tenant Financial Spend & Token Volume Breakdown
                  </h3>
                  <p className="text-xs text-[#8890a6]">Click any bar or chart area to inspect root cause spend and token telemetry.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#181c28] border border-[#283046] text-xs font-mono text-blue-400 font-bold flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-blue-400" /> Inspect
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tenantComparisonData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        const payload = state.activePayload[0].payload;
                        handleTileClick(
                          `Financial Spend & Token Breakdown (${payload.name})`,
                          `$${payload.spendUsd.toLocaleString()} / ${payload.tokensM}M Tokens`,
                          'FinOps & Cost'
                        );
                      }
                    }}
                  >
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#8890a6', fontSize: 11 }} />
                    <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fill: '#3b82f6', fontSize: 11 }} unit="$" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fill: '#10b981', fontSize: 11 }} unit="M" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#181c28', borderColor: '#283046', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar
                      yAxisId="left"
                      dataKey="spendUsd"
                      name="Monthly Spend ($USD)"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      cursor="pointer"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="tokensM"
                      name="Tokens Consumed (Millions)"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      cursor="pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart: Functional AI Capability Token Allocation */}
            <div
              onClick={() => handleTileClick('Token Volume by Capability Function', '100% Routed Tokens', 'AI Operations & Latency')}
              className="bg-[#12141c] border border-[#222636] hover:border-purple-500/50 p-5 rounded-2xl space-y-4 flex flex-col justify-between cursor-pointer transition-all group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 group-hover:text-purple-400 transition-colors">
                    <PieChartIcon className="w-5 h-5 text-purple-400" />
                    Token Volume by Capability Function
                  </h3>
                  <Maximize2 className="w-4 h-4 text-[#555e78] group-hover:text-purple-400" />
                </div>
                <p className="text-xs text-[#8890a6]">Click pie slices or legend items to inspect routing diagnostics per capability.</p>
              </div>

              <div className="h-56 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={capabilityTokenDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      cursor="pointer"
                      onClick={(entry: any) => {
                        if (entry && entry.name) {
                          handleTileClick(
                            `Capability Function: ${entry.name}`,
                            `${entry.value}% of Total Tokens`,
                            'AI Operations & Latency'
                          );
                        }
                      }}
                    >
                      {capabilityTokenDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#181c28', borderColor: '#283046', borderRadius: '12px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 gap-1 text-xs font-mono pt-2 border-t border-[#1d2232]">
                {capabilityTokenDistribution.map((cap, i) => (
                  <div
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTileClick(`Capability Function: ${cap.name}`, `${cap.value}% Token Share`, 'AI Operations & Latency');
                    }}
                    className="flex items-center justify-between hover:bg-[#181d2a] p-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cap.color }}></span>
                      <span className="text-[#8890a6] truncate max-w-[150px]">{cap.name}</span>
                    </div>
                    <span className="text-white font-bold">{cap.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GRAPHICAL DISPLAYS SECTION 2: Multi-Dimensional Radar & Request Velocity Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart: Multi-Capability Compliance & Health Benchmark */}
            <div
              onClick={() => handleTileClick('Multi-Capability Platform Performance Radar', '99.98% Platform Uptime', 'Availability & Health')}
              className="bg-[#12141c] border border-[#222636] hover:border-emerald-500/50 p-5 rounded-2xl space-y-4 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    Multi-Capability Platform Performance Radar
                  </h3>
                  <p className="text-xs text-[#8890a6]">Click radar axes to inspect benchmark target vs actual SLA delta.</p>
                </div>
                <Maximize2 className="w-4 h-4 text-[#555e78] group-hover:text-emerald-400" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    data={globalCapabilityRadarData}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        const payload = state.activePayload[0].payload;
                        handleTileClick(
                          `Performance Radar: ${payload.capability}`,
                          `Actual ${payload.actual}% vs Target ${payload.target}%`,
                          'Availability & Health'
                        );
                      }
                    }}
                  >
                    <PolarGrid stroke="#242c40" />
                    <PolarAngleAxis dataKey="capability" tick={{ fill: '#8890a6', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#242c40" />
                    <Radar name="Platform Actual" dataKey="actual" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    <Radar name="Target SLA" dataKey="target" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#181c28', borderColor: '#283046', borderRadius: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Area Chart: 24-Hour Velocity & Response Latency Trend */}
            <div
              onClick={() => handleTileClick('Multi-Tenant Request Velocity & Latency Curve', '18,900 Peak Req/Hr', 'AI Operations & Latency')}
              className="bg-[#12141c] border border-[#222636] hover:border-amber-500/50 p-5 rounded-2xl space-y-4 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 group-hover:text-amber-400 transition-colors">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    Multi-Tenant Request Velocity & Latency Curve
                  </h3>
                  <p className="text-xs text-[#8890a6]">Click any point on velocity curve to drill into hourly latency and load drivers.</p>
                </div>
                <Maximize2 className="w-4 h-4 text-[#555e78] group-hover:text-amber-400" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={multiTenantHourlyVelocity}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        const payload = state.activePayload[0].payload;
                        handleTileClick(
                          `Traffic Velocity & Latency @ ${payload.hour}`,
                          `${payload.requests.toLocaleString()} req/hr | Latency ${payload.latency}ms`,
                          'AI Operations & Latency'
                        );
                      }
                    }}
                  >
                    <XAxis dataKey="hour" stroke="#64748b" tick={{ fill: '#8890a6', fontSize: 11 }} />
                    <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fill: '#f59e0b', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fill: '#8b5cf6', fontSize: 11 }} unit="ms" />
                    <Tooltip contentStyle={{ backgroundColor: '#181c28', borderColor: '#283046', borderRadius: '12px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="requests" name="Hourly Requests" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} cursor="pointer" />
                    <Area yAxisId="right" type="monotone" dataKey="latency" name="Response Latency (ms)" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} cursor="pointer" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ALL-TENANTS INTERACTIVE CAPABILITY CARDS GRID */}
          <div className="bg-[#12141c] border border-[#222636] p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Onboarded Enterprise Tenants Diagnostic Register
                </h3>
                <p className="text-xs text-[#8890a6]">Select any tenant card to enter dedicated 360-degree deep-dive diagnostics.</p>
              </div>
              <span className="text-xs font-mono text-[#77809a]">
                Showing {customers.length} Onboarded Organizations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((c) => {
                const spendUsd = c.monthlySpendUsd || 3840;
                const budgetUsd = c.monthlyBudgetUsd || 15000;
                const spendPercent = Math.min(Math.round((spendUsd / budgetUsd) * 100), 100);

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveTenantId(c.id);
                      setViewMode('tenant_deepdive');
                    }}
                    className="bg-[#161a26] border border-[#242c40] hover:border-blue-500/50 p-4 rounded-xl space-y-3 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg group"
                  >
                    {/* Card Top Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-bold">
                          {c.code || c.id.substring(5, 10).toUpperCase()}
                        </span>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors mt-1">
                          {c.name}
                        </h4>
                        <span className="text-[11px] text-[#77809a] font-mono">{c.industry || 'Financial Services'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold font-mono text-emerald-400">{c.healthScore || 98}</span>
                        <span className="text-[9px] font-mono text-[#77809a] block">HEALTH SCORE</span>
                      </div>
                    </div>

                    {/* Spend vs Ceiling Progress */}
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8890a6]">Monthly Spend:</span>
                        <span className="text-emerald-400 font-bold">${spendUsd.toLocaleString()} / ${budgetUsd.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#22283a] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${spendPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${spendPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Operational Badges */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-[#20283c]">
                      <div>
                        <span className="text-[#77809a] block text-[9px]">SLA AVAILABILITY</span>
                        <span className="text-white font-bold">{c.kpiProfile?.availabilityPercent || 99.98}%</span>
                      </div>
                      <div>
                        <span className="text-[#77809a] block text-[9px]">P95 LATENCY</span>
                        <span className="text-blue-400 font-bold">{c.kpiProfile?.p95LatencyMs || 245}ms</span>
                      </div>
                    </div>

                    {/* Quick Button */}
                    <div className="pt-2 flex justify-end">
                      <span className="text-xs font-mono text-blue-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Inspect 360 Diagnostic <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SECOND VIEW: TENANT-SPECIFIC 360-DEGREE DEEP-DIVE DIAGNOSTIC VIEW     */}
      {/* ========================================================================= */}
      {viewMode === 'tenant_deepdive' && (
        <div className="space-y-6">
          {/* Top Tenant Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status & Health */}
            <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-[#77809a] uppercase">Health Score & Status</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold font-mono text-emerald-400">{tenantOverallScore}/100</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  HEALTHY
                </span>
              </div>
              <div className="text-xs text-[#8890a6] font-mono flex items-center justify-between pt-1 border-t border-[#1d2232]">
                <span>Account Status:</span>
                <span className="text-white font-semibold uppercase">{tenant.status}</span>
              </div>
            </div>

            {/* Statutory Officers & Governance */}
            <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-1.5 text-xs">
              <span className="text-[10px] font-mono text-[#77809a] uppercase">Statutory Governance</span>
              <div className="flex justify-between font-mono">
                <span className="text-[#77809a]">Information Officer:</span>
                <span className="text-white truncate font-semibold">{tenant.statutoryOfficers?.informationOfficer?.name || 'Adv. Willem Van Zyl'}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#77809a]">Data Protection DPO:</span>
                <span className="text-white truncate font-semibold">{tenant.statutoryOfficers?.dataProtectionOfficer?.name || 'Dr. Sarah Schmidt'}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#77809a]">POPIA Registration:</span>
                <span className="text-emerald-400 truncate font-bold">ZA-IR-IO-2023-4921</span>
              </div>
            </div>

            {/* Financial & Token Consumption */}
            <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-1.5 text-xs">
              <span className="text-[10px] font-mono text-[#77809a] uppercase">Spend & Token Quota</span>
              <div className="flex justify-between font-mono">
                <span className="text-[#77809a]">Monthly Spend:</span>
                <span className="text-emerald-400 font-bold">${tenant.monthlySpendUsd.toLocaleString()} / R{(tenant.monthlySpendUsd * 18.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#77809a]">Monthly Tokens:</span>
                <span className="text-blue-400 font-bold">{(tenant.monthlyTokenUsage / 1_000_000).toFixed(1)}M Tokens</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#77809a]">Budget Ceiling:</span>
                <span className="text-amber-400 font-bold">${tenant.contractTerms?.spendCeilingUsd || 25000}</span>
              </div>
            </div>

            {/* SLA & Incident Indicators */}
            <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-1.5 text-xs">
              <span className="text-[10px] font-mono text-[#77809a] uppercase">SLA & Incidents</span>
              <div className="flex justify-between font-mono">
                <span className="text-[#77809a]">Availability Target:</span>
                <span className="text-emerald-400 font-bold">{tenant.slaProfile?.availabilityTargetPercent || 99.95}% (Achieved 99.98%)</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#77809a]">Open Incidents:</span>
                <span className="text-white font-bold">0 Active P1/P2</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#77809a]">Service Credits:</span>
                <span className="text-amber-400 font-bold">$0.00 (Zero Breaches)</span>
              </div>
            </div>
          </div>

          {/* Configuration & Diagnostic Sub-Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-[#222636] pb-3 text-xs font-mono overflow-x-auto">
            <button
              onClick={() => setConfigSubTab('capabilities')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                configSubTab === 'capabilities'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white bg-[#141824]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Deployed AI Capability Telemetry
            </button>
            <button
              onClick={() => setConfigSubTab('commercial')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                configSubTab === 'commercial'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white bg-[#141824]'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Commercial & FinOps Terms
            </button>
            <button
              onClick={() => setConfigSubTab('service')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                configSubTab === 'service'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white bg-[#141824]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Service & SLA Targets
            </button>
            <button
              onClick={() => setConfigSubTab('security')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                configSubTab === 'security'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white bg-[#141824]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Security & Guardrails
            </button>
            <button
              onClick={() => setConfigSubTab('compliance')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                configSubTab === 'compliance'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white bg-[#141824]'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              Statutory POPIA / GDPR
            </button>
            <button
              onClick={() => setConfigSubTab('entitlements')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                configSubTab === 'entitlements'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white bg-[#141824]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Contracted vs Entitled Matrix
            </button>
            <button
              onClick={() => setConfigSubTab('scorecard')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                configSubTab === 'scorecard'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-[#8890a6] hover:text-white bg-[#141824]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Weighted Health Scorecard
            </button>
          </div>

          {/* Sub-Tab 1: Deployed AI Capability Telemetry */}
          {configSubTab === 'capabilities' && (
            <div className="space-y-6">
              <div className="bg-[#12141c] border border-[#222636] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-blue-400" />
                      Active Deployed Capability Functions ({tenant.name})
                    </h3>
                    <p className="text-xs text-[#8890a6]">
                      Operational performance, model assignment, latency, and token throughput per deployed capability.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#181c28] border border-[#283046] text-xs font-mono text-emerald-400 font-bold">
                    {activeTenantCapabilities.length} Active AI Functions
                  </span>
                </div>

                {/* Capability Function Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTenantCapabilities.map((cap, i) => (
                    <div
                      key={i}
                      onClick={() => handleTileClick(`Capability Function: ${cap.name}`, cap.requests, 'AI Operations & Latency')}
                      className="bg-[#161a26] border border-[#242c40] hover:border-blue-500/50 p-4 rounded-xl space-y-3 cursor-pointer transition-all hover:scale-[1.01] group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-bold">
                            CAPABILITY #{i + 1}
                          </span>
                          <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors mt-1">{cap.name}</h4>
                          <span className="text-xs font-mono text-[#8890a6]">Assigned Model: <strong className="text-blue-300">{cap.model}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {cap.status}
                          </span>
                          <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-blue-400" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-[#22283a]">
                        <div>
                          <span className="text-[#77809a] text-[10px] block">DAILY REQUESTS</span>
                          <span className="text-white font-bold">{cap.requests}</span>
                        </div>
                        <div>
                          <span className="text-[#77809a] text-[10px] block">MONTHLY TOKENS</span>
                          <span className="text-purple-400 font-bold">{cap.tokens}</span>
                        </div>
                        <div>
                          <span className="text-[#77809a] text-[10px] block">P95 RESPONSE LATENCY</span>
                          <span className="text-blue-400 font-bold">{cap.latency}</span>
                        </div>
                        <div>
                          <span className="text-[#77809a] text-[10px] block">SERVICE UPTIME</span>
                          <span className="text-emerald-400 font-bold">{cap.uptime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Commercial Terms */}
          {configSubTab === 'commercial' && (
            <div className="bg-[#12141c] border border-[#222636] rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Commercial & Contractual Terms ({tenant.name})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="bg-[#161a26] p-4 rounded-xl border border-[#242c40] space-y-2">
                  <span className="text-[#77809a] text-[10px] uppercase block font-bold">Contract Lifecycle</span>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Contract Start:</span><span className="text-white">{tenant.contractTerms?.contractStartDate || '2026-01-01'}</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Contract End:</span><span className="text-white">{tenant.contractTerms?.contractEndDate || '2027-12-31'}</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Renewal Date:</span><span className="text-amber-400 font-bold">{tenant.contractTerms?.renewalDate || '2027-11-30'}</span></div>
                </div>

                <div className="bg-[#161a26] p-4 rounded-xl border border-[#242c40] space-y-2">
                  <span className="text-[#77809a] text-[10px] uppercase block font-bold">Billing & Currency</span>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Service Tier:</span><span className="text-blue-400 font-bold uppercase">{tenant.tier}</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Billing Currency:</span><span className="text-white font-bold">{tenant.contractTerms?.currency || 'USD'} / ZAR</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Payment Terms:</span><span className="text-white uppercase">{tenant.contractTerms?.billingTerms || 'NET_30'}</span></div>
                </div>

                <div className="bg-[#161a26] p-4 rounded-xl border border-[#242c40] space-y-2">
                  <span className="text-[#77809a] text-[10px] uppercase block font-bold">Spend Ceilings & Overages</span>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Monthly Minimum:</span><span className="text-white">${tenant.contractTerms?.monthlyMinimumUsd || 5000}</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Spend Ceiling:</span><span className="text-emerald-400 font-bold">${tenant.contractTerms?.spendCeilingUsd || 25000}</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Limit Action:</span><span className="text-amber-400 font-bold uppercase">{tenant.contractTerms?.budgetActionOn100Percent || 'BLOCK'}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Service & SLA */}
          {configSubTab === 'service' && (
            <div className="bg-[#12141c] border border-[#222636] rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Service Level Agreement (SLA) & Resilience
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="bg-[#161a26] p-4 rounded-xl border border-[#242c40] space-y-2">
                  <span className="text-[#77809a] text-[10px] uppercase block font-bold">Availability & Latency Targets</span>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Availability Target:</span><span className="text-emerald-400 font-bold">{tenant.slaProfile?.availabilityTargetPercent || 99.95}%</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">P95 Latency Target:</span><span className="text-white">&lt;{tenant.slaProfile?.p95LatencyMsTarget || 800}ms</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">P99 Latency Target:</span><span className="text-white">&lt;{tenant.slaProfile?.p99LatencyMsTarget || 2000}ms</span></div>
                </div>

                <div className="bg-[#161a26] p-4 rounded-xl border border-[#242c40] space-y-2">
                  <span className="text-[#77809a] text-[10px] uppercase block font-bold">Incident Response SLAs</span>
                  <div className="flex justify-between"><span className="text-[#8890a6]">P1 Ack SLA:</span><span className="text-blue-400 font-bold">&lt;{tenant.slaProfile?.p1ResponseMinutes || 15} mins</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">P2 Ack SLA:</span><span className="text-white">&lt;{tenant.slaProfile?.p2ResponseMinutes || 30} mins</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Support Hours:</span><span className="text-emerald-400 font-bold">{tenant.slaProfile?.supportHours || '24/7/365'}</span></div>
                </div>

                <div className="bg-[#161a26] p-4 rounded-xl border border-[#242c40] space-y-2">
                  <span className="text-[#77809a] text-[10px] uppercase block font-bold">Resilience & DR Commitments</span>
                  <div className="flex justify-between"><span className="text-[#8890a6]">RTO (Recovery Time):</span><span className="text-white font-bold">{tenant.slaProfile?.rtoHours || 1} Hour</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">RPO (Recovery Point):</span><span className="text-white font-bold">{tenant.slaProfile?.rpoMinutes || 15} Minutes</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Penalty Credit:</span><span className="text-amber-400 font-bold">{tenant.slaProfile?.penaltyCreditRatePercent || 10}% Per Breach</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 4: Security */}
          {configSubTab === 'security' && (
            <div className="bg-[#12141c] border border-[#222636] rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                Security Rules & Data Guardrails
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#161a26] p-4 rounded-xl border border-[#242c40] space-y-2.5">
                  <span className="text-[#77809a] text-[10px] uppercase block font-bold">Access Controls & IP Whitelist</span>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Allowed CIDR IP Ranges:</span><span className="text-emerald-400 font-bold">196.25.1.0/24, 102.130.0.0/16</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">MFA Enforcement:</span><span className="text-emerald-400 font-bold">REQUIRED (SAML SSO)</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">SSO Identity Provider:</span><span className="text-blue-400">Azure AD / Okta SAML 2.0</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Encryption Standard:</span><span className="text-white">AES-256 (At Rest) / TLS 1.3 (In Transit)</span></div>
                </div>

                <div className="bg-[#161a26] p-4 rounded-xl border border-[#242c40] space-y-2.5">
                  <span className="text-[#77809a] text-[10px] uppercase block font-bold">Model Restrictions & Data Sensitivity</span>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Data Classification:</span><span className="text-amber-400 font-bold uppercase">{tenant.securityProfile?.dataClassification || 'special_personal_information'}</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Approved AI Providers:</span><span className="text-emerald-400">OpenAI, Groq LPU, Ollama Private GPU</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Prohibited Endpoints:</span><span className="text-rose-400 font-bold">Unencrypted Public Endpoints</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Max Data Sensitivity:</span><span className="text-purple-400 font-bold">Category 5 (Special Personal Records)</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 5: Compliance */}
          {configSubTab === 'compliance' && (
            <div className="bg-[#12141c] border border-[#222636] rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Statutory POPIA & GDPR Compliance Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#161a26] p-4 rounded-xl border border-[#242c40] space-y-2.5">
                  <span className="text-[#77809a] text-[10px] uppercase block font-bold">POPIA / GDPR Statutory Mandates</span>
                  <div className="flex justify-between"><span className="text-[#8890a6]">POPIA Adequacy:</span><span className="text-emerald-400 font-bold">Section 72 Certified</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">GDPR Adequacy:</span><span className="text-emerald-400 font-bold">Article 45 Parity</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Data Residency:</span><span className="text-white font-bold">{tenant.securityProfile?.dataResidencyRestrictions?.join(', ') || 'South Africa Only'}</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Cross-Border Transfer:</span><span className="text-amber-400">Prior Written Legal Consent Required</span></div>
                </div>

                <div className="bg-[#161a26] p-4 rounded-xl border border-[#242c40] space-y-2.5">
                  <span className="text-[#77809a] text-[10px] uppercase block font-bold">DSAR & Breach Protocol</span>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Retention Period:</span><span className="text-white">{tenant.securityProfile?.retentionPolicyDays || 90} Days (Zero Payload Log)</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">DSAR SLA:</span><span className="text-blue-400">&lt;14 Days Automated Export</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Breach Notification:</span><span className="text-rose-400 font-bold">Immediate (&lt;72 Hours Regulator Mandate)</span></div>
                  <div className="flex justify-between"><span className="text-[#8890a6]">Information Officer:</span><span className="text-white font-bold">{tenant.statutoryOfficers?.informationOfficer?.name || 'Adv. Willem Van Zyl'}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 6: Entitlements Matrix */}
          {configSubTab === 'entitlements' && (
            <div className="bg-[#12141c] border border-[#222636] rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                Contracted vs Entitled vs Consumed Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#181c28] border-b border-[#242c40] text-[#77809a] uppercase">
                    <tr>
                      <th className="py-3 px-4">Service Feature / Entitlement</th>
                      <th className="py-3 px-4">Contracted Limit</th>
                      <th className="py-3 px-4">Entitled Allocation</th>
                      <th className="py-3 px-4">Consumed to Date</th>
                      <th className="py-3 px-4">Remaining Capacity</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2436] text-[#b0b8d0]">
                    {entitlements.map((item, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleTileClick(`Entitlement: ${item.feature}`, `${item.consumed} / ${item.entitled}`, 'Availability & Health')}
                        className="hover:bg-[#1c2234] cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4 font-semibold text-white group-hover:text-blue-400">{item.feature}</td>
                        <td className="py-3 px-4 text-[#77809a]">{item.contracted}</td>
                        <td className="py-3 px-4 text-blue-400 font-bold">{item.entitled}</td>
                        <td className="py-3 px-4 text-emerald-400">{item.consumed}</td>
                        <td className="py-3 px-4 text-white">{item.remaining}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-Tab 7: Weighted Health Scorecard */}
          {configSubTab === 'scorecard' && (
            <div className="bg-[#12141c] border border-[#222636] rounded-2xl p-5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    Configurable Weighted Tenant Health Scorecard
                  </h3>
                  <p className="text-xs text-[#8890a6]">Weighted mathematical aggregation across seven key operational domains.</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold font-mono text-emerald-400">{tenantOverallScore}/100</span>
                  <span className="text-[10px] text-[#77809a] block font-mono">WEIGHTED SCORE</span>
                </div>
              </div>

              {/* Interactive Domain Weight Adjusters & Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {domainScores.map((ds, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleTileClick(`Health Domain: ${ds.domain}`, `${ds.score}/100 Score`, 'Availability & Health')}
                    className="bg-[#161a26] border border-[#242c40] hover:border-emerald-500/50 p-4 rounded-xl space-y-3 cursor-pointer transition-all hover:scale-[1.01] group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{ds.domain}</span>
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          Weight: {ds.weight}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-mono font-bold text-emerald-400">{ds.score}/100</span>
                        <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-emerald-400" />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-[#22283a] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ds.score}%` }} />
                    </div>

                    <p className="text-[11px] text-[#8890a6] font-mono">{ds.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
