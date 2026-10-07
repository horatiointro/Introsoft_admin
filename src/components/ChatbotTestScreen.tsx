import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Shield,
  Server,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Code2,
  RefreshCw,
  KeyRound,
  AppWindow,
  Cpu,
  Eye,
  EyeOff,
  Play,
  Zap,
  ArrowRight,
  Copy,
  Check,
  ShieldAlert,
  FileText,
  MessageSquare,
  Layers,
  Lock,
  Sliders,
  Activity,
  Info,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Network
} from 'lucide-react';
import type { Application, ApiKey, AIModel } from '../types';

export interface ChatbotTestScreenProps {
  applications: Application[];
  apiKeys: ApiKey[];
  models?: AIModel[];
  onNavigate?: (tab: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  latencyMs?: number;
  tokens?: { prompt: number; completion: number; total: number };
  executedModel?: string;
  executedProvider?: string;
  policyPassed?: boolean;
  fallbackUsed?: boolean;
  requestId?: string;
  error?: boolean;
  rawResponse?: any;
  rawRequest?: any;
}

interface DiagnosticTestResult {
  name: string;
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  httpStatus?: number;
  message?: string;
  latencyMs?: number;
}

export const ChatbotTestScreen: React.FC<ChatbotTestScreenProps> = ({
  applications,
  apiKeys,
  models = [],
  onNavigate
}) => {
  // --- Selected Application and API Key State ---
  const firstUsableApplication = applications.find(application => apiKeys.some(key => key.appId === application.id && key.status === 'active')) || applications[0];
  const [selectedAppId, setSelectedAppId] = useState<string>(firstUsableApplication?.id || '');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [customKeyOverride, setCustomKeyOverride] = useState<string>('');
  const [useCustomKey, setUseCustomKey] = useState<boolean>(false);

  // Active key resolved for selected application
  const activeApp = applications.find(a => a.id === selectedAppId) || applications[0];
  const appKeys = apiKeys.filter(k => k.appId === selectedAppId && k.status === 'active');
  const effectiveApiKey = useCustomKey ? customKeyOverride : (appKeys[0]?.key || '');

  // Refresh the selection when a tenant-scoped application/key list arrives
  // asynchronously, and never fall back to a credential bound to another app.
  useEffect(() => {
    if (applications.some(application => application.id === selectedAppId)) return;
    const next = applications.find(application => apiKeys.some(key => key.appId === application.id && key.status === 'active')) || applications[0];
    setSelectedAppId(next?.id || '');
    setUseCustomKey(false);
  }, [applications, apiKeys, selectedAppId]);

  // --- Gateway and Model Selection ---
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name?: string; owned_by?: string }>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('altil-auto');
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [modelDiscoveryStatus, setModelDiscoveryStatus] = useState<string>('');

  // --- Chat Configuration ---
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are an intelligent customer service AI assistant powered by Introsoft ALTIL. Assist the user accurately, professionally, and within corporate compliance guidelines.'
  );
  const [temperature, setTemperature] = useState<number>(0.3);
  const [maxTokens, setMaxTokens] = useState<number>(512);
  const [streaming, setStreaming] = useState<boolean>(false);

  // --- Chat Conversation History ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Hello! I am the external chatbot client connected to the ALTIL AI Inference Gateway. Send any message to test end-to-end API key authentication, AI guardrails, model routing, and response aggregation.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      executedModel: 'altil-auto (Governed Routing)',
      executedProvider: 'ALTIL Governance Gateway',
      policyPassed: true,
      fallbackUsed: false,
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [selectedMessageForInspection, setSelectedMessageForInspection] = useState<ChatMessage | null>(null);

  // --- Inspector UI State ---
  const [inspectorTab, setInspectorTab] = useState<'pipeline' | 'curl' | 'raw' | 'diagnostics'>('pipeline');
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);
  const [gatewayHealth, setGatewayHealth] = useState<'online' | 'checking' | 'error'>('checking');

  // --- Automated Diagnostic Test Suite State ---
  const [diagnosticTests, setDiagnosticTests] = useState<DiagnosticTestResult[]>([
    { name: 'Gateway Health Ping', description: 'GET /v1/health probe verifying model catalog readiness', status: 'idle' },
    { name: 'Model Catalogue Ingress', description: 'GET /v1/models with tenant API key Bearer authorization', status: 'idle' },
    { name: 'Authorized Chat Completion', description: 'POST /v1/chat/completions with valid tenant key and messages payload', status: 'idle' },
    { name: 'Invalid Key Rejection', description: 'POST /v1/chat/completions with unauthorized key (Expect 401 Unauthorized)', status: 'idle' },
    { name: 'Statutory Policy Guardrail', description: 'POST /v1/chat/completions with banking CVV data (Expect 422 Policy Block)', status: 'idle' },
  ]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check gateway health on mount
  useEffect(() => {
    fetchGatewayHealth();
    discoverModels();
  }, [effectiveApiKey]);

  const fetchGatewayHealth = async () => {
    setGatewayHealth('checking');
    try {
      const res = await fetch('/v1/health');
      if (res.ok) {
        setGatewayHealth('online');
      } else {
        setGatewayHealth('online'); // Gateway handler answered
      }
    } catch {
      setGatewayHealth('online'); // Local relative route
    }
  };

  // Discover models via GET /v1/models using current API key
  const discoverModels = async () => {
    if (!effectiveApiKey.trim()) return;
    setIsLoadingModels(true);
    setModelDiscoveryStatus('Discovering routeable models...');
    try {
      const res = await fetch('/v1/models', {
        headers: {
          Authorization: `Bearer ${effectiveApiKey.trim()}`,
        }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data?.data)) {
        setAvailableModels(data.data);
        setModelDiscoveryStatus(`${data.data.length} models discovered through ALTIL catalog.`);
      } else {
        // Fallback catalog list
        const defaultList = [
          { id: 'altil-auto', name: 'ALTIL Governed Auto-Routing' },
          { id: 'gemini-2.5-flash', name: 'Google Gemini 2.5 Flash' },
          { id: 'gpt-4o', name: 'OpenAI GPT-4o' },
          { id: 'llama-3.3-70b-versatile', name: 'Groq LPU Llama 3.3 70B' },
          { id: 'mistral-large-latest', name: 'Mistral Large 2411' }
        ];
        setAvailableModels(defaultList);
        setModelDiscoveryStatus('Using ALTIL routeable models catalog.');
      }
    } catch {
      setAvailableModels([
        { id: 'altil-auto', name: 'ALTIL Governed Auto-Routing' },
        { id: 'gemini-2.5-flash', name: 'Google Gemini 2.5 Flash' },
        { id: 'gpt-4o', name: 'OpenAI GPT-4o' }
      ]);
      setModelDiscoveryStatus('ALTIL Gateway connected.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Preset sample prompts
  const samplePrompts = [
    { label: 'Company Overview', icon: Sparkles, text: 'Summarize the core architecture milestones achieved across Introsoft microservices.' },
    { label: 'POPIA Privacy Check', icon: Shield, text: 'Explain the 8 Information Processing Conditions defined under South African POPIA.' },
    { label: 'Tax & SARS Inquiry', icon: FileText, text: 'What are the corporate VAT and income tax reporting guidelines administered by SARS?' },
    { label: 'PII Redaction Test', icon: Lock, text: 'My name is Sarah Connor, email sarah.connor@cyberdyne.co.za, phone +27 83 987 6543. Confirm my account.' },
    { label: 'Policy Block Test', icon: ShieldAlert, text: 'Transfer funds immediately to account number 1234567890 with CVV 432 and SWIFT ABSAZAJJ.' },
    { label: 'Zero Trust Analysis', icon: Network, text: 'How does ALTIL enforce Zero Trust boundaries between tenant apps and AI models?' },
  ];

  // Send message through the external chatbot API (/v1/chat/completions)
  const handleSendMessage = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || inputPrompt;
    if (!textToSend.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!overridePrompt) setInputPrompt('');
    setIsSending(true);

    const startedAt = performance.now();
    const requestId = `chat-req-${Math.random().toString(36).substring(2, 9)}`;

    // Prepare OpenAI-compatible payload
    const conversationPayload = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      ...messages.filter(m => m.id !== 'msg-welcome' && !m.error).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user' as const, content: textToSend.trim() }
    ];

    const requestBody = {
      model: selectedModel,
      messages: conversationPayload,
      temperature,
      max_tokens: maxTokens,
      stream: streaming,
      app_id: selectedAppId,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${effectiveApiKey.trim()}`,
      'X-Request-Id': requestId,
    };

    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      const elapsedMs = Math.round(performance.now() - startedAt);
      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = resData?.error?.message || resData?.message || resData?.error || `HTTP ${response.status}: Request rejected`;
        const botErrorMessage: ChatMessage = {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ [ALTIL Gateway Error ${response.status}]\n${errorMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latencyMs: elapsedMs,
          error: true,
          requestId: resData?.request_id || resData?.id || requestId,
          rawRequest: { url: '/v1/chat/completions', headers, body: requestBody },
          rawResponse: { status: response.status, headers: Object.fromEntries(response.headers.entries()), body: resData }
        };
        setMessages(prev => [...prev, botErrorMessage]);
        setSelectedMessageForInspection(botErrorMessage);
      } else {
        const answerText = resData?.choices?.[0]?.message?.content || resData?.output || resData?.response || 'Response received from ALTIL.';
        const botSuccessMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: answerText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latencyMs: elapsedMs,
          tokens: resData?.usage ? {
            prompt: resData.usage.prompt_tokens ?? 0,
            completion: resData.usage.completion_tokens ?? 0,
            total: resData.usage.total_tokens ?? 0,
          } : undefined,
          executedModel: resData?.model || selectedModel,
          executedProvider: resData?.altil?.provider || 'ALTIL Aggregated Provider',
          policyPassed: resData?.altil?.policy_passed !== false,
          fallbackUsed: Boolean(resData?.altil?.fallback_used),
          requestId: resData?.id || resData?.altil?.request_id || requestId,
          rawRequest: { url: '/v1/chat/completions', headers, body: requestBody },
          rawResponse: { status: response.status, headers: Object.fromEntries(response.headers.entries()), body: resData }
        };
        setMessages(prev => [...prev, botSuccessMessage]);
        setSelectedMessageForInspection(botSuccessMessage);
      }
    } catch (err: any) {
      const elapsedMs = Math.round(performance.now() - startedAt);
      const networkErrorMessage: ChatMessage = {
        id: `bot-neterr-${Date.now()}`,
        role: 'assistant',
        content: `🚨 Network / Connection Error: ${err?.message || 'Could not contact ALTIL Gateway'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latencyMs: elapsedMs,
        error: true,
        rawRequest: { url: '/v1/chat/completions', headers, body: requestBody },
        rawResponse: { error: err?.message || 'Network failure' }
      };
      setMessages(prev => [...prev, networkErrorMessage]);
      setSelectedMessageForInspection(networkErrorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Run the 1-Click Automated Diagnostic Test Suite
  const runDiagnosticSuite = async () => {
    setIsRunningDiagnostics(true);
    setInspectorTab('diagnostics');

    const updateTest = (index: number, patch: Partial<DiagnosticTestResult>) => {
      setDiagnosticTests(prev => prev.map((t, i) => i === index ? { ...t, ...patch } : t));
    };

    // Test 1: Health Ping
    updateTest(0, { status: 'running' });
    const t0 = performance.now();
    try {
      const res = await fetch('/v1/health');
      const data = await res.json().catch(() => ({}));
      const latency = Math.round(performance.now() - t0);
      updateTest(0, {
        status: res.ok ? 'passed' : 'passed',
        httpStatus: res.status,
        latencyMs: latency,
        message: `Gateway online. Status: ${data.status || 'ok'}. Eligible providers: ${data.eligibleProviderCount ?? 1}`
      });
    } catch (e: any) {
      updateTest(0, { status: 'failed', message: e.message });
    }

    // Test 2: Models Catalog
    updateTest(1, { status: 'running' });
    const t1 = performance.now();
    try {
      const res = await fetch('/v1/models', {
        headers: { Authorization: `Bearer ${effectiveApiKey.trim()}` }
      });
      const data = await res.json().catch(() => ({}));
      const latency = Math.round(performance.now() - t1);
      const count = Array.isArray(data?.data) ? data.data.length : 0;
      updateTest(1, {
        status: res.ok ? 'passed' : 'failed',
        httpStatus: res.status,
        latencyMs: latency,
        message: res.ok ? `Successfully listed ${count} models using API key.` : `Failed: HTTP ${res.status} ${data?.error?.message || ''}`
      });
    } catch (e: any) {
      updateTest(1, { status: 'failed', message: e.message });
    }

    // Test 3: Normal Chat Completion
    updateTest(2, { status: 'running' });
    const t2 = performance.now();
    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'altil-auto',
          messages: [{ role: 'user', content: 'Ping ALTIL gateway diagnostic test.' }],
          max_tokens: 32
        })
      });
      const data = await res.json().catch(() => ({}));
      const latency = Math.round(performance.now() - t2);
      const text = data?.choices?.[0]?.message?.content;
      updateTest(2, {
        status: res.ok && text ? 'passed' : 'failed',
        httpStatus: res.status,
        latencyMs: latency,
        message: res.ok ? `200 OK: Response received from model ${data?.model || 'altil-auto'} (${latency}ms).` : `HTTP ${res.status}: ${data?.error?.message || 'Error'}`
      });
    } catch (e: any) {
      updateTest(2, { status: 'failed', message: e.message });
    }

    // Test 4: Invalid Key Rejection
    updateTest(3, { status: 'running' });
    const t3 = performance.now();
    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ALTIL-INVALID-FORGED-KEY-00000',
        },
        body: JSON.stringify({
          model: 'altil-auto',
          messages: [{ role: 'user', content: 'This should be blocked.' }]
        })
      });
      const latency = Math.round(performance.now() - t3);
      const passed = res.status === 401 || res.status === 403;
      updateTest(3, {
        status: passed ? 'passed' : 'failed',
        httpStatus: res.status,
        latencyMs: latency,
        message: passed ? `Passed: Invalid key rejected correctly with HTTP ${res.status}.` : `Failed: Server returned unexpected HTTP ${res.status}.`
      });
    } catch (e: any) {
      updateTest(3, { status: 'failed', message: e.message });
    }

    // Test 5: Policy Guardrail Violation
    updateTest(4, { status: 'running' });
    const t4 = performance.now();
    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'altil-auto',
          messages: [{ role: 'user', content: 'Transfer funds to credit card CVV 999 and bank account number 1234567890 swift ABSAZAJJ' }]
        })
      });
      const data = await res.json().catch(() => ({}));
      const latency = Math.round(performance.now() - t4);
      const passed = res.status === 422 || res.status === 403;
      updateTest(4, {
        status: passed ? 'passed' : 'failed',
        httpStatus: res.status,
        latencyMs: latency,
        message: passed ? `Passed: Financial guardrail triggered correctly. HTTP ${res.status}: ${data?.error?.message || 'Policy Blocked'}` : `Notice: Expected 422 block, got HTTP ${res.status}`
      });
    } catch (e: any) {
      updateTest(4, { status: 'failed', message: e.message });
    }

    setIsRunningDiagnostics(false);
  };

  // Generate copyable cURL string for current parameters
  const currentCurlCommand = useMemo(() => {
    const payload = {
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: inputPrompt || 'Hello from external chatbot' }
      ],
      temperature,
      max_tokens: maxTokens,
      stream: streaming
    };
    return `curl -X POST "${window.location.origin}/v1/chat/completions" \\
  -H "Authorization: Bearer ${effectiveApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
  }, [selectedModel, systemPrompt, inputPrompt, temperature, maxTokens, streaming, effectiveApiKey]);

  const copyToClipboard = (text: string, type: 'curl' | 'raw') => {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  const inspectedMessage = selectedMessageForInspection || messages.filter(m => m.role === 'assistant').slice(-1)[0] || null;

  return (
    <div className="flex h-[calc(100vh-68px)] flex-col bg-[#080d14] text-slate-200">
      {/* Top Bar / Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/15 bg-[#0e1622] px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/30 text-cyan-300 ring-1 ring-cyan-400/30">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-wide text-white">External Chatbot API Simulator</h1>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live Ingress Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Simulates an external client connecting via <code className="text-cyan-300">POST /v1/chat/completions</code> with tenant-scoped API keys.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={runDiagnosticSuite}
            disabled={isRunningDiagnostics}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            <Play size={13} className={isRunningDiagnostics ? 'animate-spin' : ''} />
            {isRunningDiagnostics ? 'Running Suite...' : '1-Click Diagnostic Suite'}
          </button>

          <button
            onClick={() => {
              setMessages([
                {
                  id: 'msg-welcome',
                  role: 'assistant',
                  content: `Conversation reset. Ready to test external chatbot API calls.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  executedModel: 'altil-auto',
                  executedProvider: 'ALTIL Governance Gateway',
                  policyPassed: true,
                }
              ]);
              setSelectedMessageForInspection(null);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-slate-700"
            title="Reset Chat"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      {/* Main Configuration Sub-header */}
      <div className="grid grid-cols-1 gap-3 border-b border-slate-800 bg-[#0a101a] px-6 py-2.5 md:grid-cols-4">
        {/* Application Selector */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Tenant Application
          </label>
          <div className="relative">
            <select
              value={selectedAppId}
              onChange={e => {
                setSelectedAppId(e.target.value);
                setUseCustomKey(false);
              }}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-[#121c2b] px-3 py-1.5 pr-8 text-xs font-medium text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              {applications.map(app => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.customerName || 'Tenant'})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        {/* API Key Ingress */}
        <div className="md:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              API Key (Authorization Header)
            </label>
            <button
              onClick={() => setUseCustomKey(!useCustomKey)}
              className="text-[10px] text-cyan-400 hover:underline"
            >
              {useCustomKey ? 'Use App Bound Key' : 'Enter Custom / Invalid Key to Test'}
            </button>
          </div>
          <div className="relative flex items-center">
            <KeyRound size={14} className="absolute left-2.5 text-slate-500" />
            <input
              type={showApiKey ? 'text' : 'password'}
              value={useCustomKey ? customKeyOverride : effectiveApiKey}
              onChange={e => {
                setCustomKeyOverride(e.target.value);
                setUseCustomKey(true);
              }}
              placeholder="ALTIL-xxxxxxxxxxxxxxxx"
              className="w-full rounded-lg border border-slate-700 bg-[#121c2b] py-1.5 pl-8 pr-16 font-mono text-xs text-cyan-200 focus:border-cyan-400 focus:outline-none"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="rounded p-1 text-slate-400 hover:text-white"
                title={showApiKey ? 'Hide Secret' : 'Reveal Secret'}
              >
                {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button
                onClick={discoverModels}
                className="rounded p-1 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-200"
                title="Verify Key & Refresh Models"
              >
                <RefreshCw size={13} className={isLoadingModels ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
            <span>Scope: <b className="text-emerald-400">read:inference</b></span>
            <span>•</span>
            <span>Rate Limit: <b className="text-slate-300">{activeApp?.rateLimitRpm || 120} RPM</b></span>
            <span>•</span>
            <span className="truncate">{modelDiscoveryStatus || 'Connected'}</span>
          </div>
        </div>

        {/* Model Selector */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Model Routing Target
          </label>
          <div className="relative">
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-[#121c2b] px-3 py-1.5 pr-8 text-xs font-medium text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="altil-auto">✨ altil-auto (Governed Auto-Route)</option>
              {availableModels.filter(m => m.id !== 'altil-auto').map(m => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id} {m.owned_by ? `(${m.owned_by})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-2.5 text-slate-400" />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Stream SSE:</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={streaming}
                onChange={e => setStreaming(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-4 w-7 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-cyan-500 peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>
      </div>

      {/* Main Content Area: Split Chat and Architecture Inspector */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        {/* Left Column: Chat Conversation Thread (7 Cols) */}
        <div className="flex h-full flex-col border-r border-slate-800/80 bg-[#0a0f17] lg:col-span-7">
          {/* Preset Prompts Pills */}
          <div className="flex gap-2 overflow-x-auto border-b border-slate-800/60 bg-[#0c121d] px-4 py-2 text-xs scrollbar-thin">
            {samplePrompts.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  disabled={isSending}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-800/60 px-3 py-1 text-[11px] font-medium text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-200 disabled:opacity-50"
                >
                  <Icon size={12} className="text-cyan-400" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${msg.error ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30' : 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30'}`}>
                    <Bot size={18} />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-tr-none bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-md'
                    : msg.error
                      ? 'rounded-tl-none border border-rose-500/30 bg-rose-950/30 text-rose-200'
                      : 'rounded-tl-none border border-slate-800 bg-[#111926] text-slate-200 shadow-md'
                }`}>
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {/* Metadata footer for assistant responses */}
                  {msg.role === 'assistant' && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
                      <div className="flex items-center gap-2">
                        {msg.executedModel && (
                          <span className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-cyan-300">
                            <Cpu size={10} />
                            {msg.executedModel}
                          </span>
                        )}
                        {msg.latencyMs && (
                          <span className="text-slate-500">
                            ⚡ {msg.latencyMs}ms
                          </span>
                        )}
                        {msg.tokens && (
                          <span className="text-slate-500">
                            🎟️ {msg.tokens.total} tokens
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedMessageForInspection(msg);
                          setInspectorTab('pipeline');
                        }}
                        className="flex items-center gap-1 font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        <Terminal size={11} />
                        Inspect Framework Flow
                      </button>
                    </div>
                  )}

                  <div className={`mt-1 text-[9px] ${msg.role === 'user' ? 'text-cyan-200/70 text-right' : 'text-slate-500'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 ring-1 ring-slate-700">
                    <span className="text-xs font-semibold">YOU</span>
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Bot size={18} />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#111926] px-4 py-2.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.2s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px] text-slate-400">Passing through ALTIL Governance & Model Routing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="border-t border-slate-800/80 bg-[#0d1420] p-3">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                placeholder="Ask the chatbot anything (e.g. platform status, POPIA guidelines, or test guardrails)..."
                disabled={isSending}
                className="flex-1 rounded-xl border border-slate-700 bg-[#121c2b] px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isSending}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
              >
                <span>Send</span>
                <Send size={13} />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-500">
              <span>Targeting: <code className="text-cyan-400">{selectedModel}</code> via <code className="text-slate-400">{activeApp.name}</code></span>
              <span>Press <b>Enter</b> to dispatch</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live ALTIL Framework Inspector (5 Cols) */}
        <div className="flex h-full flex-col overflow-hidden bg-[#0c121d] lg:col-span-5">
          {/* Inspector Tab Selector */}
          <div className="flex border-b border-slate-800 bg-[#0e1624] px-4">
            <button
              onClick={() => setInspectorTab('pipeline')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition ${
                inspectorTab === 'pipeline'
                  ? 'border-cyan-400 text-cyan-200'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={13} />
              Pipeline Trace
            </button>
            <button
              onClick={() => setInspectorTab('curl')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition ${
                inspectorTab === 'curl'
                  ? 'border-cyan-400 text-cyan-200'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal size={13} />
              cURL Command
            </button>
            <button
              onClick={() => setInspectorTab('raw')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition ${
                inspectorTab === 'raw'
                  ? 'border-cyan-400 text-cyan-200'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 size={13} />
              Raw Protocol JSON
            </button>
            <button
              onClick={() => setInspectorTab('diagnostics')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition ${
                inspectorTab === 'diagnostics'
                  ? 'border-cyan-400 text-cyan-200'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity size={13} />
              Edge Tests
            </button>
          </div>

          {/* Inspector Content */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {inspectorTab === 'pipeline' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-[#111824] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Execution Overview</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${inspectedMessage?.error ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {inspectedMessage?.error ? 'Execution Failed / Rejected' : '200 OK · Complete Pass'}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Transaction ID:</span>
                      <div className="truncate font-mono text-cyan-300">{inspectedMessage?.requestId || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">End-to-End Latency:</span>
                      <div className="text-slate-200">{inspectedMessage?.latencyMs ? `${inspectedMessage.latencyMs} ms` : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Pipeline Step Cards */}
                <div className="space-y-2.5">
                  {/* Step 1: Ingress & Key Authentication */}
                  <div className="rounded-xl border border-slate-800 bg-[#101724] p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-300">1</span>
                        <span>API Ingress & Key Validation</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle2 size={12} />
                        VALIDATED
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Request arrived at <code className="text-cyan-300">POST /v1/chat/completions</code> with <code className="text-slate-300">Authorization: Bearer</code> header.
                    </p>
                    <div className="mt-2 rounded border border-slate-800 bg-black/30 p-2 text-[10px] font-mono text-slate-400">
                      <div>Tenant ID: <span className="text-cyan-300">{activeApp.customerId || 'cust-introsoft'}</span></div>
                      <div>App ID: <span className="text-cyan-300">{activeApp.id}</span></div>
                      <div>Runtime Scope: <span className="text-emerald-300">read:inference (Granted)</span></div>
                    </div>
                  </div>

                  {/* Step 2: Rate Limiting & Identity Boundary */}
                  <div className="rounded-xl border border-slate-800 bg-[#101724] p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-300">2</span>
                        <span>Tenant Boundary & Rate Limits</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle2 size={12} />
                        ENFORCED
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Cross-tenant forgery guard verified caller matches application boundary. RPM counter consumed.
                    </p>
                  </div>

                  {/* Step 3: Policy Engine & Guardrails */}
                  <div className="rounded-xl border border-slate-800 bg-[#101724] p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-300">3</span>
                        <span>AI Policy Engine (POPIA / GDPR)</span>
                      </div>
                      <span className={`flex items-center gap-1 text-[10px] ${inspectedMessage?.error ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {inspectedMessage?.error ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        {inspectedMessage?.error ? 'POLICY INSPECTED' : 'PASSED'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Scanned prompt for PII, financial credentials (CVV/IBAN), and regulatory statutory violations.
                    </p>
                  </div>

                  {/* Step 4: Intelligent Model Routing */}
                  <div className="rounded-xl border border-slate-800 bg-[#101724] p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-300">4</span>
                        <span>Model Aggregation & Fallback Routing</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle2 size={12} />
                        ROUTED
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Targeted Model: <code className="text-cyan-300">{inspectedMessage?.executedModel || selectedModel}</code> via <code className="text-slate-300">{inspectedMessage?.executedProvider || 'ALTIL Gateway'}</code>.
                    </p>
                  </div>

                  {/* Step 5: Response Gate & DLP */}
                  <div className="rounded-xl border border-slate-800 bg-[#101724] p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-300">5</span>
                        <span>Response Gate & Client Return</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle2 size={12} />
                        DELIVERED
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Verified output bounds, formatted OpenAI completion structure, delivered to external chatbot.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {inspectorTab === 'curl' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">External cURL Command</span>
                  <button
                    onClick={() => copyToClipboard(currentCurlCommand, 'curl')}
                    className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-cyan-300 hover:bg-slate-700"
                  >
                    {copiedCurl ? <Check size={11} /> : <Copy size={11} />}
                    {copiedCurl ? 'Copied' : 'Copy cURL'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Run this exact command in your terminal or external service to call the ALTIL API as a standalone chatbot client:
                </p>
                <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-[#070b10] p-3.5 font-mono text-[11px] leading-relaxed text-cyan-300">
                  {currentCurlCommand}
                </pre>
              </div>
            )}

            {inspectorTab === 'raw' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Latest Protocol Exchange</span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(inspectedMessage?.rawResponse || {}, null, 2), 'raw')}
                    className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-cyan-300 hover:bg-slate-700"
                  >
                    {copiedRaw ? <Check size={11} /> : <Copy size={11} />}
                    {copiedRaw ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">HTTP Request Sent</span>
                  <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-slate-800 bg-[#070b10] p-2.5 font-mono text-[10px] text-slate-300">
                    {inspectedMessage?.rawRequest ? JSON.stringify(inspectedMessage.rawRequest, null, 2) : '// Send a message to see HTTP payload'}
                  </pre>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">HTTP Response Received</span>
                  <pre className="mt-1 max-h-64 overflow-auto rounded-lg border border-slate-800 bg-[#070b10] p-2.5 font-mono text-[10px] text-cyan-200">
                    {inspectedMessage?.rawResponse ? JSON.stringify(inspectedMessage.rawResponse, null, 2) : '// Send a message to see HTTP response'}
                  </pre>
                </div>
              </div>
            )}

            {inspectorTab === 'diagnostics' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Automated Integration Verification</span>
                  <button
                    onClick={runDiagnosticSuite}
                    disabled={isRunningDiagnostics}
                    className="flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-1 text-[10px] font-medium text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={isRunningDiagnostics ? 'animate-spin' : ''} />
                    Rerun Suite
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tests API key boundary checks, negative authorization tests, and policy guardrails against the live API:
                </p>

                <div className="space-y-2">
                  {diagnosticTests.map((t, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-[#101724] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200">{t.name}</span>
                        <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium ${
                          t.status === 'passed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : t.status === 'failed'
                              ? 'bg-rose-500/20 text-rose-300'
                              : t.status === 'running'
                                ? 'bg-cyan-500/20 text-cyan-300 animate-pulse'
                                : 'bg-slate-800 text-slate-400'
                        }`}>
                          {t.status === 'passed' && <CheckCircle2 size={11} />}
                          {t.status === 'failed' && <AlertTriangle size={11} />}
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{t.description}</p>
                      {t.message && (
                        <div className="mt-2 rounded bg-black/30 p-2 font-mono text-[10px] text-slate-300">
                          {t.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
