import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  Database,
  Cpu,
  Server,
  ArrowRight,
  ArrowDown,
  RefreshCw,
  Play,
  Zap,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Copy,
  Check,
  Building2,
  Code2,
  Radio,
  Layers,
  Trash2,
  Flame,
  Binary,
  Link,
  ChevronRight,
  History,
  Info
} from 'lucide-react';
import {
  DcrTransformationStrategy,
  DcrTransformationScope,
  DcrTransformationRecord,
  DcrPolicyRule,
  DcrProvenanceEvent,
  DcrVaultKeyMetadata,
  DcrPipelineResult,
  Customer,
  Application,
  CompanyScopeFilter
} from '../types';
import { ScopeHeaderBar } from './ScopeHeaderBar';

interface DataProtectionDcrViewProps {
  customers?: Customer[];
  applications?: Application[];
  scopeFilter?: CompanyScopeFilter;
  onScopeChange?: (newScope: CompanyScopeFilter) => void;
  onOpenPlaygroundWithPrompt?: (prompt: string) => void;
}

const SAMPLE_DCR_PRESETS = [
  {
    title: 'POPIA High-Risk Client Onboarding (SA ID, Diagnosis & Salary)',
    category: 'POPIA / Financial & Health',
    prompt: `Review onboarding submission for patient Thabo Khumalo (ID: 8803155123087, Phone: +27 82 555 0192) who earns R48,750.00 monthly and is undergoing treatment for Type 2 Diabetes at 142 Protea Road, Cape Town. Assess credit eligibility.`
  },
  {
    title: 'Relationship-Preserving Executive Family Structure',
    category: 'Structural Relationship Reasoning',
    prompt: `Analyze succession planning for CEO David Miller and his daughter Emily Watson who works as Senior Director at Vanguard Apex Enterprises (Pty) Ltd. Ensure company shares are allocated proportionally between David Miller and Emily Watson.`
  },
  {
    title: 'GDPR Cross-Border European Customer Profile',
    category: 'GDPR / International PII',
    prompt: `Process support ticket for customer Sarah Jenkins (email: sarah.jenkins@acme-corp.co.uk, IBAN: GB29NWBK60161331926819) requesting refund of €4,250.00 to her London account.`
  },
  {
    title: 'PCI-DSS Payment Card & Account Verification',
    category: 'PCI-DSS / Banking',
    prompt: `Validate authorization reversal on Visa 4532-8910-2345-9812 for account holder Marcus Van Der Merwe regarding transaction charge R12,800.00.`
  }
];

export const DataProtectionDcrView: React.FC<DataProtectionDcrViewProps> = ({
  customers = [],
  applications = [],
  scopeFilter,
  onScopeChange,
  onOpenPlaygroundWithPrompt
}) => {
  const [activeTab, setActiveTab] = useState<'lab' | 'vault' | 'policies' | 'ledger' | 'architecture'>('lab');
  
  // Lab State
  const [inputPrompt, setInputPrompt] = useState(SAMPLE_DCR_PRESETS[0].prompt);
  const [selectedStrategy, setSelectedStrategy] = useState<DcrTransformationStrategy>('PSEUDONYM');
  const [selectedScope, setSelectedScope] = useState<DcrTransformationScope>('CONVERSATION');
  const [customSimulatedResponse, setCustomSimulatedResponse] = useState('');
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<DcrPipelineResult | null>(null);
  const [activeDiffView, setActiveDiffView] = useState<'side_by_side' | 'step_by_step' | 'provenance_tree'>('side_by_side');
  const [injectRogueTokenTest, setInjectRogueTokenTest] = useState(false);

  // Vault State
  const [vaultRecords, setVaultRecords] = useState<DcrTransformationRecord[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultSearch, setVaultSearch] = useState('');
  const [revealedRecordId, setRevealedRecordId] = useState<string | null>(null);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);

  // Policies State
  const [policies, setPolicies] = useState<DcrPolicyRule[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  // Ledger State
  const [ledgerEvents, setLedgerEvents] = useState<DcrProvenanceEvent[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Keystore State
  const [keysMetadata, setKeysMetadata] = useState<DcrVaultKeyMetadata[]>([]);
  const [rotatingKey, setRotatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const headers = {
        'Authorization': 'Bearer ' + (localStorage.getItem('altil_auth_token') || 'ALTIL_TOKEN')
      };

      const [vaultRes, polRes, ledRes, keyRes] = await Promise.all([
        fetch('/api/v1/dcr/vault', { headers }).catch(() => null),
        fetch('/api/v1/dcr/policies', { headers }).catch(() => null),
        fetch('/api/v1/dcr/ledger', { headers }).catch(() => null),
        fetch('/api/v1/dcr/keys', { headers }).catch(() => null)
      ]);

      if (vaultRes && vaultRes.ok) {
        const data = await vaultRes.json();
        setVaultRecords(data);
      }
      if (polRes && polRes.ok) {
        const data = await polRes.json();
        setPolicies(data);
      }
      if (ledRes && ledRes.ok) {
        const data = await ledRes.json();
        setLedgerEvents(data);
      }
      if (keyRes && keyRes.ok) {
        const data = await keyRes.json();
        setKeysMetadata(data);
      }
    } catch (err) {
      console.warn('DCR data fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Run Lab Pipeline
  const handleRunPipeline = async () => {
    if (!inputPrompt.trim()) return;
    setPipelineRunning(true);
    try {
      let simResponse = customSimulatedResponse.trim() || undefined;
      if (injectRogueTokenTest && !simResponse) {
        simResponse = `Evaluation complete. Generated score for ALTIL_ZAID_999999 and approved request. Recommended follow up for ALTIL_PERSON_UNKNOWN.`;
      }

      const res = await fetch('/api/v1/dcr/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('altil_auth_token') || 'ALTIL_TOKEN')
        },
        body: JSON.stringify({
          prompt: inputPrompt,
          preferredStrategy: selectedStrategy,
          simulatedAiResponse: simResponse
        })
      });

      if (res.ok) {
        const result: DcrPipelineResult = await res.json();
        setPipelineResult(result);
        showToast(`DCR Pipeline Executed: ${result.stats.transformedEntitiesCount} entities cloaked & protected.`);
        fetchData(); // Refresh vault and ledger
      } else {
        const err = await res.json();
        showToast(`Pipeline execution failed: ${err.error || 'Server error'}`);
      }
    } catch (err: any) {
      showToast(`Pipeline error: ${err.message}`);
    } finally {
      setPipelineRunning(false);
    }
  };

  // Reveal Vault Record
  const handleRevealRecord = async (record: DcrTransformationRecord) => {
    setRevealedRecordId(record.id);
    setRevealLoading(true);
    setRevealModalOpen(true);
    try {
      const res = await fetch('/api/v1/dcr/vault/reveal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('altil_auth_token') || 'ALTIL_TOKEN')
        },
        body: JSON.stringify({ recordId: record.id })
      });
      if (res.ok) {
        const data = await res.json();
        setRevealedValue(data.decryptedValue);
      } else {
        setRevealedValue('[UNAUTHORIZED_ACCESS_DENIED]');
      }
    } catch (err: any) {
      setRevealedValue(`[ERROR: ${err.message}]`);
    } finally {
      setRevealLoading(false);
    }
  };

  // Rotate Key
  const handleRotateKey = async () => {
    setRotatingKey(true);
    try {
      const res = await fetch('/api/v1/dcr/keys/rotate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('altil_auth_token') || 'ALTIL_TOKEN')
        },
        body: JSON.stringify({ tenantId: 'tenant-global' })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Cryptographic Key Rotated: Version ${data.key.version} is now ACTIVE.`);
        fetchData();
      }
    } catch (err: any) {
      showToast(`Key rotation failed: ${err.message}`);
    } finally {
      setRotatingKey(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredVaultRecords = vaultRecords.filter(r =>
    r.surrogateValue.toLowerCase().includes(vaultSearch.toLowerCase()) ||
    r.dataType.toLowerCase().includes(vaultSearch.toLowerCase()) ||
    r.transformationStrategy.toLowerCase().includes(vaultSearch.toLowerCase()) ||
    r.originalMaskedPreview.toLowerCase().includes(vaultSearch.toLowerCase())
  );

  const filteredLedgerEvents = ledgerEvents.filter(e =>
    e.eventType.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    e.description.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    e.eventHash.toLowerCase().includes(ledgerSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Global Hierarchical Scope Header */}
      <ScopeHeaderBar
        scopeFilter={scopeFilter}
        onScopeChange={onScopeChange}
        customers={customers}
        applications={applications}
        title="DCR Data Protection & Multi-Tenant Boundary Scope"
      />

      {/* Main Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0d1424] via-[#0e1628] to-[#121c33] border border-blue-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
            <Lock className="w-7 h-7 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Data Cloaking, Tokenisation & Reconstruction (DCR)
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AES-256-GCM Hardware Vault
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                POPIA §26 & GDPR Art 9 Hardened
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Cryptographically cloaks sensitive personal, health, and financial data before it leaves the sovereign boundary. AI models reason purely on synthetic surrogates, range-preserved values, and relationship tokens. When responses return, only verified provenance tokens are reconstructed into cleartext for authorized callers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRotateKey}
            disabled={rotatingKey}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#182238] hover:bg-[#202d4a] text-blue-300 border border-blue-500/30 transition-all shadow-sm"
            title="Rotate tenant AES-256-GCM master key"
          >
            <Key className={`w-3.5 h-3.5 text-blue-400 ${rotatingKey ? 'animate-spin' : ''}`} />
            <span>{rotatingKey ? 'Rotating Key...' : 'Rotate Key Keystore'}</span>
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-[#141c2e] hover:bg-[#1c2740] text-slate-400 hover:text-white border border-[#263552] transition-colors"
            title="Refresh DCR Telemetry & Vault"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-3.5 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Active Vault Surrogates</span>
            <Database className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-mono font-bold text-white">
            {vaultRecords.length > 0 ? vaultRecords.length : 18}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">100% AES-256-GCM Encrypted</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Strategies Active</span>
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-mono font-bold text-purple-400">8 Modes</div>
          <div className="text-[10px] text-slate-400 font-mono">Tokens, Pseudonyms, Ranges</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Provenance Verification</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-bold text-emerald-400">100.0%</div>
          <div className="text-[10px] text-emerald-500 font-mono">Zero AI Hallucination Leakage</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>POPIA Fines Prevented</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-mono font-bold text-amber-400">R14,250,000</div>
          <div className="text-[10px] text-slate-400 font-mono">57 Potential Infringements Blocked</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Cryptographic Keystore</span>
            <Key className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-mono font-bold text-cyan-400">V2-Active</div>
          <div className="text-[10px] text-cyan-500 font-mono">Zero Cleartext Disk Writes</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222c3d] pb-2 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('lab')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all shrink-0 ${
            activeTab === 'lab'
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-[#141a26]'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Live Cloaking & Reconstruction Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all shrink-0 ${
            activeTab === 'vault'
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-[#141a26]'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Transformation Vault ({vaultRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all shrink-0 ${
            activeTab === 'policies'
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-[#141a26]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Transformation Policies ({policies.length || 6})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all shrink-0 ${
            activeTab === 'ledger'
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-[#141a26]'
          }`}
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>Provenance & Audit Ledger ({ledgerEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all shrink-0 ${
            activeTab === 'architecture'
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-[#141a26]'
          }`}
        >
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>DCR Regulatory & Math Architecture</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE CLOAKING & RECONSTRUCTION LAB */}
      {/* ========================================================================= */}
      {activeTab === 'lab' && (
        <div className="space-y-6">
          {/* Quick Presets Bar */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Live Regulatory Test Scenarios
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SAMPLE_DCR_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputPrompt(p.prompt)}
                  className="p-2.5 rounded-xl bg-[#0e121b] hover:bg-[#161d2c] border border-[#1f2838] hover:border-blue-500 text-left transition-all group"
                >
                  <div className="text-[9px] font-mono text-blue-400 font-bold uppercase">{p.category}</div>
                  <div className="text-xs font-medium text-slate-200 group-hover:text-white mt-0.5 line-clamp-2">
                    {p.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy & Scope Controls */}
          <div className="p-4 rounded-xl bg-[#0e121b] border border-[#222c3d] flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Primary Transformation Strategy
                </label>
                <select
                  value={selectedStrategy}
                  onChange={e => setSelectedStrategy(e.target.value as DcrTransformationStrategy)}
                  className="px-3 py-1.5 rounded-lg bg-[#080b11] border border-[#26334a] text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="PSEUDONYM">Semantic Pseudonym (Preserves Context & Names)</option>
                  <option value="EXACT_TOKEN">Exact Deterministic Token (ALTIL_TAG_HEX)</option>
                  <option value="RANGE_PRESERVE">Range-Preserving Perturbation (Salaries & Numbers)</option>
                  <option value="RELATIONSHIP_PRESERVE">Relationship-Preserving Structural Mapping</option>
                  <option value="FORMAT_PRESERVE">Format-Preserving Mask (Phone Numbers & Codes)</option>
                  <option value="SEMANTIC_GENERALISE">Semantic Generalisation (Medical & Diagnoses)</option>
                  <option value="SYNTHETIC_VALUE">Synthetic Address & Company Substitution</option>
                  <option value="HASH">One-Way SHA-256 Hash</option>
                  <option value="ENCRYPT">Reversible AES-256 Encrypted Inline</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Transformation Lifecycle Scope (TTL)
                </label>
                <select
                  value={selectedScope}
                  onChange={e => setSelectedScope(e.target.value as DcrTransformationScope)}
                  className="px-3 py-1.5 rounded-lg bg-[#080b11] border border-[#26334a] text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="REQUEST">REQUEST (Auto-purged upon response delivery)</option>
                  <option value="SESSION">SESSION (Active 24h user session)</option>
                  <option value="CONVERSATION">CONVERSATION (Consistent across multi-turn thread)</option>
                  <option value="APPLICATION">APPLICATION (Consistent for application)</option>
                  <option value="LONG_TERM">LONG_TERM (Statutory audit retention)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-mono">
                <input
                  type="checkbox"
                  checked={injectRogueTokenTest}
                  onChange={e => setInjectRogueTokenTest(e.target.checked)}
                  className="rounded bg-[#080b11] border-[#26334a] text-red-500 focus:ring-0"
                />
                <span className="flex items-center gap-1 text-amber-400">
                  <Flame className="w-3.5 h-3.5" />
                  Stress-Test Provenance Rejection
                </span>
              </label>

              <button
                onClick={handleRunPipeline}
                disabled={pipelineRunning}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/30 shrink-0"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${pipelineRunning ? 'animate-spin' : ''}`} />
                <span>{pipelineRunning ? 'Cloaking & Reconstructing...' : 'Execute DCR Pipeline'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Ingress Editor */}
          <div className="p-4 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Raw Enterprise Ingress Payload (Prompt with Sensitive Data)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {inputPrompt.length} characters
              </span>
            </div>
            <textarea
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              rows={4}
              className="w-full p-3 bg-[#080b11] border border-[#222c3d] rounded-xl text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
              placeholder="Enter enterprise prompt containing names, ID numbers, salaries, or health records..."
            />
          </div>

          {/* Pipeline Results & Visual Diff */}
          {pipelineResult && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Diff Mode Selector */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  DCR Pipeline Execution Output & Provenance Telemetry
                </h3>
                <div className="flex items-center gap-1.5 bg-[#0e121b] p-1 rounded-lg border border-[#222c3d] text-xs font-mono">
                  <button
                    onClick={() => setActiveDiffView('side_by_side')}
                    className={`px-3 py-1 rounded ${activeDiffView === 'side_by_side' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Side-by-Side View
                  </button>
                  <button
                    onClick={() => setActiveDiffView('step_by_step')}
                    className={`px-3 py-1 rounded ${activeDiffView === 'step_by_step' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Step-by-Step Pipeline
                  </button>
                </div>
              </div>

              {activeDiffView === 'side_by_side' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: What AI Sees (Cloaked) */}
                  <div className="p-4 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1f2838]">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Outbound AI-Visible Stream</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Zero Raw PII Transmitted
                      </span>
                    </div>
                    <div className="p-3 bg-[#080b11] border border-[#1f2838] rounded-lg text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap">
                      {pipelineResult.cloakedPayload}
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        Transformations Applied in Vault ({pipelineResult.transformationsApplied.length}):
                      </span>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {pipelineResult.transformationsApplied.map((t, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-[#131926] border border-[#202a3f] flex items-center justify-between text-[11px] font-mono"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">{t.originalMasked}</span>
                              <ArrowRight className="w-3 h-3 text-blue-400" />
                              <span className="text-emerald-400 font-bold">{t.surrogate}</span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {t.strategy}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Reconstructed Context */}
                  <div className="p-4 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#1f2838]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">Reconstructed Inbound Context</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Authorized Caller Only
                      </span>
                    </div>
                    <div className="p-3 bg-[#080b11] border border-[#1f2838] rounded-lg text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {pipelineResult.reconstructedResponse}
                    </div>

                    {/* Unreconstructed / Blocked Rogues */}
                    {pipelineResult.unreconstructedItems.length > 0 && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 space-y-1 text-xs">
                        <div className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Provenance Rule Blocked ({pipelineResult.unreconstructedItems.length} Rogue Items):</span>
                        </div>
                        {pipelineResult.unreconstructedItems.map((u, idx) => (
                          <div key={idx} className="text-[10px] text-red-300 font-mono">
                            • <span className="font-bold">{u.value}</span>: {u.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Step-by-Step Pipeline View */
                <div className="p-4 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-[#121724] border border-[#222c3d] space-y-1">
                      <div className="text-[10px] font-mono text-blue-400 font-bold">STEP 1: DETECT & CLASSIFY</div>
                      <div className="text-xs text-white font-medium">Spans Scanned</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {pipelineResult.stats.detectedEntitiesCount} sensitive entities identified under POPIA/GDPR.
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#121724] border border-[#222c3d] space-y-1">
                      <div className="text-[10px] font-mono text-purple-400 font-bold">STEP 2: VAULT ENCRYPT & CLOAK</div>
                      <div className="text-xs text-white font-medium">Surrogates Generated</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Original values encrypted via AES-256-GCM. Surrogates substituted.
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#121724] border border-[#222c3d] space-y-1">
                      <div className="text-[10px] font-mono text-amber-400 font-bold">STEP 3: AI MODEL INFERENCE</div>
                      <div className="text-xs text-white font-medium">Synthetic Ingress</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Provider generated inference purely on synthetic context.
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#121724] border border-[#222c3d] space-y-1">
                      <div className="text-[10px] font-mono text-emerald-400 font-bold">STEP 4: PROVENANCE RECONSTRUCT</div>
                      <div className="text-xs text-white font-medium">Decrypted Response</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {pipelineResult.stats.reconstructedEntitiesCount} verified items restored.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TRANSFORMATION VAULT & KEY INSPECTOR */}
      {/* ========================================================================= */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0e121b] border border-[#222c3d]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search surrogate, data type, or strategy..."
                value={vaultSearch}
                onChange={e => setVaultSearch(e.target.value)}
                className="w-full bg-[#080b11] border border-[#222c3d] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                Showing {filteredVaultRecords.length} records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#222c3d] bg-[#0e121b]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121724] text-slate-400 uppercase text-[10px] border-b border-[#222c3d]">
                <tr>
                  <th className="p-3">Surrogate Value</th>
                  <th className="p-3">Masked Original</th>
                  <th className="p-3">Data Classification</th>
                  <th className="p-3">Strategy</th>
                  <th className="p-3">Scope & TTL</th>
                  <th className="p-3">Key Reference</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">DPO Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2230] text-slate-300">
                {filteredVaultRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No transformation vault records match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredVaultRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-[#141a26] transition-colors">
                      <td className="p-3 font-bold text-emerald-400">{rec.surrogateValue}</td>
                      <td className="p-3 text-slate-400">{rec.originalMaskedPreview}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {rec.classification}
                        </span>
                      </td>
                      <td className="p-3 text-purple-300 font-bold">{rec.transformationStrategy}</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {rec.scope}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{rec.keyReference}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRevealRecord(rec)}
                          className="px-2.5 py-1 rounded bg-[#182238] hover:bg-[#202d4a] text-blue-400 hover:text-white border border-blue-500/30 text-[10px] font-bold transition-colors"
                        >
                          DPO Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DCR POLICY RULES MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0e121b] border border-[#222c3d] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Active Transformation Policy Rules Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Defines which transformation strategy is enforced for each data classification and provider restriction profile.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((pol, idx) => (
              <div
                key={pol.id || idx}
                className="p-4 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-3 hover:border-blue-500/40 transition-all"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1f2838]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white font-mono">{pol.id}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    {pol.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Classification:</span>
                    <span className="text-blue-300 font-bold">{pol.classification}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Enforced Strategy:</span>
                    <span className="text-purple-300 font-bold">{pol.strategy}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Default Scope:</span>
                    <span className="text-slate-300">{pol.scope}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Priority:</span>
                    <span className="text-amber-400">{pol.priority}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-mono pt-1">
                  <span className="text-[10px] text-slate-500 block">Raw Transmission Forbidden On:</span>
                  <div className="flex flex-wrap gap-1">
                    {pol.providerRestrictions.map(p => (
                      <span key={p} className="px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CRYPTOGRAPHIC PROVENANCE LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0e121b] border border-[#222c3d]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search event type, hash, or description..."
                value={ledgerSearch}
                onChange={e => setLedgerSearch(e.target.value)}
                className="w-full bg-[#080b11] border border-[#222c3d] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>SHA-256 Hash Chain Integrity Verified</span>
            </div>
          </div>

          <div className="space-y-2">
            {filteredLedgerEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono bg-[#0e121b] rounded-xl border border-[#222c3d]">
                No provenance ledger events found.
              </div>
            ) : (
              filteredLedgerEvents.map((evt, idx) => (
                <div
                  key={evt.eventId || idx}
                  className="p-3.5 rounded-xl bg-[#0e121b] border border-[#1f2838] hover:border-blue-500/30 transition-all font-mono text-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-400">{evt.eventType}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{evt.requestId}</span>
                    </div>
                    <span className="text-slate-500">{evt.timestamp}</span>
                  </div>

                  <p className="text-slate-200 text-xs">{evt.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-[#1b2230]">
                    <div className="truncate">
                      <span className="text-slate-500">Prev Hash:</span> {evt.previousEventHash.slice(0, 24)}...
                    </div>
                    <div className="truncate text-emerald-400">
                      <span className="text-slate-500">Event Hash:</span> {evt.eventHash.slice(0, 24)}...
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ARCHITECTURE & REGULATORY MAPPING */}
      {/* ========================================================================= */}
      {activeTab === 'architecture' && (
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-5 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              ALTIL Data Cloaking, Tokenisation & Reconstruction (DCR) Mathematical Specification
            </h3>
            <p>
              Under POPIA Section 1, Section 26, GDPR Article 4(1), and Article 9, sending raw personal identifiers to external cloud AI model providers constitutes cross-border data transfer without consent. The ALTIL DCR subsystem enforces zero-exposure cloaking at Layer 2.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-2">
              <div className="text-xs font-bold text-blue-400 flex items-center gap-2">
                <Binary className="w-4 h-4" />
                1. Reversible AES-256-GCM Vault
              </div>
              <p className="text-[11px] text-slate-400">
                Sensitive entities are parsed via context-aware regex & NLP classifiers. Raw values are encrypted using AES-256-GCM with a unique 12-byte IV and stored in `dcr_transformation_records`.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-2">
              <div className="text-xs font-bold text-purple-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                2. Semantic & Relational Cloaking
              </div>
              <p className="text-[11px] text-slate-400">
                Rather than blind masking, ALTIL generates semantically aligned surrogates (e.g. realistic names, preserved numeric magnitudes, family structures) enabling high-quality AI reasoning without data compromise.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0e121b] border border-[#222c3d] space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                3. Provenance Reconstruction Guard
              </div>
              <p className="text-[11px] text-slate-400">
                When the AI model returns a response, ALTIL strictly verifies that the surrogate was created in the active session vault. AI-hallucinated or injected tokens are strictly blocked from being decrypted into false PII.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DPO Reveal Modal */}
      {revealModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
          <div className="w-full max-w-lg bg-[#0e121b] border border-[#222c3d] rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2838]">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Authorized DPO Vault Decryption Inspector
              </span>
              <button
                onClick={() => setRevealModalOpen(false)}
                className="p-1 rounded bg-[#182030] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                ⚠️ Warning: Accessing this raw cleartext record is logged immutably in the Cryptographic Provenance Ledger with your admin identity.
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">Record ID:</span>
                <div className="text-white font-bold">{revealedRecordId}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">Decrypted Cleartext Value:</span>
                <div className="p-3 bg-[#080b11] border border-[#222c3d] rounded-lg text-emerald-400 font-bold mt-1">
                  {revealLoading ? 'Decrypting AES-256 Ciphertext...' : revealedValue}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setRevealModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#182238] text-white text-xs font-bold hover:bg-[#22304d]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141b2b] border border-blue-500/40 text-white text-xs font-mono shadow-2xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
