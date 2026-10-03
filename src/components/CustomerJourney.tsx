import React from 'react';
import { ArrowLeft, ArrowRight, Building2, CreditCard, Network, Plus, ShieldCheck } from 'lucide-react';
import type { Customer } from '../types';
import type { NavTabId } from './Sidebar';

// These are workspaces, not inferred completion states or commercial identity mappings.
export const customerJourneySteps = [
  { label: 'Buyer & account', description: 'Review the commercial buyer, operating organisation, legal entity and billing account. Only recorded relationships establish ownership.', tools: [{ tab: 'commercial_account_portal', label: 'Commercial account' }, { tab: 'org_hierarchy', label: 'Organisation network' }] },
  { label: 'Customer setup', description: 'Register the technical customer workspace. Company fields apply to companies; individual buyers use the individual form. Registration does not establish commercial ownership.', tools: [{ tab: 'customer_manage', label: 'Customer details' }, { tab: 'customer_add', label: 'Register customer' }] },
  { label: 'Order', description: 'Choose the product and quantity, review the price snapshot, then confirm the order. An order is a commitment, not cash received.', tools: [{ tab: 'billing_orders', label: 'Orders & checkout' }] },
  { label: 'Invoice & payment', description: 'Review the invoice and outstanding balance. Use secure checkout to request payment; provider confirmation must establish receipt.', tools: [{ tab: 'billing_invoices', label: 'Invoices & payment' }, { tab: 'billing_accounts', label: 'Billing account' }] },
  { label: 'Access & service', description: 'Review the license and entitlements, then configure users, applications and credentials using existing authorised operations.', tools: [{ tab: 'tenant_licensing', label: 'Plans & licenses' }, { tab: 'iam_admin', label: 'Users & roles' }, { tab: 'applications', label: 'Applications' }, { tab: 'keys', label: 'Credentials' }, { tab: 'policies', label: 'Company policies' }] },
  { label: 'Customer operations', description: 'Review the customer portal, service health, usage and support. Provider cost and customer charges are separate financial measures.', tools: [{ tab: 'tenant_portal', label: 'Customer portal' }, { tab: 'tenant_360', label: 'Customer overview' }, { tab: 'finops', label: 'Usage & cost' }, { tab: 'communications', label: 'Messages' }] },
  { label: 'Reconcile & account', description: 'Confirm payment allocation, settlement and accounting evidence. Opening this step never marks payment or reconciliation complete.', tools: [{ tab: 'billing_settlement', label: 'Reconciliation' }, { tab: 'accounting', label: 'Accounting' }, { tab: 'billing_refunds', label: 'Refunds & credits' }, { tab: 'customer_logs', label: 'Customer history' }] }
] as const;

const permissionByTab: Partial<Record<NavTabId, string>> = {
  commercial_account_portal: 'tenant.read', org_hierarchy: 'tenant.read', customer_manage: 'tenant.read', customer_add: 'tenant.write',
  billing_orders: 'billing.read', billing_invoices: 'billing.read', billing_accounts: 'billing.read', tenant_licensing: 'tenant.read',
  iam_admin: 'iam.users.write', applications: 'tenant.read', keys: 'tenant.read', policies: 'policy.read', tenant_portal: 'tenant.read',
  tenant_360: 'tenant.read', finops: 'billing.read', communications: 'tenant.read', billing_settlement: 'billing.read', accounting: 'billing.read',
  billing_refunds: 'billing.read', customer_logs: 'audit.read'
};
export function canOpenJourneyTool(tab: NavTabId, global: boolean, permissions: readonly string[]): boolean {
  return global || Boolean(permissionByTab[tab] && permissions.includes(permissionByTab[tab]!));
}

interface Props {
  customers: Customer[]; selectedId: string; step: number; tool: NavTabId;
  global: boolean; permissions: readonly string[];
  onSelect: (id: string) => void; onOpen: (step: number, tool: NavTabId) => void;
}
export const CustomerJourney: React.FC<Props> = ({ customers, selectedId, step, tool, global, permissions, onSelect, onOpen }) => {
  const current = customerJourneySteps[step];
  const selected = customers.find(customer => customer.id === selectedId);
  const openStep = (index: number) => {
    const first = customerJourneySteps[index].tools.find(item => canOpenJourneyTool(item.tab, global, permissions));
    if (first) onOpen(index, first.tab);
  };
  return <section className="space-y-4 rounded-2xl border border-cyan-300/20 bg-[#101925] p-4 sm:p-6" aria-label="Guided customer journey">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-300">{global ? 'Introsoft owner workspace' : 'Authorised organisation workspace'}</p><h1 className="mt-1 text-2xl font-semibold text-white">Customer journey</h1><p className="mt-2 max-w-2xl text-xs text-slate-400">One working context, from buyer to confirmed cash and ongoing service. Navigation progress is not business completion.</p></div>
      <button type="button" disabled={!canOpenJourneyTool('customer_add', global, permissions)} onClick={() => { onSelect('all'); onOpen(1, 'customer_add'); }} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"><Plus size={16}/>New customer</button>
    </header>
    <label className="block text-xs text-slate-400">Technical customer workspace
      <select aria-label="Journey customer" value={selected?.id || 'all'} onChange={event => onSelect(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0c111a] p-3 text-sm text-white">
        <option value="all">Choose a customer workspace</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
      </select>
    </label>
    <div className="flex flex-wrap gap-2 text-[11px] text-slate-400"><span className="inline-flex items-center gap-1"><ShieldCheck size={13}/>Server permissions apply at every step</span><span>·</span><span>Commercial account selection is separate from technical tenant scope</span></div>
    <nav aria-label="Customer lifecycle steps" className="overflow-x-auto pb-2"><ol className="flex min-w-max gap-2">{customerJourneySteps.map((item, index) => {
      const enabled = item.tools.some(entry => canOpenJourneyTool(entry.tab, global, permissions));
      return <li key={item.label}><button type="button" disabled={!enabled} onClick={() => openStep(index)} aria-current={index === step ? 'step' : undefined} className={`rounded-xl border px-3 py-2.5 text-left text-xs disabled:opacity-35 ${index === step ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}><span className="mr-2 font-mono">{index + 1}</span>{item.label}</button></li>;
    })}</ol></nav>
    <div className="flex flex-wrap items-start justify-between gap-4 border-t border-white/10 pt-4"><div className="max-w-2xl"><h2 className="text-sm font-semibold text-white">Step {step + 1} of {customerJourneySteps.length} · {current.label}</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">{current.description}</p></div><div className="flex gap-2"><button type="button" disabled={step === 0 || !customerJourneySteps[step - 1].tools.some(item => canOpenJourneyTool(item.tab, global, permissions))} onClick={() => openStep(step - 1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 disabled:opacity-30"><ArrowLeft size={13} className="mr-1 inline"/>Back</button><button type="button" disabled={step === customerJourneySteps.length - 1 || !customerJourneySteps[step + 1].tools.some(item => canOpenJourneyTool(item.tab, global, permissions))} onClick={() => openStep(step + 1)} className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-30">Next workspace<ArrowRight size={13} className="ml-1 inline"/></button></div></div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Current step tools">{current.tools.map(item => <button key={item.tab} type="button" disabled={!canOpenJourneyTool(item.tab, global, permissions)} onClick={() => onOpen(step, item.tab)} aria-pressed={tool === item.tab} className={`rounded-lg border px-3 py-2 text-xs disabled:opacity-35 ${tool === item.tab ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>{item.tab === 'billing_invoices' && <CreditCard size={13} className="mr-1 inline"/>}{item.tab === 'org_hierarchy' && <Network size={13} className="mr-1 inline"/>}{item.tab === 'commercial_account_portal' && <Building2 size={13} className="mr-1 inline"/>}{item.label}</button>)}</div>
  </section>;
};
