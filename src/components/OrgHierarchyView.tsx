import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, ChevronRight, LoaderCircle, Users } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';
import type { Application, ApiKey, Customer } from '../types';

interface CommercialOrganization {
  id: string;
  canonical_key: string | null;
  name: string;
  organization_type: 'INTROSOFT' | 'SUBSIDIARY' | 'PARTNER' | 'RESELLER';
  status: string;
}
interface CommercialEdge { id: string; parent_organization_id: string; child_organization_id: string; relationship_type: string; }
interface CommercialCustomer { id: string; customer_type: 'INDIVIDUAL' | 'COMPANY'; display_name: string; status: string; organization_id: string; relationship_type: string; }
interface CommercialTechnicalScope { id: string; organization_id: string; tenant_id: string; tenant_name: string; scope_link_type: string; status: string; effective_from: string; effective_to: string | null; }
interface CommercialHierarchyResponse { organizations: CommercialOrganization[]; relationships: CommercialEdge[]; customers: CommercialCustomer[]; technicalScopes: CommercialTechnicalScope[]; }

interface OrgHierarchyViewProps { customers?: Customer[]; applications?: Application[]; apiKeys?: ApiKey[]; }

export const OrgHierarchyView: React.FC<OrgHierarchyViewProps> = () => {
  const [data, setData] = useState<CommercialHierarchyResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch(`${import.meta.env.BASE_URL}api/v1/commercial/organizations`)
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 403 ? 'You are not authorized to read commercial organization data in this scope.' : 'Commercial organization data could not be loaded.');
        return response.json() as Promise<CommercialHierarchyResponse>;
      })
      .then(result => { if (active) { setData(result); setError(''); } })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Commercial organization data could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const root = data?.organizations.find(item => item.canonical_key === 'INTROSOFT_ROOT') || null;
  const orgById = useMemo(() => new Map((data?.organizations || []).map(item => [item.id, item])), [data]);
  const childrenOf = (id: string) => (data?.relationships || []).filter(edge => edge.parent_organization_id === id)
    .map(edge => orgById.get(edge.child_organization_id)).filter((item): item is CommercialOrganization => Boolean(item));
  const customersOf = (id: string) => (data?.customers || []).filter(customer => customer.organization_id === id);
  const scopesOf = (id: string) => (data?.technicalScopes || []).filter(scope => scope.organization_id === id);

  const renderOrganization = (organization: CommercialOrganization, depth = 0, seen = new Set<string>()): React.ReactNode => {
    if (seen.has(organization.id)) return null;
    const lineage = new Set(seen).add(organization.id);
    return <section key={organization.id} className="rounded-xl border border-[#2a2a2a] bg-[#121212]" style={{ marginLeft: depth ? Math.min(depth * 18, 72) : 0 }}>
      <button type="button" onClick={() => setSelectedId(organization.id)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-white/[.03]">
        <span className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-2 text-cyan-300"><Building2 size={17}/></span>
        <span className="min-w-0 flex-1"><strong className="block text-sm text-white">{organization.name}</strong><small className="text-[10px] uppercase tracking-wide text-slate-400">{organization.organization_type} · {organization.status}</small></span>
        <span className="text-xs text-slate-500">{customersOf(organization.id).length} customer{customersOf(organization.id).length === 1 ? '' : 's'}</span>
      </button>
      {selectedId === organization.id && <div className="border-t border-white/5 px-4 py-3 text-xs text-slate-400"><p>Commercial organization record · {organization.id}</p><p className="mt-3 font-medium text-slate-300">Explicit technical scopes</p>{scopesOf(organization.id).length ? <ul className="mt-1 space-y-1">{scopesOf(organization.id).map(scope => <li key={scope.id}>{scope.tenant_name} · {scope.scope_link_type} · {scope.status} · tenant {scope.tenant_id}</li>)}</ul> : <p className="mt-1">No technical tenant scope is linked to this organization.</p>}</div>}
      {customersOf(organization.id).map(customer => <button key={customer.id} type="button" onClick={() => setSelectedCustomerId(customer.id)} className="flex w-full items-center gap-3 border-t border-white/5 px-4 py-3 text-left hover:bg-emerald-500/[.04]" style={{ paddingLeft: `${Math.min(24 + depth * 18, 96)}px` }}>
        <Users size={15} className="text-emerald-300"/><span className="flex-1"><strong className="block text-xs text-slate-200">{customer.display_name}</strong><small className="text-[10px] uppercase text-slate-500">{customer.customer_type} · {customer.relationship_type}</small></span><ChevronRight size={14} className="text-slate-500"/>
      </button>)}
      <div className="space-y-2 p-2">{childrenOf(organization.id).map(child => renderOrganization(child, depth + 1, lineage))}</div>
    </section>;
  };

  return <main className="space-y-5 pb-12">
    <header className="border-b border-[#222] pb-4"><p className="text-[10px] uppercase tracking-[.2em] text-cyan-300">Commercial organization structure</p><h1 className="mt-1 text-xl font-semibold text-white">Organizations and customers</h1><p className="mt-1 max-w-3xl text-xs text-slate-400">The tree uses persisted commercial relationships. Technical tenants, customer names, metadata, and industry are never used to infer commercial ownership.</p></header>
    {loading && <div className="flex items-center gap-2 text-sm text-slate-400"><LoaderCircle className="animate-spin" size={16}/>Loading authorized commercial records…</div>}
    {error && <div role="alert" className="flex gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100"><AlertTriangle size={17}/>{error}</div>}
    {!loading && !error && (!data?.organizations.length || !root) && <div role="status" className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">No authorized commercial hierarchy is available. No technical tenant or customer record has been converted into a commercial organization.</div>}
    {!loading && !error && root && <div className="space-y-2">{renderOrganization(root)}{data!.organizations.filter(item => item.id !== root.id && !data!.relationships.some(edge => edge.child_organization_id === item.id)).map(item => <div key={item.id} className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100">Unlinked commercial organization: {item.name}. No parent relationship is inferred.</div>)}</div>}
    {selectedCustomerId && data?.customers.some(customer => customer.id === selectedCustomerId) && <section className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm"><p className="text-[10px] uppercase tracking-wider text-emerald-300">Selected commercial customer</p><strong className="mt-1 block text-white">{data.customers.find(customer => customer.id === selectedCustomerId)?.display_name}</strong><p className="mt-1 text-xs text-slate-400">This is a commercial customer record. The current technical tenant workspace is separate and will not be opened using this customer ID.</p></section>}
  </main>;
};
