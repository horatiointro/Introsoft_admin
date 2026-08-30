import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  Plus,
  ShieldAlert,
  Search,
  ChevronRight,
  Send,
  Sparkles,
  Zap,
  Kanban,
  Table as TableIcon,
  MessageSquare,
  Mail,
  Smartphone,
  Bell,
  RefreshCw,
  Building2,
  Filter,
  Layers,
  BookOpen
} from 'lucide-react';
import { Incident, ProblemRecord, MultiChannelAlert, Customer, Application, IncidentSeverity, IncidentStatus, RagKnowledgeArticle } from '../types';

interface IncidentCrmViewProps {
  incidents: Incident[];
  problems: ProblemRecord[];
  alerts: MultiChannelAlert[];
  customers: Customer[];
  applications: Application[];
  ragKnowledgeBase: RagKnowledgeArticle[];
  onOpenDiagnosticModal: (incident: Incident) => void;
  onAddIncident: (inc: Incident) => void;
  onUpdateIncidentStatus: (incidentId: string, status: IncidentStatus) => void;
  onSendMultiChannelAlert: (alert: Partial<MultiChannelAlert>) => void;
}

export const IncidentCrmView: React.FC<IncidentCrmViewProps> = ({
  incidents,
  problems,
  alerts,
  customers,
  applications,
  ragKnowledgeBase,
  onOpenDiagnosticModal,
  onAddIncident,
  onUpdateIncidentStatus,
  onSendMultiChannelAlert
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'alerts_testbench' | 'knowledge_base'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showLogModal, setShowLogModal] = useState(false);

  // Form state for logging new incident
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>('P1_CRITICAL');
  const [newCategory, setNewCategory] = useState<Incident['category']>('API_Gateway');
  const [newTenantId, setNewTenantId] = useState(customers[0]?.id || 'cust-fnb');
  const [newAppId, setNewAppId] = useState(applications[0]?.id || 'app-fnb-support');
  const [newCommander, setNewCommander] = useState('Horatio Huxham (BOC Commander)');
  const [newAssignedTeam, setNewAssignedTeam] = useState<Incident['assignedTeam']>('NOC');
  const [newSummary, setNewSummary] = useState('');
  const [newNotifySms, setNewNotifySms] = useState(true);
  const [newNotifyEmail, setNewNotifyEmail] = useState(true);
  const [newNotifyInApp, setNewNotifyInApp] = useState(true);

  // Form state for Alert Test Bench
  const [testRecipientPhone, setTestRecipientPhone] = useState('+27 82 555 0192');
  const [testRecipientEmail, setTestRecipientEmail] = useState('ciso@fnb.co.za');
  const [testAlertMessage, setTestAlertMessage] = useState('[ALTIL P1 ALERT] Latency spike detected on gateway route.');
  const [testSendChannels, setTestSendChannels] = useState<('sms' | 'email' | 'in_app')[]>(['sms', 'email', 'in_app']);
  const [testAlertSuccess, setTestAlertSuccess] = useState<string | null>(null);

  // Filtered incidents
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tenant = customers.find(c => c.id === newTenantId);
    const app = applications.find(a => a.id === newAppId);

    const created: Incident = {
      id: `INC-2026-${Math.floor(900 + Math.random() * 90)}`,
      title: newTitle,
      severity: newSeverity,
      status: 'reported',
      commander: newCommander,
      assignedTeam: newAssignedTeam,
      affectedTenantIds: [newTenantId],
      affectedTenantNames: [tenant?.name || newTenantId],
      affectedAppIds: [newAppId],
      affectedAppNames: [app?.name || newAppId],
      affectedServiceIds: ['srv-01'],
      startTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      slaImpacted: newSeverity === 'P1_CRITICAL',
      slaBreachMinutes: newSeverity === 'P1_CRITICAL' ? 15 : undefined,
      summary: newSummary || newTitle,
      category: newCategory,
      alertChannels: [
        ...(newNotifySms ? ['sms' as const] : []),
        ...(newNotifyEmail ? ['email' as const] : []),
        ...(newNotifyInApp ? ['in_app' as const] : [])
      ],
      smsAlertSent: newNotifySms,
      emailAlertSent: newNotifyEmail,
      inAppAlertSent: newNotifyInApp,
      timeline: [
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: newCommander,
          note: `Declared major incident (${newSeverity}). Dispatched multi-channel alerts.`
        }
      ]
    };

    onAddIncident(created);
    setShowLogModal(false);
    setNewTitle('');
    setNewSummary('');

    // Trigger alert testbench record
    if (newNotifySms || newNotifyEmail || newNotifyInApp) {
      onSendMultiChannelAlert({
        incidentId: created.id,
        incidentTitle: created.title,
        severity: created.severity,
        tenantName: tenant?.name,
        appName: app?.name,
        message: `[ALTIL ${created.severity}] ${created.title}`,
        channels: created.alertChannels,
        recipientPhone: '+27 82 555 0192',
        recipientEmail: 'ciso@enterprise.co.za',
        smsStatus: newNotifySms ? 'sent' : 'queued',
        emailStatus: newNotifyEmail ? 'sent' : 'queued',
        inAppStatus: 'delivered',
        isRead: false
      });
    }
  };

  const handleSendTestAlert = () => {
    if (!testAlertMessage.trim()) return;

    onSendMultiChannelAlert({
      incidentId: 'INC-2026-TEST',
      incidentTitle: 'Simulated Emergency Alert Test',
      severity: 'P1_CRITICAL',
      tenantName: 'First National Bank (FNB)',
      appName: 'FNB Customer Support AI Bot',
      message: testAlertMessage,
      channels: testSendChannels,
      recipientPhone: testRecipientPhone,
      recipientEmail: testRecipientEmail,
      smsStatus: testSendChannels.includes('sms') ? 'sent' : 'queued',
      emailStatus: testSendChannels.includes('email') ? 'sent' : 'queued',
      inAppStatus: 'delivered',
      isRead: false
    });

    setTestAlertSuccess(`Multi-channel alert successfully fired to SMS (${testRecipientPhone}), Email (${testRecipientEmail}), and In-App!`);
    setTimeout(() => setTestAlertSuccess(null), 4000);
  };

  const crmStages: { stage: IncidentStatus; label: string; color: string }[] = [
    { stage: 'reported', label: 'Reported / Ingress', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
    { stage: 'investigating', label: 'Investigating (L1/NOC)', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
    { stage: 'assigned', label: 'Assigned to Commander', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
    { stage: 'mitigated', label: 'Mitigated (Fallback Active)', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10' },
    { stage: 'resolved', label: 'Resolved (PIR Completed)', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
    { stage: 'closed', label: 'Closed & Archived', color: 'border-[#333333] text-[#888888] bg-[#141414]' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              ITIL & Statutory Governance CRM
            </span>
            <span className="text-xs text-amber-400 font-mono">SMS • Email • In-App Alerting Engine</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Incident Lifecycle CRM & Multi-Channel Alert Centre</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Log, assign, track, and alert across BOC, SOC, NOC, and L1-L3 support tiers with full drill-down diagnostics and RAG assistance.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Declare Major Incident (P1/P2)
          </button>
        </div>
      </div>

      {/* Control Bar: Views & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-4 rounded-xl">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-[#181c2b] p-1 rounded-lg border border-[#283046]">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded text-xs font-bold font-mono flex items-center space-x-2 transition-colors ${
              viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-[#8890a6] hover:text-white'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded text-xs font-bold font-mono flex items-center space-x-2 transition-colors ${
              viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-[#8890a6] hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Data Table ({filteredIncidents.length})</span>
          </button>

          <button
            onClick={() => setViewMode('alerts_testbench')}
            className={`px-3 py-1.5 rounded text-xs font-bold font-mono flex items-center space-x-2 transition-colors ${
              viewMode === 'alerts_testbench' ? 'bg-purple-600 text-white shadow-sm' : 'text-[#8890a6] hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Multi-Channel Alert Test Bench</span>
          </button>

          <button
            onClick={() => setViewMode('knowledge_base')}
            className={`px-3 py-1.5 rounded text-xs font-bold font-mono flex items-center space-x-2 transition-colors ${
              viewMode === 'knowledge_base' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#8890a6] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>RAG Knowledge Base</span>
          </button>
        </div>

        {/* Search & Severity Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8890a6] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search incidents by ID, tenant, title..."
              className="pl-9 pr-3 py-1.5 rounded-lg bg-[#181c2b] border border-[#283046] text-xs font-mono text-white placeholder-[#666666] focus:outline-none focus:border-blue-500 w-64"
            />
          </div>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#181c2b] border border-[#283046] text-xs font-mono text-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="P1_CRITICAL">P1 Critical</option>
            <option value="P2_HIGH">P2 High</option>
            <option value="P3_MEDIUM">P3 Medium</option>
            <option value="P4_LOW">P4 Low</option>
          </select>
        </div>
      </div>

      {/* ========================================== */}
      {/* VIEW 1: KANBAN BOARD VIEW */}
      {/* ========================================== */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {crmStages.map(col => {
            const stageIncidents = filteredIncidents.filter(inc => inc.status === col.stage);

            return (
              <div key={col.stage} className="bg-[#12141c] border border-[#222636] rounded-xl p-3 flex flex-col space-y-3 min-w-[240px]">
                {/* Column Header */}
                <div className={`p-2.5 rounded-lg border font-mono text-xs font-bold flex items-center justify-between ${col.color}`}>
                  <span>{col.label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px]">
                    {stageIncidents.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {stageIncidents.length === 0 ? (
                    <div className="p-4 text-center text-[10px] font-mono text-[#666666] border border-dashed border-[#222636] rounded-lg">
                      No incidents in this stage
                    </div>
                  ) : (
                    stageIncidents.map(inc => (
                      <div
                        key={inc.id}
                        onClick={() => onOpenDiagnosticModal(inc)}
                        className="bg-[#181c2b] border border-[#283046] hover:border-blue-500/60 p-3.5 rounded-xl space-y-2.5 cursor-pointer transition-all shadow-md group hover:-translate-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-blue-400 group-hover:underline">
                            {inc.id}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                              inc.severity === 'P1_CRITICAL'
                                ? 'bg-red-500/20 text-red-400'
                                : inc.severity === 'P2_HIGH'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {inc.severity.replace('_', ' ')}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                          {inc.title}
                        </h3>

                        <div className="text-[10px] font-mono text-[#8890a6] space-y-1 pt-1 border-t border-[#222636]">
                          <div>Tenant: <strong className="text-emerald-400">{inc.affectedTenantNames?.[0] || 'Enterprise'}</strong></div>
                          <div className="flex items-center justify-between text-[#666666]">
                            <span>Team: {inc.assignedTeam}</span>
                            <span className="text-blue-400 font-bold">360 Inspector →</span>
                          </div>
                        </div>

                        {/* Quick Lifecycle Advance Controls */}
                        <div className="pt-1 flex items-center justify-between text-[9px] font-mono">
                          {col.stage !== 'closed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextStageMap: Record<IncidentStatus, IncidentStatus> = {
                                  reported: 'investigating',
                                  investigating: 'assigned',
                                  assigned: 'mitigated',
                                  mitigated: 'resolved',
                                  resolved: 'closed',
                                  closed: 'closed'
                                };
                                onUpdateIncidentStatus(inc.id, nextStageMap[inc.status]);
                              }}
                              className="px-2 py-1 rounded bg-[#22283a] hover:bg-blue-600 text-white font-bold transition-colors"
                            >
                              Advance Stage →
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* VIEW 2: DATA TABLE VIEW */}
      {/* ========================================== */}
      {viewMode === 'table' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161a26] border-b border-[#222636] text-[10px] font-mono font-bold uppercase text-[#8890a6]">
                <th className="p-4">Incident ID</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Status & Stage</th>
                <th className="p-4">Title & Details</th>
                <th className="p-4">Affected Tenant / App</th>
                <th className="p-4">Assigned Team</th>
                <th className="p-4 text-right">360 Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222636] text-xs font-mono">
              {filteredIncidents.map(inc => (
                <tr
                  key={inc.id}
                  onClick={() => onOpenDiagnosticModal(inc)}
                  className="hover:bg-[#181c2b] cursor-pointer transition-colors"
                >
                  <td className="p-4 font-bold text-blue-400">{inc.id}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        inc.severity === 'P1_CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : inc.severity === 'P2_HIGH'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {inc.severity.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="capitalize font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {inc.status}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs">
                    <div className="font-semibold text-white truncate">{inc.title}</div>
                    <div className="text-[10px] text-[#8890a6] truncate">{inc.summary}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-emerald-400 font-bold">{inc.affectedTenantNames?.[0] || 'Enterprise'}</div>
                    <div className="text-[10px] text-purple-300">{inc.affectedAppNames?.[0] || 'App'}</div>
                  </td>
                  <td className="p-4 font-bold text-blue-300">{inc.assignedTeam}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDiagnosticModal(inc);
                      }}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-colors"
                    >
                      Inspect 360°
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================== */}
      {/* VIEW 3: MULTI-CHANNEL ALERT TEST BENCH */}
      {/* ========================================== */}
      {viewMode === 'alerts_testbench' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dispatcher Form */}
          <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-400" />
              Live Multi-Channel Alert Dispatch Simulator
            </h2>

            {testAlertSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-mono">
                {testAlertSuccess}
              </div>
            )}

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[#8890a6] mb-1">Target SMS Recipient Phone Number</label>
                <input
                  type="text"
                  value={testRecipientPhone}
                  onChange={e => setTestRecipientPhone(e.target.value)}
                  className="w-full bg-[#181c2b] border border-[#283046] rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[#8890a6] mb-1">Target Email Recipient Address</label>
                <input
                  type="email"
                  value={testRecipientEmail}
                  onChange={e => setTestRecipientEmail(e.target.value)}
                  className="w-full bg-[#181c2b] border border-[#283046] rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[#8890a6] mb-1">Emergency Alert Payload Message</label>
                <textarea
                  rows={3}
                  value={testAlertMessage}
                  onChange={e => setTestAlertMessage(e.target.value)}
                  className="w-full bg-[#181c2b] border border-[#283046] rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSendTestAlert}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  Fire Multi-Channel Alert (SMS + Email + In-App)
                </button>
              </div>
            </div>
          </div>

          {/* Active Dispatch Logs */}
          <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Live Alert Delivery Ledger ({alerts.length})
            </h2>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {alerts.map(alt => (
                <div key={alt.id} className="bg-[#181c2b] border border-[#283046] p-3.5 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-bold">{alt.incidentId}</span>
                    <span className="text-[10px] text-[#8890a6]">{alt.timestamp}</span>
                  </div>

                  <p className="text-white font-medium">{alt.message}</p>

                  <div className="flex items-center space-x-3 text-[10px] pt-1 border-t border-[#222636]">
                    <span className="text-emerald-400">SMS: {alt.smsStatus.toUpperCase()}</span>
                    <span className="text-blue-400">EMAIL: {alt.emailStatus.toUpperCase()}</span>
                    <span className="text-purple-400">IN-APP: {alt.inAppStatus.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VIEW 4: RAG KNOWLEDGE BASE VIEW */}
      {/* ========================================== */}
      {viewMode === 'knowledge_base' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ragKnowledgeBase.map(art => (
            <div key={art.id} className="bg-[#12141c] border border-[#222636] p-5 rounded-xl space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-400 font-bold">{art.id}</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 uppercase">
                  {art.category}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white">{art.title}</h3>

              <div className="bg-[#0a0c12] border border-[#222636] p-3 rounded-lg text-xs text-[#c0c6d8] whitespace-pre-wrap">
                {art.content}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {art.keywords.map((kw, i) => (
                  <span key={i} className="text-[9px] bg-[#1c2234] text-[#8890a6] px-2 py-0.5 rounded">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Declare Major Incident */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12141c] border border-[#222636] rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222636] pb-3">
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Declare Major Enterprise Incident (P1 / P2)
              </h2>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-[#8890a6] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#8890a6] mb-1">Incident Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. High P99 Latency Spike on Gemini Cloud Route"
                  className="w-full bg-[#181c2b] border border-[#283046] rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8890a6] mb-1">Severity *</label>
                  <select
                    value={newSeverity}
                    onChange={e => setNewSeverity(e.target.value as any)}
                    className="w-full bg-[#181c2b] border border-[#283046] rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    <option value="P1_CRITICAL">P1 Critical (SLA Risk)</option>
                    <option value="P2_HIGH">P2 High</option>
                    <option value="P3_MEDIUM">P3 Medium</option>
                    <option value="P4_LOW">P4 Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8890a6] mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#181c2b] border border-[#283046] rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    <option value="API_Gateway">API Gateway Outage</option>
                    <option value="Security_POPIA">Security & POPIA Violation</option>
                    <option value="Provider_Outage">Upstream Provider Failure</option>
                    <option value="Latency_Spike">P99 Latency Spike</option>
                    <option value="Billing_Webhook">Billing / Webhook Failure</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8890a6] mb-1">Affected Tenant *</label>
                  <select
                    value={newTenantId}
                    onChange={e => setNewTenantId(e.target.value)}
                    className="w-full bg-[#181c2b] border border-[#283046] rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8890a6] mb-1">Assigned Operational Team</label>
                  <select
                    value={newAssignedTeam}
                    onChange={e => setNewAssignedTeam(e.target.value as any)}
                    className="w-full bg-[#181c2b] border border-[#283046] rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    <option value="BOC">BOC (Business Ops)</option>
                    <option value="SOC">SOC (Security Ops)</option>
                    <option value="NOC">NOC (Network Ops)</option>
                    <option value="Level_1">Level 1 Support</option>
                    <option value="Level_2">Level 2 Diagnostics</option>
                    <option value="Level_3">Level 3 Software Eng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#8890a6] mb-1">Summary & Technical Details</label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  placeholder="Provide initial observations, error codes, and impacted user channels..."
                  className="w-full bg-[#181c2b] border border-[#283046] rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              {/* Multi-channel alert dispatch checkboxes */}
              <div className="pt-2 border-t border-[#222636]">
                <label className="block text-[#8890a6] mb-2 font-bold">Initial Multi-Channel Alert Channels:</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNotifySms}
                      onChange={e => setNewNotifySms(e.target.checked)}
                      className="rounded border-[#283046] bg-[#181c2b] text-red-500"
                    />
                    <span>SMS Alert</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNotifyEmail}
                      onChange={e => setNewNotifyEmail(e.target.checked)}
                      className="rounded border-[#283046] bg-[#181c2b] text-blue-500"
                    />
                    <span>Email Dispatch</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNotifyInApp}
                      onChange={e => setNewNotifyInApp(e.target.checked)}
                      className="rounded border-[#283046] bg-[#181c2b] text-purple-500"
                    />
                    <span>In-App Banner Push</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#1a1e2c] text-white font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30"
                >
                  Declare Incident & Alert Response Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
