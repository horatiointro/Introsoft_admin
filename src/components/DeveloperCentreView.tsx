import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AppWindow, ArrowRight, BookOpen, Boxes, CircleAlert, Code2, KeyRound, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';
import type { NavTabId } from './Sidebar';

type ApiApplication = { id: string; name: string; status: string; environment?: string; customerId?: string };
type ApiCredential = { id: string; name: string; status: string; appId: string; expiresAt?: string | null };
type UsageSummary = { requests?: number; inputTokens?: number; outputTokens?: number } | null;
type UsagePayload = { recordedUsage?: UsageSummary; recordedUsageStatus?: string; applicationUsage?: Array<{ id: string; name?: string; requests?: number; quota?: number }> };
type InventoryPayload = { inventoryComplete?: boolean; generatedAt?: string; capabilities?: Array<{ id: string; name: string; status: string; availableToCurrentIdentity?: boolean | null }> };
type IdentityPayload = { user?: { environment?: string } };

interface DeveloperCentreViewProps {
  onNavigate: (tab: NavTabId) => void;
  organizationLabel: string;
  globalScope: boolean;
  permissions: readonly string[];
}

type LoadState<T> = { status: 'loading' } | { status: 'ready'; value: T } | { status: 'unavailable'; reason: 'unauthorized' | 'unavailable' };

const API_BASE = `${import.meta.env.BASE_URL}api/v1`;
const card = 'rounded-2xl border border-white/[.08] bg-[#111722]';

async function readJson<T>(path: string): Promise<T> {
  const response = await apiFetch(`${API_BASE}${path}`);
  if (response.status === 401 || response.status === 403) throw Object.assign(new Error('unauthorized'), { accessDenied: true });
  if (!response.ok) throw new Error('unavailable');
  return response.json() as Promise<T>;
}

function Metric({ label, value, status, detail }: { label: string; value: string; status: 'LIVE' | 'CALCULATED' | 'SYNTHETIC' | 'UNAVAILABLE'; detail: string }) {
  const colors = status === 'LIVE' ? 'text-emerald-200 border-emerald-200/15 bg-emerald-200/[.04]' : status === 'CALCULATED' ? 'text-cyan-100 border-cyan-200/15 bg-cyan-200/[.04]' : status === 'SYNTHETIC' ? 'text-violet-100 border-violet-200/15 bg-violet-200/[.04]' : 'text-slate-400 border-white/[.08] bg-white/[.02]';
  return <article className={`${card} p-4`}><div className="flex items-start justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${colors}`}>{status}</span></div><p className="mt-3 text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p></article>;
}

function unavailableReason(state: LoadState<unknown>): string {
  return state.status === 'unavailable' && state.reason === 'unauthorized' ? 'Not authorized for this data' : 'UNAVAILABLE';
}

export const DeveloperCentreView: React.FC<DeveloperCentreViewProps> = ({ onNavigate, organizationLabel, globalScope, permissions }) => {
  const [applications, setApplications] = useState<LoadState<ApiApplication[]>>({ status: 'loading' });
  const [credentials, setCredentials] = useState<LoadState<ApiCredential[]>>({ status: 'loading' });
  const [usage, setUsage] = useState<LoadState<UsagePayload>>({ status: 'loading' });
  const [inventory, setInventory] = useState<LoadState<InventoryPayload>>({ status: 'loading' });
  const [identity, setIdentity] = useState<LoadState<IdentityPayload>>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    const load = async <T,>(path: string, setter: (state: LoadState<T>) => void) => {
      try { const value = await readJson<T>(path); if (current) setter({ status: 'ready', value }); }
      catch (error) { if (current) setter({ status: 'unavailable', reason: (error as { accessDenied?: boolean }).accessDenied ? 'unauthorized' : 'unavailable' }); }
    };
    void load<ApiApplication[]>('/applications', setApplications);
    void load<ApiCredential[]>('/api-keys', setCredentials);
    void load<UsagePayload>('/usage', setUsage);
    void load<InventoryPayload>('/capabilities', setInventory);
    void load<IdentityPayload>('/auth/me', setIdentity);
    return () => { current = false; };
  }, []);

  const appRows = applications.status === 'ready' ? applications.value : [];
  const keyRows = credentials.status === 'ready' ? credentials.value : [];
  const activeApps = appRows.filter(item => item.status === 'active').length;
  const activeKeys = keyRows.filter(item => item.status === 'active').length;
  const revokedKeys = keyRows.filter(item => item.status === 'revoked').length;
  const expiringKeys = keyRows.filter(item => item.status === 'active' && item.expiresAt && Date.parse(item.expiresAt) >= Date.now() && Date.parse(item.expiresAt) <= Date.now() + 30 * 86400000).length;
  const environmentCounts = useMemo(() => appRows.reduce<Record<string, number>>((counts, app) => { const env = app.environment || 'not specified'; counts[env] = (counts[env] || 0) + 1; return counts; }, {}), [appRows]);
  const usageAvailable = usage.status === 'ready' && usage.value.recordedUsageStatus === 'AVAILABLE' && typeof usage.value.recordedUsage?.requests === 'number';
  const summary = usageAvailable && usage.status === 'ready' ? usage.value.recordedUsage : null;
  const metricStatus: 'CALCULATED' | 'SYNTHETIC' = identity.status === 'ready' && identity.value.user?.environment === 'LOCAL_TEST' ? 'SYNTHETIC' : 'CALCULATED';
  const canReadAudit = permissions.includes('audit.read');
  const capabilityCount = inventory.status === 'ready' ? inventory.value.capabilities?.length : undefined;

  const quickLinks: Array<{ title: string; description: string; tab: NavTabId; icon: React.ElementType; action: string }> = [
    { title: 'Applications', description: 'Manage integration identities and their existing application environments.', tab: 'applications', icon: AppWindow, action: 'Open applications' },
    { title: 'API credentials', description: 'Create, inspect, or revoke credentials with currently enforced scope.', tab: 'keys', icon: KeyRound, action: 'Open credentials' },
  ];
  if (globalScope) quickLinks.push(
    { title: 'API Explorer', description: 'Explore the existing API contract. Write operations may change data.', tab: 'playground', icon: Code2, action: 'Open API Explorer' },
    { title: 'API documentation', description: 'Review the partial capability inventory and the current OpenAPI contract.', tab: 'api_docs', icon: BookOpen, action: 'Open documentation' },
    { title: 'Models', description: 'Browse the configured ALTIL model catalogue.', tab: 'models', icon: Boxes, action: 'Browse models' },
    { title: 'Usage and FinOps', description: 'Open the platform usage workspace available to global administrators.', tab: 'finops', icon: Activity, action: 'Open FinOps' },
  );
  if (canReadAudit) quickLinks.push({ title: 'Audit trail', description: 'Inspect audit records limited by the existing audit permission and organization rules.', tab: 'logs', icon: ShieldCheck, action: 'Open audit trail' });

  return <main className="space-y-6 pb-10 text-slate-200">
    <header className="rounded-2xl border border-cyan-200/15 bg-gradient-to-br from-cyan-300/[.10] via-[#111722] to-indigo-400/[.08] p-6 sm:p-8">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-200/10 text-cyan-100"><Code2 size={24}/></span>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-200">Customers · Developers</p><h1 className="mt-2 text-2xl font-semibold text-white">Developer Centre</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Build and govern integrations using ALTIL’s existing applications, credentials, API contract, models, and organization-scoped usage.</p></div>
        <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-[10px] text-slate-300">{globalScope ? 'Introsoft · Global scope' : organizationLabel}</span>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400"><span className="rounded-md border border-white/10 px-2 py-1">APPLICATION</span><ArrowRight size={12}/><span className="rounded-md border border-white/10 px-2 py-1">ENVIRONMENT</span><ArrowRight size={12}/><span className="rounded-md border border-white/10 px-2 py-1">CREDENTIAL</span><ArrowRight size={12}/><span className="rounded-md border border-white/10 px-2 py-1">RUNTIME SCOPE</span><span className="ml-auto text-slate-500">All displayed resources come from authorization-scoped APIs.</span></div>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Developer platform metrics">
      <Metric label="Applications" value={applications.status === 'ready' ? String(appRows.length) : unavailableReason(applications)} status={applications.status === 'ready' ? metricStatus : 'UNAVAILABLE'} detail={applications.status === 'ready' ? `${activeApps} active · calculated from your visible application list${metricStatus === 'SYNTHETIC' ? ' · LOCAL TEST fixture' : ''}` : 'Scoped application list could not be read.'}/>
      <Metric label="Credentials" value={credentials.status === 'ready' ? String(keyRows.length) : unavailableReason(credentials)} status={credentials.status === 'ready' ? metricStatus : 'UNAVAILABLE'} detail={credentials.status === 'ready' ? `${activeKeys} active · ${revokedKeys} revoked · ${expiringKeys} expire within 30 days${metricStatus === 'SYNTHETIC' ? ' · LOCAL TEST fixture' : ''}` : 'Scoped credential metadata could not be read.'}/>
      <Metric label="Recorded requests" value={usageAvailable ? String(summary?.requests ?? 0) : 'UNAVAILABLE'} status={usageAvailable ? metricStatus : 'UNAVAILABLE'} detail={usageAvailable ? `Aggregate from the organization-scoped usage endpoint; not a daily time series.${metricStatus === 'SYNTHETIC' ? ' LOCAL TEST fixture.' : ''}` : usage.status === 'unavailable' && usage.reason === 'unauthorized' ? 'Not authorized to read usage.' : 'No scoped aggregate is currently available.'}/>
      <Metric label="Tokens" value={usageAvailable ? String((summary?.inputTokens ?? 0) + (summary?.outputTokens ?? 0)) : 'UNAVAILABLE'} status={usageAvailable ? metricStatus : 'UNAVAILABLE'} detail={usageAvailable ? `Input plus output tokens in the available stored aggregate.${metricStatus === 'SYNTHETIC' ? ' LOCAL TEST fixture.' : ''}` : 'Token totals are unavailable without a scoped usage aggregate.'}/>
    </section>

    <section className={`${card} p-5`} aria-label="Developer integration setup">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-sm font-semibold text-white">Integration path</h2><p className="mt-1 text-[10px] text-slate-500">Use the existing ALTIL workflows. Each step shows the current implementation boundary.</p></div>
        <span className="rounded-full border border-amber-200/15 bg-amber-100/[.035] px-2.5 py-1 text-[9px] text-amber-100">Environment binding · LIMITED</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { step: '01', title: 'Application', detail: applications.status === 'ready' && appRows.length ? `${appRows.length} visible · ${activeApps} active` : 'Create or select an application', tab: 'applications' as NavTabId },
          { step: '02', title: 'Environment and capabilities', detail: 'Set on the application; credential environment binding is unavailable', tab: 'applications' as NavTabId },
          { step: '03', title: 'Credential', detail: credentials.status === 'ready' && keyRows.length ? `${keyRows.length} visible · create screen returns a secret once` : 'Create a credential with the supported runtime scope', tab: 'keys' as NavTabId },
          { step: '04', title: 'Test an API request', detail: 'Existing Playground; execution may contact a configured provider', tab: 'playground' as NavTabId },
          { step: '05', title: 'Review documentation', detail: 'OpenAPI contract and partial capability inventory', tab: 'api_docs' as NavTabId },
          ...(canReadAudit ? [{ step: '06', title: 'Inspect audit records', detail: 'Organization-scoped access under the existing audit permission', tab: 'logs' as NavTabId }] : []),
        ].map(item => <button key={item.step} onClick={() => onNavigate(item.tab)} className="rounded-xl border border-white/[.07] bg-black/10 p-3 text-left transition hover:border-cyan-200/20 hover:bg-cyan-200/[.03]"><span className="text-[9px] font-semibold tracking-wider text-cyan-200">STEP {item.step}</span><span className="mt-1 block text-xs font-semibold text-slate-100">{item.title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{item.detail}</span></button>)}
      </div>
      <p className="mt-3 text-[10px] leading-4 text-slate-500">The current API Explorer does not establish a persistent request trace or durable usage-to-invoice relationship. Usage and request measurements remain UNAVAILABLE when no scoped evidence is returned.</p>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <div className={`${card} overflow-hidden`}><div className="border-b border-white/[.07] px-5 py-4"><h2 className="text-sm font-semibold text-white">Start building</h2><p className="mt-1 text-xs text-slate-500">Continue through the existing ALTIL workflows.</p></div><div className="grid gap-2 p-4 sm:grid-cols-2">{quickLinks.map(item => { const Icon = item.icon; return <button key={item.title} onClick={() => onNavigate(item.tab)} className="group rounded-xl border border-white/[.07] bg-white/[.02] p-4 text-left transition hover:border-cyan-200/20 hover:bg-cyan-200/[.04]"><span className="flex items-center gap-2 text-xs font-semibold text-slate-100"><Icon size={15} className="text-cyan-200"/>{item.title}<ArrowRight size={13} className="ml-auto text-slate-600 group-hover:text-cyan-100"/></span><span className="mt-2 block text-[10px] leading-4 text-slate-500">{item.description}</span><span className="mt-3 block text-[10px] font-medium text-cyan-100">{item.action}</span></button>; })}</div></div>

      <div className={`${card} p-5`}><h2 className="flex items-center gap-2 text-sm font-semibold text-white"><ShieldCheck size={16} className="text-cyan-200"/>Platform signals</h2><div className="mt-4 space-y-3">
        <div className="rounded-xl border border-white/[.07] bg-black/10 p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-300">Request success / errors / latency</span><span className="text-slate-500">UNAVAILABLE</span></div><p className="mt-1 text-[10px] text-slate-600">No verified request-level metrics are exposed by the current scoped usage response.</p></div>
        <div className="rounded-xl border border-white/[.07] bg-black/10 p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-300">Developer webhook health</span><span className="text-slate-500">UNAVAILABLE</span></div><p className="mt-1 text-[10px] text-slate-600">Payment-provider callbacks are not customer-configured developer webhooks.</p></div>
        <div className="rounded-xl border border-white/[.07] bg-black/10 p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-300">API capability inventory</span><span className="text-cyan-100">{capabilityCount === undefined ? 'UNAVAILABLE' : `${capabilityCount} reviewed entries`}</span></div><p className="mt-1 text-[10px] text-slate-600">{inventory.status === 'ready' ? `Partial inventory · generated ${inventory.value.generatedAt ? new Date(inventory.value.generatedAt).toLocaleString() : 'without a timestamp'}` : 'The authenticated capability inventory could not be read.'}</p></div>
        <div className="rounded-xl border border-white/[.07] bg-black/10 p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-300">Audit activity</span><span className="text-slate-500">{canReadAudit ? 'Open audit trail' : 'Not authorized'}</span></div>{canReadAudit && <button onClick={() => onNavigate('logs')} className="mt-2 text-[10px] text-cyan-100 hover:underline">View authorized audit records</button>}</div>
      </div></div>
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className={`${card} p-5`}><h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Layers3 size={16} className="text-violet-200"/>Application environments</h2><p className="mt-1 text-[10px] leading-4 text-slate-500">Environment is currently an application attribute. Credentials do not have an independently enforced environment binding.</p>{applications.status === 'ready' ? <div className="mt-4 flex flex-wrap gap-2">{Object.entries(environmentCounts).length ? Object.entries(environmentCounts).map(([env, count]) => <span key={env} className="rounded-lg border border-white/[.08] bg-black/10 px-3 py-2 text-xs text-slate-300">{env} <b className="ml-2 text-white">{count}</b></span>) : <span className="text-xs text-slate-500">No visible applications are registered.</span>}</div> : <p className="mt-4 text-xs text-slate-500">{unavailableReason(applications)}</p>}</div>
      <div className={`${card} p-5`}><h2 className="flex items-center gap-2 text-sm font-semibold text-white"><KeyRound size={16} className="text-amber-200"/>Credential scope</h2><p className="mt-1 text-[10px] leading-4 text-slate-500">Management permission does not grant arbitrary runtime access. The current registry grants only the runtime-enforced inference scope.</p><div className="mt-4 flex flex-wrap items-center gap-2"><code className="rounded-lg border border-emerald-200/15 bg-emerald-200/[.04] px-3 py-2 text-xs text-emerald-100">read:inference · ENFORCED</code><span className="text-[10px] text-slate-500">Models, capabilities, telemetry and other scopes are unavailable until their runtime operations are implemented.</span></div></div>
    </section>

    {usage.status === 'ready' && usage.value.applicationUsage?.length ? <section className={`${card} p-5`}><h2 className="text-sm font-semibold text-white">Application quota snapshot <span className="ml-2 text-[9px] font-normal text-cyan-100">{metricStatus}</span></h2><p className="mt-1 text-[10px] text-slate-500">Values are returned by the scoped usage endpoint; they are not independent request telemetry.{metricStatus === 'SYNTHETIC' ? ' LOCAL TEST fixture.' : ''}</p><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{usage.value.applicationUsage.map((app, index) => <div key={`${String(app.id || app.name || 'application')}-${index}`} className="rounded-lg border border-white/[.07] bg-black/10 p-3"><p className="truncate text-xs text-slate-200">{app.name || app.id}</p><p className="mt-1 text-[10px] text-slate-500">{Number(app.requests || 0).toLocaleString()} used of {Number(app.quota || 0).toLocaleString()} requests</p></div>)}</div></section> : null}

    <div className="flex items-start gap-3 rounded-xl border border-amber-200/15 bg-amber-100/[.035] p-4 text-[10px] leading-5 text-amber-100/75"><CircleAlert size={15} className="mt-0.5 shrink-0"/><p>Metrics are labeled by source. The usage API may return no scoped aggregate; in that case ALTIL shows UNAVAILABLE instead of inventing zero activity. Application and credential counts are calculations over the authorized API responses; CALCULATED does not independently prove production provenance. The LOCAL_TEST identity marker identifies synthetic harness data. {inventory.status === 'ready' && inventory.value.inventoryComplete === false ? 'The capability inventory is intentionally partial.' : ''} {globalScope ? 'Global view is available through the explicit global authorization context.' : `Current organization scope: ${organizationLabel}.`}</p></div>
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('altil:open-screen-assistant', { detail: { prompt: 'Explain what is currently available in the ALTIL Developer Centre. Distinguish implemented, unavailable, and unverified capabilities using the current application documentation.' } }))} className="inline-flex items-center gap-2 rounded-lg border border-violet-200/15 bg-violet-200/[.04] px-3 py-2 text-[10px] text-violet-100 hover:bg-violet-200/[.08]"><Sparkles size={13}/>Ask ALTIL AI about this screen</button>
  </main>;
};
