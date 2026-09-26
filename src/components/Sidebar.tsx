import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Server,
  Boxes,
  AppWindow,
  KeyRound,
  GitFork,
  ShieldCheck,
  PlaySquare,
  BarChart3,
  ScrollText,
  Activity,
  Sun,
  Moon,
  Network,
  Settings,
  DollarSign,
  Workflow,
  FileCheck,
  Users,
  ShieldAlert,
  AlertTriangle,
  CreditCard,
  LineChart,
  FileSpreadsheet,
  Gauge,
  Lock,
  Shield,
  BookOpen
} from 'lucide-react';

export type NavTabId =
  | 'command_centre'
  | 'stack_wiring'
  | 'tenants'
  | 'org_hierarchy'
  | 'tenant_360'
  | 'tenant_licensing'
  | 'service_management'
  | 'sla_kpi_monitoring'
  | 'operations_cmdb'
  | 'incidents'
  | 'ai_ops'
  | 'ai_governance_lab'
  | 'api_mgmt'
  | 'sec_ops'
  | 'enterprise_risk'
  | 'policies'
  | 'dcr_data_protection'
  | 'compliance'
  | 'trust_fabric'
  | 'finops'
  | 'automation'
  | 'reporting'
  | 'iam_admin'
  | 'admin_settings'
  | 'playground'
  | 'logs'
  // Legacy / Direct access mappings
  | 'dashboard'
  | 'customers'
  | 'providers'
  | 'telemetry'
  | 'models'
  | 'applications'
  | 'keys'
  | 'routing'
  | 'usage'
  | 'system'
  | 'help_guide';

interface SidebarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  counts?: {
    customers?: number;
    providers?: number;
    models?: number;
    applications?: number;
    keys?: number;
    routes?: number;
    policies?: number;
    complianceRequests?: number;
    logs?: number;
    incidents?: number;
  };
  theme?: 'night' | 'day';
  onToggleTheme?: () => void;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: any;
  badge?: number;
  isNew?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  counts,
  theme = 'night',
  onToggleTheme
}) => {
  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Executive',
      items: [
        { id: 'command_centre', label: 'Executive Command Centre', icon: LayoutDashboard },
        { id: 'stack_wiring', label: '5-Layer Stack Architecture', icon: Network, isNew: true },
        { id: 'reporting', label: 'Executive & Audit Reports', icon: FileSpreadsheet, isNew: true }
      ]
    },
    {
      title: 'Tenant Management & Governance',
      items: [
        { id: 'tenants', label: 'Tenant Portfolio Directory', icon: Building2, badge: counts?.customers },
        { id: 'org_hierarchy', label: 'Organization Hierarchy', icon: Network, isNew: true },
        { id: 'tenant_360', label: 'Tenant 360 Diagnostics', icon: Gauge, isNew: true },
        { id: 'tenant_licensing', label: 'Licensing & Subscriptions', icon: CreditCard, isNew: true },
        { id: 'sla_kpi_monitoring', label: 'Tenant SLA & KPI Monitoring', icon: LineChart, isNew: true },
        { id: 'iam_admin', label: 'IAM Users & Access Control', icon: Users, isNew: true },
        { id: 'admin_settings', label: 'Admin & System Settings', icon: Settings, isNew: true }
      ]
    },
    {
      title: 'AI Infrastructure & Gateway',
      items: [
        { id: 'ai_ops', label: 'AI Gateway & Providers', icon: Server, badge: counts?.providers },
        { id: 'api_mgmt', label: 'Applications & Gateway Keys', icon: AppWindow, badge: counts?.applications },
        { id: 'ai_governance_lab', label: 'AI Model Evaluation Lab', icon: Boxes, isNew: true },
        { id: 'playground', label: 'API Playground & Threat Simulator', icon: PlaySquare, isNew: true }
      ]
    },
    {
      title: 'Service Operations & Incidents',
      items: [
        { id: 'service_management', label: 'Services & SLA Engine', icon: Workflow, isNew: true },
        { id: 'incidents', label: 'Incidents, PIRs & Alerts', icon: AlertTriangle, badge: counts?.incidents },
        { id: 'operations_cmdb', label: 'CMDB, Change & BCDR', icon: Network, isNew: true },
        { id: 'automation', label: 'Workflows & Approvals', icon: GitFork, isNew: true }
      ]
    },
    {
      title: 'Security, Risk & Compliance',
      items: [
        { id: 'sec_ops', label: 'Security Ops (SOC & Alerts)', icon: ShieldAlert },
        { id: 'policies', label: 'AI Guardrails & Policies', icon: Shield, badge: counts?.policies, isNew: true },
        { id: 'dcr_data_protection', label: 'Data Cloaking & Vault (DCR)', icon: Lock, isNew: true },
        { id: 'enterprise_risk', label: 'Risk Register & 5x5 Heatmap', icon: ShieldCheck, isNew: true },
        { id: 'compliance', label: 'POPIA & GDPR Suite', icon: FileCheck, badge: counts?.complianceRequests, isNew: true },
        { id: 'trust_fabric', label: 'ALTIL Trust Fabric & Identity', icon: Lock, isNew: true },
        { id: 'logs', label: 'Audit Trail Ledger', icon: ScrollText, badge: counts?.logs },
        { id: 'finops', label: 'FinOps & Token Economics', icon: DollarSign, isNew: true }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#111111] border-r border-[#222222] flex flex-col justify-between shrink-0 select-none h-full">
      <nav className="flex-1 py-3 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.title} className={idx > 0 ? 'mt-4' : ''}>
            <div className="px-5 py-1.5 text-[10px] font-bold text-[#555555] uppercase tracking-wider">
              {section.title}
            </div>
            {section.items.map(item => {
              const Icon = item.icon;
              // Check active status with legacy aliasing support
              const isActive = activeTab === item.id || 
                (item.id === 'command_centre' && activeTab === 'dashboard') ||
                (item.id === 'tenants' && activeTab === 'customers') ||
                (item.id === 'ai_ops' && (activeTab === 'providers' || activeTab === 'telemetry' || activeTab === 'models' || activeTab === 'routing')) ||
                (item.id === 'api_mgmt' && (activeTab === 'applications' || activeTab === 'keys')) ||
                (item.id === 'finops' && activeTab === 'usage');

              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-5 py-2 text-xs transition-colors text-left ${
                    isActive
                      ? 'text-blue-400 bg-blue-500/10 border-r-2 border-blue-500 font-medium'
                      : 'text-[#888888] hover:text-white hover:bg-[#151515]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {Icon && typeof Icon === 'function' && (
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-[#666666]'}`} />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.isNew && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        NEW
                      </span>
                    )}
                    {item.badge !== undefined && item.badge !== null && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          isActive
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-[#1a1a1a] text-[#666666]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer info in sidebar */}
      <div className="p-3 border-t border-[#222222] bg-[#0d0d0d]">
        <button
          id="nav-btn-help_guide"
          onClick={() => setActiveTab('help_guide')}
          className={`w-full flex items-center gap-2.5 px-2 py-2 mb-3 rounded text-xs text-left transition-colors ${activeTab === 'help_guide' ? 'text-blue-300 bg-blue-500/10' : 'text-[#999] hover:text-white hover:bg-[#151515]'}`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Help & Screen Guide</span>
        </button>
        <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            H
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">Horatio Huxham</span>
            <span className="text-[10px] text-green-500 font-mono">Platform Admin</span>
          </div>
        </div>
        </div>
      </div>
    </aside>
  );
};

