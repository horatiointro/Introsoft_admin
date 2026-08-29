import React, { useState } from 'react';
import {
  Network,
  GitFork,
  ShieldCheck,
  RotateCcw,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  Server,
  RefreshCw,
  Zap,
  Clock,
  FileText
} from 'lucide-react';
import {
  CmdbNode,
  CmdbDependency,
  ChangeRequestRecord,
  Vendor360Record,
  BcdrStatus
} from '../types';
import {
  initialCmdbNodes,
  initialCmdbDependencies,
  initialChangeRequests,
  initialVendor360,
  initialBcdrStatus
} from '../data/initialState';

export const EnterpriseOperationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cmdb' | 'change_mgmt' | 'bcdr' | 'vendor_360'>('cmdb');

  // CMDB state
  const [nodes, setNodes] = useState<CmdbNode[]>(initialCmdbNodes);
  const [dependencies, setDependencies] = useState<CmdbDependency[]>(initialCmdbDependencies);

  // Change management state
  const [changeRequests, setChangeRequests] = useState<ChangeRequestRecord[]>(initialChangeRequests);

  // Vendor 360 state
  const [vendors, setVendors] = useState<Vendor360Record[]>(initialVendor360);

  // BCDR state
  const [bcdr, setBcdr] = useState<BcdrStatus>(initialBcdrStatus);
  const [drExercising, setDrExercising] = useState(false);

  const handleRunDrExercise = () => {
    setDrExercising(true);
    setTimeout(() => {
      setDrExercising(false);
      setBcdr(prev => ({
        ...prev,
        lastDrTestDate: '2026-08-29',
        lastDrTestResult: 'PASSED',
        recoverySuccessPercent: 100
      }));
    }, 2500);
  };

  const degradedNodes = nodes.filter(n => n.status !== 'operational');

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
              ITIL Infrastructure & Resilience
            </span>
            <span className="text-xs text-emerald-400 font-mono">Operations Control & CMDB</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">CMDB, Change Management, BCDR & Vendor 360</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Visualize multi-tier dependency chains, execute controlled DR exercises, audit vendor concentration risk, and track ITIL changes.
          </p>
        </div>

        {degradedNodes.length > 0 && (
          <div className="px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            Impact Warning: {degradedNodes.length} Node Degraded (OpenAI US-East)
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222636] pb-3 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('cmdb')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'cmdb' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <Network className="w-3.5 h-3.5 text-blue-400" />
          CMDB & Service Dependency Map
        </button>
        <button
          onClick={() => setActiveTab('change_mgmt')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'change_mgmt' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <GitFork className="w-3.5 h-3.5 text-purple-400" />
          ITIL Change Management
        </button>
        <button
          onClick={() => setActiveTab('bcdr')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'bcdr' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          BCDR & Disaster Recovery Centre
        </button>
        <button
          onClick={() => setActiveTab('vendor_360')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'vendor_360' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          Vendor 360 & Resilience
        </button>
      </div>

      {/* 1. CMDB DEPENDENCY MAP */}
      {activeTab === 'cmdb' && (
        <div className="space-y-6">
          <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-blue-400" />
                  ALTIL CMDB Architecture Dependency Topology
                </h3>
                <p className="text-xs text-[#8890a6]">Tenant → Application → Gateway → Policy → Router → AI Provider → Model</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                Blast Radius: 2 Tenants / 4 Apps / 1 Degraded Provider Node
              </span>
            </div>

            {/* Visual Node Chain */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2">
              <div className="bg-[#161a26] border border-[#242c40] p-3 rounded-lg text-xs font-mono space-y-1">
                <span className="text-[10px] text-blue-400 uppercase font-bold">1. Tenants</span>
                <p className="text-white font-semibold">Discovery Health SA</p>
                <p className="text-[#8890a6]">Standard Bank</p>
              </div>
              <div className="bg-[#161a26] border border-[#242c40] p-3 rounded-lg text-xs font-mono space-y-1">
                <span className="text-[10px] text-purple-400 uppercase font-bold">2. Applications</span>
                <p className="text-white font-semibold">Clinical Note Summarizer</p>
                <p className="text-[#8890a6]">Fraud Copilot</p>
              </div>
              <div className="bg-[#161a26] border border-[#242c40] p-3 rounded-lg text-xs font-mono space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase font-bold">3. ALTIL Gateway</span>
                <p className="text-white font-semibold">Gateway Engine</p>
                <p className="text-emerald-400">12ms Latency</p>
              </div>
              <div className="bg-[#161a26] border border-[#242c40] p-3 rounded-lg text-xs font-mono space-y-1">
                <span className="text-[10px] text-amber-400 uppercase font-bold">4. Policy Engine</span>
                <p className="text-white font-semibold">POPIA Guard</p>
                <p className="text-[#8890a6]">4ms Processing</p>
              </div>
              <div className="bg-[#161a26] border border-[#242c40] p-3 rounded-lg text-xs font-mono space-y-1">
                <span className="text-[10px] text-cyan-400 uppercase font-bold">5. Router & Orchestrator</span>
                <p className="text-white font-semibold">Dynamic Fallback Matrix</p>
                <p className="text-cyan-400">Groq + Ollama Active</p>
              </div>
              <div className="bg-[#161a26] border border-[#242c40] p-3 rounded-lg text-xs font-mono space-y-1">
                <span className="text-[10px] text-rose-400 uppercase font-bold">6. Providers & Models</span>
                <p className="text-emerald-400 font-semibold">Groq (210ms)</p>
                <p className="text-amber-400">OpenAI (1420ms Spike)</p>
              </div>
            </div>

            <div className="overflow-x-auto pt-4">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#181c28] text-[#77809a] uppercase border-b border-[#242c40]">
                  <tr>
                    <th className="py-2.5 px-3">CMDB Node Name</th>
                    <th className="py-2.5 px-3">Node Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Latency Benchmark</th>
                    <th className="py-2.5 px-3">Operational Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2436] text-[#b0b8d0]">
                  {nodes.map(node => (
                    <tr key={node.id} className="hover:bg-[#161a26]">
                      <td className="py-2.5 px-3 font-semibold text-white">{node.name}</td>
                      <td className="py-2.5 px-3 text-blue-400 uppercase">{node.type}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          node.status === 'operational' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {node.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-white">{node.latencyMs ? `${node.latencyMs}ms` : '—'}</td>
                      <td className="py-2.5 px-3 text-[#8890a6]">{node.details || 'Operational without issue'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. CHANGE MANAGEMENT */}
      {activeTab === 'change_mgmt' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitFork className="w-4 h-4 text-purple-400" />
                ITIL Change Management & PIR Chain
              </h3>
              <p className="text-xs text-[#8890a6]">Traceable change requests linked to incidents: Change → Incident → Problem → Root Cause.</p>
            </div>
            <button className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono">
              + New Change Request
            </button>
          </div>

          <div className="space-y-3">
            {changeRequests.map(cr => (
              <div key={cr.id} className="bg-[#161a26] border border-[#242c40] rounded-xl p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">{cr.id}</span>
                    <span className="text-white font-bold">{cr.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                    {cr.approvalStatus}
                  </span>
                </div>
                <p className="text-[11px] text-[#8890a6] normal-case">{cr.impactDescription}</p>
                <div className="pt-2 border-t border-[#242c40] grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-[#77809a]">
                  <div>Requestor: <strong className="text-white">{cr.requestor}</strong></div>
                  <div>Type: <strong className="text-purple-400">{cr.type}</strong></div>
                  <div>Risk Level: <strong className="text-emerald-400">{cr.riskLevel}</strong></div>
                  <div>Planned Start: <strong className="text-white">{cr.plannedStart}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BCDR CENTRE */}
      {activeTab === 'bcdr' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                Business Continuity & Disaster Recovery (BCDR) Centre
              </h3>
              <p className="text-xs text-[#8890a6]">Cross-region failover readiness, RTO/RPO targets, and automated DR simulation exercises.</p>
            </div>
            <button
              onClick={handleRunDrExercise}
              disabled={drExercising}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 font-mono shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${drExercising ? 'animate-spin' : ''}`} />
              {drExercising ? 'RUNNING SIMULATED FAILOVER...' : 'RUN DR EXERCISE'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-[#161a26] border border-[#242c40] p-4 rounded-xl space-y-1">
              <span className="text-[#77809a] text-[10px] uppercase">RTO Target</span>
              <p className="text-xl font-bold text-emerald-400">{bcdr.rtoTargetHours} Hour Target</p>
              <span className="text-[10px] text-[#8890a6]">Actual DR Test: 24 mins</span>
            </div>
            <div className="bg-[#161a26] border border-[#242c40] p-4 rounded-xl space-y-1">
              <span className="text-[#77809a] text-[10px] uppercase">RPO Target</span>
              <p className="text-xl font-bold text-blue-400">{bcdr.rpoTargetMinutes} Mins Target</p>
              <span className="text-[10px] text-[#8890a6]">Sync Ledger: Zero Data Loss</span>
            </div>
            <div className="bg-[#161a26] border border-[#242c40] p-4 rounded-xl space-y-1">
              <span className="text-[#77809a] text-[10px] uppercase">DR Region Node</span>
              <p className="text-sm font-bold text-white truncate">{bcdr.drRegion}</p>
              <span className="text-[10px] text-emerald-400 font-bold">{bcdr.failoverReadiness}</span>
            </div>
            <div className="bg-[#161a26] border border-[#242c40] p-4 rounded-xl space-y-1">
              <span className="text-[#77809a] text-[10px] uppercase">Last DR Exercise</span>
              <p className="text-xl font-bold text-emerald-400">{bcdr.lastDrTestResult}</p>
              <span className="text-[10px] text-[#8890a6]">Executed: {bcdr.lastDrTestDate}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. VENDOR 360 */}
      {activeTab === 'vendor_360' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            Vendor 360 & Concentration Exposure Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendors.map(v => (
              <div key={v.id} className="bg-[#161a26] border border-[#242c40] rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{v.vendorName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    {v.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-[#242c40] text-[11px]">
                  <div className="flex justify-between"><span className="text-[#77809a]">Concentration Exposure:</span><span className="text-amber-400 font-bold">{v.concentrationRiskExposurePercent}% Traffic</span></div>
                  <div className="flex justify-between"><span className="text-[#77809a]">Data Residency:</span><span className="text-white">{v.dataResidency}</span></div>
                  <div className="flex justify-between"><span className="text-[#77809a]">DPA Signed:</span><span className="text-emerald-400 font-bold">{v.dpaSigned ? 'YES' : 'NO'}</span></div>
                  <div className="flex justify-between"><span className="text-[#77809a]">Failover Readiness:</span><span className="text-blue-400 font-bold">{v.drFailoverReadiness}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
