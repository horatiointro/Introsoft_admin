import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, AppWindow, BookOpen, Boxes, Building2, ChevronDown, ArrowLeftRight,
  CircleDollarSign, CreditCard, FileCheck, FileSpreadsheet, Gauge, GitFork,
  KeyRound, LayoutDashboard, LineChart, Lock, MessageSquareMore, Network, Code2,
  PlaySquare, Plus, Rocket, ScrollText, Search, Server, Settings, Shield, ShieldAlert,
  ShieldCheck, Sparkles, Users, WalletCards, Workflow
} from 'lucide-react';

export type NavTabId =
  | 'command_centre' | 'stack_wiring' | 'tenants' | 'org_hierarchy' | 'tenant_360'
  | 'tenant_licensing' | 'billing_admin' | 'billing_commercial' | 'accounting' | 'saas_admin'
  | 'billing_accounts' | 'billing_orders' | 'billing_products' | 'billing_invoices' | 'billing_refunds' | 'billing_settlement' | 'accounting_journals' | 'accounting_chart'
  | 'communications' | 'tenant_portal' | 'service_management' | 'sla_kpi_monitoring'
  | 'operations_cmdb' | 'incidents' | 'ai_ops' | 'ai_governance_lab' | 'api_mgmt'
  | 'sec_ops' | 'enterprise_risk' | 'policies' | 'dcr_data_protection' | 'compliance'
  | 'trust_fabric' | 'finops' | 'automation' | 'reporting' | 'iam_admin'
  | 'admin_settings' | 'playground' | 'logs' | 'customer_add' | 'customer_manage' | 'customer_logs'
  | 'dashboard' | 'customers' | 'providers' | 'telemetry' | 'models' | 'applications'
  | 'keys' | 'routing' | 'usage' | 'system' | 'api_docs' | 'help_guide';

interface SidebarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  counts?: { customers?: number; providers?: number; applications?: number; policies?: number; complianceRequests?: number; logs?: number; incidents?: number };
  theme?: 'night' | 'day';
  onToggleTheme?: () => void;
}

const sections = [
  { title: 'Overview', icon: LayoutDashboard, items: [
    { id: 'command_centre', label: 'Command centre', icon: LayoutDashboard, terms: 'home executive overview dashboard' },
    { id: 'reporting', label: 'Reports', icon: FileSpreadsheet, terms: 'audit analytics exports' },
    { id: 'stack_wiring', label: 'Platform architecture', icon: Network, terms: 'layers map infrastructure' }
  ] },
  { title: 'Customers', icon: Building2, items: [
    { id: 'tenants', label: 'Manage customers', icon: Building2, badgeKey: 'customers', terms: 'tenants companies accounts clients', children: [
      { id: 'customer_add', label: 'Add new customer', icon: Plus, terms: 'register onboard create customer' },
      { id: 'customer_manage', label: 'Manage customers', icon: Users, terms: 'directory edit customer profile CRUD' },
      { id: 'customer_logs', label: 'Customer logs', icon: ScrollText, terms: 'customer activity history audit events' }
    ] },
    { id: 'org_hierarchy', label: 'Organization tree', icon: Network, terms: 'subsidiaries corporate structure parent' },
    { id: 'tenant_360', label: 'Customer overview', icon: Gauge, terms: '360 diagnostics health profile' },
    { id: 'tenant_portal', label: 'Customer portal', icon: WalletCards, terms: 'client account portal usage users keys billing' },
    { id: 'tenant_licensing', label: 'Plans & licenses', icon: CreditCard, terms: 'subscriptions packages entitlements' },
    { id: 'saas_admin', label: 'Onboarding & growth', icon: Rocket, terms: 'registration trial conversion saas' },
    { id: 'communications', label: 'Customer messages', icon: MessageSquareMore, terms: 'email sms push firebase announcements' }
  ] },
  { title: 'Finance', icon: CircleDollarSign, items: [
    { id: 'billing_admin', label: 'Finance workspace', icon: CircleDollarSign, defaultTab: 'billing_accounts', terms: 'revenue payment gateway plans collection', children: [
      { id: 'billing_commercial', label: 'Commercial lifecycle', icon: GitFork, terms: 'customer 360 contract quote acceptance order subscription entitlement usage charges invoice allocation reconciliation settlement accounting' },
      { id: 'billing_accounts', label: 'Accounts', icon: Users, terms: 'customer accounts credit balance invoice date' },
      { id: 'billing_orders', label: 'Orders', icon: FileSpreadsheet, terms: 'subscriptions products order history' },
      { id: 'billing_products', label: 'Products & pricing', icon: CreditCard, terms: 'catalog price plans licence seat request charges' },
      { id: 'billing_admin', label: 'Billing', icon: WalletCards, terms: 'billing portfolio collections schedules' },
      { id: 'billing_invoices', label: 'Invoices', icon: FileSpreadsheet, terms: 'invoice register automatic invoice delivery' },
      { id: 'billing_refunds', label: 'Refunds & credits', icon: CircleDollarSign, terms: 'refund credit adjustment' },
      { id: 'billing_settlement', label: 'Settlement & reconciliation', icon: ArrowLeftRight, terms: 'gateway bank recon settlement' },
      { id: 'accounting', label: 'Accounting', icon: BookOpen, terms: 'chart of accounts journals books', children: [
        { id: 'accounting_chart', label: 'Chart of accounts', icon: LineChart, terms: 'general ledger accounts balances' },
        { id: 'accounting_journals', label: 'Journal entries', icon: ScrollText, terms: 'double entry journals invoice mapping' }
      ] }
    ] },
    { id: 'finops', label: 'AI cost & usage', icon: LineChart, terms: 'finops tokens provider cost budget forecast' }
  ] },
  { title: 'AI platform', icon: Server, items: [
    { id: 'ai_ops', label: 'Providers & models', icon: Server, badgeKey: 'providers', terms: 'gateway model catalog routing free tiers' },
    { id: 'api_mgmt', label: 'Applications & API keys', icon: AppWindow, badgeKey: 'applications', terms: 'keys credentials applications integrations' },
    { id: 'ai_governance_lab', label: 'Model evaluation', icon: Boxes, terms: 'benchmarks tests availability' },
    { id: 'playground', label: 'API playground', icon: PlaySquare, terms: 'simulate request threat test' },
    { id: 'api_docs', label: 'API docs & Swagger', icon: Code2, terms: 'swagger openapi endpoints reference integration documentation' }
  ] },
  { title: 'Operations', icon: Workflow, items: [
    { id: 'service_management', label: 'Services & SLAs', icon: Workflow, terms: 'service targets metrics catalogue' },
    { id: 'sla_kpi_monitoring', label: 'Customer SLA & KPIs', icon: LineChart, terms: 'tenant kpi monitoring performance' },
    { id: 'incidents', label: 'Incidents & alerts', icon: AlertTriangle, badgeKey: 'incidents', terms: 'problems PIR notifications' },
    { id: 'operations_cmdb', label: 'CMDB & continuity', icon: Network, terms: 'change b c d r vendors' },
    { id: 'automation', label: 'Workflows & approvals', icon: GitFork, terms: 'automation rules triggers' }
  ] },
  { title: 'Trust & governance', icon: ShieldCheck, items: [
    { id: 'policies', label: 'AI guardrails & policies', icon: Shield, badgeKey: 'policies', terms: 'safety restrictions controls privacy' },
    { id: 'sec_ops', label: 'Security operations', icon: ShieldAlert, terms: 'SOC alerts threats' },
    { id: 'compliance', label: 'Privacy & compliance', icon: FileCheck, badgeKey: 'complianceRequests', terms: 'POPIA GDPR data requests' },
    { id: 'dcr_data_protection', label: 'Data protection vault', icon: Lock, terms: 'cloak tokens surrogate DCR' },
    { id: 'enterprise_risk', label: 'Risk register', icon: ShieldCheck, terms: 'heatmap assessment' },
    { id: 'trust_fabric', label: 'Identity & trust', icon: Lock, terms: 'devices credentials trust fabric' },
    { id: 'iam_admin', label: 'Users & roles', icon: Users, terms: 'IAM access permissions' },
    { id: 'logs', label: 'Audit trail', icon: ScrollText, badgeKey: 'logs', terms: 'logs history evidence' },
    { id: 'admin_settings', label: 'Platform settings', icon: Settings, terms: 'configuration currency locale finance' }
  ] }
] as const;

const aliases: Partial<Record<NavTabId, NavTabId>> = {
  dashboard: 'command_centre', customers: 'tenants', providers: 'ai_ops', telemetry: 'ai_ops', models: 'ai_ops', routing: 'ai_ops',
  applications: 'api_mgmt', keys: 'api_mgmt', usage: 'finops', system: 'admin_settings'
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const normalizedActive = aliases[activeTab] || activeTab;
  const activeSection = sections.find(section => section.items.some(item => item.id === normalizedActive || ('children' in item && item.children?.some(child => child.id === normalizedActive))));
  const [expanded, setExpanded] = useState<string>(activeSection?.title || 'Overview');
  const [search, setSearch] = useState('');
  useEffect(() => { if (!search && activeSection) setExpanded(activeSection.title); }, [activeSection?.title, search]);
  const filtered = useMemo(() => sections.map(section => ({ ...section, items: section.items.filter(item => !search || `${section.title} ${item.label} ${item.terms} ${'children' in item ? item.children?.map(child => `${child.label} ${child.terms}`).join(' ') : ''}`.toLowerCase().includes(search.trim().toLowerCase())) })).filter(section => section.items.length), [search]);
  const openAssistant = (prompt = '') => window.dispatchEvent(new CustomEvent('altil:open-screen-assistant', { detail: { prompt } }));

  return <aside className="flex h-full w-[17rem] shrink-0 select-none flex-col border-r border-[#222938] bg-[#0d1119] text-slate-100">
    <div className="border-b border-white/[.06] p-3">
      <button onClick={() => openAssistant()} className="flex w-full items-center gap-3 rounded-xl border border-indigo-300/15 bg-gradient-to-r from-indigo-400/[.12] to-cyan-300/[.06] p-3 text-left transition hover:border-indigo-300/30 hover:bg-indigo-300/[.12]" aria-label="Ask ALTIL to find a screen">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200"><Sparkles size={17}/></span>
        <span className="min-w-0"><b className="block text-xs">Ask ALTIL</b><span className="mt-0.5 block text-[10px] text-slate-400">Find a screen or learn a task</span></span>
        <span className="ml-auto rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-500">AI</span>
      </button>
      <label className="relative mt-3 block"><Search size={14} className="absolute left-3 top-2.5 text-slate-500"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search navigation…" aria-label="Search navigation" className="w-full rounded-lg border border-white/[.08] bg-black/20 py-2 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-200/30"/></label>
    </div>
    <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
      {filtered.map(section => { const isExpanded = Boolean(search) || expanded === section.title; const SectionIcon = section.icon; return <section key={section.title} className="mb-1">
        <button type="button" aria-expanded={isExpanded} onClick={() => setExpanded(isExpanded && !search ? '' : section.title)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-[.12em] transition ${isExpanded ? 'text-slate-300' : 'text-slate-500 hover:bg-white/[.035] hover:text-slate-300'}`}><SectionIcon size={13}/><span className="flex-1">{section.title}</span><span className="mr-1 text-[9px] font-normal text-slate-600">{section.items.length}</span><ChevronDown size={13} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}/></button>
        {isExpanded && <div className="mb-2 ml-[17px] border-l border-white/[.07] pl-2">{section.items.map(item => { const Icon = item.icon; const isTree = 'children' in item && Boolean(item.children?.length); const selected = normalizedActive === item.id || Boolean(isTree && item.children?.some(child => child.id === normalizedActive)); const badge = 'badgeKey' in item ? counts?.[item.badgeKey as keyof typeof counts] : undefined; return <React.Fragment key={item.id}><button type="button" id={`nav-btn-${item.id}`} onClick={() => { setActiveTab((isTree ? ('defaultTab' in item ? item.defaultTab : 'customer_manage') : item.id) as NavTabId); if (isTree) setExpanded(section.title); }} aria-current={selected ? 'page' : undefined} className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[11px] transition ${selected ? 'bg-cyan-200/[.10] font-medium text-cyan-100 shadow-[inset_2px_0_0_#67e8f9]' : 'text-slate-400 hover:bg-white/[.04] hover:text-slate-100'}`}><Icon size={14} className={selected ? 'text-cyan-200' : 'shrink-0 text-slate-600 group-hover:text-slate-300'}/><span className="min-w-0 flex-1 truncate">{item.label}</span>{badge !== undefined && badge !== null && <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[9px] ${selected ? 'bg-cyan-200/10 text-cyan-100' : 'bg-white/[.045] text-slate-500'}`}>{badge}</span>}</button>{isTree && <div className="mb-1 ml-4 border-l border-cyan-200/10 pl-2">{item.children?.map(child => { const ChildIcon = child.icon; const childSelected = normalizedActive === child.id; return <button key={child.id} type="button" id={`nav-btn-${child.id}`} onClick={() => setActiveTab(child.id as NavTabId)} aria-current={childSelected ? 'page' : undefined} className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] transition ${childSelected ? 'font-medium text-cyan-100' : 'text-slate-500 hover:bg-white/[.04] hover:text-slate-200'}`}><ChildIcon size={12}/><span className="truncate">{child.label}</span></button>})}</div>}</React.Fragment>})}</div>}
      </section>})}
      {search && filtered.length === 0 && <div className="px-3 py-8 text-center"><p className="text-xs text-slate-500">No screen matches “{search}”.</p><button onClick={() => openAssistant(`Help me find the ALTIL screen for: ${search}`)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-indigo-300/15 px-3 py-2 text-[10px] text-indigo-200 hover:bg-indigo-300/10"><Sparkles size={13}/> Ask ALTIL to find it</button></div>}
    </nav>
    <div className="space-y-2 border-t border-white/[.06] bg-black/10 p-3">
      <button id="nav-btn-help_guide" onClick={() => setActiveTab('help_guide')} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] transition ${activeTab === 'help_guide' ? 'bg-cyan-200/[.08] text-cyan-100' : 'text-slate-400 hover:bg-white/[.04] hover:text-white'}`}><BookOpen size={14}/>Help centre & guides</button>
      <div className="flex items-center gap-2 px-2 py-1"><span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-[10px] font-bold">H</span><span className="min-w-0"><b className="block truncate text-[10px]">Horatio Huxham</b><small className="text-[9px] text-emerald-300">Platform Admin</small></span></div>
    </div>
  </aside>;
};
