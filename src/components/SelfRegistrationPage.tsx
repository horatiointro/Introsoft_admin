import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, CircleDollarSign, LockKeyhole, Shield, Sparkles, UserRound, Building2 } from 'lucide-react';
import type { LicensingPlanTemplate } from '../types';

const API = `${import.meta.env.BASE_URL}api/v1`;

type RegistrationResult = { status: 'pending_approval'; registrationId: string; plan: { name: string }; message: string };

export const SelfRegistrationPage: React.FC = () => {
  const [plans, setPlans] = useState<LicensingPlanTemplate[]>([]);
  const [planId, setPlanId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [form, setForm] = useState({ companyName: '', firstName: '', lastName: '', email: '', password: '', accountType: 'company', applicationName: '', country: 'South Africa', acceptedTerms: false });

  useEffect(() => {
    fetch(`${API}/public/plans`).then(response => response.ok ? response.json() : Promise.reject())
      .then((items: LicensingPlanTemplate[]) => {
        setPlans(items);
        if (items.length) setPlanId(items.find(plan => plan.id === 'plan-team-100k')?.id || items[0].id);
      })
      .catch(() => setError('Published packages are temporarily unavailable. Please try again soon.'));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`${API}/public/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, planId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'We could not record your registration request.');
      setResult(data as RegistrationResult);
    } catch (failure: any) { setError(failure.message || 'Registration failed.'); }
    finally { setBusy(false); }
  };

  const field = 'w-full rounded-xl border border-white/10 bg-[#0c111a] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10';
  return <div className="min-h-screen bg-[#090d14] text-slate-100"><div className="mx-auto max-w-7xl px-5 py-8 md:px-10">
    <header className="flex items-center justify-between"><a href="/" className="flex items-center gap-3 text-lg font-semibold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-indigo-400 text-slate-950"><Sparkles size={20}/></span>ALTIL<span className="ml-1 text-xs font-normal text-slate-500">by Introsoft</span></a><a href="/" className="text-sm text-slate-400 hover:text-white">Already have an account? Sign in →</a></header>
    <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#162844] via-[#121b2a] to-[#11141c] px-6 py-10 md:px-12 md:py-14"><div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"/><div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
      <div><span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-[11px] uppercase tracking-[.18em] text-cyan-100"><Shield size={14}/> Governed AI, ready for your team</span><h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">A safer way to put AI to work.</h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-300">Submit a customer registration request for an ALTIL workspace. Account provisioning starts only after owner approval.</p><div className="mt-7 grid gap-3 sm:grid-cols-3">{[['One key, many models','Governed AI gateway access after approval'],['Your own workspace','Usage and users stay tenant scoped'],['Built-in guardrails','Quota, privacy and audit controls']].map(([title, detail])=><div key={title} className="rounded-2xl border border-white/10 bg-black/15 p-4"><CheckCircle2 size={16} className="text-emerald-300"/><b className="mt-3 block text-sm">{title}</b><span className="mt-1 block text-xs leading-5 text-slate-400">{detail}</span></div>)}</div></div>
      <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-[#0d131e]/90 p-5 shadow-2xl backdrop-blur md:p-7">
        {result ? <div className="space-y-5"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-200"><Check size={24}/></div><div><h2 className="text-2xl font-semibold">Request submitted</h2><p className="mt-2 text-sm leading-6 text-slate-400">{result.message}</p></div><div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm"><div className="font-medium">{result.plan.name}</div><div className="mt-2 text-xs text-slate-400">Reference: {result.registrationId}</div><div className="mt-3 text-xs text-slate-400">No user account, tenant access, API key, license, or payment is issued until approval.</div></div><a href="/" className="block rounded-xl bg-cyan-300 px-4 py-3 text-center text-sm font-semibold text-slate-950">Continue to sign in <ArrowRight size={15} className="ml-2 inline"/></a></div> : <>
          <div className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-cyan-200"><UserRound size={15}/> Request an ALTIL workspace</div>
          {error && <div className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs text-rose-200">{error}</div>}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1"><button type="button" onClick={()=>setForm({...form,accountType:'individual'})} className={`rounded-lg px-3 py-2.5 text-xs ${form.accountType==='individual'?'bg-white/10 text-white':'text-slate-400'}`}><UserRound size={14} className="mr-1 inline"/>Individual</button><button type="button" onClick={()=>setForm({...form,accountType:'company'})} className={`rounded-lg px-3 py-2.5 text-xs ${form.accountType==='company'?'bg-white/10 text-white':'text-slate-400'}`}><Building2 size={14} className="mr-1 inline"/>Company</button></div>
          <div className="mt-4 space-y-3">{form.accountType==='company' ? <label className="block text-xs text-slate-400">Company / workspace name<input required minLength={2} maxLength={180} value={form.companyName} onChange={e=>setForm({...form,companyName:e.target.value})} className={`${field} mt-1.5`} placeholder="e.g. Northstar Health"/></label> : null}<div className="grid grid-cols-2 gap-3"><label className="block text-xs text-slate-400">{form.accountType==='company'?'Owner first name':'First name'}<input required maxLength={100} value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} className={`${field} mt-1.5`}/></label><label className="block text-xs text-slate-400">{form.accountType==='company'?'Owner last name':'Last name'}<input required maxLength={100} value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} className={`${field} mt-1.5`}/></label></div><label className="block text-xs text-slate-400">Owner email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={`${field} mt-1.5`} placeholder="you@company.com"/></label><label className="block text-xs text-slate-400">Password<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className={`${field} mt-1.5`} placeholder="Create a strong password"/><small className="mt-1 block text-[10px] text-slate-500">Use at least 8 characters, including one uppercase letter and one special character.</small></label><div className="grid grid-cols-2 gap-3"><label className="block text-xs text-slate-400">First application<input required maxLength={180} value={form.applicationName} onChange={e=>setForm({...form,applicationName:e.target.value})} className={`${field} mt-1.5`} placeholder="Support assistant"/></label><label className="block text-xs text-slate-400">Country<input required maxLength={80} value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className={`${field} mt-1.5`} placeholder="Country"/></label></div><label className="block text-xs text-slate-400">Package<select required value={planId} onChange={e=>setPlanId(e.target.value)} className={`${field} mt-1.5`}>{plans.map(plan=><option key={plan.id} value={plan.id}>{plan.name} · {plan.currency} {plan.basePrice}/{plan.billingCycle}</option>)}</select></label><label className="flex items-start gap-2 text-[11px] leading-5 text-slate-400"><input required type="checkbox" checked={form.acceptedTerms} onChange={e=>setForm({...form,acceptedTerms:e.target.checked})} className="mt-1 accent-cyan-300"/>I agree to ALTIL’s terms, privacy and acceptable-use policies, and understand this is a registration request subject to owner approval.</label><button disabled={busy||!plans.length||!planId} className="w-full rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">{busy?'Submitting request…':'Submit registration request'} <ArrowRight size={15} className="ml-2 inline"/></button></div><p className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500"><LockKeyhole size={12}/> Password securely hashed · no API key or payment is issued before approval</p>
        </>}
      </form>
    </div></section><footer className="flex flex-wrap justify-between gap-3 py-6 text-[11px] text-slate-600"><span>Introsoft ALTIL · Governed AI Infrastructure</span><span><CircleDollarSign size={13} className="mr-1 inline"/>Package billing and payment collection follow approved account terms.</span></footer>
  </div></div>;
};
