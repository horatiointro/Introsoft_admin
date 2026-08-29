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
  LineChart,
  FileSpreadsheet
} from 'lucide-react';

export type NavTabId =
  | 'command_centre'
  | 'tenants'
  | 'tenant_360'
  | 'service_management'
  | 'sla_kpi_monitoring'
  | 'operations_cmdb'
  | 'incidents'
  | 'ai_ops'
  | 'ai_governance_lab'
  | 'api_mgmt'
  | 'sec_ops'
  | 'enterprise_risk'
  | 'governance'
  | 'compliance'
  | 'finops'
  | 'automation'
  | 'reporting'
  | 'iam_admin'
  | 'playground'
  | 'logs'
  // Legacy / Direct access mappings
  | 'dashboard'
  | 'customers'
  | 'org_hierarchy'
  | 'providers'
  | 'telemetry'
  | 'models'
  | 'applications'
  | 'keys'
  | 'routing'
  | 'policies'
  | 'usage'
  | 'system'
  | 'admin_settings';

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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  counts,
  theme = 'night',
  onToggleTheme
}) => {
  const navSections = [
    {
      title: 'Executive',
      items: [
        { id: 'command_centre' as NavTabId, label: 'Executive Command Centre', icon: LayoutDashboard },
        { id: 'reporting' as NavTabId, label: 'Executive Reports', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'Tenants & Service',
      items: [
        { id: 'tenant_360' as NavTabId, label: 'Tenant 360 Diagnostics', icon: Building2, badge: counts?.customers },
        { id: 'service_management' as NavTabId, label: 'Services & SLA Engine', icon: LineChart },
        { id: 'incidents' as NavTabId, label: 'Incidents & PIRs', icon: AlertTriangle, badge: counts?.incidents }
      ]
    },
    {
      title: 'Operations & CMDB',
      items: [
        { id: 'operations_cmdb' as NavTabId, label: 'CMDB, Change & BCDR', icon: Network },
        { id: 'ai_ops' as NavTabId, label: 'AI Platform & Gateway', icon: Server, badge: counts?.providers },
        { id: 'api_mgmt' as NavTabId, label: 'API Gateway & Apps', icon: AppWindow, badge: counts?.applications }
      ]
    },
    {
      title: 'AI Lab & Governance',
      items: [
        { id: 'ai_governance_lab' as NavTabId, label: 'AI Model Lab & Eval', icon: Boxes },
        { id: 'sec_ops' as NavTabId, label: 'Security Ops (SOC)', icon: ShieldAlert },
        { id: 'enterprise_risk' as NavTabId, label: 'Risk Register & 5x5 Heatmap', icon: ShieldCheck, badge: counts?.policies },
        { id: 'compliance' as NavTabId, label: 'POPIA & GDPR Suite', icon: FileCheck, badge: counts?.complianceRequests }
      ]
    },
    {
      title: 'FinOps & Admin',
      items: [
        { id: 'finops' as NavTabId, label: 'FinOps & Unit Economics', icon: DollarSign },
        { id: 'automation' as NavTabId, label: 'Workflows & Approvals', icon: Workflow },
        { id: 'iam_admin' as NavTabId, label: 'IAM Users & Roles', icon: Users },
        { id: 'playground' as NavTabId, label: 'Interactive Playground', icon: PlaySquare },
        { id: 'logs' as NavTabId, label: 'Audit Trail Ledger', icon: ScrollText, badge: counts?.logs }
      ]
    }
  ];

  return (
    <aside className="w-60 bg-[#111111] border-r border-[#222222] flex flex-col justify-between shrink-0 select-none h-[calc(100vh-64px)] sticky top-16">
      <nav className="flex-1 py-3 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.title} className={idx > 0 ? 'mt-3' : ''}>
            <div className="px-5 py-1.5 text-[10px] font-bold text-[#555555] uppercase tracking-wider">
              {section.title}
            </div>
            {section.items.map(item => {
              const Icon = item.icon;
              // Check active status with legacy aliasing support
              const isActive = activeTab === item.id || 
                (item.id === 'command_centre' && activeTab === 'dashboard') ||
                (item.id === 'tenants' && (activeTab === 'customers' || activeTab === 'org_hierarchy')) ||
                (item.id === 'ai_ops' && (activeTab === 'providers' || activeTab === 'telemetry' || activeTab === 'models' || activeTab === 'routing')) ||
                (item.id === 'api_mgmt' && (activeTab === 'applications' || activeTab === 'keys')) ||
                (item.id === 'governance' && activeTab === 'policies') ||
                (item.id === 'finops' && activeTab === 'usage') ||
                (item.id === 'iam_admin' && activeTab === 'admin_settings');

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
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-[#666666]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-[#1a1a1a] text-[#666666]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer info in sidebar with Day/Night toggle */}
      <div className="p-3 border-t border-[#222222] flex items-center justify-between gap-2 bg-[#0d0d0d]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            H
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">Horatio Huxham</span>
            <span className="text-[10px] text-green-500 font-mono">Platform Admin</span>
          </div>
        </div>

        {onToggleTheme && (
          <button
            id="sidebar-btn-day-night"
            onClick={onToggleTheme}
            title={theme === 'night' ? 'Switch to Day mode' : 'Switch to Night mode'}
            className="p-1.5 rounded bg-[#161616] hover:bg-[#202020] text-[#888888] hover:text-white border border-[#222222] transition-colors shrink-0"
          >
            {theme === 'night' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

