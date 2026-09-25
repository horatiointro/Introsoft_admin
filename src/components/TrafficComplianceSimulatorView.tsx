import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Zap,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Lock,
  Key,
  Cpu,
  Server,
  Building2,
  Database,
  ArrowRight,
  ArrowDown,
  FileCheck,
  FileText,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  Search,
  ExternalLink,
  CheckCircle2,
  Sliders,
  Flame,
  Radio,
  Clock,
  Sparkles,
  Layers,
  Terminal,
  Activity,
  Globe
} from 'lucide-react';
import { ScopeHeaderBar } from './ScopeHeaderBar';
import {
  COMPANY_TRAFFIC_SCENARIOS,
  CompanyTrafficScenario,
  SimulationTrafficPacket,
  SimulatedLawViolation,
  VaultTokenRecord
} from '../utils/complianceSimulationEngine';

export const TrafficComplianceSimulatorView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'live_inspector' | 'token_vault' | 'violations_ledger' | 'db_audit_log'>('live_inspector');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(COMPANY_TRAFFIC_SCENARIOS[0].id);
  const [currentPacket, setCurrentPacket] = useState<SimulationTrafficPacket | null>(null);
  const [recentPackets, setRecentPackets] = useState<SimulationTrafficPacket[]>([]);
  const [vaultTokens, setVaultTokens] = useState<VaultTokenRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAutoStreaming, setIsAutoStreaming] = useState<boolean>(false);
  const [streamSpeed, setStreamSpeed] = useState<number>(3000); // ms
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFrameworkFilter, setSelectedFrameworkFilter] = useState<string>('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [revealedVaultTokens, setRevealedVaultTokens] = useState<Record<string, boolean>>({});
  const [inspectModalPacket, setInspectModalPacket] = useState<SimulationTrafficPacket | null>(null);
  const [activeDiffTab, setActiveDiffTab] = useState<'outbound' | 'inbound'>('outbound');

  const streamIntervalRef = useRef<any>(null);

  // Fetch initial simulated logs and vault from backend
  const fetchLogsAndVault = async () => {
    try {
      const [logsRes, vaultRes] = await Promise.all([
        fetch('/api/v1/compliance/simulated-logs', {
          headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('altil_auth_token') || 'ALTIL_TOKEN') }
        }),
        fetch('/api/v1/compliance/token-vault', {
          headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('altil_auth_token') || 'ALTIL_TOKEN') }
        })
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (Array.isArray(logsData) && logsData.length > 0) {
          setRecentPackets(logsData);
          if (!currentPacket) {
            setCurrentPacket(logsData[0]);
          }
        }
      }

      if (vaultRes.ok) {
        const vaultData = await vaultRes.json();
        if (Array.isArray(vaultData)) {
          setVaultTokens(vaultData);
        }
      }
    } catch (err) {
      console.warn('Failed to load simulation logs from backend:', err);
    }
  };

  useEffect(() => {
    fetchLogsAndVault();
  }, []);

  // Run single simulation scenario
  const handleSimulateScenario = async (scenarioId?: string) => {
    setLoading(true);
    try {
      const targetId = scenarioId || selectedScenarioId;
      const res = await fetch('/api/v1/compliance/simulate-traffic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('altil_auth_token') || 'ALTIL_TOKEN')
        },
        body: JSON.stringify({ scenarioId: targetId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.packet) {
          setCurrentPacket(data.packet);
          setRecentPackets(prev => [data.packet, ...prev.slice(0, 49)]);
          // Refresh vault tokens
          if (data.packet.tokenizedEntities && data.packet.tokenizedEntities.length > 0) {
            setVaultTokens(prev => [...data.packet.tokenizedEntities, ...prev]);
          }
        }
      }
    } catch (err) {
      console.error('Error executing traffic simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run batch simulation for all company scenarios
  const handleSimulateAllCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/compliance/simulate-traffic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('altil_auth_token') || 'ALTIL_TOKEN')
        },
        body: JSON.stringify({ runAll: true })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.packets && data.packets.length > 0) {
          setCurrentPacket(data.packets[0]);
          setRecentPackets(prev => [...data.packets, ...prev].slice(0, 60));
          await fetchLogsAndVault();
        }
      }
    } catch (err) {
      console.error('Error simulating all companies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear DB logs
  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all stored simulation traffic logs and cryptographic vault records from the database?')) {
      return;
    }
    try {
      const res = await fetch('/api/v1/compliance/simulated-logs', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + (localStorage.getItem('altil_auth_token') || 'ALTIL_TOKEN')
        }
      });
      if (res.ok) {
        setRecentPackets([]);
        setCurrentPacket(null);
        setVaultTokens([]);
        setRevealedVaultTokens({});
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  // Auto-stream effect
  useEffect(() => {
    if (isAutoStreaming) {
      streamIntervalRef.current = setInterval(() => {
        const randIdx = Math.floor(Math.random() * COMPANY_TRAFFIC_SCENARIOS.length);
        const scen = COMPANY_TRAFFIC_SCENARIOS[randIdx];
        handleSimulateScenario(scen.id);
      }, streamSpeed);
    } else {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    }

    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [isAutoStreaming, streamSpeed]);

  // Aggregate stats
  const totalSimulatedCalls = recentPackets.length;
  const totalPopiaViolations = recentPackets.reduce(
    (acc, p) => acc + (p.violations?.filter(v => v.framework === 'POPIA').length || 0),
    0
  );
  const totalGdprViolations = recentPackets.reduce(
    (acc, p) => acc + (p.violations?.filter(v => v.framework === 'GDPR').length || 0),
    0
  );
  const totalPciViolations = recentPackets.reduce(
    (acc, p) => acc + (p.violations?.filter(v => v.framework === 'PCI-DSS' || v.framework === 'CYBER_IP').length || 0),
    0
  );
  const totalFinesPreventedZar = recentPackets.reduce((acc, p) => acc + (p.finesPreventedZar || 0), 0);
  const totalFinesPreventedEur = recentPackets.reduce((acc, p) => acc + (p.finesPreventedEur || 0), 0);
  const totalSovereignReroutes = recentPackets.filter(p => p.sovereignRerouted).length;

  const currentScenario = COMPANY_TRAFFIC_SCENARIOS.find(s => s.id === selectedScenarioId) || COMPANY_TRAFFIC_SCENARIOS[0];

  // Filtering for logs
  const filteredPackets = recentPackets.filter(p => {
    if (selectedCompanyFilter !== 'ALL' && p.companyId !== selectedCompanyFilter) return false;
    if (selectedFrameworkFilter !== 'ALL') {
      const hasFw = p.violations?.some(v => v.framework === selectedFrameworkFilter);
      if (!hasFw) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCompany = p.companyName.toLowerCase().includes(q);
      const matchApp = p.sourceApp.toLowerCase().includes(q);
      const matchTx = p.transactionId.toLowerCase().includes(q);
      const matchViol = p.violations?.some(v => v.ruleName.toLowerCase().includes(q) || v.legalClause.toLowerCase().includes(q));
      if (!matchCompany && !matchApp && !matchTx && !matchViol) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Global Hierarchical Scope Bar */}
      <ScopeHeaderBar />

      {/* Hero Header & Control Bar */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-gradient-to-br from-indigo-600/10 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-gradient-to-tr from-emerald-600/10 via-cyan-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <Radio className={`w-3 h-3 ${isAutoStreaming ? 'text-emerald-400 animate-pulse' : 'text-blue-400'}`} />
                {isAutoStreaming ? 'LIVE AUTO-STREAM ACTIVE' : 'GATEWAY SIMULATOR'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                POPIA §14, §19, §26 + GDPR Art 5, 9, 17, 22
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                PCI-DSS v4.0 + Sovereign Routing
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-amber-400" />
              Interactive Enterprise Compliance & Threat Traffic Simulator
            </h1>
            <p className="text-sm text-[#999999] leading-relaxed">
              Simulate enterprise client traffic generating raw AI inference requests loaded with live statutory POPIA & GDPR law-breakers, PCI-DSS cardholder exposures, and prompt injections. Watch the ALTIL Gateway intercept, tokenize into the Cryptographic Vault, reroute to Sovereign local nodes, and scrub egress AI responses in real-time. All events are recorded directly to the persistent audit database.
            </p>
          </div>

          {/* Action Stream Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                id="btn-simulate-all-companies"
                onClick={handleSimulateAllCompanies}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {loading ? 'Simulating Fleet...' : 'Simulate All Company Calls'}
              </button>

              <button
                id="btn-toggle-auto-stream"
                onClick={() => setIsAutoStreaming(!isAutoStreaming)}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  isAutoStreaming
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/30 shadow-lg'
                    : 'bg-[#1e1e1e] hover:bg-[#282828] text-gray-200 border-[#333333]'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isAutoStreaming ? 'animate-pulse' : ''}`} />
                {isAutoStreaming ? 'Stop Stream' : 'Auto-Pilot Stream'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 bg-[#0d0d0d] p-1.5 rounded-lg border border-[#222222]">
              <span className="text-[11px] text-[#777777] font-mono px-2">Speed:</span>
              <div className="flex items-center gap-1">
                {[
                  { label: '1x (4s)', val: 4000 },
                  { label: '2x (2s)', val: 2000 },
                  { label: '5x (0.8s)', val: 800 }
                ].map(spd => (
                  <button
                    key={spd.val}
                    onClick={() => setStreamSpeed(spd.val)}
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                      streamSpeed === spd.val ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    {spd.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#222222]">
          <div className="bg-[#0f0f0f] border border-[#222222] rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase text-[#777777] block">Simulated Calls</span>
            <div className="text-xl font-bold font-mono text-white mt-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-400" />
              {totalSimulatedCalls}
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Stored in DB</span>
          </div>

          <div className="bg-[#0f0f0f] border border-amber-500/20 rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase text-amber-400 block">POPIA Violations</span>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              {totalPopiaViolations}
            </div>
            <span className="text-[10px] text-amber-500/80 mt-0.5 block">
              {(totalPopiaViolations > 0 ? `R${(totalFinesPreventedZar / 1000000).toFixed(1)}M` : 'R0')} fines prevented
            </span>
          </div>

          <div className="bg-[#0f0f0f] border border-blue-500/20 rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase text-blue-400 block">GDPR Violations</span>
            <div className="text-xl font-bold font-mono text-blue-300 mt-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-400" />
              {totalGdprViolations}
            </div>
            <span className="text-[10px] text-blue-500/80 mt-0.5 block">
              {(totalGdprViolations > 0 ? `€${(totalFinesPreventedEur / 1000000).toFixed(1)}M` : '€0')} fines prevented
            </span>
          </div>

          <div className="bg-[#0f0f0f] border border-purple-500/20 rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase text-purple-400 block">Vault Tokens</span>
            <div className="text-xl font-bold font-mono text-purple-300 mt-1 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-purple-400" />
              {vaultTokens.length}
            </div>
            <span className="text-[10px] text-purple-500/80 mt-0.5 block">Cryptographic UUIDs</span>
          </div>

          <div className="bg-[#0f0f0f] border border-emerald-500/20 rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block">Sovereign Reroutes</span>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              {totalSovereignReroutes}
            </div>
            <span className="text-[10px] text-emerald-500/80 mt-0.5 block">Local GPU Isolation</span>
          </div>

          <div className="bg-[#0f0f0f] border border-[#222222] rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase text-[#777777] block">PCI / Cyber Blocks</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              {totalPciViolations}
            </div>
            <span className="text-[10px] text-rose-500/80 mt-0.5 block">Zero Cloud Exposure</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-2">
        <div className="flex items-center gap-2">
          {[
            { id: 'live_inspector', label: 'Live Bi-Directional Packet Inspector', icon: Activity },
            { id: 'token_vault', label: 'Cryptographic Tokenization Vault', icon: Lock, badge: vaultTokens.length },
            { id: 'violations_ledger', label: 'Law-Breakers & Statutory Clauses', icon: ShieldAlert, badge: totalPopiaViolations + totalGdprViolations + totalPciViolations },
            { id: 'db_audit_log', label: 'Database Audit Ledger', icon: Database, badge: recentPackets.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-sim-${tab.id}`}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                    : 'text-[#888888] hover:text-white hover:bg-[#181818]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-[#222222] text-gray-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {recentPackets.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear DB Records
          </button>
        )}
      </div>

      {/* TAB 1: LIVE BI-DIRECTIONAL PACKET INSPECTOR */}
      {activeSubTab === 'live_inspector' && (
        <div className="space-y-6">
          {/* Scenario Selector Carousel / Chips */}
          <div className="bg-[#121212] border border-[#222222] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Select Enterprise Company AI Request Scenario
              </span>
              <span className="text-[11px] text-[#666666] font-mono">6 Preconfigured Law-Breaker Suites</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {COMPANY_TRAFFIC_SCENARIOS.map(scen => {
                const isSelected = selectedScenarioId === scen.id;
                return (
                  <div
                    key={scen.id}
                    onClick={() => {
                      setSelectedScenarioId(scen.id);
                      handleSimulateScenario(scen.id);
                    }}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10'
                        : 'bg-[#171717] border-[#252525] hover:border-[#3a3a3a] hover:bg-[#1c1c1c]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">{scen.companyName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#222222] text-gray-400 shrink-0">
                          {scen.requestedCapability}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#888888] mt-1 line-clamp-2">{scen.scenarioDescription}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#222222] flex items-center justify-between">
                      <div className="flex items-center gap-1 flex-wrap">
                        {scen.tags.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {t}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScenarioId(scen.id);
                          handleSimulateScenario(scen.id);
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] text-gray-300 hover:text-white'
                        }`}
                      >
                        <Play className="w-2.5 h-2.5" />
                        Run
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bi-Directional Animated Pipeline Diagram */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Live Ingress ➔ AI Core ➔ Egress Inspection Pipeline
              </span>
              {currentPacket && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#777777]">Transaction:</span>
                  <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {currentPacket.transactionId}
                  </span>
                </div>
              )}
            </div>

            {/* 5-Node Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
              {/* Node 1: Company Ingress */}
              <div className="bg-[#181818] border border-[#2d2d2d] rounded-lg p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">1. Company App</span>
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-xs font-bold text-white mt-1 truncate">
                    {currentPacket?.companyName || currentScenario.companyName}
                  </div>
                  <div className="text-[11px] text-[#777777] mt-0.5 truncate">
                    {currentPacket?.sourceApp || currentScenario.sourceApp}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#262626]">
                  <span className="text-[10px] font-mono text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {currentPacket?.violations?.length || currentScenario.tags.length} Law Breakers Ingested
                  </span>
                </div>
              </div>

              {/* Node 2: ALTIL Ingress Policy & Tokenizer */}
              <div className="bg-[#181818] border border-blue-500/40 rounded-lg p-3.5 flex flex-col justify-between relative shadow-lg shadow-blue-500/5">
                <div className="absolute -top-2 left-3 px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-600 text-white font-bold">
                  ALTIL INGRESS
                </div>
                <div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">2. Sanitizer & Vault</span>
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-xs font-bold text-white mt-1">Cryptographic Tokenizer</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {currentPacket?.tokenizedEntities?.length || 0} Entities Tokenized
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#262626]">
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Format-Preserved Vault
                  </span>
                </div>
              </div>

              {/* Node 3: AI Inference Core (Model Dispatch) */}
              <div className={`border rounded-lg p-3.5 flex flex-col justify-between ${
                currentPacket?.sovereignRerouted
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-[#181818] border-[#2d2d2d]'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">3. Inference Node</span>
                    <Cpu className={`w-3.5 h-3.5 ${currentPacket?.sovereignRerouted ? 'text-emerald-400' : 'text-blue-400'}`} />
                  </div>
                  <div className="text-xs font-bold text-white mt-1 truncate">
                    {currentPacket?.targetModel || currentScenario.preferredModel}
                  </div>
                  <div className="text-[11px] text-[#777777] mt-0.5 truncate">
                    {currentPacket?.targetProvider || currentScenario.preferredProvider}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#262626]">
                  {currentPacket?.sovereignRerouted ? (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Sovereign Local Node
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-400">
                      Standard Cloud Dispatch
                    </span>
                  )}
                </div>
              </div>

              {/* Node 4: ALTIL Egress Firewall */}
              <div className="bg-[#181818] border border-amber-500/40 rounded-lg p-3.5 flex flex-col justify-between relative shadow-lg shadow-amber-500/5">
                <div className="absolute -top-2 left-3 px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-600 text-white font-bold">
                  ALTIL EGRESS
                </div>
                <div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">4. Egress Firewall</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xs font-bold text-white mt-1">Anti-Hallucination Scan</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    De-tokenization Clearance
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#262626]">
                  <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Zero Egress Leakage
                  </span>
                </div>
              </div>

              {/* Node 5: Client Company Delivery */}
              <div className="bg-[#181818] border border-[#2d2d2d] rounded-lg p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">5. Secure Output</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xs font-bold text-white mt-1 truncate">
                    Safe Verified Payload
                  </div>
                  <div className="text-[11px] text-[#777777] mt-0.5">
                    {currentPacket?.latencyMs ? `${currentPacket.latencyMs}ms Total Latency` : 'Sub-30ms'}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#262626]">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    100% Compliant Delivery
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Ingress vs Egress Diff Viewer */}
          {currentPacket ? (
            <div className="bg-[#121212] border border-[#242424] rounded-xl overflow-hidden shadow-xl">
              <div className="bg-[#171717] px-5 py-3 border-b border-[#242424] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    Bi-Directional Payload Diff Inspection
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    currentPacket.actionTaken === 'SOVEREIGN_REROUTED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : currentPacket.actionTaken === 'BLOCKED_CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    ACTION: {currentPacket.actionTaken}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-[#0f0f0f] p-1 rounded-lg border border-[#262626]">
                  <button
                    onClick={() => setActiveDiffTab('outbound')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      activeDiffTab === 'outbound' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Outbound Ingress (Company ➔ AI)
                  </button>
                  <button
                    onClick={() => setActiveDiffTab('inbound')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      activeDiffTab === 'inbound' ? 'bg-amber-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Inbound Egress (AI ➔ Company)
                  </button>
                </div>
              </div>

              {activeDiffTab === 'outbound' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#242424]">
                  {/* Left Column: Untrusted Raw Payload */}
                  <div className="p-5 space-y-3 bg-[#131313]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs font-bold text-rose-400 uppercase font-mono">
                          Raw Untrusted Company Request
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">Unfiltered Prompt</span>
                    </div>

                    <div className="p-4 rounded-lg bg-[#0a0a0a] border border-rose-500/30 font-mono text-xs text-gray-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {currentPacket.outboundRawPrompt}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-gray-400 uppercase font-mono block">
                        Detected Law Breakers ({currentPacket.violations?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentPacket.violations?.map((v, i) => (
                          <span
                            key={i}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              v.severity === 'critical'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            [{v.framework}] {v.ruleName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Sanitized & Tokenized Dispatch */}
                  <div className="p-5 space-y-3 bg-[#131313]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-emerald-400 uppercase font-mono">
                          ALTIL Tokenized & Sanitized Prompt
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Dispatched to AI</span>
                    </div>

                    <div className="p-4 rounded-lg bg-[#0a0a0a] border border-emerald-500/30 font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {currentPacket.outboundSanitizedPrompt}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-gray-400 uppercase font-mono block">
                        Vault Replacement Mappings ({currentPacket.tokenizedEntities?.length || 0}):
                      </span>
                      <div className="space-y-1">
                        {currentPacket.tokenizedEntities?.map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px] font-mono p-1.5 rounded bg-[#1a1a1a] border border-[#2a2a2a]">
                            <span className="text-purple-400 font-bold">{t.tokenId}</span>
                            <span className="text-gray-500">➔</span>
                            <span className="text-gray-400">{t.maskedPreview} ({t.entityType})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#242424]">
                  {/* Left Column: Raw AI Model Response */}
                  <div className="p-5 space-y-3 bg-[#131313]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-amber-400 uppercase font-mono">
                          Raw Inbound Response from AI Model
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">Pre-Egress Scrubbing</span>
                    </div>

                    <div className="p-4 rounded-lg bg-[#0a0a0a] border border-amber-500/30 font-mono text-xs text-gray-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {currentPacket.inboundRawResponse}
                    </div>

                    <div className="text-[11px] text-[#777777]">
                      Scanned for hallucinated PII, cross-tenant leaks, or prompt reflection attacks before client app handoff.
                    </div>
                  </div>

                  {/* Right Column: Sanitized Response Handed to Company */}
                  <div className="p-5 space-y-3 bg-[#131313]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-emerald-400 uppercase font-mono">
                          ALTIL Egress-Sanitized Payload
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Returned to Company</span>
                    </div>

                    <div className="p-4 rounded-lg bg-[#0a0a0a] border border-emerald-500/30 font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {currentPacket.inboundSanitizedResponse}
                    </div>

                    <div className="text-[11px] text-emerald-400/80 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Audited by ALTIL Egress Firewall: Zero Statutory POPIA/GDPR liability returned.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#141414] border border-[#242424] rounded-xl">
              <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-gray-400">No simulation traffic executed yet.</p>
              <p className="text-xs text-gray-600 mt-1">Click &quot;Simulate All Company Calls&quot; or pick a scenario above.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CRYPTOGRAPHIC TOKENIZATION VAULT */}
      {activeSubTab === 'token_vault' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#242424] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  ALTIL Cryptographic Tokenization Vault
                </h3>
                <p className="text-xs text-[#888888] mt-1">
                  Sensitive PII and restricted identifiers are replaced with reversible, salted tokens before reaching upstream LLMs. The raw records reside securely in this vault with zero model training retention.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {vaultTokens.length} Active Cryptographic Tokens
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#242424] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181818] text-[#888888] uppercase text-[10px] font-mono border-b border-[#242424]">
                  <tr>
                    <th className="px-4 py-3">Token Identifier</th>
                    <th className="px-4 py-3">Entity Classification</th>
                    <th className="px-4 py-3">Masked Preview</th>
                    <th className="px-4 py-3">Raw Value (DPO Audit Clearance)</th>
                    <th className="px-4 py-3">Jurisdiction</th>
                    <th className="px-4 py-3">Retention Expiry</th>
                    <th className="px-4 py-3 text-right">Reversibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f1f]">
                  {vaultTokens.length > 0 ? (
                    vaultTokens.map((token, idx) => {
                      const isRevealed = revealedVaultTokens[token.tokenId];
                      return (
                        <tr key={idx} className="hover:bg-[#181818]/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-purple-400">
                            {token.tokenId}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#222222] text-gray-300 border border-[#333333]">
                              {token.entityType}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-300">
                            {token.maskedPreview}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <div className="flex items-center gap-2">
                              <span className={isRevealed ? 'text-amber-400 font-bold' : 'text-gray-600'}>
                                {isRevealed ? token.rawSensitiveValue : '••••••••••••••••'}
                              </span>
                              <button
                                onClick={() => {
                                  setRevealedVaultTokens(prev => ({
                                    ...prev,
                                    [token.tokenId]: !prev[token.tokenId]
                                  }));
                                }}
                                className="text-gray-500 hover:text-white p-1 rounded hover:bg-[#252525] transition-colors"
                                title={isRevealed ? 'Hide raw value' : 'Authorize DPO Reveal'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              token.jurisdiction.includes('POPIA')
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {token.jurisdiction}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#777777] font-mono text-[11px]">
                            {token.retentionExpiry}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              AES-256 REVERSIBLE
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500 text-xs font-mono">
                        Vault empty. Run a simulation scenario to populate cryptographic tokens.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LAW-BREAKERS & STATUTORY CLAUSES */}
      {activeSubTab === 'violations_ledger' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#242424] rounded-xl p-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Active Statutory Law-Breakers & Regulatory Enforcements
            </h3>
            <p className="text-xs text-[#888888] mt-1">
              Complete inventory of intercepted regulatory infractions across South African POPIA (Act 4 of 2013), EU GDPR (Regulation 2016/679), and PCI-DSS mandates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentPackets.flatMap(p => p.violations || []).slice(0, 20).map((v, i) => (
              <div key={i} className="bg-[#121212] border border-[#262626] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      v.framework === 'POPIA'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : v.framework === 'GDPR'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {v.framework}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{v.ruleName}</span>
                  </div>
                  <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                    v.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {v.severity}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-gray-300 bg-[#171717] p-2.5 rounded border border-[#252525]">
                  <span className="text-gray-500 block text-[9px] uppercase">Legal Clause & Section:</span>
                  {v.legalClause}
                </div>

                <p className="text-xs text-gray-400">{v.explanation}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#222222] text-[11px] font-mono">
                  <span className="text-gray-500">Remediation:</span>
                  <span className="text-emerald-400 font-bold">{v.remediationAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE AUDIT LEDGER */}
      {activeSubTab === 'db_audit_log' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#242424] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by company, app, transaction, or rule..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0e0e0e] border border-[#262626] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={selectedFrameworkFilter}
                onChange={e => setSelectedFrameworkFilter(e.target.value)}
                className="bg-[#0e0e0e] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
              >
                <option value="ALL">All Frameworks</option>
                <option value="POPIA">POPIA (South Africa)</option>
                <option value="GDPR">GDPR (European Union)</option>
                <option value="PCI-DSS">PCI-DSS / Cyber</option>
              </select>
            </div>

            <div className="text-xs font-mono text-[#888888]">
              Showing {filteredPackets.length} Stored Records
            </div>
          </div>

          <div className="bg-[#121212] border border-[#242424] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181818] text-[#888888] uppercase text-[10px] font-mono border-b border-[#242424]">
                  <tr>
                    <th className="px-4 py-3">Timestamp / TX</th>
                    <th className="px-4 py-3">Company & App</th>
                    <th className="px-4 py-3">Target AI Model</th>
                    <th className="px-4 py-3">Violations</th>
                    <th className="px-4 py-3">Action Taken</th>
                    <th className="px-4 py-3">Fines Prevented</th>
                    <th className="px-4 py-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f1f]">
                  {filteredPackets.length > 0 ? (
                    filteredPackets.map((pkt) => (
                      <tr key={pkt.id} className="hover:bg-[#181818]/60 transition-colors">
                        <td className="px-4 py-3 font-mono">
                          <div className="text-white font-bold">{pkt.transactionId}</div>
                          <div className="text-[10px] text-gray-500">{pkt.timestamp}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white font-semibold">{pkt.companyName}</div>
                          <div className="text-[10px] text-gray-400">{pkt.sourceApp}</div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <span className={`text-[10px] px-2 py-0.5 rounded ${
                            pkt.sovereignRerouted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#222222] text-gray-300'
                          }`}>
                            {pkt.targetModel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {pkt.violations?.slice(0, 2).map((v, idx) => (
                              <span key={idx} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                                {v.ruleName.slice(0, 18)}
                              </span>
                            ))}
                            {(pkt.violations?.length || 0) > 2 && (
                              <span className="text-[9px] font-mono px-1 rounded bg-[#222222] text-gray-400">
                                +{(pkt.violations?.length || 0) - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            pkt.actionTaken === 'SOVEREIGN_REROUTED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : pkt.actionTaken === 'BLOCKED_CRITICAL'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {pkt.actionTaken}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          {pkt.finesPreventedZar > 0 && (
                            <div className="text-amber-400 font-bold">
                              R{(pkt.finesPreventedZar / 1000000).toFixed(1)}M ZAR
                            </div>
                          )}
                          {pkt.finesPreventedEur > 0 && (
                            <div className="text-blue-400">
                              €{(pkt.finesPreventedEur / 1000000).toFixed(1)}M EUR
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setCurrentPacket(pkt);
                              setActiveSubTab('live_inspector');
                            }}
                            className="text-xs text-blue-400 hover:text-white px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-600 transition-colors font-semibold"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500 text-xs font-mono">
                        No audit records match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
