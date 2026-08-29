import React, { useState } from 'react';
import { AltilLogo } from './AltilLogo';
import {
  Play,
  Sparkles,
  Shield,
  Server,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Code,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Lock,
  AppWindow,
  KeyRound
} from 'lucide-react';
import {
  Application,
  ApiKey,
  RoutingRule,
  AIPolicy,
  OrchestrationRequest,
  OrchestrationResponse
} from '../types';

interface PlaygroundViewProps {
  applications: Application[];
  apiKeys: ApiKey[];
  routingRules: RoutingRule[];
  policies: AIPolicy[];
  onOrchestrate: (payload: OrchestrationRequest) => Promise<OrchestrationResponse>;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  applications,
  apiKeys,
  routingRules,
  policies,
  onOrchestrate
}) => {
  const [selectedAppId, setSelectedAppId] = useState(applications[0]?.id || 'app-introsoft');
  const [selectedCapability, setSelectedCapability] = useState('general_ai');
  const [promptText, setPromptText] = useState(
    'Please summarize the quarterly operational milestones and prepare a customer greeting for Introsoft platform users.'
  );
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<OrchestrationResponse | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'node' | 'python'>('curl');

  const selectedApp = applications.find(a => a.id === selectedAppId);
  const matchingKey = apiKeys.find(k => k.appId === selectedAppId && k.status === 'active') || apiKeys[0];

  const samplePresets = [
    {
      label: 'General AI Milestone Summary',
      appId: 'app-introsoft',
      capability: 'general_ai',
      prompt: 'Summarize the top three engineering deliverables achieved across Introsoft microservices this quarter.'
    },
    {
      label: 'Financial Summary (FinEduca)',
      appId: 'app-fineduca',
      capability: 'financial_summary',
      prompt: 'Analyze student monthly budgeting habits. Total discretionary income is $1,200. Suggest optimal savings allocation.'
    },
    {
      label: 'Security Analysis (MVI Secure)',
      appId: 'app-mvisecure',
      capability: 'security_analysis',
      prompt: 'Review system auth access log containing unexpected SSH connection attempts from IP 198.51.100.42 and evaluate threat level.'
    },
    {
      label: 'PII Scrubbing Test (SafeCircle)',
      appId: 'app-safecircle',
      capability: 'document_analysis',
      prompt: 'Extract support notes for customer Alice Smith (email: alice.smith@introsoft.co.uk, phone: +44 7911 123456) regarding account verification.'
    }
  ];

  const handleApplyPreset = (preset: typeof samplePresets[0]) => {
    setSelectedAppId(preset.appId);
    setSelectedCapability(preset.capability);
    setPromptText(preset.prompt);
  };

  const handleExecute = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await onOrchestrate({
        appId: selectedAppId,
        apiKey: matchingKey?.key || 'ALTIL-DEMO-SECRET-KEY',
        capability: selectedCapability,
        prompt: promptText,
        simulateProviderFailure: simulateFailure
      });
      setResponse(res);
    } catch (err: any) {
      setResponse({
        id: `err-${Date.now()}`,
        status: 'ERROR',
        capability: selectedCapability,
        executedModel: 'None',
        executedProvider: 'None',
        durationSeconds: 0.1,
        tokensConsumed: 0,
        output: `Error during orchestration: ${err.message || 'Internal connection error'}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const curlSnippet = `curl -X POST https://api.altil.internal/v1/orchestrate \\
  -H "Authorization: Bearer ${matchingKey?.key || 'ALTIL-DEMO-KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "capability": "${selectedCapability}",
    "prompt": "${promptText.replace(/\n/g, ' ')}"
  }'`;

  const nodeSnippet = `import { AltilClient } from '@introsoft/altil-sdk';

const altil = new AltilClient({
  apiKey: process.env.ALTIL_API_KEY // "${matchingKey?.prefix || 'ALTIL-...'}"
});

const response = await altil.orchestrate({
  capability: '${selectedCapability}',
  prompt: \`${promptText}\`
});

console.log(response.output);`;

  const pythonSnippet = `from altil import AltilClient

client = AltilClient(api_key="${matchingKey?.prefix || 'ALTIL-...'}")

response = client.orchestrate(
    capability="${selectedCapability}",
    prompt="""${promptText}"""
)

print(response.output)`;

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div className="flex items-center gap-3.5">
          <AltilLogo size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                ALTIL API Playground & Ingress Tester
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Interactive Testbench
              </span>
            </div>
            <p className="text-xs text-[#888888] mt-0.5">
              Simulate how Introsoft applications invoke ALTIL without needing to know which provider or model executes behind the scenes.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Presets Bar */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider font-mono">
          Quick Capability Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePresets.map(p => (
            <button
              key={p.label}
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 rounded bg-[#141414] hover:bg-[#1a1a1a] border border-[#222222] text-[#e5e5e5] text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Form: Caller Setup & Prompt (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded bg-[#141414] border border-[#222222] space-y-4 text-xs">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <AppWindow className="w-3.5 h-3.5 text-blue-400" />
              <span>1. Application Identity & Capability</span>
            </h2>

            {/* Application Selector */}
            <div>
              <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                Calling Application
              </label>
              <select
                value={selectedAppId}
                onChange={e => setSelectedAppId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.appIdentifier}) - {app.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Auth Key Preview */}
            <div className="p-2 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between font-mono text-[11px]">
              <span className="text-[#666666] flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-blue-400" />
                Token:
              </span>
              <span className="text-blue-400">
                {matchingKey?.prefix || 'ALTIL-LIVE-BEARER-KEY'}
              </span>
            </div>

            {/* Capability Hook */}
            <div>
              <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                Task / Capability Hook
              </label>
              <select
                value={selectedCapability}
                onChange={e => setSelectedCapability(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-blue-500/40 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="general_ai">general_ai (Default Reasoning)</option>
                <option value="financial_summary">financial_summary (FinEduca Rules)</option>
                <option value="security_analysis">security_analysis (MVI Secure)</option>
                <option value="document_analysis">document_analysis (Long Context)</option>
                <option value="code_generation">code_generation (Syntax & Refactor)</option>
                <option value="fast_chat">fast_chat (Sub-100ms LPU)</option>
              </select>
              <p className="text-[10px] text-[#666666] mt-1 font-mono">
                ✨ The caller specifies <strong>only the capability</strong>, not the model or provider.
              </p>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                User Prompt Payload
              </label>
              <textarea
                rows={5}
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                placeholder="Enter prompt text here..."
                className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans text-xs"
              />
            </div>

            {/* Simulation Options */}
            <div className="pt-2 border-t border-[#222222] space-y-2">
              <label className="flex items-center space-x-2.5 cursor-pointer text-[#e5e5e5]">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={e => setSimulateFailure(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 bg-[#0a0a0a] border-[#222222]"
                />
                <span className="text-[11px] font-mono text-yellow-400">
                  Simulate Primary Provider Failure (Triggers ALTIL Automatic Fallback)
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="btn-execute-orchestration"
              onClick={handleExecute}
              disabled={loading || !promptText.trim()}
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Orchestrating Through ALTIL...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute ALTIL Orchestration</span>
                </>
              )}
            </button>
          </div>

          {/* Client SDK Integration Snippet */}
          <div className="p-4 rounded bg-[#141414] border border-[#222222] text-xs space-y-2.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-400" />
                <span>Consuming App Code</span>
              </span>

              <div className="flex items-center space-x-1 p-0.5 bg-[#0a0a0a] rounded border border-[#222222]">
                {(['curl', 'node', 'python'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveSnippetTab(tab)}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                      activeSnippetTab === tab ? 'bg-[#1a1a1a] text-white font-bold border border-[#333333]' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="p-3 rounded bg-[#0a0a0a] border border-[#222222] text-[11px] text-[#888888] overflow-x-auto">
                {activeSnippetTab === 'curl'
                  ? curlSnippet
                  : activeSnippetTab === 'node'
                  ? nodeSnippet
                  : pythonSnippet}
              </pre>
              <button
                onClick={() =>
                  copyCode(
                    activeSnippetTab === 'curl'
                      ? curlSnippet
                      : activeSnippetTab === 'node'
                      ? nodeSnippet
                      : pythonSnippet
                  )
                }
                className="absolute right-2 top-2 p-1.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-white border border-[#222222]"
                title="Copy Code"
              >
                {copiedSnippet ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Output: 7-Step Pipeline Visualizer & Result (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded bg-[#141414] border border-[#222222] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>2. ALTIL Orchestration Lifecycle</span>
              </h2>

              {response && (
                <span
                  className={`text-[10px] font-mono flex items-center gap-1 ${
                    response.status === 'SUCCESS'
                      ? 'text-green-400'
                      : response.status === 'FALLBACK_SUCCESS'
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }`}
                >
                  <span>●</span>
                  <span>{response.status} ({response.durationSeconds}s)</span>
                </span>
              )}
            </div>

            {/* 7-Step Pipeline Indicators */}
            <div className="space-y-2 text-xs font-mono">
              {/* Step 1 */}
              <div className={`p-2 rounded border flex items-center justify-between ${
                response ? 'bg-[#0a0a0a] border-green-500/30 text-green-300' : 'bg-[#0a0a0a] border-[#222222] text-[#666666]'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <span className="w-4 h-4 rounded bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-[#888888]">1</span>
                  <span><strong className="text-white font-sans">Auth & Identity:</strong> Verified app "{selectedApp?.name}"</span>
                </div>
                {response && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />}
              </div>

              {/* Step 2 */}
              <div className={`p-2 rounded border flex items-center justify-between ${
                response ? 'bg-[#0a0a0a] border-green-500/30 text-green-300' : 'bg-[#0a0a0a] border-[#222222] text-[#666666]'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <span className="w-4 h-4 rounded bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-[#888888]">2</span>
                  <span><strong className="text-white font-sans">Policy Engine:</strong> PII scrubbing & financial protections evaluated</span>
                </div>
                {response && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />}
              </div>

              {/* Step 3 */}
              <div className={`p-2 rounded border flex items-center justify-between ${
                response ? 'bg-[#0a0a0a] border-green-500/30 text-green-300' : 'bg-[#0a0a0a] border-[#222222] text-[#666666]'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <span className="w-4 h-4 rounded bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-[#888888]">3</span>
                  <span><strong className="text-white font-sans">Capability Route Resolution:</strong> Hook "{selectedCapability}" resolved</span>
                </div>
                {response && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />}
              </div>

              {/* Step 4 & 5 (Dispatch & Fallback) */}
              <div className={`p-2 rounded border flex items-center justify-between ${
                response
                  ? response.fallbackTriggered
                    ? 'bg-[#0a0a0a] border-blue-500/40 text-blue-300'
                    : 'bg-[#0a0a0a] border-green-500/30 text-green-300'
                  : 'bg-[#0a0a0a] border-[#222222] text-[#666666]'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <span className="w-4 h-4 rounded bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-[#888888]">4</span>
                  <div>
                    <span><strong className="text-white font-sans">Dispatch & Egress:</strong> {response ? `Executed on ${response.executedProvider} / ${response.executedModel}` : 'Awaiting dispatch'}</span>
                    {response?.fallbackTriggered && (
                      <div className="text-[10px] text-blue-400 mt-0.5">
                        ⚡ Primary Tier failed: Cascaded to Tier 2 ({response.executedModel})
                      </div>
                    )}
                  </div>
                </div>
                {response && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1a1a1a] text-white border border-[#333333]">
                    {response.tokensConsumed} tokens
                  </span>
                )}
              </div>

              {/* Step 6 & 7 */}
              <div className={`p-2 rounded border flex items-center justify-between ${
                response ? 'bg-[#0a0a0a] border-green-500/30 text-green-300' : 'bg-[#0a0a0a] border-[#222222] text-[#666666]'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <span className="w-4 h-4 rounded bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-[#888888]">5</span>
                  <span><strong className="text-white font-sans">Audit Ledger:</strong> Recorded immutable transaction log</span>
                </div>
                {response && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />}
              </div>
            </div>

            {/* Generated Response Box */}
            <div className="pt-3 border-t border-[#222222]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Decoupled Model Output
                </span>
                {response && (
                  <span className="text-[10px] font-mono text-[#888888]">
                    Attributed: <strong className="text-blue-400">{response.executedProvider}</strong> ({response.executedModel})
                  </span>
                )}
              </div>

              <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222] text-xs text-[#e5e5e5] font-sans leading-relaxed min-h-[140px] whitespace-pre-wrap">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-28 space-y-2 text-[#888888]">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                    <span>Processing orchestration pipeline...</span>
                  </div>
                ) : response ? (
                  response.output
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-[#666666] italic">
                    Select an application and capability on the left, then click "Execute ALTIL Orchestration" to view results.
                  </div>
                )}
              </div>
            </div>

            {/* Raw JSON telemetry toggle */}
            {response && (
              <details className="text-xs text-[#888888] pt-2 border-t border-[#222222]">
                <summary className="cursor-pointer font-mono text-[10px] hover:text-white">
                  View Raw Ingress / Egress JSON Payload
                </summary>
                <pre className="mt-2 p-3 rounded bg-[#0a0a0a] border border-[#222222] font-mono text-[10px] text-blue-300 overflow-x-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
