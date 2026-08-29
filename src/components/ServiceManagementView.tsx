import React, { useState } from 'react';
import {
  LineChart,
  Boxes,
  Workflow,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  FileText,
  DollarSign,
  UserCheck,
  Send,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';
import {
  SlaProfileDefinition,
  KpiDefinition,
  ServiceCatalogItem,
  ServiceDeskTicket,
  WorkflowRule
} from '../types';
import {
  initialSlaProfiles,
  initialKpiDefinitions,
  initialServiceCatalogue,
  initialServiceDeskTickets,
  initialWorkflows
} from '../data/initialState';

interface ServiceManagementViewProps {
  onNavigate?: (tab: any) => void;
}

export const ServiceManagementView: React.FC<ServiceManagementViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'sla_designer' | 'kpi_centre' | 'catalogue' | 'service_desk' | 'workflow_approvals'>('sla_designer');

  // SLA Designer State
  const [slaProfiles, setSlaProfiles] = useState<SlaProfileDefinition[]>(initialSlaProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(slaProfiles[0]?.id || 'sla-platinum');

  // KPI Management State
  const [kpis, setKpis] = useState<KpiDefinition[]>(initialKpiDefinitions);

  // Service Catalogue State
  const [catalogueItems, setCatalogueItems] = useState<ServiceCatalogItem[]>(initialServiceCatalogue);

  // Service Desk Tickets State
  const [tickets, setTickets] = useState<ServiceDeskTicket[]>(initialServiceDeskTickets);

  // Workflow rules state
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(initialWorkflows);

  const currentSlaProfile = slaProfiles.find(p => p.id === selectedProfileId) || slaProfiles[0];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              ITIL Enterprise Service Suite
            </span>
            <span className="text-xs text-emerald-400 font-mono">Service Management & SLA Engine</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Services, SLAs, KPIs & Service Catalogue</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Design reusable SLA profiles, monitor business & AI operational KPIs, publish ITIL Service Catalogues, and process approval workflows.
          </p>
        </div>
      </div>

      {/* Main Service Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222636] pb-3 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('sla_designer')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'sla_designer' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <LineChart className="w-3.5 h-3.5 text-blue-400" />
          SLA Designer & Metric Profiles
        </button>
        <button
          onClick={() => setActiveTab('kpi_centre')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'kpi_centre' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          KPI Management & Scorecards
        </button>
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'catalogue' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <Boxes className="w-3.5 h-3.5 text-purple-400" />
          ITIL Service Catalogue
        </button>
        <button
          onClick={() => setActiveTab('service_desk')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'service_desk' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <Send className="w-3.5 h-3.5 text-amber-400" />
          Service Request Desk
        </button>
        <button
          onClick={() => setActiveTab('workflow_approvals')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'workflow_approvals' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <Workflow className="w-3.5 h-3.5 text-cyan-400" />
          Approval & Workflow Engine
        </button>
      </div>

      {/* 1. SLA DESIGNER & PROFILES */}
      {activeTab === 'sla_designer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {slaProfiles.map(prof => (
              <div
                key={prof.id}
                onClick={() => setSelectedProfileId(prof.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedProfileId === prof.id
                    ? 'bg-[#181c28] border-blue-500 shadow-lg shadow-blue-500/10'
                    : 'bg-[#12141c] border-[#222636] hover:border-[#333b54]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{prof.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{prof.availabilityTargetPercent}%</span>
                </div>
                <p className="text-[11px] text-[#8890a6] line-clamp-2">{prof.description}</p>
                <div className="mt-3 pt-2 border-t border-[#222636] flex justify-between text-[10px] font-mono text-[#77809a]">
                  <span>P95: &lt;{prof.p95LatencyMsTarget}ms</span>
                  <span>RTO: {prof.rtoHours}h</span>
                </div>
              </div>
            ))}
          </div>

          {/* Configurable SLA Profile Matrix */}
          <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">SLA Metric Commitments for: {currentSlaProfile.name}</h3>
                <p className="text-xs text-[#8890a6]">Configuration Object: Tenant → SLA Profile → Individual SLA Metrics</p>
              </div>
              <button className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono">
                + Add Custom SLA Metric
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#181c28] text-[#77809a] uppercase border-b border-[#242c40]">
                  <tr>
                    <th className="py-2.5 px-3">SLA Commitment Metric</th>
                    <th className="py-2.5 px-3">Target Standard</th>
                    <th className="py-2.5 px-3">Measurement Window</th>
                    <th className="py-2.5 px-3">Breach Remediation Action</th>
                    <th className="py-2.5 px-3">Configurable Object Mapping</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2436] text-[#b0b8d0]">
                  <tr className="hover:bg-[#161a26]">
                    <td className="py-2.5 px-3 font-semibold text-white">Gateway Availability Uptime</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{currentSlaProfile.availabilityTargetPercent}% Target</td>
                    <td className="py-2.5 px-3 text-[#8890a6]">Monthly Rolling Window</td>
                    <td className="py-2.5 px-3 text-amber-400">{currentSlaProfile.penaltyCreditRatePercent}% Service Credit Accrual</td>
                    <td className="py-2.5 px-3 text-blue-400">{currentSlaProfile.id}.availabilityTargetPercent</td>
                  </tr>
                  <tr className="hover:bg-[#161a26]">
                    <td className="py-2.5 px-3 font-semibold text-white">P95 Response Latency</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">&lt;{currentSlaProfile.p95LatencyMsTarget} ms</td>
                    <td className="py-2.5 px-3 text-[#8890a6]">Hourly Aggregation</td>
                    <td className="py-2.5 px-3 text-amber-400">Automatic Groq/Ollama Fallback Trigger</td>
                    <td className="py-2.5 px-3 text-blue-400">{currentSlaProfile.id}.p95LatencyMsTarget</td>
                  </tr>
                  <tr className="hover:bg-[#161a26]">
                    <td className="py-2.5 px-3 font-semibold text-white">P99 Response Latency</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">&lt;{currentSlaProfile.p99LatencyMsTarget} ms</td>
                    <td className="py-2.5 px-3 text-[#8890a6]">Hourly Aggregation</td>
                    <td className="py-2.5 px-3 text-amber-400">P3 Operational Warning Alert</td>
                    <td className="py-2.5 px-3 text-blue-400">{currentSlaProfile.id}.p99LatencyMsTarget</td>
                  </tr>
                  <tr className="hover:bg-[#161a26]">
                    <td className="py-2.5 px-3 font-semibold text-white">P1 Emergency Incident Response</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">&lt;{currentSlaProfile.p1ResponseMinutes} mins Ack</td>
                    <td className="py-2.5 px-3 text-[#8890a6]">Per Incident Audit</td>
                    <td className="py-2.5 px-3 text-rose-400">Executive PagerDuty Escalation</td>
                    <td className="py-2.5 px-3 text-blue-400">{currentSlaProfile.id}.p1ResponseMinutes</td>
                  </tr>
                  <tr className="hover:bg-[#161a26]">
                    <td className="py-2.5 px-3 font-semibold text-white">RTO (Disaster Recovery Time)</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">&lt;{currentSlaProfile.rtoHours} Hour</td>
                    <td className="py-2.5 px-3 text-[#8890a6]">Quarterly DR Test</td>
                    <td className="py-2.5 px-3 text-purple-400">Automated Cross-Region Node Failover</td>
                    <td className="py-2.5 px-3 text-blue-400">{currentSlaProfile.id}.rtoHours</td>
                  </tr>
                  <tr className="hover:bg-[#161a26]">
                    <td className="py-2.5 px-3 font-semibold text-white">RPO (Disaster Recovery Point)</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">&lt;{currentSlaProfile.rpoMinutes} Minutes</td>
                    <td className="py-2.5 px-3 text-[#8890a6]">Continuous Audit Sync</td>
                    <td className="py-2.5 px-3 text-purple-400">Audit Ledger DB Replication</td>
                    <td className="py-2.5 px-3 text-blue-400">{currentSlaProfile.id}.rpoMinutes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. KPI MANAGEMENT CENTRE */}
      {activeTab === 'kpi_centre' && (
        <div className="space-y-6">
          <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Operational & Business Performance KPI Definitions
            </h3>
            <p className="text-xs text-[#8890a6]">
              SLAs are contractual commitments. KPIs measure internal operational health, AI quality, unit economics, and customer experience.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kpis.map(kpi => (
                <div key={kpi.id} className="bg-[#161a26] border border-[#242c40] rounded-xl p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{kpi.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      kpi.status === 'within_target' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {kpi.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8890a6] normal-case">{kpi.description}</p>
                  
                  <div className="pt-2 border-t border-[#22283a] space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#77809a]">Current Metric Value:</span>
                      <span className="text-emerald-400 font-bold">{kpi.currentValue} {kpi.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#77809a]">Target Standard:</span>
                      <span className="text-white">{kpi.targetValue} {kpi.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#77809a]">Evaluation Window:</span>
                      <span className="text-blue-400">{kpi.measurementPeriod}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. ITIL SERVICE CATALOGUE */}
      {activeTab === 'catalogue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalogueItems.map(item => (
              <div key={item.id} className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">{item.criticality.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  <p className="text-xs text-[#8890a6]">{item.description}</p>

                  <div className="bg-[#161a26] border border-[#242c40] rounded-lg p-3 text-xs font-mono space-y-1.5 mt-2">
                    <div className="flex justify-between"><span className="text-[#77809a]">Service Owner:</span><span className="text-white">{item.serviceOwner}</span></div>
                    <div className="flex justify-between"><span className="text-[#77809a]">Technical Owner:</span><span className="text-white">{item.technicalOwner}</span></div>
                    <div className="flex justify-between"><span className="text-[#77809a]">Pricing Structure:</span><span className="text-emerald-400">{item.pricingModel}</span></div>
                    <div className="flex justify-between"><span className="text-[#77809a]">Dependencies:</span><span className="text-blue-400">{item.dependencies.join(', ')}</span></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#222636] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#77809a]">SLA Tier: <strong className="text-white">{item.slaTier}</strong></span>
                  <button className="px-3 py-1 rounded bg-[#181c28] hover:bg-[#22283a] border border-[#283046] text-white text-[11px] font-semibold">
                    Request Provisioning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SERVICE REQUEST DESK */}
      {activeTab === 'service_desk' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-400" />
                Enterprise Service Desk & Change Request Portal
              </h3>
              <p className="text-xs text-[#8890a6]">Self-service portal for API keys, quota limit increases, IP whitelists, and model approvals.</p>
            </div>
            <button className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono">
              + Raise Service Ticket
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#181c28] text-[#77809a] uppercase border-b border-[#242c40]">
                <tr>
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Request Type</th>
                  <th className="py-2.5 px-3">Requestor & Tenant</th>
                  <th className="py-2.5 px-3">Current Approval Stage</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2436] text-[#b0b8d0]">
                {tickets.map(t => (
                  <tr key={t.id} className="hover:bg-[#161a26]">
                    <td className="py-2.5 px-3 font-bold text-blue-400">{t.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{t.requestType}</td>
                    <td className="py-2.5 px-3 text-[#8890a6]">{t.requestorName} ({t.tenantName})</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">{t.approvalStage}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-bold uppercase">
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. WORKFLOW & APPROVAL ENGINE */}
      {activeTab === 'workflow_approvals' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Workflow className="w-4 h-4 text-cyan-400" />
            Generic Workflow Engine: Trigger → Conditions → Approvals → Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map(wf => (
              <div key={wf.id} className="bg-[#161a26] border border-[#242c40] rounded-xl p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{wf.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">ENABLED</span>
                </div>
                <p className="text-[11px] text-[#8890a6] normal-case">{wf.description}</p>
                <div className="pt-2 border-t border-[#242c40] space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-[#77809a]">Trigger Event:</span><span className="text-blue-400">{wf.triggerEvent}</span></div>
                  <div className="flex justify-between"><span className="text-[#77809a]">Condition:</span><span className="text-amber-400">{wf.condition}</span></div>
                  <div className="flex justify-between"><span className="text-[#77809a]">Automated Action:</span><span className="text-emerald-400">{wf.action}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
