import { InfoButton } from './InfoButton';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  ArrowDown,
  Shield,
  Server,
  Lock,
  Cpu,
  Database,
  Search,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Zap,
  Activity,
  SlidersHorizontal,
  Workflow,
  Eye,
  Hash,
  Download,
  Fingerprint,
  RefreshCw,
  X,
  Radio,
  FileText,
  KeyRound,
  Network
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
  Cell
} from 'recharts';
import { Customer, AIProvider, AIModel, Application, ApiKey, AIPolicy, AuditLog } from '../types';

export interface AltilStackWiringViewProps {
  customers?: Customer[];
  providers?: AIProvider[];
  models?: AIModel[];
  applications?: Application[];
  apiKeys?: ApiKey[];
  policies?: AIPolicy[];
  auditLogs?: AuditLog[];
  onNavigateToTab?: (tab: string) => void;
}

type TimeRange = 'now' | '1h' | '24h' | '7d' | '30d';

interface LayerDefinition {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  color: string;
  accentBg: string;
  borderAccent: string;
  icon: React.ComponentType<{ className?: string }>;
  domains: {
    name: string;
    description: string;
    currentMetric: string;
    historicalMetric: string;
    status: 'optimal' | 'active' | 'warning';
    targetTab?: string;
  }[];
  nowSummary: {
    status: string;
    throughput: string;
    latency: string;
    activeItems: string;
  };
  historicalSummary: {
    totalEvents: string;
    availability: string;
    avgLatency: string;
    incidentCount: number;
  };
}

export const AltilStackWiringView: React.FC<AltilStackWiringViewProps> = ({
  customers = [],
  providers = [],
  models = [],
  applications = [],
  apiKeys = [],
  policies = [],
  auditLogs = [],
  onNavigateToTab
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('now');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedDomainName, setSelectedDomainName] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'now' | 'historical' | 'wiring'>('now');

  // Simulation state for the animated request pipeline
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(0); // 0 = idle, 1..5 for layers
  const [simulationLogs, setSimulationLogs] = useState<{ step: number; layer: string; time: string; text: string; latency: number }[]>([]);

  // Simulation timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimulationStep((prev) => {
          const next = (prev % 5) + 1;
          const stepLogs = [
            { step: 1, layer: 'Control Plane', time: new Date().toLocaleTimeString(), text: 'Application API Key validated for "Acme Mobile Portal". Routing policy resolved: Gemini 1.5 Flash.', latency: 4 },
            { step: 2, layer: 'Trust Fabric', time: new Date().toLocaleTimeString(), text: 'User JWT authenticated. mTLS hardware attestation valid. Cross-tenant isolation verified (Tenant: ACME-ZA).', latency: 8 },
            { step: 3, layer: 'Policy Engine', time: new Date().toLocaleTimeString(), text: 'POPIA/GDPR inspection complete. 1 SA ID number redacted. Zero confidentiality leakage detected.', latency: 16 },
            { step: 4, layer: 'AI Gateway', time: new Date().toLocaleTimeString(), text: 'Dispatched to Google Gemini Europe/Johannesburg node. Model responded with 412 tokens.', latency: 138 },
            { step: 5, layer: 'Immutable Ledger', time: new Date().toLocaleTimeString(), text: 'WORM block #842,915 sealed with SHA-256 Merkle root. Tamper-proof transaction receipt emitted.', latency: 3 }
          ];
          setSimulationLogs((logs) => [stepLogs[next - 1], ...logs.slice(0, 7)]);
          return next;
        });
      }, 1600);
    } else {
      setSimulationStep(0);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // The 5 Layers exactly matching the requested specification
  const layers: LayerDefinition[] = useMemo(() => [
    {
      id: 'control_plane',
      number: 1,
      title: 'ALTIL ADMIN / CONTROL PLANE',
      subtitle: 'Central Governance, Key Orchestration & API Management',
      color: '#3b82f6',
      accentBg: 'bg-blue-500/10',
      borderAccent: 'border-blue-500/30 hover:border-blue-500/60',
      icon: SlidersHorizontal,
      domains: [
        { name: 'Providers', description: 'Provider lifecycle management, API endpoints & upstream health tracking', currentMetric: `${providers.length || 6} Online`, historicalMetric: '99.98% Uptime (30d)', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Models', description: 'Foundation model catalog, versioning, context limits & deprecation rules', currentMetric: `${models.length || 14} Cataloged`, historicalMetric: '42 Models Evaluated', status: 'optimal', targetTab: 'ai_governance_lab' },
        { name: 'Apps', description: 'Enterprise client applications, quotas, rate limits & service bindings', currentMetric: `${applications.length || 8} Active Apps`, historicalMetric: '2.4M Lifetime Reqs', status: 'optimal', targetTab: 'api_mgmt' },
        { name: 'Policies', description: 'Global declarative rules for content safety, security & routing bounds', currentMetric: `${policies.length || 18} Rules Active`, historicalMetric: '14,280 Enforcements', status: 'optimal', targetTab: 'policies' },
        { name: 'Compliance', description: 'POPIA & GDPR compliance orchestrator with data residency pinning', currentMetric: '100% Compliant', historicalMetric: '0 Audit Findings', status: 'optimal', targetTab: 'compliance' },
        { name: 'Usage', description: 'Real-time multi-tenant token consumption & FinOps billing attribution', currentMetric: '1.4M Tokens/hr', historicalMetric: '$14,250 MTD Spend', status: 'optimal', targetTab: 'finops' },
        { name: 'Routing', description: 'Dynamic semantic routing engine with latency and cost optimization', currentMetric: '12 Dynamic Rules', historicalMetric: '88% Optimal Path', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Keys', description: 'Cryptographic API keys, dual-token rotation & SHA-256 hashed storage', currentMetric: `${apiKeys.length || 12} Active Keys`, historicalMetric: '0 Compromised Keys', status: 'optimal', targetTab: 'api_mgmt' },
        { name: 'DSAR', description: 'Data Subject Access Request pipeline for automated personal data extraction', currentMetric: '4 In Progress', historicalMetric: '28 Fulfilled on SLA', status: 'optimal', targetTab: 'compliance' },
        { name: 'Telemetry', description: 'Unified OpenTelemetry stream for distributed tracing, latency & errors', currentMetric: '1,420 spans/sec', historicalMetric: '99.99% Ingestion', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Audit', description: 'Immutable log dispatcher streaming all administrative actions to ledger', currentMetric: `${auditLogs.length || 240} Recent Logs`, historicalMetric: '100% Sealed', status: 'optimal', targetTab: 'logs' },
        { name: 'Orchestration', description: 'Cross-module workflow automation, incident triggers & approval flows', currentMetric: '6 Active Workflows', historicalMetric: '1,840 Executions', status: 'optimal', targetTab: 'automation' }
      ],
      nowSummary: {
        status: 'OPERATIONAL',
        throughput: '142 req/sec',
        latency: '4.2ms avg',
        activeItems: `${applications.length || 8} Apps • ${providers.length || 6} Providers`
      },
      historicalSummary: {
        totalEvents: '1,842,910 events',
        availability: '99.995%',
        avgLatency: '4.1ms',
        incidentCount: 0
      }
    },
    {
      id: 'trust_fabric',
      number: 2,
      title: 'ALTIL TRUST FABRIC',
      subtitle: 'Zero-Trust Identity, Tenant Isolation & Cryptographic Handshakes',
      color: '#06b6d4',
      accentBg: 'bg-cyan-500/10',
      borderAccent: 'border-cyan-500/30 hover:border-cyan-500/60',
      icon: Lock,
      domains: [
        { name: 'Identity', description: 'Enterprise IAM integration, OIDC/SAML federated identity & subject claims', currentMetric: '2,840 Verified Users', historicalMetric: '14,800 IAM Logins', status: 'optimal', targetTab: 'iam_admin' },
        { name: 'Authentication', description: 'Mutual TLS (mTLS), biometrics, FIDO2 WebAuthn & hardware key validation', currentMetric: '100% mTLS Enforced', historicalMetric: '0 Auth Bypass', status: 'optimal', targetTab: 'trust_fabric' },
        { name: 'Authorisation', description: 'Fine-grained attribute-based access control (ABAC) and role-based policies', currentMetric: '24 ABAC Rules', historicalMetric: '99.99% Precision', status: 'optimal', targetTab: 'iam_admin' },
        { name: 'Consent', description: 'Granular consent receipts, purpose specification & revocable data permissions', currentMetric: '12,410 Receipts', historicalMetric: '99.2% Renewal Rate', status: 'optimal', targetTab: 'trust_fabric' },
        { name: 'Contract', description: 'Tenant enterprise agreements, monthly token quotas & SLA commitment profiles', currentMetric: `${customers.length || 5} Active Contracts`, historicalMetric: '100% SLA Adherence', status: 'optimal', targetTab: 'tenant_licensing' },
        { name: 'Trust Relationship', description: 'Parent-subsidiary corporate hierarchy trust & partner delegated access', currentMetric: '8 Verified Relations', historicalMetric: '0 Elevation Breaches', status: 'optimal', targetTab: 'org_hierarchy' },
        { name: 'Credential Lifecycle', description: 'Automated 90-day key rotation, certificate renewal & instant revocation', currentMetric: '0 Stale Credentials', historicalMetric: '142 Auto Rotations', status: 'optimal', targetTab: 'trust_fabric' },
        { name: 'Tenant Isolation', description: 'Cryptographic boundary separation ensuring zero cross-tenant data bleed', currentMetric: '100% Isolated', historicalMetric: '0 Leakage Incidents', status: 'optimal', targetTab: 'tenants' },
        { name: 'Device Identity', description: 'Hardware-backed mobile & workstation device fingerprints and binding', currentMetric: '1,842 Registered', historicalMetric: '99.8% Trusted Devs', status: 'optimal', targetTab: 'trust_fabric' },
        { name: 'AI Identity', description: 'Cryptographic attestation and autonomy boundaries for autonomous AI agents', currentMetric: '12 Bounded Agents', historicalMetric: '42,000 Safe Actions', status: 'optimal', targetTab: 'ai_governance_lab' }
      ],
      nowSummary: {
        status: 'ENFORCING',
        throughput: '2,450 checks/min',
        latency: '8.4ms avg',
        activeItems: '1,842 Bound Devices • 100% Isolation'
      },
      historicalSummary: {
        totalEvents: '3,410,200 handshakes',
        availability: '99.999%',
        avgLatency: '8.1ms',
        incidentCount: 0
      }
    },
    {
      id: 'policy_engine',
      number: 3,
      title: 'ALTIL POLICY ENGINE',
      subtitle: 'POPIA / GDPR Guardrails, Real-Time PII Redaction & DLP',
      color: '#8b5cf6',
      accentBg: 'bg-purple-500/10',
      borderAccent: 'border-purple-500/30 hover:border-purple-500/60',
      icon: Shield,
      domains: [
        { name: 'POPIA', description: 'South Africa Protection of Personal Information Act lawful processing gates', currentMetric: '100% POPIA Checked', historicalMetric: '142 Audits Passed', status: 'optimal', targetTab: 'compliance' },
        { name: 'GDPR', description: 'EU General Data Protection Regulation cross-border data transfer controls', currentMetric: 'Article 44 Compliant', historicalMetric: '0 Cross-border Leaks', status: 'optimal', targetTab: 'compliance' },
        { name: 'Confidentiality', description: 'Proprietary IP, trade secrets & enterprise code leakage interception', currentMetric: '0 Confidential Flags', historicalMetric: '14 Blocks (30d)', status: 'optimal', targetTab: 'policies' },
        { name: 'DLP', description: 'Real-time deep packet inspection for credit cards, passwords & secret keys', currentMetric: '22 scans/sec', historicalMetric: '840 DLP Triggers', status: 'optimal', targetTab: 'policies' },
        { name: 'Classification', description: 'Automated data tagging: Public, Internal, Confidential, Restricted', currentMetric: '100% Tagged', historicalMetric: '1.2M Docs Classified', status: 'optimal', targetTab: 'compliance' },
        { name: 'Redaction', description: 'Dynamic synthetic masking of South African ID numbers, emails & phones', currentMetric: '18 Redactions/min', historicalMetric: '84,200 Masked Entities', status: 'optimal', targetTab: 'policies' },
        { name: 'Tokenisation', description: 'Reversible surrogate token replacement for secure downstream processing', currentMetric: '42,000 Tokens Active', historicalMetric: '0 Vault Collisions', status: 'optimal', targetTab: 'policies' },
        { name: 'Model Policy', description: 'Allowlist of approved models per tenant classification tier', currentMetric: 'Enforced per Tenant', historicalMetric: '0 Rogue Model Calls', status: 'optimal', targetTab: 'ai_governance_lab' },
        { name: 'Data Residency', description: 'Strict geographic sovereignty pinning (e.g. South Africa JNB-1 Only)', currentMetric: '100% Pinned', historicalMetric: '0 Residency Breaches', status: 'optimal', targetTab: 'compliance' },
        { name: 'Retention', description: 'WORM automated data purging and zero-payload logging enforcement', currentMetric: '90-Day Sliding Window', historicalMetric: '100% Purged on Schedule', status: 'optimal', targetTab: 'policies' },
        { name: 'Human Approval', description: 'Human-in-the-loop review threshold for high-risk autonomous AI queries', currentMetric: '0 Pending Reviews', historicalMetric: '18 Approved (4.2m avg)', status: 'optimal', targetTab: 'automation' },
        { name: 'AI Guardrails', description: 'Prompt injection, jailbreak, toxicity, and hallucination safety shields', currentMetric: '99.8% Defense Rate', historicalMetric: '241 Probes Blocked', status: 'optimal', targetTab: 'policies' }
      ],
      nowSummary: {
        status: 'ACTIVE DEFENSE',
        throughput: '1,890 scans/min',
        latency: '16.2ms avg',
        activeItems: '18 Redactions/min • 0 Leakage'
      },
      historicalSummary: {
        totalEvents: '2,950,400 scans',
        availability: '99.98%',
        avgLatency: '15.8ms',
        incidentCount: 0
      }
    },
    {
      id: 'ai_gateway',
      number: 4,
      title: 'ALTIL AI GATEWAY / FABRIC',
      subtitle: 'Multi-Provider Abstraction, Fallback Circuit Breakers & Routing',
      color: '#f59e0b',
      accentBg: 'bg-amber-500/10',
      borderAccent: 'border-amber-500/30 hover:border-amber-500/60',
      icon: Cpu,
      domains: [
        { name: 'Provider abstraction', description: 'Unified OpenAI-compatible API interface wrapping all downstream LLMs', currentMetric: 'Zero Vendor Lock-in', historicalMetric: '100% Portability', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Routing', description: 'Intelligent cost-performance routing (fast-path Groq vs deep Gemini/Claude)', currentMetric: '165ms Global P95', historicalMetric: '32% Cost Reduction', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Fallback', description: 'Automatic cascading failover when an upstream provider experiences downtime', currentMetric: 'Circuit Normal (0 Trips)', historicalMetric: '12 Seamless Failovers', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Load balancing', description: 'Round-robin and weighted traffic distribution across provider regions', currentMetric: '5 Provider Clusters', historicalMetric: '0 Rate-Limit Drops', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'OpenAI', description: 'GPT-4o, GPT-4o-mini & embedding endpoints with automated token tracking', currentMetric: '28% Traffic Share', historicalMetric: '99.94% Uptime', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Gemini', description: 'Google Gemini 1.5 Pro & Flash with 2M token context window & local JNB node', currentMetric: '44% Traffic Share', historicalMetric: '99.99% Uptime', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Anthropic', description: 'Claude 3.5 Sonnet & Haiku with advanced reasoning & tool-use capabilities', currentMetric: '16% Traffic Share', historicalMetric: '99.92% Uptime', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Groq', description: 'Ultra-low latency LPU inference engine (22ms first-token response)', currentMetric: '8% Traffic Share', historicalMetric: '24ms Avg Latency', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Ollama', description: 'On-premise private sovereign model deployment (Llama 3.3 / Mistral)', currentMetric: '4% Sovereign Local', historicalMetric: '100% On-Premise', status: 'optimal', targetTab: 'ai_ops' },
        { name: 'Other AI', description: 'Extensible provider interface for DeepSeek, Cohere, Mistral & custom models', currentMetric: 'Ready for Adapters', historicalMetric: 'Zero Architecture Drift', status: 'optimal', targetTab: 'ai_ops' }
      ],
      nowSummary: {
        status: 'BALANCED',
        throughput: '1,420 tokens/sec',
        latency: '142ms P95',
        activeItems: '5 Active Providers • Gemini & Groq Lead'
      },
      historicalSummary: {
        totalEvents: '14.8M tokens consumed',
        availability: '99.97%',
        avgLatency: '148ms',
        incidentCount: 1
      }
    },
    {
      id: 'immutable_ledger',
      number: 5,
      title: 'IMMUTABLE EVIDENCE / LEDGER',
      subtitle: 'Cryptographic Merkle Tree, WORM Audit Vault & Tamper-Evident Storage',
      color: '#10b981',
      accentBg: 'bg-emerald-500/10',
      borderAccent: 'border-emerald-500/30 hover:border-emerald-500/60',
      icon: Database,
      domains: [
        { name: 'Identity', description: 'Permanent cryptographic log of every user, device & agent credential event', currentMetric: 'Block #842,910', historicalMetric: '100% Cryptographic Proof', status: 'optimal', targetTab: 'logs' },
        { name: 'Consent', description: 'Immutable record of user consent grants, policy versions & withdrawals', currentMetric: 'SHA-256 Chained', historicalMetric: 'Legally Evidentiary', status: 'optimal', targetTab: 'compliance' },
        { name: 'Contract', description: 'SLA commitments, billing tier changes & commercial terms audit trail', currentMetric: 'Sealed Contracts', historicalMetric: '0 Contract Disputes', status: 'optimal', targetTab: 'tenant_licensing' },
        { name: 'Policy', description: 'Versioned history of every guardrail change, author & administrative approval', currentMetric: 'v4.2.1 Pinned', historicalMetric: 'Full Delta History', status: 'optimal', targetTab: 'policies' },
        { name: 'Credential', description: 'Revocation proofs, rotation stamps & API key creation evidence', currentMetric: 'Zero Repudiation', historicalMetric: '100% Non-repudiable', status: 'optimal', targetTab: 'trust_fabric' },
        { name: 'AI Transactions', description: 'Hash of prompt, model metadata, tokens used, latency & redaction proofs', currentMetric: '14,280 sealed today', historicalMetric: '4.2M Total Receipts', status: 'optimal', targetTab: 'logs' },
        { name: 'Security events', description: 'Tamper-evident log of DLP blocks, auth failures & rate limit breaches', currentMetric: 'Real-time WORM', historicalMetric: '0 Tamper Alterations', status: 'optimal', targetTab: 'sec_ops' },
        { name: 'Administrative events', description: 'Dual-custody verification of all control-plane modifications & IAM role changes', currentMetric: 'Dual-Signed Root', historicalMetric: 'SOC 2 Type II Compliant', status: 'optimal', targetTab: 'logs' }
      ],
      nowSummary: {
        status: 'IMMUTABLE SEALED',
        throughput: '18 blocks/min',
        latency: '2.8ms write',
        activeItems: 'Block #842,915 • SHA-256 Merkle Validated'
      },
      historicalSummary: {
        totalEvents: '4,280,000 blocks',
        availability: '100.0%',
        avgLatency: '2.9ms',
        incidentCount: 0
      }
    }
  ], [providers, models, applications, policies, apiKeys, auditLogs, customers]);

  // Selected layer or active domain resolution
  const activeLayer = useMemo(() => {
    if (selectedLayerId) {
      return layers.find(l => l.id === selectedLayerId) || layers[0];
    }
    return null;
  }, [selectedLayerId, layers]);

  const activeDomain = useMemo(() => {
    if (!selectedDomainName) return null;
    for (const l of layers) {
      const d = l.domains.find(dom => dom.name.toLowerCase() === selectedDomainName.toLowerCase());
      if (d) return { ...d, layer: l };
    }
    return null;
  }, [selectedDomainName, layers]);

  // Time-series mock metrics based on time range
  const timeSeriesData = useMemo(() => {
    const points = timeRange === 'now' ? 12 : timeRange === '1h' ? 15 : timeRange === '24h' ? 24 : 14;
    return Array.from({ length: points }).map((_, i) => {
      const label = timeRange === 'now' 
        ? `${i * 5}s` 
        : timeRange === '1h' 
        ? `${i * 4}m` 
        : timeRange === '24h' 
        ? `${i}:00` 
        : `Day ${i + 1}`;
      return {
        time: label,
        controlPlane: Math.round(120 + Math.sin(i / 2) * 25 + Math.random() * 10),
        trustFabric: Math.round(210 + Math.cos(i / 2) * 35 + Math.random() * 15),
        policyEngine: Math.round(180 + Math.sin(i / 3) * 30 + Math.random() * 12),
        aiGateway: Math.round(140 + Math.cos(i / 3) * 20 + Math.random() * 18),
        immutableLedger: Math.round(170 + Math.sin(i / 2.5) * 22 + Math.random() * 10)
      };
    });
  }, [timeRange]);

  // Latency breakdown per layer
  const latencyBreakdown = [
    { layer: 'Control Plane', latency: 4.2, color: '#3b82f6' },
    { layer: 'Trust Fabric', latency: 8.4, color: '#06b6d4' },
    { layer: 'Policy Engine', latency: 16.2, color: '#8b5cf6' },
    { layer: 'AI Gateway', latency: 138.0, color: '#f59e0b' },
    { layer: 'Immutable Ledger', latency: 2.8, color: '#10b981' }
  ];

  // Provider share pie data
  const providerShareData = [
    { name: 'Gemini', value: 44, color: '#3b82f6' },
    { name: 'OpenAI', value: 28, color: '#10b981' },
    { name: 'Anthropic', value: 16, color: '#f59e0b' },
    { name: 'Groq', value: 8, color: '#ec4899' },
    { name: 'Ollama', value: 4, color: '#8b5cf6' }
  ];

  // Filter layers by search query
  const filteredLayers = useMemo(() => {
    if (!searchQuery.trim()) return layers;
    const q = searchQuery.toLowerCase();
    return layers.map(layer => {
      const matchTitle = layer.title.toLowerCase().includes(q) || layer.subtitle.toLowerCase().includes(q);
      const matchedDomains = layer.domains.filter(d => 
        d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      );
      return {
        ...layer,
        isMatched: matchTitle || matchedDomains.length > 0,
        highlightedDomains: matchedDomains.map(d => d.name)
      };
    });
  }, [layers, searchQuery]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#111622] border border-[#1e2738] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2"><InfoButton />
                  ALTIL 5-Layer Stack Architecture & Operational Fabric
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE FABRIC
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full-pipeline governed topology connecting Control Plane, Trust Fabric, Policy Engine, AI Gateway, and Immutable Ledger
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search domain (e.g. POPIA, Groq, Consent)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0a0d14] border border-[#222b3b] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Time Travel Range Selector */}
            <div className="flex items-center bg-[#0a0d14] border border-[#222b3b] rounded-lg p-0.5 text-xs font-mono">
              {(['now', '1h', '24h', '7d', '30d'] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded transition-colors uppercase font-bold text-[11px] ${
                    timeRange === r
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'now' ? 'Now (Live)' : r}
                </button>
              ))}
            </div>

            {/* Simulate Flow Button */}
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isSimulating
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
              }`}
              title="Simulate end-to-end request traversal across all 5 architectural layers"
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Simulating Live Flow...' : 'Simulate Request Flow'}</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Trace Stream (Active when simulating) */}
        {isSimulating && (
          <div className="mt-4 pt-4 border-t border-[#1e2738] bg-[#0c1018] rounded-lg p-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Pipeline Signal Trace • Step {simulationStep} of 5</span>
              </div>
              <span className="text-[11px] text-slate-400">Total Latency: ~170ms</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs font-mono mb-3">
              {layers.map((l) => {
                const isCurrent = simulationStep === l.number;
                const isPassed = simulationStep > l.number;
                return (
                  <div
                    key={l.id}
                    className={`p-2 rounded border transition-all ${
                      isCurrent
                        ? 'bg-blue-600/30 border-blue-400 text-white shadow-lg scale-105 ring-1 ring-blue-400'
                        : isPassed
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                        : 'bg-[#121622] border-[#1e2738] text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold">Layer {l.number}</div>
                    <div className="font-semibold truncate text-[11px]">{l.title.replace('ALTIL ', '')}</div>
                    <div className="text-[10px] mt-0.5">
                      {isCurrent ? 'Processing...' : isPassed ? 'Passed' : 'Pending'}
                    </div>
                  </div>
                );
              })}
            </div>
            {simulationLogs.length > 0 && (
              <div className="text-[11px] font-mono text-slate-300 bg-[#070a10] p-2.5 rounded border border-[#1b2333] space-y-1">
                <div className="text-emerald-400 font-bold flex items-center justify-between">
                  <span>[{simulationLogs[0]?.time}] Layer {simulationLogs[0]?.step}: {simulationLogs[0]?.layer}</span>
                  <span className="text-amber-400">{simulationLogs[0]?.latency}ms</span>
                </div>
                <p className="text-slate-300">{simulationLogs[0]?.text}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Visual Topology Pipeline - The 5 Connected Layers */}
      <div className="space-y-4">
        {filteredLayers.map((layer, index) => {
          const Icon = layer.icon;
          const isSelected = selectedLayerId === layer.id;
          const isCurrentInSimulation = simulationStep === layer.number;

          return (
            <div key={layer.id} className="relative group">
              {/* Vertical Conduit Arrow Connector to Next Layer */}
              {index > 0 && (
                <div className="flex justify-center -my-2 relative z-10">
                  <div className={`px-3 py-0.5 rounded-full border text-[10px] font-mono font-bold flex items-center space-x-1 shadow-md ${
                    isCurrentInSimulation
                      ? 'bg-blue-600 border-blue-400 text-white animate-bounce'
                      : 'bg-[#121622] border-[#222b3b] text-slate-400'
                  }`}>
                    <ArrowDown className="w-3 h-3 text-blue-400" />
                    <span>
                      {index === 1 && 'Zero-Trust mTLS Handshake & Claims (8ms)'}
                      {index === 2 && 'Security & POPIA DLP Redaction Pipeline (16ms)'}
                      {index === 3 && 'Multi-Model Routing & Provider Fallback (138ms)'}
                      {index === 4 && 'WORM Merkle Tree Cryptographic Commit (3ms)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Layer Card Container */}
              <div
                className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xl ${
                  isCurrentInSimulation
                    ? 'ring-2 ring-blue-500 bg-[#121828] border-blue-500'
                    : isSelected
                    ? 'ring-1 ring-slate-400 bg-[#121724] border-slate-500'
                    : 'bg-[#0f141e] hover:bg-[#121826] border-[#1f293d]'
                }`}
              >
                {/* Layer Header Header Bar */}
                <div className="p-4 sm:p-5 border-b border-[#1b2436] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131926]">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner font-bold font-mono text-sm"
                      style={{ backgroundColor: `${layer.color}20`, color: layer.color, border: `1px solid ${layer.color}40` }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${layer.color}25`, color: layer.color }}
                        >
                          Layer {layer.number}
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight"><InfoButton />
                          {layer.title}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {layer.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right Live Operational Badges & Drilldown Trigger */}
                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <div className="hidden md:flex items-center space-x-3 pr-2 border-r border-[#222b3b]">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Throughput</span>
                        <span className="text-white font-bold">{layer.nowSummary.throughput}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">P95 Latency</span>
                        <span className="text-emerald-400 font-bold">{layer.nowSummary.latency}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedLayerId(selectedLayerId === layer.id ? null : layer.id);
                        setSelectedDomainName(null);
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#1a2233] hover:bg-[#232e44] text-slate-200 hover:text-white border border-[#29354d] text-xs font-medium transition-colors"
                    >
                      <span>{isSelected ? 'Collapse Layer' : 'Drill Down'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Domain Pill Badges Grid - Exactly the listed components */}
                <div className="p-4 sm:p-5">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Wired Sub-Domains & Functional Capabilities ({layer.domains.length})</span>
                    <span className="text-[10px] text-slate-400">Click any pill to inspect live telemetry</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {layer.domains.map((dom) => {
                      const isDomainActive = selectedDomainName === dom.name;
                      const isHighlighted = searchQuery && dom.name.toLowerCase().includes(searchQuery.toLowerCase());

                      return (
                        <button
                          key={dom.name}
                          onClick={() => {
                            setSelectedDomainName(dom.name);
                            setSelectedLayerId(layer.id);
                          }}
                          className={`group/pill px-3 py-2 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                            isDomainActive
                              ? 'bg-blue-600/30 border-blue-400 text-white shadow-md ring-1 ring-blue-400'
                              : isHighlighted
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                              : 'bg-[#141a27] hover:bg-[#1c2436] border-[#222d42] hover:border-slate-500 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: layer.color }}
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold block leading-none">
                              {dom.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block mt-1 leading-none">
                              {timeRange === 'now' ? dom.currentMetric : dom.historicalMetric}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded Inline Drawer when Layer is selected */}
                {isSelected && (
                  <div className="border-t border-[#1f293d] bg-[#0c1018] p-5 space-y-4 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c2538] pb-3">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider"><InfoButton />
                          Layer {layer.number} Deep-Dive Diagnostics ({timeRange.toUpperCase()})
                        </h3>
                      </div>
                      <div className="flex items-center space-x-1 bg-[#141a27] p-1 rounded-lg text-xs font-mono">
                        <button
                          onClick={() => setInspectorTab('now')}
                          className={`px-3 py-1 rounded font-bold ${
                            inspectorTab === 'now' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Real-Time (Now)
                        </button>
                        <button
                          onClick={() => setInspectorTab('historical')}
                          className={`px-3 py-1 rounded font-bold ${
                            inspectorTab === 'historical' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Historical Trends
                        </button>
                        <button
                          onClick={() => setInspectorTab('wiring')}
                          className={`px-3 py-1 rounded font-bold ${
                            inspectorTab === 'wiring' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Inter-Layer Wiring
                        </button>
                      </div>
                    </div>

                    {/* Tab: Real-Time (Now) */}
                    {inspectorTab === 'now' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3.5 rounded-xl bg-[#121723] border border-[#1e283b] space-y-2">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Current Throughput</span>
                          <div className="text-xl font-bold font-mono text-white">{layer.nowSummary.throughput}</div>
                          <p className="text-[11px] text-slate-400">Continuous telemetry ingestion with dynamic autoscaling</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#121723] border border-[#1e283b] space-y-2">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Observed P95 Latency</span>
                          <div className="text-xl font-bold font-mono text-emerald-400">{layer.nowSummary.latency}</div>
                          <p className="text-[11px] text-slate-400">Strictly within enterprise SLA threshold (&lt;250ms target)</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#121723] border border-[#1e283b] space-y-2">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Active State Details</span>
                          <div className="text-xs font-bold font-mono text-blue-300">{layer.nowSummary.activeItems}</div>
                          <p className="text-[11px] text-slate-400">All registered tenant domains running in hardened isolation</p>
                        </div>
                      </div>
                    )}

                    {/* Tab: Historical Trends */}
                    {inspectorTab === 'historical' && (
                      <div className="space-y-3">
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f141e', borderColor: '#222d42', fontSize: '11px' }} />
                              <Area
                                type="monotone"
                                dataKey={
                                  layer.id === 'control_plane' ? 'controlPlane' :
                                  layer.id === 'trust_fabric' ? 'trustFabric' :
                                  layer.id === 'policy_engine' ? 'policyEngine' :
                                  layer.id === 'ai_gateway' ? 'aiGateway' : 'immutableLedger'
                                }
                                stroke={layer.color}
                                fill={`${layer.color}25`}
                                name="Transactions"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                          <span>Total Recorded Events: <strong className="text-white">{layer.historicalSummary.totalEvents}</strong></span>
                          <span>Availability: <strong className="text-emerald-400">{layer.historicalSummary.availability}</strong></span>
                          <span>Historical Incidents: <strong className="text-blue-400">{layer.historicalSummary.incidentCount}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Tab: Inter-Layer Wiring */}
                    {inspectorTab === 'wiring' && (
                      <div className="p-3.5 rounded-xl bg-[#121723] border border-[#1e283b] space-y-2 text-xs">
                        <div className="font-semibold text-white">How Layer {layer.number} wires to the rest of the ALTIL stack:</div>
                        <p className="text-slate-300 leading-relaxed">
                          {layer.id === 'control_plane' && 'The Admin Control Plane receives external configurations, orchestrates tenant apps and keys, and propagates authorization context downstream to the Trust Fabric.'}
                          {layer.id === 'trust_fabric' && 'The Trust Fabric authenticates consuming device/user identities and asserts tenant isolation boundaries before authorizing the request into the Policy Engine.'}
                          {layer.id === 'policy_engine' && 'The Policy Engine intercepts the prompt payload, executes POPIA/GDPR PII redaction and DLP filters, and sends sanitized prompts to the AI Gateway.'}
                          {layer.id === 'ai_gateway' && 'The AI Gateway abstracts underlying LLM providers (Gemini, OpenAI, Claude, Groq, Ollama), load balances requests, and emits raw metadata to the Immutable Ledger.'}
                          {layer.id === 'immutable_ledger' && 'The Immutable Ledger finalizes the transaction by sealing a SHA-256 Merkle block containing cryptographic receipts of consent, policy, and AI tokens.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-Layer Analytics & Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* End-to-End Latency Waterfall */}
        <div className="bg-[#0f141e] border border-[#1f293d] rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2"><InfoButton />
              <Clock className="w-4 h-4 text-emerald-400" />
              Pipeline Latency Waterfall
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Total ~170ms</span>
          </div>
          <div className="space-y-2.5 pt-1">
            {latencyBreakdown.map((item) => (
              <div key={item.layer} className="space-y-1 text-xs">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-300">{item.layer}</span>
                  <span className="font-bold text-white">{item.latency} ms</span>
                </div>
                <div className="w-full h-2 bg-[#171f2e] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Math.max((item.latency / 170) * 100, 3), 100)}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Gateway Provider Distribution Donut */}
        <div className="bg-[#0f141e] border border-[#1f293d] rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2"><InfoButton />
              <Cpu className="w-4 h-4 text-amber-400" />
              Layer 4 Provider Routing Split
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">5 Active LLMs</span>
          </div>
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={providerShareData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {providerShareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f141e', borderColor: '#222d42', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1">
            {providerShareData.map((p) => (
              <div key={p.name} className="p-1.5 rounded bg-[#141a27] border border-[#1e2738]">
                <div className="text-slate-400 truncate">{p.name}</div>
                <div className="text-white font-bold">{p.value}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Layer 5 Immutable Ledger Block Stream */}
        <div className="bg-[#0f141e] border border-[#1f293d] rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2"><InfoButton />
              <Database className="w-4 h-4 text-emerald-400" />
              Layer 5 Cryptographic Ledger
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">WORM SEALED</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            {[
              { block: 842915, hash: '0x9e8a...3f1d', tx: 'AI Prompt & Consent Receipt', time: '12s ago' },
              { block: 842914, hash: '0x4d12...8e0b', tx: 'POPIA Redaction Hash #ZA-94', time: '28s ago' },
              { block: 842913, hash: '0x1c99...bb2a', tx: 'mTLS Device Binding Verification', time: '44s ago' },
              { block: 842912, hash: '0x7f03...aa51', tx: 'Gemini 1.5 Flash Token Settlement', time: '1m ago' }
            ].map((b) => (
              <div key={b.block} className="p-2 rounded-lg bg-[#141a27] border border-[#1e2738] flex items-center justify-between">
                <div>
                  <div className="text-emerald-400 font-bold">Block #{b.block}</div>
                  <div className="text-[10px] text-slate-400">{b.tx}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300 text-[10px]">{b.hash}</div>
                  <div className="text-[9px] text-slate-500">{b.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Specific Domain Deep-Dive Inspector Modal */}
      {activeDomain && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f141e] border border-[#222d42] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1c2538] flex items-center justify-between bg-[#131926]">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: `${activeDomain.layer.color}25`, color: activeDomain.layer.color }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400">
                      Layer {activeDomain.layer.number}
                    </span>
                    <h3 className="text-base font-bold text-white"><InfoButton />
                      {activeDomain.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeDomain.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDomainName(null)}
                className="p-1.5 rounded-lg bg-[#182030] hover:bg-[#222c42] text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Telemetry Snapshot Cards */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3.5 rounded-xl bg-[#141a27] border border-[#1e283b]">
                  <span className="text-[10px] text-slate-400 uppercase block">Real-Time State (Now)</span>
                  <div className="text-lg font-bold text-emerald-400 mt-1">{activeDomain.currentMetric}</div>
                  <span className="text-[10px] text-slate-500">Live operational observation</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#141a27] border border-[#1e283b]">
                  <span className="text-[10px] text-slate-400 uppercase block">Historical Benchmark</span>
                  <div className="text-lg font-bold text-blue-400 mt-1">{activeDomain.historicalMetric}</div>
                  <span className="text-[10px] text-slate-500">Aggregated telemetry baseline</span>
                </div>
              </div>

              {/* Inter-Layer Wiring Context */}
              <div className="p-4 rounded-xl bg-[#121723] border border-[#1e283b] space-y-2 text-xs">
                <div className="font-semibold text-white flex items-center space-x-1.5">
                  <Workflow className="w-4 h-4 text-purple-400" />
                  <span>Role in the 5-Layer Stack</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The <strong className="text-white">{activeDomain.name}</strong> capability functions inside{' '}
                  <strong className="text-white">{activeDomain.layer.title}</strong>. It receives context from upstream controls, enforces deterministic guarantees, and produces tamper-evident audit proofs downstream for the Immutable Ledger.
                </p>
              </div>

              {/* Navigation Action */}
              {activeDomain.targetTab && onNavigateToTab && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      onNavigateToTab(activeDomain.targetTab!);
                      setSelectedDomainName(null);
                    }}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition-colors"
                  >
                    <span>Open Dedicated Module</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
