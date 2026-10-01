import React, { useEffect, useMemo, useState } from 'react';

import { Activity, ArrowDownRight, ArrowUpRight, Building2, CircleDollarSign, Clock3, KeyRound, Layers3, RefreshCw, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';

import type { ApiKey, Application, Customer } from '../types';

import { CURRENCY_OPTIONS, formatForDisplay } from '../utils/currency';
import { apiFetch } from '../utils/apiFetch';
import { CustomerPortalCommercialNotice } from './StageFCommercialViews';



const API_BASE = `${import.meta.env.BASE_URL}api/v1`;

type PortalData = {

  tenant: { id: string; name: string; legalName?: string; status: string; tier: string; orgRole: string; primaryContact: { name: string; email: string }; billingConfig?: Customer['billingConfig']; monthlyBudgetUsd: number; currentSpendUsd: number; updatedAt: string };

  applications: { id: string; name: string; status: string; environment: string; parentApplicationId?: string | null; applicationType?: string; functionIdentifier?: string; quotaUsedRequests: number; quotaMonthlyRequests: number }[];

  keys: { id: string; name: string; prefix: string; status: string; applicationName: string; requests: number; inputTokens: number; outputTokens: number; amountUsd: number; monthlyRequestLimit: number | null; monthlySpendLimitUsd: number | null; lastUsedAt?: string | null }[];

  usage: { requests: number; inputTokens: number; outputTokens: number; meteredSpendUsd: number; daily: { date: string; requests: number; spendUsd: number }[] };

  activity: { id: string; at: string; applicationId: string; apiKeyPrefix: string; modelName: string; inputTokens: number; outputTokens: number; amountUsd: number; status: string }[];

  paymentHistory: { id: string; invoiceId?: string; timestamp?: string; eventType: string; amount: number; currency: string; status: string; gateway: string }[];

  license: { id: string; planName: string; status: string; paymentStatus: string; nextBillingDate: string; includedTransactions: number; usedTransactions: number; currency: string; basePrice: number; discountPercent?: number; groupSize?: number } | null;

  lastUpdatedAt: string;

};

type PortalInvoice = { id: string; tenantId: string; number: string; currency: string; periodStart: string; periodEnd: string; issuedAt?: string; dueAt: string; total: number; paid: number; status: string };



interface Props { customerId: string; customers: Customer[]; applications: Application[]; apiKeys: ApiKey[]; onNavigate: (tab: any) => void; }



export const TenantPortalView: React.FC<Props> = ({ customerId, customers, applications, apiKeys, onNavigate }) => {

  const [tenantSelection, setTenantSelection] = useState(customerId === 'all' ? customers[0]?.id || '' : customerId);

  useEffect(() => { if (customerId !== 'all') setTenantSelection(customerId); else if (!customers.some(customer => customer.id === tenantSelection)) setTenantSelection(customers[0]?.id || ''); }, [customerId, customers]);

  const tenant = customers.find(customer => customer.id === tenantSelection) || customers[0];

  const [data, setData] = useState<PortalData | null>(null);

  const [loading, setLoading] = useState(false);

  const [notice, setNotice] = useState('');

  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [invoice, setInvoice] = useState<any>(null);

  const [issuedInvoices, setIssuedInvoices] = useState<PortalInvoice[]>([]);

  const [newApplicationType, setNewApplicationType] = useState<'sub_application' | 'function'>('sub_application');

  const [newApplicationName, setNewApplicationName] = useState('');

  const [newApplicationParent, setNewApplicationParent] = useState('');

  const [newFunctionIdentifier, setNewFunctionIdentifier] = useState('');

  const [createdSecret, setCreatedSecret] = useState('');

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [checkoutProvider, setCheckoutProvider] = useState<'stripe'|'payfast'|'ikhokha'>('payfast');

  const [payingInvoice, setPayingInvoice] = useState('');

  const [savedMethods,setSavedMethods]=useState<any[]>([]);

  const [billingSchedules,setBillingSchedules]=useState<any[]>([]);

  const [paymentIntents,setPaymentIntents]=useState<any[]>([]);

  const [refundRequests,setRefundRequests]=useState<any[]>([]);

  const [methodProvider,setMethodProvider]=useState<'stripe'|'payfast'|'ikhokha'>('stripe');

  const [scheduleType,setScheduleType]=useState<'threshold'|'monthly'>('threshold');

  const [thresholdAmount,setThresholdAmount]=useState('25');

  const [maximumCharge,setMaximumCharge]=useState('100');

  const [mandateConsent,setMandateConsent]=useState(false);

  const [scheduleConsent,setScheduleConsent]=useState(false);

  const [billingBusy,setBillingBusy]=useState(false);

  const [currencyConfig,setCurrencyConfig]=useState<any>(null);

  const [selectedCurrency,setSelectedCurrency]=useState(tenant?.billingConfig?.displayCurrency||'USD');

  const [currencySaving,setCurrencySaving]=useState(false);



  const refresh = async () => {

    if (!tenant) return;

    setLoading(true);

    try {

      const response = await apiFetch(`${API_BASE}/tenant-portal/${encodeURIComponent(tenant.id)}`);

      if (!response.ok) throw new Error('Portal data is unavailable for this account.');

      const portalData = await response.json();

      setData(portalData);

      const invoiceResponse = await apiFetch(`${API_BASE}/billing/invoices`);

      if (invoiceResponse.ok) setIssuedInvoices((await invoiceResponse.json()).filter((item: PortalInvoice) => item.tenantId === tenant.id));

      const [methodsResponse,schedulesResponse,paymentsResponse,refundsResponse,currencyResponse]=await Promise.all([apiFetch(`${API_BASE}/billing/payment-methods`),apiFetch(`${API_BASE}/billing/schedules`),apiFetch(`${API_BASE}/billing/payments`),apiFetch(`${API_BASE}/billing/refunds`),apiFetch(`${API_BASE}/currency/config`)]);

      if(methodsResponse.ok)setSavedMethods(await methodsResponse.json());if(schedulesResponse.ok)setBillingSchedules(await schedulesResponse.json());if(paymentsResponse.ok)setPaymentIntents(await paymentsResponse.json());if(refundsResponse.ok)setRefundRequests(await refundsResponse.json());if(currencyResponse.ok){const config=await currencyResponse.json();setCurrencyConfig(config);setSelectedCurrency(portalData.tenant.billingConfig?.displayCurrency||config.defaultDisplayCurrency||'USD');}

      setNotice('');

    } catch (error: any) { setNotice(error?.message || 'Could not refresh account data.'); }

    finally { setLoading(false); }

  };

  useEffect(() => { void refresh(); }, [tenant?.id]);



  const localKeys = useMemo(() => apiKeys.filter(key => key.customerId === tenant?.id), [apiKeys, tenant?.id]);

  const localApps = useMemo(() => applications.filter(app => app.customerId === tenant?.id), [applications, tenant?.id]);

  const budget = data?.tenant.monthlyBudgetUsd ?? tenant?.monthlyBudgetUsd ?? 0;

  const spend = data?.tenant.currentSpendUsd ?? tenant?.currentSpendUsd ?? 0;

  const budgetPct = budget > 0 ? Math.min(100, spend / budget * 100) : 0;

  const displayCurrency = data?.tenant.billingConfig?.displayCurrency || selectedCurrency || 'USD';

  const currencyRates = Object.fromEntries((currencyConfig?.currencies || []).filter((row:any)=>row.rate!==null&&row.isFresh).map((row:any)=>[row.code,row.rate]));

  const displayLocale = data?.tenant.billingConfig?.displayLocale || currencyConfig?.defaultLocale || undefined;

  const displayMoney = (amount:number, from='USD') => formatForDisplay(amount,from,displayCurrency,currencyRates,displayLocale);

  const changeDisplayCurrency = async (code:string) => { if(!tenant)return;setSelectedCurrency(code);setCurrencySaving(true);try{const response=await apiFetch(`${API_BASE}/tenant-portal/${encodeURIComponent(tenant.id)}/display-currency`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({displayCurrency:code})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Display currency could not be saved.');setData(current=>current?{...current,tenant:{...current.tenant,billingConfig:{...current.tenant.billingConfig,displayCurrency:code}}}:current);setNotice(result.message);}catch(error:any){setNotice(error?.message||'Display currency could not be saved.');setSelectedCurrency(data?.tenant.billingConfig?.displayCurrency||'USD');}finally{setCurrencySaving(false);}};



  const saveLimits = async (keyId: string, requestLimit: number | null, spendLimit: number | null) => {

    if (!tenant) return;

    setSavingKey(keyId);

    try {

      const response = await apiFetch(`${API_BASE}/tenant-portal/${encodeURIComponent(tenant.id)}/keys/${encodeURIComponent(keyId)}/limits`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monthlyRequestLimit: requestLimit, monthlySpendLimitUsd: spendLimit, billingMode: 'metered' }) });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Could not save key guardrails.');

      setNotice('Key guardrails saved. They take effect immediately.');

      await refresh();

    } catch (error: any) { setNotice(error?.message || 'Could not save key guardrails.'); }

    finally { setSavingKey(null); }

  };



  const previewInvoice = async () => {

    if (!tenant) return;

    try {

      const response = await apiFetch(`${API_BASE}/customers/${encodeURIComponent(tenant.id)}/invoice-preview`);

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Invoice preview is unavailable.');

      setInvoice(result);

    } catch (error: any) { setNotice(error?.message || 'Could not load invoice preview.'); }

  };



  const openCheckout = async () => {

    if (!tenant || !data?.license) return;

    setCheckoutLoading(true);

    try { const response = await apiFetch(`${API_BASE}/billing/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId: tenant.id, licenseId: data.license.id }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Secure checkout is unavailable.'); window.location.assign(result.checkoutUrl); }

    catch (error: any) { setNotice(error?.message || 'Secure checkout is unavailable.'); }

    finally { setCheckoutLoading(false); }

  };



  const payInvoice = async (item: PortalInvoice) => {

    setPayingInvoice(item.id);

    try { const response=await apiFetch(`${API_BASE}/billing/payments/checkout`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tenantId:tenant.id,invoiceId:item.id,provider:checkoutProvider})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Payment checkout is unavailable.');window.location.assign(result.checkoutUrl); }

    catch(error:any){setNotice(error?.message||'Payment checkout is unavailable.');setPayingInvoice('');}

  };



  const setupSavedMethod=async()=>{if(!tenant||!mandateConsent)return;setBillingBusy(true);const mandate=`I authorise Introsoft ALTIL to save a payment token with ${methodProvider} and to initiate only the recurring, threshold-based or invoice payments I separately configure and confirm in the ALTIL billing portal. I can pause or revoke this mandate in the portal. ALTIL will not store my full card number or CVV.`;try{const response=await apiFetch(`${API_BASE}/billing/payment-methods/setup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tenantId:tenant.id,provider:methodProvider,consent:true,mandateText:mandate})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Payment method setup could not start.');window.location.assign(result.checkoutUrl);}catch(error:any){setNotice(error?.message||'Payment method setup unavailable.');setBillingBusy(false);}};

  const createBillingSchedule=async()=>{if(!tenant||!scheduleConsent)return;setBillingBusy(true);const text=scheduleType==='threshold'?`I authorise ALTIL to aggregate successful, billable AI usage for this tenant in USD. When usage reaches ${thresholdAmount} USD, ALTIL may issue an itemised usage invoice and attempt to collect up to ${maximumCharge||'the full outstanding usage amount'} USD per charge using the chosen active Stripe card mandate, subject to provider approval. I can pause or cancel this schedule and revoke the card mandate at any time.`:`I authorise ALTIL to attempt collection of issued, undisputed invoices for this tenant once per month using the selected saved payment method, up to the invoice balance. I can pause or cancel this schedule and revoke the payment mandate at any time.`;try{const response=await apiFetch(`${API_BASE}/billing/schedules`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tenantId:tenant.id,scheduleType,thresholdAmount:Number(thresholdAmount),maximumCharge:Number(maximumCharge)||0,currency:scheduleType==='threshold'?'USD':tenant.billingConfig?.currency||'USD',paymentMethodId:savedMethods.find(method=>method.status==='active'&&method.provider===(scheduleType==='threshold'?'stripe':methodProvider))?.id,consent:true,consentText:text})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Payment schedule could not be saved.');setNotice(result.message);setScheduleConsent(false);const updated=await apiFetch(`${API_BASE}/billing/schedules`);if(updated.ok)setBillingSchedules(await updated.json());}catch(error:any){setNotice(error?.message||'Payment schedule unavailable.');}finally{setBillingBusy(false);}};

  const requestRefund=async(payment:any)=>{const amountText=window.prompt(`Refund amount (up to ${payment.currency} ${Number(payment.capturedAmount).toFixed(2)}):`,Number(payment.capturedAmount).toFixed(2));if(amountText===null)return;const reason=window.prompt('Please provide a reason for the refund (10–1,000 characters):');if(!reason)return;try{const response=await apiFetch(`${API_BASE}/billing/refunds`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tenantId:tenant?.id,paymentIntentId:payment.id,amount:Number(amountText),reason})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Refund request could not be submitted.');setNotice(result.message);await refresh();}catch(error:any){setNotice(error?.message||'Refund request could not be submitted.');}};

  const changeBillingSchedule=async(id:string,status:'paused'|'active'|'cancelled')=>{try{const response=await apiFetch(`${API_BASE}/billing/schedules/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not change schedule.');setBillingSchedules(current=>current.map(row=>row.id===id?{...row,status}:row));}catch(error:any){setNotice(error?.message||'Could not change schedule.');}};



  const createChildApplication = async (event: React.FormEvent) => {

    event.preventDefault();

    if (!tenant || !newApplicationName.trim() || !newApplicationParent) return;

    try {

      const response = await apiFetch(`${API_BASE}/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: tenant.id, name: newApplicationName.trim(), appIdentifier: newFunctionIdentifier.trim() || newApplicationName.trim(), parentApplicationId: newApplicationParent, applicationType: newApplicationType, functionIdentifier: newApplicationType === 'function' ? (newFunctionIdentifier.trim() || newApplicationName.trim()) : undefined, environment: 'production', contactEmail: tenant.primaryContact.email }) });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Could not register this application scope.');

      setCreatedSecret(result.apiKey?.key || '');

      setNewApplicationName(''); setNewFunctionIdentifier('');

      setNotice(`${newApplicationType === 'function' ? 'Function' : 'Sub-application'} registered with its own ALTIL-issued key.`);

      await refresh();

    } catch (error: any) { setNotice(error?.message || 'Could not register application scope.'); }

  };



  if (!tenant) return <div className="rounded-xl border border-[#272b37] bg-[#11131a] p-8 text-sm text-[#9ba3b4]">No tenant accounts are available in this view.</div>;

  const daily = data?.usage.daily || [];

  const maxRequests = Math.max(1, ...daily.map(item => item.requests));

  const friendlyRole = ({ parent_owner: 'Parent organization', subsidiary: 'Subsidiary', partner_reseller: 'Partner', direct_client: 'Direct client' } as Record<string, string>)[data?.tenant.orgRole || tenant.orgRole || 'direct_client'];



  return <div className="space-y-5 pb-12 text-[#e6e8ee]">

    <section className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-[#17213a] via-[#151a29] to-[#101319] p-6 md:p-8">

      <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-5">

        <div><div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-indigo-300"><Sparkles size={14}/> ALTIL Client Space <span className="rounded-full border border-white/10 px-2 py-0.5 tracking-normal text-[#b8becb]">{friendlyRole}</span>{customers.length > 1 && <select aria-label="Choose tenant account" value={tenant?.id || ''} onChange={event => setTenantSelection(event.target.value)} className="rounded border border-white/10 bg-[#151a29] px-2 py-1 text-[10px] normal-case tracking-normal text-white">{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select>}</div>

          <h1 className="text-2xl font-semibold md:text-3xl">Welcome to {data?.tenant.name || tenant.name}</h1>

          <p className="mt-2 max-w-2xl text-sm text-[#a8afbf]">Your applications, access keys, model activity and account guardrails in one calm workspace.</p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#929bad]"><span className="inline-flex items-center gap-1.5"><Building2 size={13}/>{data?.tenant.legalName || tenant.legalName || tenant.name}</span><span className="inline-flex items-center gap-1.5"><ShieldCheck size={13}/>{(data?.tenant.status || tenant.status).replace('_', ' ')}</span><span>Contact: {data?.tenant.primaryContact.email || tenant.primaryContact.email}</span></div>

        </div>

        <div className="flex items-end gap-2"><label className="text-[9px] text-indigo-100/70">Display currency<select aria-label="Preferred display currency" value={displayCurrency} onChange={event=>void changeDisplayCurrency(event.target.value)} disabled={currencySaving||!currencyConfig} className="mt-1 block min-w-40 rounded-lg border border-white/10 bg-[#121827] px-3 py-2 text-xs text-white disabled:opacity-50">{(currencyConfig?.currencies||[]).filter((row:any)=>(row.rate!==null&&row.isFresh)||row.code===displayCurrency).map((row:any)=><option key={row.code} value={row.code}>{row.code} · {row.name}{!row.isFresh?' · rate needs refresh':''}</option>)}</select><span className="mt-1 block text-[8px] text-indigo-100/50">{currencySaving?'Saving preference':displayCurrency==='USD'?'USD accounting view':`Estimate · FX date ${currencyConfig?.currencies?.find((row:any)=>row.code===displayCurrency)?.asOf?new Date(currencyConfig.currencies.find((row:any)=>row.code===displayCurrency).asOf).toLocaleDateString():'unknown'}`}</span></label><button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"><RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>Refresh</button></div>
      </div>

      {notice && <div className="relative mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">{notice}</div>}

      <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <Metric icon={<Activity size={16}/>} label="Successful requests · month to date" value={(data?.usage.requests ?? 0).toLocaleString()} detail="Attributed per key" tone="indigo"/>

        <Metric icon={<CircleDollarSign size={16}/>} label="Spend this cycle" value={displayMoney(spend).value} detail={`${budgetPct.toFixed(0)}% of ${displayMoney(budget).value} budget · USD ledger`} tone="emerald"/>

        <Metric icon={<KeyRound size={16}/>} label="Active keys" value={(data?.keys.filter(key => key.status === 'active').length ?? localKeys.filter(key => key.status === 'active').length).toString()} detail="Each key has its own ledger" tone="sky"/>

        <Metric icon={<Layers3 size={16}/>} label="Applications" value={(data?.applications.length ?? localApps.length).toString()} detail="Separate keys by environment" tone="violet"/>

      </div>

    </section>



    <CustomerPortalCommercialNotice technicalTenantId={tenant.id} />

    <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">

      <section className="rounded-xl border border-[#262a35] bg-[#12141b] p-5">

        <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Usage pulse</h2><p className="mt-1 text-xs text-[#858d9d]">Daily completed AI calls for the last 14 days.</p></div><span className="text-[10px] text-[#737c8e]">{data ? `Updated ${new Date(data.lastUpdatedAt).toLocaleString()}` : 'Waiting for first usage event'}</span></div>

        <div className="mt-5 flex h-40 items-end gap-1.5 border-b border-[#292d37] pb-1">{daily.length ? daily.map((day, index) => <div key={day.date} className="group relative flex h-full flex-1 items-end"><div title={`${day.date}: ${day.requests} requests · ${displayMoney(day.spendUsd).value}`} className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-sky-400 opacity-80 transition hover:opacity-100" style={{ height: `${Math.max(day.requests ? 7 : 2, day.requests / maxRequests * 100)}%` }}/><div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-[10px] group-hover:block">{day.date}: {day.requests} req</div>{index % 2 === 0 && <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-[#727b8b]">{day.date.slice(5)}</span>}</div>) : <div className="mb-3 w-full text-center text-xs text-[#687183]">Usage bars appear here as requests complete.</div>}</div>

        <div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-lg bg-[#191c25] p-3"><span className="text-[10px] uppercase tracking-wider text-[#858d9d]">Input tokens · 90d</span><div className="mt-1 font-mono text-lg">{(data?.usage.inputTokens || 0).toLocaleString()}</div></div><div className="rounded-lg bg-[#191c25] p-3"><span className="text-[10px] uppercase tracking-wider text-[#858d9d]">Output tokens · 90d</span><div className="mt-1 font-mono text-lg">{(data?.usage.outputTokens || 0).toLocaleString()}</div></div></div>

      </section>

      <section className="rounded-xl border border-[#262a35] bg-[#12141b] p-5">

        <div className="flex items-center gap-2"><WalletCards size={16} className="text-emerald-300"/><h2 className="font-semibold">Plan & billing</h2></div>

        {data?.license ? <><div className="mt-4 rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-4"><div className="text-sm font-medium">{data.license.planName}</div><div className="mt-1 text-xs text-[#929bad]">{data.license.status.replace('_', ' ')} · payment {data.license.paymentStatus}</div>{Boolean(data.license.groupSize || data.license.discountPercent) && <div className="mt-2 inline-flex rounded-full bg-indigo-400/10 px-2 py-1 text-[10px] text-indigo-200">Group of {data.license.groupSize || 1} · {data.license.discountPercent || 0}% discount</div>}<div className="mt-4 flex justify-between text-xs"><span className="text-[#929bad]">Included requests</span><span className="font-mono">{data.license.usedTransactions.toLocaleString()} / {data.license.includedTransactions.toLocaleString()}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, data.license.usedTransactions / Math.max(1, data.license.includedTransactions) * 100)}%` }}/></div><p className="mt-3 text-xs text-[#929bad]">Next renewal · {data.license.nextBillingDate}</p></div></> : <div className="mt-4 rounded-lg border border-dashed border-[#343946] p-4 text-xs text-[#929bad]">No active application plan is attached. Pay-as-you-go metering applies to completed calls.</div>}

        <div className="mt-4 rounded-lg bg-[#191c25] p-4"><div className="flex items-center justify-between text-xs"><span className="text-[#a6adbb]">Monthly spend guardrail</span><span className={budgetPct >= 80 ? 'text-amber-300' : 'text-emerald-300'}>{budgetPct.toFixed(0)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${budgetPct >= 95 ? 'bg-rose-400' : budgetPct >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${budgetPct}%` }}/></div><div className="mt-2 flex justify-between text-[10px] text-[#7f8797]"><span>{displayMoney(spend).value} used</span><span>{displayMoney(budget).value} limit</span></div></div>

        <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onNavigate('tenant_licensing')} className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">View plans</button><button onClick={() => void previewInvoice()} className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Invoice preview</button>{data?.license && data.license.paymentStatus !== 'paid' && <button disabled={checkoutLoading} onClick={() => void openCheckout()} className="w-full rounded-lg bg-emerald-300 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{checkoutLoading ? 'Opening secure checkout…' : 'Add payment method'}</button>}</div>

        {invoice && <div className="mt-3 rounded-lg border border-white/10 bg-[#191c25] p-3"><div className="flex justify-between text-xs"><span>Preview {invoice.invoiceNumber}</span><button onClick={() => setInvoice(null)} className="text-[#7f8797] hover:text-white">Close</button></div><div className="mt-2 space-y-1">{invoice.lineItems.map((line: any) => <div key={line.id} className="flex justify-between gap-3 text-[10px] text-[#929bad]"><span>{line.description}</span><span className="whitespace-nowrap">{displayMoney(Number(line.totalUsd)).value}</span></div>)}</div><div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-xs font-semibold"><span>Total due</span><span>{displayMoney(Number(invoice.totalDueUsd)).value}</span></div></div>}

        <div className="mt-4 border-t border-white/10 pt-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="text-[10px] font-semibold uppercase tracking-wider text-[#7e8798]">Invoices & payment history</div><label className="text-[9px] text-[#7e8798]">Pay securely with <select value={checkoutProvider} onChange={e=>setCheckoutProvider(e.target.value as any)} className="ml-1 rounded border border-white/10 bg-[#151a29] px-2 py-1 text-[10px] text-white"><option value="payfast">PayFast</option><option value="ikhokha">iKhokha</option><option value="stripe">Stripe</option></select></label></div>{issuedInvoices.slice(0, 5).map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 text-[10px]"><span className="min-w-0"><b className="block truncate text-[#d9deea]">{item.number}</b><span className="text-[#828b9b]">{item.periodStart} — {item.periodEnd} · due {item.dueAt}</span></span><span className="whitespace-nowrap text-right text-[#cbd0db]">{displayMoney(Number(item.total),item.currency).value}<span className="block capitalize text-[#8992a3]">{item.status} · balance {displayMoney(Number(item.total-item.paid),item.currency).value}{displayMoney(Number(item.total),item.currency).converted&&<span className="block normal-case">Invoice source: {item.currency} {Number(item.total).toFixed(2)}</span>}</span></span>{['issued','partial','overdue'].includes(item.status)&&item.total>item.paid&&<button disabled={Boolean(payingInvoice)} onClick={()=>void payInvoice(item)} className="rounded-md bg-emerald-300 px-2.5 py-1.5 font-semibold text-slate-950 disabled:opacity-50">{payingInvoice===item.id?'Opening…':'Pay balance'}</button>}</div>)}{!issuedInvoices.length && <div className="text-[10px] text-[#697284]">Issued invoices will appear here.</div>}{(data?.paymentHistory || []).slice(0, 3).map(payment => <div key={payment.id} className="flex items-center justify-between gap-2 py-1.5 text-[10px]"><span className="min-w-0 truncate text-[#9da5b4]">{payment.invoiceId || payment.eventType} · {payment.gateway}</span><span className="whitespace-nowrap text-[#cbd0db]">{displayMoney(Number(payment.amount),payment.currency).value} · {payment.status}</span></div>)}{paymentIntents.filter(payment=>payment.status==='succeeded').length>0&&<div className="mt-3 border-t border-white/5 pt-3"><div className="text-[10px] font-semibold text-[#aeb7c7]">Captured payments · refund requests</div>{paymentIntents.filter(payment=>payment.status==='succeeded').slice(0,5).map(payment=>{const existing=refundRequests.filter(refund=>refund.paymentIntentId===payment.id);const refundable=Math.max(0,Number(payment.capturedAmount)-existing.filter(refund=>['requested','processing','succeeded','manual_review'].includes(refund.status)).reduce((sum,refund)=>sum+Number(refund.amount),0));return <div key={payment.id} className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[.025] p-2 text-[10px]"><span>{displayMoney(Number(payment.capturedAmount),payment.currency).value} · {payment.provider} · {payment.id.slice(-10)}{existing.map(refund=><span key={refund.id} className="ml-2 text-amber-200">refund {refund.status}</span>)}</span>{refundable>0&&<button onClick={()=>void requestRefund(payment)} className="rounded border border-amber-200/20 px-2 py-1 text-amber-100">Request refund · up to {displayMoney(refundable,payment.currency).value}</button>}</div>})}</div>}</div>

      </section>

    </div>



    <section className="rounded-xl border border-[#262a35] bg-[#12141b] p-5">

      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Credential control room</h2><p className="mt-1 text-xs text-[#858d9d]">Review each key’s usage and set hard monthly caps. Reaching a cap safely blocks that key with a clear 402 response.</p></div><button onClick={() => onNavigate('keys')} className="rounded-lg bg-indigo-500/15 px-3 py-2 text-xs text-indigo-200 hover:bg-indigo-500/25">Manage keys</button></div>

      <div className="mt-4 space-y-3">{(data?.keys || localKeys.map(key => ({ id: key.id, name: key.name, prefix: key.prefix, status: key.status, applicationName: key.appName || 'Application', requests: 0, inputTokens: 0, outputTokens: 0, amountUsd: 0, monthlyRequestLimit: key.monthlyRequestLimit ?? null, monthlySpendLimitUsd: key.monthlySpendLimitUsd ?? null }))).map(key => <div key={key.id} className="grid gap-3 rounded-lg border border-[#262a35] bg-[#171a22] p-3 lg:grid-cols-[1.3fr_.8fr_.7fr_.7fr_auto] lg:items-center">

        <div className="min-w-0"><div className="truncate text-sm font-medium">{key.name}</div><div className="mt-1 font-mono text-[10px] text-[#828b9c]">{key.prefix} <span className="font-sans">· {key.applicationName}</span></div></div>

        <div className="text-xs"><span className="block text-[9px] uppercase text-[#747d8d]">Requests / spend</span><span className="font-mono">{key.requests.toLocaleString()} · {displayMoney(key.amountUsd).value}</span></div>

        <label className="text-[9px] uppercase text-[#747d8d]">Request cap<input aria-label={`Monthly request cap for ${key.name}`} type="number" min="1" placeholder="No cap" defaultValue={key.monthlyRequestLimit || ''} onBlur={event => { const v = event.target.value; void saveLimits(key.id, v ? Number(v) : null, key.monthlySpendLimitUsd); }} className="mt-1 block w-full rounded border border-[#353a47] bg-[#101218] px-2 py-1.5 text-xs text-white placeholder:text-[#606879]"/></label>

        <label className="text-[9px] uppercase text-[#747d8d]">Spend cap · USD<input aria-label={`Monthly spend cap for ${key.name}`} type="number" min="0" step="0.01" placeholder="No cap" defaultValue={key.monthlySpendLimitUsd || ''} onBlur={event => { const v = event.target.value; void saveLimits(key.id, key.monthlyRequestLimit, v ? Number(v) : null); }} className="mt-1 block w-full rounded border border-[#353a47] bg-[#101218] px-2 py-1.5 text-xs text-white placeholder:text-[#606879]"/></label>

        <span className={`w-fit rounded-full px-2 py-1 text-[9px] uppercase ${key.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>{savingKey === key.id ? 'Saving' : key.status}</span>

      </div>)}{!(data?.keys.length || localKeys.length) && <div className="rounded-lg border border-dashed border-[#353a47] p-6 text-center text-xs text-[#8b94a5]">No keys are assigned to this tenant yet.<button onClick={() => onNavigate('keys')} className="ml-1 text-indigo-300 underline">Create the first key</button></div>}</div>

    </section>



    <section className="grid gap-4 xl:grid-cols-2">

      <div className="rounded-xl border border-[#262a35] bg-[#12141b] p-5"><div className="flex items-center gap-2"><WalletCards size={17} className="text-emerald-200"/><h2 className="font-semibold">Payment methods & collection schedules</h2></div><p className="mt-2 text-xs leading-5 text-[#858d9d]">Card details are entered at the provider and remain vaulted there. ALTIL stores only an encrypted provider token and the consent record you approve.</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="text-[10px] text-[#858d9d]">Provider for secure card authorisation<select value={methodProvider} onChange={e=>setMethodProvider(e.target.value as any)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0d1119] p-2.5 text-xs text-white"><option value="stripe">Stripe · global cards & saved mandates</option><option value="payfast">PayFast · South African cards / ZAR</option><option value="ikhokha">iKhokha · hosted one-time checkout only</option></select></label><button onClick={()=>void setupSavedMethod()} disabled={billingBusy||!mandateConsent||methodProvider==='ikhokha'} className="self-end rounded-lg bg-emerald-300 px-3 py-2.5 text-xs font-semibold text-slate-950 disabled:opacity-40">Authorise card</button></div><label className="mt-3 flex items-start gap-2 text-[10px] leading-5 text-[#9da5b4]"><input type="checkbox" checked={mandateConsent} onChange={e=>setMandateConsent(e.target.checked)} className="mt-1 accent-emerald-300"/>I authorise the selected gateway to vault my card token. ALTIL may charge it only for the separate invoice/schedule mandate I confirm below. I can revoke it in this portal.</label>{methodProvider==='ikhokha'&&<p className="mt-2 text-[10px] text-amber-200">iKhokha is available for hosted invoice checkout. Its current public API guide does not document a stored-card token for automatic collection.</p>}<div className="mt-4 space-y-2">{savedMethods.map(method=><div key={method.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[.025] p-3 text-xs"><span><b>{method.displayMetadata?.provider||method.provider}</b><span className="ml-2 text-[10px] text-[#858d9d]">{method.displayMetadata?.cardBrand||'Card'} {method.displayMetadata?.last4?`•••• ${method.displayMetadata.last4}`:''} · mandate {method.status}</span></span>{method.status==='active'&&<button onClick={()=>void apiFetch(`${API_BASE}/billing/payment-methods/${method.id}`,{method:'DELETE'}).then(()=>refresh())} className="text-[10px] text-rose-200">Revoke</button>}</div>)}{!savedMethods.length&&<div className="text-[10px] text-[#697284]">No stored payment tokens. Set up a mandate above.</div>}</div><div className="mt-5 border-t border-white/5 pt-4"><div className="text-xs font-medium">Automate invoice collection</div><div className="mt-3 grid grid-cols-2 gap-2"><select value={scheduleType} onChange={e=>setScheduleType(e.target.value as any)} className="rounded-lg border border-white/10 bg-[#0d1119] p-2 text-[10px] text-white"><option value="threshold">Usage threshold (USD · Stripe)</option><option value="monthly">Monthly invoice collection</option></select><select value={scheduleType==='threshold'?'stripe':methodProvider} disabled={scheduleType==='threshold'} onChange={e=>setMethodProvider(e.target.value as any)} className="rounded-lg border border-white/10 bg-[#0d1119] p-2 text-[10px] text-white disabled:opacity-60"><option value="stripe">Stripe</option><option value="payfast">PayFast (ZAR)</option></select></div>{scheduleType==='threshold'&&<label className="mt-2 block text-[10px] text-[#858d9d]">Charge when successful metered usage reaches USD<input type="number" min="1" step="1" value={thresholdAmount} onChange={e=>setThresholdAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0d1119] p-2.5 text-xs text-white"/></label>}{scheduleType==='threshold'&&<label className="mt-2 block text-[10px] text-[#858d9d]">Maximum amount per charge (USD; set 0 for no cap)<input type="number" min="0" step="1" value={maximumCharge} onChange={e=>setMaximumCharge(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0d1119] p-2.5 text-xs text-white"/></label>}<label className="mt-3 flex items-start gap-2 text-[10px] leading-5 text-[#9da5b4]"><input type="checkbox" checked={scheduleConsent} onChange={e=>setScheduleConsent(e.target.checked)} className="mt-1 accent-emerald-300"/>I approve this exact schedule: {scheduleType==='threshold'?`ALTIL may invoice my successful USD usage when it reaches $${thresholdAmount} and attempt to collect up to $${maximumCharge||'the outstanding usage amount'} per charge using my Stripe mandate.`:`ALTIL may attempt to collect issued invoices monthly using my selected saved payment token.`} I can pause or cancel it at any time.</label><button onClick={()=>void createBillingSchedule()} disabled={billingBusy||!scheduleConsent||!savedMethods.some(method=>method.status==='active'&&method.provider===(scheduleType==='threshold'?'stripe':methodProvider))} className="mt-3 rounded-lg border border-emerald-200/20 px-3 py-2 text-[10px] text-emerald-100 disabled:opacity-40">Create authorised schedule</button><div className="mt-3 space-y-2">{billingSchedules.map(schedule=><div key={schedule.id} className="flex items-center justify-between rounded-lg bg-white/[.025] p-2 text-[10px]"><span>{schedule.scheduleType==='threshold'?`Usage threshold · USD ${schedule.thresholdAmount}`:'Monthly invoice collection'} · {schedule.status}</span>{schedule.status!=='cancelled'&&<button onClick={()=>void changeBillingSchedule(schedule.id,schedule.status==='active'?'paused':'active')} className="text-cyan-200">{schedule.status==='active'?'Pause':'Resume'}</button>}</div>)}</div></div></div>

      <div className="rounded-xl border border-[#262a35] bg-[#12141b] p-5"><h2 className="font-semibold">Collection guardrails</h2><p className="mt-2 text-xs leading-6 text-[#858d9d]">ALTIL keeps payment tokens with the selected gateway and never requests or stores your CVV. A failed collection remains visible as an open invoice; retries are paced and produce a payment attempt reference. Usage-threshold schedules create an itemised invoice only after the tenant’s successful, billable USD usage reaches the amount you approved. Cancel or revoke here before future charges are attempted.</p><div className="mt-4 rounded-xl border border-amber-200/10 bg-amber-200/[.03] p-3 text-[10px] leading-5 text-amber-100/70">Automatic usage threshold billing currently uses USD metering and Stripe mandates. PayFast token debit is ZAR-only; iKhokha hosted payments are one-time. Exchange rates are not guessed or silently applied.</div><button onClick={()=>onNavigate('accounting')} className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-xs">Open accounting & settlement</button></div>

    </section>



    <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">

      <div className="rounded-xl border border-[#262a35] bg-[#12141b] p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Application portfolio</h2><button onClick={() => onNavigate('applications')} className="text-[10px] text-indigo-300 hover:text-white">Full application view</button></div><div className="mt-4 space-y-2">{(data?.applications || localApps).map(app => { const parent = (data?.applications || localApps).find(item => item.id === app.parentApplicationId); const kind = app.applicationType || 'application'; return <div key={app.id} className="flex items-center justify-between rounded-lg bg-[#191c25] p-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate text-sm">{app.name}</span><span className="rounded bg-indigo-400/10 px-1.5 py-0.5 text-[8px] uppercase text-indigo-200">{kind.replace('_', ' ')}</span></div><div className="mt-1 text-[10px] text-[#818a9a]">{parent ? `↳ ${parent.name} · ` : ''}{app.environment} · {app.status}{app.functionIdentifier ? ` · ${app.functionIdentifier}` : ''}</div></div><div className="text-right"><div className="font-mono text-xs">{app.quotaUsedRequests.toLocaleString()}</div><div className="text-[9px] text-[#818a9a]">requests counted</div></div></div>; })}{!(data?.applications.length || localApps.length) && <div className="text-xs text-[#818a9a]">Your application list will appear here.</div>}</div>

        <form onSubmit={createChildApplication} className="mt-4 rounded-lg border border-[#2b3040] bg-[#171a22] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium">Add a scoped key</span><div className="flex gap-1 rounded-lg bg-black/20 p-1"><button type="button" onClick={() => setNewApplicationType('sub_application')} className={`rounded px-2 py-1 text-[9px] ${newApplicationType === 'sub_application' ? 'bg-indigo-500/20 text-indigo-200' : 'text-[#828b9c]'}`}>Sub-app</button><button type="button" onClick={() => setNewApplicationType('function')} className={`rounded px-2 py-1 text-[9px] ${newApplicationType === 'function' ? 'bg-indigo-500/20 text-indigo-200' : 'text-[#828b9c]'}`}>Function</button></div></div><div className="mt-2 grid gap-2 sm:grid-cols-2"><input required value={newApplicationName} onChange={event => setNewApplicationName(event.target.value)} placeholder={newApplicationType === 'function' ? 'Function name' : 'Sub-application name'} className="rounded border border-[#353a47] bg-[#101218] px-2 py-2 text-xs text-white placeholder:text-[#606879]"/><select required value={newApplicationParent} onChange={event => setNewApplicationParent(event.target.value)} className="rounded border border-[#353a47] bg-[#101218] px-2 py-2 text-xs text-white"><option value="">Choose parent application</option>{(data?.applications || localApps).filter(app => app.applicationType !== 'function').map(app => <option key={app.id} value={app.id}>{app.name}</option>)}</select></div>{newApplicationType === 'function' && <input value={newFunctionIdentifier} onChange={event => setNewFunctionIdentifier(event.target.value)} placeholder="Function identifier (optional)" className="mt-2 w-full rounded border border-[#353a47] bg-[#101218] px-2 py-2 text-xs text-white placeholder:text-[#606879]"/>}<button type="submit" className="mt-2 rounded bg-indigo-500/15 px-3 py-2 text-[10px] text-indigo-200 hover:bg-indigo-500/25">Create scope and issue key</button>{createdSecret && <div className="mt-3 break-all rounded border border-amber-300/20 bg-amber-300/5 p-2 text-[10px] text-amber-100"><div className="mb-1 font-bold">Copy this new key now. ALTIL stores only its hash.</div><code>{createdSecret}</code><button type="button" onClick={() => void navigator.clipboard.writeText(createdSecret)} className="ml-2 underline">Copy</button></div>}</form>

      </div>

      <div className="rounded-xl border border-[#262a35] bg-[#12141b] p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Recent model activity</h2><p className="mt-1 text-xs text-[#858d9d]">Each successful model call is tied back to its credential.</p></div><Clock3 size={16} className="text-[#747d8d]"/></div><div className="mt-4 max-h-72 overflow-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-[#12141b] text-[9px] uppercase text-[#747d8d]"><tr><th className="py-2">Model / key</th><th>When</th><th className="text-right">Tokens</th><th className="text-right">Cost</th></tr></thead><tbody className="divide-y divide-[#242833]">{(data?.activity || []).slice(0, 30).map(item => <tr key={item.id}><td className="max-w-52 py-2.5"><div className="truncate text-[#d8dce5]">{item.modelName}</div><div className="mt-0.5 font-mono text-[9px] text-[#737c8d]">{item.apiKeyPrefix}</div></td><td className="whitespace-nowrap text-[10px] text-[#8b94a5]">{new Date(item.at).toLocaleString()}</td><td className="text-right font-mono text-[10px]">{(item.inputTokens + item.outputTokens).toLocaleString()}</td><td className="text-right font-mono text-[10px]">{displayMoney(item.amountUsd).value}</td></tr>)}</tbody></table>{!data?.activity.length && <div className="py-8 text-center text-xs text-[#687183]">Successful requests will appear here.</div>}</div></div>

    </section>



    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#262a35] bg-[#12141b] px-5 py-4 text-xs text-[#8992a3]"><span className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-300"/>Tenant data is isolated. ALTIL policy and compliance guardrails apply to every key.</span><span className="flex items-center gap-3"><span className="inline-flex items-center gap-1"><ArrowUpRight size={12}/>Successful calls metered</span><span className="inline-flex items-center gap-1"><ArrowDownRight size={12}/>Failed calls not billed</span></span></div>

  </div>;

};



const Metric = ({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) => {

  const toneClass: Record<string, string> = { indigo: 'text-indigo-300', emerald: 'text-emerald-300', sky: 'text-sky-300', violet: 'text-violet-300' };

  return <div className="rounded-xl border border-white/5 bg-black/15 p-4"><div className={`flex items-center gap-2 ${toneClass[tone] || 'text-indigo-300'}`}>{icon}<span className="text-[10px] uppercase tracking-wider text-[#a3aabd]">{label}</span></div><div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-[10px] text-[#858d9d]">{detail}</div></div>;

};



