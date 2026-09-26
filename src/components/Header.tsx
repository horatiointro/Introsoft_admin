import { InfoButton } from './InfoButton';
import React, { useState } from 'react';
import { AltilLogo } from './AltilLogo';
import {
  Layers,
  Shield,
  Zap,
  Activity,
  User,
  Radio,
  Play,
  Sun,
  Moon,
  Bell,
  AlertTriangle,
  ChevronRight,
  LogOut,
  Database,
  Building2,
  Server,
  Boxes,
  FileCheck,
  Lock,
  Workflow,
  Network,
  DollarSign,
  LineChart,
  FileSpreadsheet,
  Gauge,
  CreditCard,
  Users,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Search,
  X,
  LayoutDashboard,
  AppWindow,
  GitFork,
  ScrollText
} from 'lucide-react';
import { MultiChannelAlert } from '../types';
import { ProvenanceBadge } from './ProvenanceBadge';

interface HeaderProps {
  onOpenPlayground: () => void;
  onOpenArchitecture: () => void;
  providersOnline?: number;
  totalProviders?: number;
  theme?: 'night' | 'day';
  onToggleTheme?: () => void;
  alertsList?: MultiChannelAlert[];
  onOpenAlertsView?: () => void;
  onOpenIncidentById?: (incidentId: string) => void;
  currentUser?: { name: string; email: string; role: string; tenant: string };
  onLogout?: () => void;
  dbConnected?: boolean;
  dbStatusMessage?: string;
  onNavigate?: (tab: any) => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPlayground,
  onOpenArchitecture,
  providersOnline = 4,
  totalProviders = 5,
  theme = 'night',
  onToggleTheme,
  alertsList = [],
  onOpenAlertsView,
  onOpenIncidentById,
  currentUser = { name: 'Horatio Huxham', email: 'horatio.huxham@gmail.com', role: 'Global Super Admin', tenant: 'Total Company Scope' },
  onLogout,
  dbConnected = false,
  dbStatusMessage = 'MariaDB Storage Layer',
  onNavigate,
  activeTab
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const unreadAlerts = alertsList.filter(a => !a.isRead);

  const allMenuGroups = [
    {
      group: 'Executive',
      items: [
        { id: 'command_centre', label: 'Executive Command Centre', icon: LayoutDashboard },
        { id: 'stack_wiring', label: '5-Layer Stack Architecture', icon: Network, isNew: true },
        { id: 'reporting', label: 'Executive & Audit Reports', icon: FileSpreadsheet, isNew: true }
      ]
    },
    {
      group: 'Tenant Management & Governance',
      items: [
        { id: 'tenants', label: 'Tenant Portfolio Directory', icon: Building2 },
        { id: 'org_hierarchy', label: 'Organization Hierarchy', icon: Network, isNew: true },
        { id: 'tenant_360', label: 'Tenant 360 Diagnostics', icon: Gauge, isNew: true },
        { id: 'tenant_licensing', label: 'Licensing & Subscriptions', icon: CreditCard, isNew: true },
        { id: 'sla_kpi_monitoring', label: 'Tenant SLA & KPI Monitoring', icon: LineChart, isNew: true },
        { id: 'iam_admin', label: 'IAM Users & Access Control', icon: Users, isNew: true },
        { id: 'admin_settings', label: 'Admin & System Settings', icon: Settings, isNew: true }
      ]
    },
    {
      group: 'AI Infrastructure & Gateway',
      items: [
        { id: 'ai_ops', label: 'AI Gateway & Providers', icon: Server },
        { id: 'api_mgmt', label: 'Applications & Gateway Keys', icon: AppWindow },
        { id: 'ai_governance_lab', label: 'AI Model Evaluation Lab', icon: Boxes, isNew: true },
        { id: 'playground', label: 'Interactive API Playground', icon: Play }
      ]
    },
    {
      group: 'Service Operations & Incidents',
      items: [
        { id: 'service_management', label: 'Services & SLA Engine', icon: Workflow, isNew: true },
        { id: 'incidents', label: 'Incidents, PIRs & Alerts', icon: AlertTriangle },
        { id: 'operations_cmdb', label: 'CMDB, Change & BCDR', icon: Network, isNew: true },
        { id: 'automation', label: 'Workflows & Approvals', icon: GitFork, isNew: true }
      ]
    },
    {
      group: 'Security, Risk & Compliance',
      items: [
        { id: 'sec_ops', label: 'Security Ops (SOC & Alerts)', icon: ShieldAlert },
        { id: 'policies', label: 'AI Guardrails & Policies', icon: Shield, isNew: true },
        { id: 'enterprise_risk', label: 'Risk Register & 5x5 Heatmap', icon: ShieldCheck, isNew: true },
        { id: 'compliance', label: 'POPIA & GDPR Suite', icon: FileCheck, isNew: true },
        { id: 'trust_fabric', label: 'ALTIL Trust Fabric & Identity', icon: Lock, isNew: true },
        { id: 'logs', label: 'Audit Trail Ledger', icon: ScrollText },
        { id: 'finops', label: 'FinOps & Token Economics', icon: DollarSign, isNew: true }
      ]
    }
  ];

  const filteredGroups = allMenuGroups.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.label.toLowerCase().includes(menuSearch.toLowerCase()) ||
      group.group.toLowerCase().includes(menuSearch.toLowerCase())
    )
  })).filter(g => g.items.length > 0);

  return (
    <header className="h-24 border-b border-[#222222] flex items-center justify-between px-6 sm:px-8 bg-[#0a0a0a] shrink-0 select-none relative z-40">
      {/* Left Branding with Company Logo */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity">
          <AltilLogo size="custom" height="80px" />
        </div>
      </div>

      {/* Center Live System Heartbeat & Persistence Provenance */}
      <div className="hidden lg:flex items-center space-x-4 text-xs text-[#888888]">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-[10px] font-mono uppercase text-[#888888]">Gateway: Online</span>
        </div>

        <div className="h-3.5 w-px bg-[#222222]" />

        {/* MariaDB Persistence Provenance Badge */}
        <div className="flex items-center space-x-1.5" title={dbStatusMessage}>
          <Database className={`w-3.5 h-3.5 ${dbConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-[10px] font-mono text-[#888888]">DB:</span>
          {dbConnected ? (
            <ProvenanceBadge type="LIVE" source="MariaDB 10.11" size="xs" />
          ) : (
            <ProvenanceBadge type="FALLBACK" source="In-Memory Sync" size="xs" />
          )}
        </div>

        <div className="h-3.5 w-px bg-[#222222]" />

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono uppercase text-[#666666]">Providers:</span>
          <span className="text-[10px] font-mono text-green-500 font-medium">
            {providersOnline}/{totalProviders} Active
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#222222]" />

        <div className="flex items-center space-x-2">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-mono uppercase text-[#666666]">Governance:</span>
          <span className="text-[10px] font-mono text-blue-400 font-medium">Enforcing</span>
        </div>

        <div className="h-3.5 w-px bg-[#222222]" />

        <span className="text-[10px] font-mono text-[#666666]">v2.4.1-stable</span>
      </div>

      {/* Right Admin Profile & Quick Actions */}
      <div className="flex items-center space-x-3">
        {/* Multi-Channel Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] text-[#888888] hover:text-white border border-[#222222] transition-colors relative"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[9px] font-mono font-bold text-white flex items-center justify-center animate-pulse">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {/* Notification Drawer Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#10121a] border border-[#222636] rounded-xl shadow-2xl p-4 space-y-3 z-50 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#222636] pb-2">
                <span className="font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Live Incident Alerts ({alertsList.length})
                </span>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    if (onOpenAlertsView) onOpenAlertsView();
                  }}
                  className="text-[10px] text-blue-400 hover:underline"
                >
                  View CRM Alerts →
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {alertsList.length === 0 ? (
                  <div className="text-center py-4 text-[#666666]">No active alerts</div>
                ) : (
                  alertsList.map(alt => (
                    <div
                      key={alt.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (onOpenIncidentById) onOpenIncidentById(alt.incidentId);
                      }}
                      className="p-2.5 rounded-lg bg-[#181c2b] border border-[#283046] hover:border-blue-500 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-blue-400 font-bold">{alt.incidentId}</span>
                        <span className="text-red-400 font-bold">{alt.severity}</span>
                      </div>
                      <p className="text-white text-[11px] leading-tight line-clamp-2">{alt.message}</p>
                      <div className="text-[9px] text-[#8890a6] flex justify-between pt-1">
                        <span>Tenant: {alt.tenantName || 'Enterprise'}</span>
                        <span className="text-emerald-400">Channels: {alt.channels.join(', ').toUpperCase()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* All Menus Hub / Quick Navigator Button */}
        <div className="relative">
          <button
            id="btn-all-menus-hub"
            onClick={() => setShowMenuDrawer(!showMenuDrawer)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#141b27] hover:bg-[#1e273a] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all shadow-sm"
            title="Open Complete Enterprise Menus Directory"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>All Menus</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
              22
            </span>
          </button>

          {/* Menus Dropdown Hub Modal */}
          {showMenuDrawer && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
              <div
                className="w-full max-w-4xl bg-[#0e121b] border border-[#222c3d] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header & Search */}
                <div className="p-4 sm:p-5 border-b border-[#1f2838] flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-[#121723]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2"><InfoButton />
                        Enterprise Application Menus & Portals
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          22 Menus Total
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Select any menu item below to jump directly to that module
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search all menus..."
                        value={menuSearch}
                        onChange={e => setMenuSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-[#0a0d14] border border-[#222b3b] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => setShowMenuDrawer(false)}
                      className="p-1.5 rounded-lg bg-[#182030] hover:bg-[#222c42] text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Modal Body - Categorized Menus Grid */}
                <div className="p-5 max-h-[70vh] overflow-y-auto space-y-6">
                  {filteredGroups.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No matching menus found for "{menuSearch}".
                    </div>
                  ) : (
                    filteredGroups.map(group => (
                      <div key={group.group} className="space-y-2.5">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{group.group}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {group.items.map(item => {
                            const Icon = item.icon;
                            const isCurrent = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  if (onNavigate) onNavigate(item.id);
                                  setShowMenuDrawer(false);
                                }}
                                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                                  isCurrent
                                    ? 'bg-blue-600/15 border-blue-500 text-white'
                                    : 'bg-[#121622] hover:bg-[#1a2030] border-[#1e2536] hover:border-slate-600 text-slate-300 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-blue-500/20 text-blue-400' : 'bg-[#181e2c] text-slate-400 group-hover:text-white'}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-medium truncate">
                                    {item.label}
                                  </span>
                                </div>
                                {item.isNew && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 ml-2">
                                    NEW
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-3 bg-[#0a0d14] border-t border-[#1f2838] flex items-center justify-between text-[11px] text-slate-500 font-mono px-5">
                  <span>ALTIL Secure AI Console Navigation</span>
                  <span>Click any menu item to switch instantly</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          id="btn-architecture-diagram"
          onClick={onOpenArchitecture}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#141414] hover:bg-[#1a1a1a] text-[#888888] hover:text-white border border-[#222222] transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>Architecture</span>
        </button>

        <button
          id="btn-quick-playground"
          onClick={onOpenPlayground}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Simulate API</span>
        </button>

        {/* Admin Profile & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#222222]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-800 flex items-center justify-center text-xs font-bold text-white shadow-md border border-emerald-500/30">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden xl:flex flex-col">
            <span className="text-xs font-semibold text-white leading-tight">{currentUser.name}</span>
            <span className="text-[10px] text-emerald-400 font-mono leading-tight">{currentUser.role}</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-[#141414] hover:bg-red-500/20 text-[#888888] hover:text-red-400 border border-[#222222] hover:border-red-500/30 transition-colors ml-1"
              title="Lock Console / Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
