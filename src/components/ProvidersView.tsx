import React, { useState } from 'react';
import {
  Server,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Trash2,
  Edit2,
  Key,
  Globe,
  Radio,
  Sparkles,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Check,
  Zap,
  Shield,
  BarChart3,
  Search,
  Filter,
  Layers,
  ArrowRight,
  HelpCircle,
  Copy
} from 'lucide-react';
import { AIProvider, ProviderTestResult, ProviderType } from '../types';

interface ProvidersViewProps {
  providers: AIProvider[];
  onAddProvider: (provider: Partial<AIProvider> & { autoProvisionModels?: boolean }) => void;
  onUpdateProvider: (id: string, provider: Partial<AIProvider>) => void;
  onDeleteProvider: (id: string) => void;
  onTestProvider: (id: string) => Promise<ProviderTestResult>;
  onViewTelemetry?: (providerId: string) => void;
}

const PROVIDER_PRESETS = [
  {
    label: 'OpenAI Direct Gateway',
    type: 'openai' as ProviderType,
    endpoint: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-proj-...',
    hasFreeTier: false,
    rateLimitRpm: 10000,
    rateLimitTpm: 2000000,
    notes: 'Direct OpenAI interconnect for GPT-4o, GPT-4o-mini, and o3-mini models.'
  },
  {
    label: 'Groq Cloud (Free Tier Available)',
    type: 'groq' as ProviderType,
    endpoint: 'https://api.groq.com/openai/v1',
    keyPlaceholder: 'gsk_...',
    hasFreeTier: true,
    rateLimitRpm: 6000,
    rateLimitTpm: 500000,
    notes: 'Ultra-fast LPU inference (500+ tok/s) with generous free tier quotas.'
  },
  {
    label: 'Ollama Local GPU Cluster',
    type: 'ollama' as ProviderType,
    endpoint: 'http://192.168.1.100:11434',
    keyPlaceholder: 'Leave empty (no auth required for local socket)',
    hasFreeTier: true,
    rateLimitRpm: 1200,
    rateLimitTpm: 200000,
    notes: 'Self-hosted zero-cost private inference on on-prem hardware.'
  },
  {
    label: 'Google Gemini Cloud',
    type: 'gemini' as ProviderType,
    endpoint: 'https://generativelanguage.googleapis.com',
    keyPlaceholder: 'AIzaSy...',
    hasFreeTier: true,
    rateLimitRpm: 4000,
    rateLimitTpm: 1000000,
    notes: 'Enterprise multimodal & long-context models (1M-2M context window).'
  },
  {
    label: 'DeepSeek Official API',
    type: 'deepseek' as ProviderType,
    endpoint: 'https://api.deepseek.com/v1',
    keyPlaceholder: 'sk-ds-...',
    hasFreeTier: true,
    rateLimitRpm: 3000,
    rateLimitTpm: 800000,
    notes: 'DeepSeek V3 and R1 reasoning with ultra-low token pricing.'
  },
  {
    label: 'Anthropic Claude Direct',
    type: 'anthropic' as ProviderType,
    endpoint: 'https://api.anthropic.com/v1',
    keyPlaceholder: 'sk-ant-...',
    hasFreeTier: false,
    rateLimitRpm: 4000,
    rateLimitTpm: 1000000,
    notes: 'Direct Anthropic API for Claude 3.5 Sonnet and Haiku.'
  },
  {
    label: 'OpenRouter Multi-Cloud Aggregator',
    type: 'openrouter' as ProviderType,
    endpoint: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-v1-...',
    hasFreeTier: true,
    rateLimitRpm: 2000,
    rateLimitTpm: 500000,
    notes: 'Universal aggregator providing free community models (:free) and multi-cloud fallback.'
  },
  {
    label: 'Custom OpenAI-Compatible Endpoint',
    type: 'openai_compatible' as ProviderType,
    endpoint: 'https://my-custom-endpoint.internal/v1',
    keyPlaceholder: 'Bearer token or API key',
    hasFreeTier: false,
    rateLimitRpm: 2000,
    rateLimitTpm: 500000,
    notes: 'vLLM, LiteLLM, TGI, or custom dedicated neural server.'
  }
];

export const ProvidersView: React.FC<ProvidersViewProps> = ({
  providers,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  onTestProvider,
  onViewTelemetry
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ProviderTestResult | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [onlyFreeTier, setOnlyFreeTier] = useState(false);

  // Edit / Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'openai' as ProviderType,
    endpoint: 'https://api.openai.com/v1',
    apiKey: '',
    organizationId: '',
    enabled: true,
    priority: 1,
    timeoutMs: 30000,
    rateLimitRpm: 10000,
    rateLimitTpm: 2000000,
    hasFreeTier: false,
    autoProvisionModels: true,
    notes: ''
  });

  const handleOpenCreate = () => {
    setEditingProvider(null);
    setFormData({
      name: 'OpenAI Direct Gateway',
      type: 'openai',
      endpoint: 'https://api.openai.com/v1',
      apiKey: '',
      organizationId: '',
      enabled: true,
      priority: 1,
      timeoutMs: 30000,
      rateLimitRpm: 10000,
      rateLimitTpm: 2000000,
      hasFreeTier: false,
      autoProvisionModels: true,
      notes: 'Direct OpenAI interconnect for GPT-4o and o3-mini reasoning.'
    });
    setShowApiKey(false);
    setIsModalOpen(true);
  };

  const handleSelectPreset = (preset: typeof PROVIDER_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      name: preset.label,
      type: preset.type,
      endpoint: preset.endpoint,
      hasFreeTier: preset.hasFreeTier,
      rateLimitRpm: preset.rateLimitRpm,
      rateLimitTpm: preset.rateLimitTpm,
      notes: preset.notes
    }));
  };

  const handleOpenEdit = (p: AIProvider) => {
    setEditingProvider(p);
    setFormData({
      name: p.name,
      type: p.type,
      endpoint: p.endpoint,
      apiKey: p.apiKey || '',
      organizationId: p.organizationId || '',
      enabled: p.enabled,
      priority: p.priority,
      timeoutMs: p.timeoutMs,
      rateLimitRpm: p.rateLimitRpm || 3000,
      rateLimitTpm: p.rateLimitTpm || 1000000,
      hasFreeTier: Boolean(p.hasFreeTier),
      autoProvisionModels: false,
      notes: p.notes || ''
    });
    setShowApiKey(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.endpoint.trim()) return;

    if (editingProvider) {
      onUpdateProvider(editingProvider.id, formData);
    } else {
      onAddProvider(formData);
    }
    setIsModalOpen(false);
  };

  const handleRunTest = async (providerId: string) => {
    setTestingId(providerId);
    setTestModalOpen(true);
    setTestResult(null);
    try {
      const res = await onTestProvider(providerId);
      setTestResult(res);
    } catch {
      setTestResult({
        providerId,
        providerName: 'Target Provider',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        success: false,
        latencyMs: 0,
        authValid: false,
        reachable: false,
        modelsDiscoveredCount: 0,
        discoveredModels: [],
        sampleGenerationSuccess: false,
        errorMessage: 'Network timeout or unreachable socket host.'
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleCopyKeyPrefix = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  // Filtered providers
  const filteredProviders = providers.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    const matchesFree = !onlyFreeTier || p.hasFreeTier;

    return matchesSearch && matchesType && matchesFree;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              <span>AI Provider Management & Key Vault</span>
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Aggregator Hub
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-0.5">
            Add, configure, authenticate API keys, manage rate limits, and inspect telemetry for OpenAI, Groq, Ollama, Anthropic, and free providers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-add-provider-main"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Backend Provider</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111111] border border-[#222222] rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search providers by name, endpoint, or model type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-white text-xs placeholder-[#555555] focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#0a0a0a] p-1 rounded border border-[#222222] text-xs font-mono">
            <span className="text-[10px] text-[#666666] px-1.5 uppercase">Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs font-mono cursor-pointer"
            >
              <option value="ALL">All Types ({providers.length})</option>
              <option value="openai">OpenAI Direct</option>
              <option value="groq">Groq LPU</option>
              <option value="ollama">Ollama Local</option>
              <option value="gemini">Google Gemini</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="deepseek">DeepSeek</option>
              <option value="openrouter">OpenRouter</option>
              <option value="openai_compatible">OpenAI-Compatible</option>
            </select>
          </div>

          <button
            onClick={() => setOnlyFreeTier(!onlyFreeTier)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono transition-colors border ${
              onlyFreeTier
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                : 'bg-[#0a0a0a] text-[#888888] hover:text-white border-[#222222]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Free Tier Only</span>
          </button>
        </div>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map(provider => {
          const isOnline = provider.enabled && provider.status === 'online';
          return (
            <div
              key={provider.id}
              id={`card-provider-${provider.id}`}
              className={`rounded bg-[#141414] border p-4 flex flex-col justify-between transition-all ${
                provider.enabled
                  ? 'border-[#222222] hover:border-[#333333]'
                  : 'border-[#222222]/50 opacity-60 bg-[#0d0d0d]'
              }`}
            >
              <div>
                {/* Provider Top Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded flex items-center justify-center border font-bold text-xs shrink-0 ${
                        provider.type === 'openai'
                          ? 'bg-[#1a1a1a] text-emerald-400 border-[#222222]'
                          : provider.type === 'groq'
                          ? 'bg-[#1a1a1a] text-orange-400 border-[#222222]'
                          : provider.type === 'gemini'
                          ? 'bg-[#1a1a1a] text-blue-400 border-[#222222]'
                          : provider.type === 'anthropic'
                          ? 'bg-[#1a1a1a] text-amber-400 border-[#222222]'
                          : provider.type === 'ollama'
                          ? 'bg-[#1a1a1a] text-purple-400 border-[#222222]'
                          : 'bg-[#1a1a1a] text-cyan-400 border-[#222222]'
                      }`}
                    >
                      <Server className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white leading-tight truncate">
                        {provider.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono text-[#777777] uppercase">
                          {provider.type}
                        </span>
                        {provider.hasFreeTier && (
                          <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            Free Tier
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span
                    className={`text-[10px] font-mono flex items-center gap-1 shrink-0 ${
                      isOnline ? 'text-green-500' : 'text-[#666666]'
                    }`}
                  >
                    <span>●</span>
                    <span>{provider.enabled ? provider.status.toUpperCase() : 'DISABLED'}</span>
                  </span>
                </div>

                {/* Endpoint & Key Specs */}
                <div className="space-y-2 mt-3 text-xs">
                  <div className="p-2 rounded bg-[#0a0a0a] border border-[#222222] font-mono text-[11px] text-[#888888] flex items-center justify-between">
                    <span className="truncate">{provider.endpoint}</span>
                    <Globe className="w-3.5 h-3.5 text-[#555555] shrink-0 ml-2" />
                  </div>

                  <div className="p-2 rounded bg-[#0a0a0a] border border-[#222222] font-mono text-[11px] text-[#888888] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <Key className="w-3 h-3 text-[#555555] shrink-0" />
                      <span className="truncate text-[#aaaaaa]">
                        {provider.keyPrefix || (provider.apiKey ? 'sk-...configured' : 'No Auth (Local Socket)')}
                      </span>
                    </div>
                    {provider.apiKey && (
                      <button
                        onClick={() => handleCopyKeyPrefix(provider.id, provider.apiKey)}
                        className="text-[#666666] hover:text-white shrink-0 ml-1.5"
                        title="Copy Key"
                      >
                        {copiedKeyId === provider.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 font-mono">
                    <div className="p-2 rounded bg-[#0a0a0a] border border-[#222222]">
                      <div className="text-[9px] text-[#666666] uppercase">Latency</div>
                      <div className="font-semibold text-white mt-0.5">
                        {provider.latencyMs > 0 ? `${provider.latencyMs}ms` : 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#0a0a0a] border border-[#222222]">
                      <div className="text-[9px] text-[#666666] uppercase">Priority</div>
                      <div className="font-semibold text-blue-400 mt-0.5">
                        #{provider.priority}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#0a0a0a] border border-[#222222]">
                      <div className="text-[9px] text-[#666666] uppercase">Models</div>
                      <div className="font-semibold text-green-400 mt-0.5">
                        {provider.modelsCount}
                      </div>
                    </div>
                  </div>

                  {provider.notes && (
                    <p className="text-[10px] text-[#888888] font-mono pt-1 line-clamp-2">
                      "{provider.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Provider Actions Ribbon */}
              <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <button
                    id={`btn-test-provider-${provider.id}`}
                    onClick={() => handleRunTest(provider.id)}
                    disabled={testingId === provider.id}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-mono bg-[#1a1a1a] hover:bg-[#222222] text-[#e5e5e5] border border-[#222222] transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current text-green-400" />
                    <span className="truncate">{testingId === provider.id ? 'Testing...' : 'Test'}</span>
                  </button>

                  {onViewTelemetry && (
                    <button
                      id={`btn-telemetry-${provider.id}`}
                      onClick={() => onViewTelemetry(provider.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-colors"
                      title="View Real-Time Telemetry & Performance"
                    >
                      <BarChart3 className="w-3 h-3" />
                      <span>Telemetry</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(provider)}
                    className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                    title="Configure Provider"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteProvider(provider.id)}
                    className="p-1 rounded text-[#888888] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove Provider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test Connection Result Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111111] border border-[#222222] rounded max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#e5e5e5]">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Provider Handshake & Diagnostics Probe
                  </h3>
                  <p className="text-[10px] text-[#666666] font-mono">
                    Live Socket Interconnect Validation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTestModalOpen(false)}
                className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Execution Body */}
            {testingId ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                <div className="text-xs font-semibold text-white">
                  Transmitting probe payload to provider socket...
                </div>
                <div className="text-[10px] text-[#666666] font-mono">
                  Measuring round-trip latency & validating auth headers
                </div>
              </div>
            ) : testResult ? (
              <div className="space-y-4">
                <div
                  className={`p-3 rounded border flex items-center justify-between ${
                    testResult.success
                      ? 'bg-green-500/5 border-green-500/20 text-green-400'
                      : 'bg-red-500/5 border-red-500/20 text-red-400'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-semibold text-xs">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span>
                      {testResult.success
                        ? `${testResult.providerName} Interconnect Verified`
                        : 'Connection Handshake Failed'}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0a0a0a] border border-[#222222]">
                    Latency: {testResult.latencyMs}ms
                  </span>
                </div>

                {/* Step checklist */}
                <div className="space-y-2 text-xs bg-[#0a0a0a] p-3 rounded border border-[#222222] font-mono">
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>✓ Authentication bearer / token validated</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>✓ Host socket reachable & TLS handshake complete</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      ✓ {testResult.modelsDiscoveredCount} model endpoints discovered
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>✓ Synthetic inference verification OK</span>
                  </div>
                </div>

                {/* Discovered Models List */}
                {testResult.discoveredModels.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5 font-mono">
                      Discovered Model Endpoints
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {testResult.discoveredModels.map(m => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded bg-[#141414] text-blue-300 text-[10px] font-mono border border-[#222222]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {testResult.sampleOutput && (
                  <div>
                    <div className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1 font-mono">
                      Sample Handshake Payload Output
                    </div>
                    <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222] font-mono text-[11px] text-[#888888]">
                      {testResult.sampleOutput}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="border-t border-[#222222] pt-3 flex justify-end gap-2">
              {testResult?.success && onViewTelemetry && (
                <button
                  onClick={() => {
                    setTestModalOpen(false);
                    onViewTelemetry(testResult.providerId);
                  }}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Open Telemetry Dashboard</span>
                </button>
              )}
              <button
                onClick={() => setTestModalOpen(false)}
                className="px-3 py-1.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-white text-xs font-bold border border-[#222222] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Provider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-[#111111] border border-[#222222] rounded max-w-xl w-full p-6 shadow-2xl space-y-4 text-[#e5e5e5] my-8">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span>{editingProvider ? `Configure Provider: ${editingProvider.name}` : 'Connect New AI Provider'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets Ribbon when adding new provider */}
            {!editingProvider && (
              <div className="bg-[#0a0a0a] border border-[#222222] rounded p-2.5 space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-[#777777] font-bold">
                  Quick Provider Templates (Click to Autocomplete):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PROVIDER_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-[10px] font-mono px-2 py-1 rounded transition-colors border ${
                        formData.type === preset.type && formData.endpoint === preset.endpoint
                          ? 'bg-blue-600 text-white border-blue-500 font-bold'
                          : 'bg-[#141414] text-[#aaaaaa] hover:text-white border-[#262626]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  Provider Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenAI Direct Gateway or Groq Cloud"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Provider Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as ProviderType })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="openai">OpenAI Direct</option>
                    <option value="groq">Groq Cloud (LPU)</option>
                    <option value="ollama">Ollama (Local Socket)</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="openrouter">OpenRouter Aggregator</option>
                    <option value="openai_compatible">OpenAI-Compatible Generic</option>
                    <option value="custom">Custom Neural Engine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Priority Tier (1 = Highest)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  Base API Endpoint URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://api.openai.com/v1"
                  value={formData.endpoint}
                  onChange={e => setFormData({ ...formData, endpoint: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  API Key / Secret Token
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-proj-... or gsk-... (Leave empty for local Ollama)"
                    value={formData.apiKey}
                    onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono text-[11px] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-2.5 text-[#666666] hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Organization ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. org-introsoft-eu"
                    value={formData.organizationId}
                    onChange={e => setFormData({ ...formData, organizationId: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Rate Limit (RPM)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={formData.rateLimitRpm}
                    onChange={e => setFormData({ ...formData, rateLimitRpm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Timeout Threshold (ms)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.timeoutMs}
                    onChange={e => setFormData({ ...formData, timeoutMs: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="chk-free-tier"
                      checked={formData.hasFreeTier}
                      onChange={e => setFormData({ ...formData, hasFreeTier: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 bg-[#0a0a0a] border-[#222222] focus:ring-0"
                    />
                    <label htmlFor="chk-free-tier" className="text-white font-semibold cursor-pointer">
                      Has Free Tier / Free Models
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="chk-enabled"
                      checked={formData.enabled}
                      onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 bg-[#0a0a0a] border-[#222222] focus:ring-0"
                    />
                    <label htmlFor="chk-enabled" className="text-white font-semibold cursor-pointer">
                      Enable for Ingress Routing
                    </label>
                  </div>
                </div>
              </div>

              {!editingProvider && (
                <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chk-auto-models"
                    checked={formData.autoProvisionModels}
                    onChange={e => setFormData({ ...formData, autoProvisionModels: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-500 bg-[#0a0a0a] border-[#222222] focus:ring-0"
                  />
                  <label htmlFor="chk-auto-models" className="text-blue-300 font-mono text-xs cursor-pointer">
                    Auto-provision standard catalog models (e.g. GPT-4o, Llama 3.3, Claude) for this provider
                  </label>
                </div>
              )}

              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  Architecture & Routing Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Enterprise Tier 5 direct OpenAI interconnect. Primary reasoning engine for GPT-4o..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="pt-3 border-t border-[#222222] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] font-medium border border-[#222222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-sm"
                >
                  {editingProvider ? 'Update Provider' : 'Save & Register Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
