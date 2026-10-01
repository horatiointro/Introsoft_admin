import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, Building2, CircleDollarSign, Clock3, Package, ShieldCheck, WalletCards } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

const API_BASE = `${import.meta.env.BASE_URL}api/v1`;
type AccountChoice = { value: string; label: string; kind: 'ORGANIZATION' | 'CUSTOMER' };
type PortalData = {
  accountType: 'ORGANIZATION' | 'CUSTOMER'; account: any; relationships: any[]; customers: any[];
  accounts: any[]; legalEntities: any[]; technicalScopes: any[];
  financials: { availability: string; orders: any[]; invoices: any[]; paymentIntents: any[]; refunds: any[]; schedules: any[]; recentOrders?: any[]; recentInvoices?: any[]; recentPayments?: any[]; subscriptions?: any[]; dueInvoices?: any[]; counts?: any; credits?: any; bankCashEvidence: string };
  profileManagement: { availability: string; canEdit?: boolean; editableFields?: string[]; unsupportedCompanyFields?: string[] };
  catalogue?: { availability: string; products: any[]; relationships: any[]; note?: string };
  activity?: any[]; attention?: any[]; credits?: any;
};

interface Props { onNavigate?: (tab: string) => void; }

const money = (amount: unknown, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(amount || 0));

export const CommercialAccountPortalView: React.FC<Props> = ({ onNavigate }) => {
  const [customerMode] = useState(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('altil_user_profile') || '{}');
      return Array.isArray(profile.roles) && profile.roles.length === 1 && profile.roles[0] === 'CUSTOMER_ACCOUNT_USER';
    } catch { return false; }
  });
  const [choices, setChoices] = useState<AccountChoice[]>([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        if (customerMode) {
          if (!cancelled) { setChoices([{ value: 'customer:self', label: 'My account', kind: 'CUSTOMER' }]); setSelected('customer:self'); }
          return;
        }
        const [organizationsResponse, customersResponse] = await Promise.all([
          apiFetch(`${API_BASE}/commercial/organizations`), apiFetch(`${API_BASE}/commercial/customers`),
        ]);
        if (!organizationsResponse.ok || !customersResponse.ok) throw new Error('Authorized commercial account list is unavailable.');
        const [organizationsResult, customersResult] = await Promise.all([organizationsResponse.json(), customersResponse.json()]);
        const organizationChoices: AccountChoice[] = (organizationsResult.organizations || []).map((item: any) => ({ value: `organization:${item.id}`, label: `${item.name} · Organization`, kind: 'ORGANIZATION' }));
        const customerChoices: AccountChoice[] = (customersResult.customers || []).map((item: any) => ({ value: `customer:${item.id}`, label: `${item.display_name} · Customer`, kind: 'CUSTOMER' }));
        const available = [...organizationChoices, ...customerChoices];
        if (!cancelled) { setChoices(available); setSelected(current => available.some(item => item.value === current) ? current : available[0]?.value || ''); }
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Commercial account list is unavailable.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [customerMode]);

  useEffect(() => {
    if (!selected) { setData(null); return; }
    let cancelled = false;
    const [kind, id] = selected.split(':', 2);
    const query = selected === 'customer:self' ? '' : kind === 'organization' ? `?organizationId=${encodeURIComponent(id)}` : `?customerId=${encodeURIComponent(id)}`;
    (async () => {
      setLoading(true); setError('');
      try {
        const response = await apiFetch(`${API_BASE}/commercial/account-portal${query}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Commercial account details are unavailable.');
        if (!cancelled) setData(result);
      } catch (cause) { if (!cancelled) { setData(null); setError(cause instanceof Error ? cause.message : 'Commercial account details are unavailable.'); } }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [selected]);

  useEffect(() => {
    if (!data) return;
    setDraft({
      name: data.account.name || '', displayName: data.account.display_name || '', companyName: data.account.company_name || '',
      individualGivenName: data.account.individual_given_name || '', individualFamilyName: data.account.individual_family_name || '',
      contact: data.account.contact || {},
    });
    setEditing(false);
  }, [data]);

  const refresh = async () => {
    const [kind, id] = selected.split(':', 2);
    const query = selected === 'customer:self' ? '' : kind === 'organization' ? `?organizationId=${encodeURIComponent(id)}` : `?customerId=${encodeURIComponent(id)}`;
    const response = await apiFetch(`${API_BASE}/commercial/account-portal${query}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Commercial account details are unavailable.');
    setData(result);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data || !data.profileManagement.canEdit) return;
    setSaving(true); setNotice('');
    try {
      const [kind, id] = selected.split(':', 2);
      let body: Record<string, unknown>;
      if (kind === 'organization') body = { name: draft.name };
      else {
        const contact = draft.contact || {};
        body = data.account.customer_type === 'INDIVIDUAL'
          ? { displayName: draft.displayName, individualGivenName: draft.individualGivenName, individualFamilyName: draft.individualFamilyName, contact }
          : { displayName: draft.displayName, companyName: draft.companyName, contact };
      }
      const query = selected === 'customer:self' ? '' : kind === 'organization' ? `?organizationId=${encodeURIComponent(id)}` : `?customerId=${encodeURIComponent(id)}`;
      const response = await apiFetch(`${API_BASE}/commercial/account-portal/profile${query}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Profile could not be saved.');
      setNotice(`Profile saved. Updated: ${result.updatedFields.join(', ')}.`); setEditing(false); await refresh();
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Profile could not be saved.'); }
    finally { setSaving(false); }
  };

  const updateContact = (section: string | null, key: string, value: string | boolean) => {
    setDraft((current: Record<string, any>) => ({ ...current, contact: section
      ? { ...(current.contact || {}), [section]: { ...(current.contact?.[section] || {}), [key]: value } }
      : { ...(current.contact || {}), [key]: value } }));
  };

  const selectedLabel = useMemo(() => choices.find(item => item.value === selected)?.label || '', [choices, selected]);
  const financials = data?.financials;
  const selectedProduct = data?.catalogue?.products.find((product: any) => product.id === selectedProductId);
  const lastRelevantActivity = data?.activity?.[0];
  const financialGroups = [
    ['Orders', financials?.orders || [], 'total'], ['Invoices', financials?.invoices || [], 'outstanding'],
    ['Payment intents', financials?.paymentIntents || [], 'captured'], ['Refunds', financials?.refunds || [], 'amount'],
    ['Recurring schedules', financials?.schedules || [], 'last_collected'],
  ] as const;

  return <main className="mx-auto max-w-7xl space-y-5 p-6 text-slate-100">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-300">Commercial account</p><h1 className="mt-1 text-2xl font-semibold">Account portal</h1><p className="mt-1 max-w-2xl text-sm text-slate-400">A record-backed view of commercial identity, explicit relationships and the financial records your existing access allows.</p></div>
      {customerMode ? <div className="min-w-64 rounded-lg border border-cyan-300/20 bg-cyan-300/[.04] px-3 py-2 text-xs"><span className="block text-[10px] uppercase tracking-wider text-cyan-200">Customer mode</span><b className="mt-1 block text-slate-100">My account</b></div> : <label className="min-w-64 text-xs text-slate-400">Operator · authorized account<select aria-label="Commercial account" value={selected} onChange={event => setSelected(event.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#121925] px-3 py-2 text-sm text-slate-100" disabled={!choices.length}><option value="">No authorized accounts available</option>{choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></label>}
    </header>
    {error && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[.06] p-4 text-sm text-rose-200">{error}</div>}
    {loading && <div className="rounded-xl border border-white/[.08] bg-white/[.025] p-6 text-sm text-slate-400">Loading authorized account records…</div>}
    {!loading && !error && !data && <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No commercial account is currently visible in your authorized scope.</div>}
    {!loading && data && <>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-2xl border border-white/[.08] bg-[#111722] p-5">
          <div className="flex items-start gap-3"><span className="rounded-xl bg-cyan-300/10 p-3 text-cyan-200"><Building2 size={20}/></span><div className="min-w-0 flex-1"><p className="text-xs text-slate-500">{data.accountType === 'ORGANIZATION' ? 'Commercial organisation' : `${data.account.customer_type} customer`}</p><h2 className="mt-1 truncate text-xl font-semibold">{data.account.name || data.account.display_name}</h2><p className="mt-1 text-xs text-slate-400">{data.account.organization_type || data.account.company_name || [data.account.individual_given_name, data.account.individual_family_name].filter(Boolean).join(' ') || selectedLabel}</p></div><span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-2.5 py-1 text-[10px] text-emerald-200">{data.account.status}</span></div>
          {data.accountType === 'CUSTOMER' && data.account.contact && <dl className="mt-5 grid gap-3 border-t border-white/[.06] pt-4 text-xs sm:grid-cols-2">{data.account.contact.email && <div><dt className="text-slate-500">Email</dt><dd className="mt-1 text-slate-200">{data.account.contact.email}</dd></div>}{data.account.contact.phone && <div><dt className="text-slate-500">Phone</dt><dd className="mt-1 text-slate-200">{data.account.contact.phone}</dd></div>}{data.account.contact.billingEmail && <div><dt className="text-slate-500">Billing email</dt><dd className="mt-1 text-slate-200">{data.account.contact.billingEmail}</dd></div>}</dl>}
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-3 text-xs text-amber-100/80"><ShieldCheck size={15} className="mt-0.5 shrink-0"/><p>Commercial records are shown only through explicit persisted relationships and existing IAM scope. This portal does not infer a customer from a technical tenant. Your IAM user is the sign-in identity; it does not itself establish commercial ownership.</p></div>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[.06] pt-4 text-xs"><div><dt className="text-slate-500">Account identifier</dt><dd className="mt-1 font-mono text-slate-300">{data.account.id}</dd></div><div><dt className="text-slate-500">Created</dt><dd className="mt-1 text-slate-300">{data.account.created_at ? new Date(data.account.created_at).toLocaleDateString() : 'Not recorded'}</dd></div><div><dt className="text-slate-500">Commercial account</dt><dd className="mt-1 text-slate-300">{data.accountType}</dd></div><div><dt className="text-slate-500">Technical tenant</dt><dd className="mt-1 text-slate-300">Shown separately under explicit technical scopes</dd></div></dl>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[.06] pt-4 text-xs"><div><dt className="text-slate-500">Primary contact</dt><dd className="mt-1 text-slate-300">{data.account.contact?.primaryContact?.name || data.account.contact?.authorizedContact?.name || 'Not recorded'}</dd></div><div><dt className="text-slate-500">Primary email</dt><dd className="mt-1 text-slate-300">{data.account.contact?.email || data.account.contact?.billingEmail || 'Not recorded'}</dd></div><div className="col-span-2"><dt className="text-slate-500">Last relevant activity</dt><dd className="mt-1 text-slate-300">{lastRelevantActivity?.timestamp ? `${lastRelevantActivity.action} · ${new Date(lastRelevantActivity.timestamp).toLocaleString()}` : 'No matching persisted activity recorded'}</dd></div></dl>
          {!customerMode && <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onNavigate?.('billing_products')} className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950">View products <ArrowRight size={14}/></button><button onClick={() => onNavigate?.('billing_orders')} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200">View orders</button><button onClick={() => onNavigate?.('billing_invoices')} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200">View invoices</button></div>}
          {data.profileManagement.canEdit && <div className="mt-4"><button onClick={() => setEditing(value => !value)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200">{editing ? 'Cancel profile edit' : 'Edit profile'}</button>{notice && <p role="status" className="mt-2 text-xs text-cyan-200">{notice}</p>}{editing && <form onSubmit={saveProfile} className="mt-3 grid gap-3 rounded-xl border border-white/[.08] bg-black/10 p-4 text-xs sm:grid-cols-2">{data.accountType === 'ORGANIZATION' ? <label className="sm:col-span-2">Organisation name<input required maxLength={180} value={draft.name || ''} onChange={e => setDraft({ ...draft, name: e.target.value })} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#101620] px-3 py-2"/></label> : <><label>Display name<input required maxLength={180} value={draft.displayName || ''} onChange={e => setDraft({ ...draft, displayName: e.target.value })} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#101620] px-3 py-2"/></label>{data.account.customer_type === 'INDIVIDUAL' ? <><label>First name<input required maxLength={100} value={draft.individualGivenName || ''} onChange={e => setDraft({ ...draft, individualGivenName: e.target.value })} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#101620] px-3 py-2"/></label><label>Last name<input required maxLength={100} value={draft.individualFamilyName || ''} onChange={e => setDraft({ ...draft, individualFamilyName: e.target.value })} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#101620] px-3 py-2"/></label></> : <label>Trading name<input maxLength={180} value={draft.companyName || ''} onChange={e => setDraft({ ...draft, companyName: e.target.value })} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#101620] px-3 py-2"/></label>}<label>Email<input type="email" maxLength={254} value={draft.contact?.email || ''} onChange={e => updateContact(null, 'email', e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#101620] px-3 py-2"/></label><label>Phone<input maxLength={180} value={draft.contact?.phone || ''} onChange={e => updateContact(null, 'phone', e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#101620] px-3 py-2"/></label><label>Billing email<input type="email" maxLength={254} value={draft.contact?.billingEmail || ''} onChange={e => updateContact(null, 'billingEmail', e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#101620] px-3 py-2"/></label>{(['address', 'billingAddress'] as const).map(section => <fieldset key={section} className="grid gap-2 rounded-lg border border-white/[.06] p-3 sm:col-span-2 sm:grid-cols-2"><legend className="px-1 text-slate-300">{section === 'address' ? 'Contact address' : 'Billing address'}</legend>{(['line1', 'line2', 'city', 'region', 'postalCode', 'country'] as const).map(field => <label key={field} className="capitalize">{field === 'line1' ? 'Address line 1' : field === 'line2' ? 'Address line 2' : field}<input maxLength={160} value={draft.contact?.[section]?.[field] || ''} onChange={e => updateContact(section, field, e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#101620] px-3 py-2"/></label>)}</fieldset>)}<fieldset className="rounded-lg border border-white/[.06] p-3 sm:col-span-2"><legend className="px-1 text-slate-300">Notification preferences</legend>{[['invoiceEmails', 'Invoice emails'], ['paymentReminders', 'Payment reminders'], ['productUpdates', 'Product updates']].map(([field, label]) => <label key={field} className="mr-5 inline-flex items-center gap-2"><input type="checkbox" checked={draft.contact?.notificationPreferences?.[field] !== false} onChange={e => updateContact('notificationPreferences', field, e.target.checked)} className="accent-cyan-300"/>{label}</label>)}</fieldset>{data.account.customer_type === 'COMPANY' && <p className="sm:col-span-2 text-amber-200">Legal name, registration and tax/VAT changes are not supported by this profile form; use the authorized legal-entity workflow.</p>}</>}<div className="sm:col-span-2"><button disabled={saving} className="rounded-lg bg-cyan-300 px-3 py-2 font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Saving…' : 'Save profile'}</button></div></form>}</div>}
        </article>
        <article className="rounded-2xl border border-white/[.08] bg-[#111722] p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><WalletCards size={16} className="text-cyan-200"/>Explicit relationships</h3>
          {data.relationships.length ? <ul className="mt-3 space-y-2">{data.relationships.map((item, index) => <li key={`${item.relatedOrganizationId || item.organization_id}-${index}`} className="flex justify-between gap-3 rounded-lg bg-white/[.025] px-3 py-2 text-xs"><span>{item.direction === 'CHILD' ? 'Child' : item.direction === 'PARENT' ? 'Parent' : 'Owner'}: {item.relatedOrganizationName || item.organization_name}</span><span className="text-slate-500">{item.relationship_type || item.relationshipType}</span></li>)}</ul> : <p className="mt-3 text-xs text-slate-500">No active, explicitly recorded organisation relationship is available.</p>}
          {data.accountType === 'ORGANIZATION' && <><h4 className="mt-5 text-xs font-semibold text-slate-300">Linked customers</h4>{data.customers.length ? <ul className="mt-2 space-y-1">{data.customers.map(item => <li key={item.id} className="flex justify-between gap-3 rounded-lg bg-white/[.025] px-3 py-2 text-xs"><span>{item.display_name} <span className="text-slate-500">({item.customer_type})</span>{item.relationshipAmbiguous && <span className="ml-2 text-amber-200">Multiple active relationship records ({item.activeRelationshipCount})</span>}</span><span className="text-slate-500">{item.relationship_type}</span></li>)}</ul> : <p className="mt-2 text-xs text-slate-500">No active customers linked to this organisation.</p>}</>}
          {data.technicalScopes.length > 0 && <><h4 className="mt-5 text-xs font-semibold text-slate-300">Technical scopes</h4><ul className="mt-2 space-y-1">{data.technicalScopes.map(item => <li key={item.tenant_id} className="flex justify-between gap-3 rounded-lg bg-white/[.025] px-3 py-2 text-xs"><span>{item.tenant_name}</span><span className="font-mono text-slate-500">{item.scope_link_type}</span></li>)}</ul></>}
        </article>
      </section>
      <section className="rounded-2xl border border-white/[.08] bg-[#111722] p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-semibold"><CircleDollarSign size={16} className="text-emerald-200"/>Existing financial records</h3><p className="mt-1 text-xs text-slate-500">Summaries are restricted to explicitly linked technical scopes and require billing.read.</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-400">{financials?.availability || 'UNAVAILABLE'}</span></div>
        {financials?.availability === 'AVAILABLE' && <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><article className="rounded-xl border border-white/[.06] bg-black/10 p-3"><small className="text-slate-500">Invoices due</small>{(financials.aging || []).map((row: any) => <p key={`due-${row.currency}`} className="mt-1 text-xs">{row.due_count} · {money(row.due, row.currency)}</p>)}</article><article className="rounded-xl border border-white/[.06] bg-black/10 p-3"><small className="text-slate-500">Overdue</small>{(financials.aging || []).map((row: any) => <p key={`overdue-${row.currency}`} className="mt-1 text-xs">{row.overdue_count} · {money(row.overdue, row.currency)}</p>)}</article><article className="rounded-xl border border-white/[.06] bg-black/10 p-3"><small className="text-slate-500">Payment attempts / confirmed</small><p className="mt-1 text-xs">{financials.counts?.paymentAttempts || 0} / {financials.counts?.confirmedPayments || 0}</p></article><article className="rounded-xl border border-white/[.06] bg-black/10 p-3"><small className="text-slate-500">Orders awaiting payment</small><p className="mt-1 text-xs">{financials.counts?.ordersAwaitingPayment || 0}</p></article></div>}
        {financials?.availability === 'AVAILABLE' ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{financialGroups.map(([label, rows, amountField]) => <article key={label} className="rounded-xl border border-white/[.06] bg-black/10 p-3"><h4 className="text-xs font-medium text-slate-300">{label}</h4>{rows.length ? <ul className="mt-2 space-y-2">{rows.map((row: any, index: number) => <li key={`${row.currency}-${row.status}-${index}`} className="text-[11px]"><span className="text-slate-400">{row.status} · {row.count}</span><strong className="mt-0.5 block font-medium text-slate-100">{money(row[amountField], row.currency)}</strong></li>)}</ul> : <p className="mt-2 text-[11px] text-slate-500">No persisted rows in the authorized scope.</p>}</article>)}</div> : <p className="mt-4 rounded-xl bg-white/[.025] p-4 text-xs text-slate-400">{financials?.availability === 'NOT_AUTHORIZED' ? 'Financial information is not available under the current IAM grants.' : 'No explicit commercial-to-technical billing relationship is available. No financial totals are inferred.'}</p>}
        <p className="mt-4 text-[11px] text-slate-500">Payment-intent captures are not represented as bank cash. Bank cash evidence: {financials?.bankCashEvidence || 'NOT_AVAILABLE'}.</p>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/[.08] bg-[#111722] p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><Package size={16} className="text-cyan-200"/>Available products</h3><p className="mt-1 text-xs text-slate-500">Loaded from the persisted catalogue and the account’s explicit reseller authorization.</p>{data.catalogue?.availability === 'AVAILABLE' ? data.catalogue.products.length ? <ul className="mt-3 space-y-2">{data.catalogue.products.slice(0, 12).map((product: any) => <li key={product.id}><button type="button" aria-pressed={selectedProductId === product.id} onClick={() => setSelectedProductId(product.id)} className={`w-full rounded-lg p-3 text-left ${selectedProductId === product.id ? 'bg-cyan-300/[.08] ring-1 ring-cyan-200/20' : 'bg-white/[.025]'}`}><div className="flex justify-between gap-3"><b className="text-xs">{product.name}</b><b className="text-xs">{money(product.price, product.currency)}</b></div><p className="mt-1 text-[11px] text-slate-400">{product.description}</p><small className="mt-1 block text-[10px] text-slate-500">{product.billingUnit.replaceAll('_', ' ')} · {product.recurring ? 'Recurring' : 'Usage / one-time'} · {product.eligibility}</small><span className="mt-2 block text-[10px] text-cyan-200">View product details</span></button></li>)}</ul> : <p className="mt-3 text-xs text-slate-500">No products are currently available in this account context.</p> : <p className="mt-3 text-xs text-slate-500">Catalogue visibility requires billing.read for the account’s linked commercial organisation.</p>}{selectedProduct && <div className="mt-4 rounded-xl border border-cyan-200/15 bg-cyan-200/[.035] p-4"><h4 className="text-sm font-semibold">{selectedProduct.name}</h4><p className="mt-2 text-xs text-slate-300">{selectedProduct.description || 'No product description is recorded.'}</p><dl className="mt-3 grid grid-cols-2 gap-3 text-[11px]"><div><dt className="text-slate-500">Price</dt><dd className="mt-1">{money(selectedProduct.price, selectedProduct.currency)}</dd></div><div><dt className="text-slate-500">Billing</dt><dd className="mt-1">{selectedProduct.billingUnit.replaceAll('_', ' ')} · {selectedProduct.recurring ? 'Recurring' : 'One-time / usage'}</dd></div><div><dt className="text-slate-500">Eligibility</dt><dd className="mt-1">{selectedProduct.eligibility}</dd></div><div><dt className="text-slate-500">Prerequisites</dt><dd className="mt-1">Not specified in the current catalogue</dd></div><div><dt className="text-slate-500">Current entitlement</dt><dd className="mt-1">Not verified by the current account catalogue view</dd></div></dl><p className="mt-3 text-[10px] text-slate-500">Compatible products and add-ons are shown only where an explicit catalogue relationship is configured. Nothing is automatically added to an order.</p>{!customerMode && <button type="button" onClick={() => onNavigate?.('billing_products')} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs">Open existing product catalogue</button>}{customerMode && <><button type="button" disabled className="mt-3 cursor-not-allowed rounded-lg border border-cyan-200/20 px-3 py-2 text-xs text-cyan-100/60">Request an offer · B2</button><p className="mt-2 text-[10px] text-slate-500">Offer requests are not enabled in B1. No order or purchase is created.</p></>}</div>}{data.catalogue?.relationships?.length ? <><h4 className="mt-4 text-xs font-semibold">Configured product relationships</h4><ul className="mt-2 space-y-1">{data.catalogue.relationships.slice(0, 8).map((item: any, index: number) => <li key={`${item.sourceProductId}-${item.targetProductId}-${index}`} className="text-[11px] text-slate-400">{item.type.replaceAll('_', ' ').toLowerCase()} · {item.explanation || `${item.sourceProductId} → ${item.targetProductId}`}</li>)}</ul><p className="mt-2 text-[10px] text-slate-500">These explicit relationships are informational; no product is added to an order automatically.</p></> : <p className="mt-3 text-xs text-slate-500">No configured product recommendations are available for this catalogue.</p>}{data.catalogue?.note && <p className="mt-3 text-[10px] text-slate-500">{data.catalogue.note}</p>}</article>
        <article className="rounded-2xl border border-white/[.08] bg-[#111722] p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><Clock3 size={16} className="text-violet-200"/>Subscriptions and credits</h3>{financials?.availability === 'AVAILABLE' ? <><p className="mt-3 text-xs text-slate-400">{financials.subscriptions?.length ? `${financials.subscriptions.length} persisted billing schedule(s)` : 'No active subscriptions'}</p>{financials.subscriptions?.slice(0, 8).map((item: any) => <div key={item.id} className="mt-2 rounded-lg bg-white/[.025] p-3 text-xs"><b>{item.schedule_type} · {item.status}</b><p className="mt-1 text-slate-400">Next billing: {item.next_run_at ? new Date(item.next_run_at).toLocaleDateString() : 'Not scheduled'} · {money(item.last_collected_amount, item.currency)}</p><p className="text-[10px] text-slate-500">Saved payment method reference: {item.payment_method_id || 'None'}</p></div>)}<p className="mt-3 text-xs text-slate-400">Account credit: {data.credits?.availability === 'NO_ACCOUNT_CREDIT' ? 'No account credit available' : 'Credit entries are recorded, but no spendable balance is defined by the current ledger.'}</p></> : <p className="mt-3 text-xs text-slate-500">Subscription and credit details require an explicit billing scope.</p>}</article>
      </section>
      <section className="grid gap-4 lg:grid-cols-2"><article className="rounded-2xl border border-white/[.08] bg-[#111722] p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><Activity size={16} className="text-cyan-200"/>Needs attention</h3>{data.attention?.length ? <ul className="mt-3 space-y-2">{data.attention.map((item: any) => <li key={item.resourceId} className="flex items-center justify-between gap-3 rounded-lg bg-amber-300/[.04] p-3 text-xs"><span><b>{item.kind === 'INVOICE_OVERDUE' ? 'Invoice overdue' : 'Payment required'} · {item.reference}</b><small className="mt-1 block text-slate-400">{money(item.amount, item.currency)} · due {new Date(item.dueAt).toLocaleDateString()}</small></span>{!customerMode && <button onClick={() => onNavigate?.('billing_invoices')} className="shrink-0 rounded-lg border border-white/10 px-3 py-2">View invoice</button>}</li>)}</ul> : <p className="mt-3 text-xs text-slate-500">No persisted outstanding invoice requires attention.</p>}{customerMode && data.attention?.length > 0 && <p className="mt-3 text-[11px] text-amber-200">Customer payment handoff is not yet enabled for this account. No payment has been initiated.</p>}</article><article className="rounded-2xl border border-white/[.08] bg-[#111722] p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><Activity size={16} className="text-violet-200"/>Recent activity</h3>{data.activity?.length ? <ul className="mt-3 space-y-2">{data.activity.slice(0, 10).map((item: any, index: number) => <li key={`${item.timestamp}-${index}`} className="rounded-lg bg-white/[.025] px-3 py-2 text-xs"><b>{item.action}</b><p className="mt-1 text-slate-400">{item.category} · {item.outcome} · {new Date(item.timestamp).toLocaleString()}</p></li>)}</ul> : <p className="mt-3 text-xs text-slate-500">No matching persisted commercial audit events were found.</p>}</article></section>
      <section className="grid gap-4 lg:grid-cols-2"><article className="rounded-2xl border border-white/[.08] bg-[#111722] p-5"><h3 className="text-sm font-semibold">Recent orders</h3>{financials?.recentOrders?.length ? financials.recentOrders.map((row: any) => <p key={row.id} className="mt-2 text-xs text-slate-300">{row.order_number} · {row.status} · {money(row.total, row.currency)} · {new Date(row.created_at).toLocaleDateString()}</p>) : <p className="mt-2 text-xs text-slate-500">No persisted orders.</p>}{!customerMode && <button onClick={() => onNavigate?.('billing_orders')} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs">Open orders</button>}</article><article className="rounded-2xl border border-white/[.08] bg-[#111722] p-5"><h3 className="text-sm font-semibold">Recent invoices and payments</h3>{financials?.recentInvoices?.length ? financials.recentInvoices.map((row: any) => <div key={row.id} className="mt-3 rounded-lg bg-white/[.025] p-3 text-xs"><b>{row.invoice_number} · {row.status}</b><p className="mt-1 text-slate-400">Issued {new Date(row.created_at).toLocaleDateString()} · due {new Date(row.due_at).toLocaleDateString()}</p><p className="mt-1 text-slate-300">Subtotal {money(row.subtotal, row.currency)} · tax {money(row.tax, row.currency)} · total {money(row.total, row.currency)}</p><p className="text-slate-300">Paid {money(row.paid, row.currency)} · outstanding {money(Number(row.total)-Number(row.paid), row.currency)}</p>{row.orderReference && <p className="mt-1 text-slate-500">Order reference {row.orderReference}</p>}{row.paymentHistory?.map((payment: any) => <p key={payment.id} className="mt-1 text-[11px] text-slate-400">Payment history: {payment.status} · {money(payment.capturedAmount, payment.currency)} · {new Date(payment.createdAt).toLocaleDateString()}</p>)}{!customerMode && <button onClick={() => onNavigate?.('billing_invoices')} className="mt-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px]">View invoice / payment options</button>}</div>) : <p className="mt-2 text-xs text-slate-500">No persisted invoices.</p>}{financials?.recentPayments?.length > 0 && <p className="mt-3 text-[11px] text-slate-400">Payment attempts: {financials.counts?.paymentAttempts || 0} · confirmed payment attempts: {financials.counts?.confirmedPayments || 0}</p>}{customerMode && financials?.recentInvoices?.length > 0 && <p className="mt-3 text-[11px] text-amber-200">Online payment handoff is not enabled for this commercial identity. Contact the account operator to arrange payment; displayed payment status is not bank-settlement evidence.</p>}<p className="mt-3 text-[10px] text-slate-500">Payment confirmation, provider settlement and bank cash are separate stages. Money in bank is not asserted here.</p></article></section>
    </>}
  </main>;
};
