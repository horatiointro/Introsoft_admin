import { apiFetch } from '../utils/apiFetch';
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, Check, CircleDollarSign, Clock3, Globe2, RefreshCw, Save, ShieldCheck } from 'lucide-react';

const API_BASE = `${import.meta.env.BASE_URL}api/v1`;
type CurrencyRow = { code: string; name: string; rate: number | null; isFresh?: boolean; source: string | null; asOf: string | null; updatedAt: string | null; updatedBy: string | null };
type CurrencyConfig = { accountingCurrency: string; defaultDisplayCurrency: string; defaultLocale: string; rateStaleAfterHours: number; currencies: CurrencyRow[]; lastUpdatedAt: string };
const authHeaders = () => ({ 'Content-Type': 'application/json', ...(localStorage.getItem('altil_auth_token') ? { Authorization: `Bearer ${localStorage.getItem('altil_auth_token')}` } : {}) });

export const AdminSettingsView: React.FC = () => {
  const [config, setConfig] = useState<CurrencyConfig | null>(null);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [source, setSource] = useState('Finance-approved manual rate');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [error, setError] = useState('');
  const [defaultDisplayCurrency, setDefaultDisplayCurrency] = useState('USD');
  const [defaultLocale, setDefaultLocale] = useState('en-US');
  const [rateStaleAfterHours, setRateStaleAfterHours] = useState(24);

  const refresh = async () => {
    setBusy('loading');
    try {
      const response = await apiFetch(`${API_BASE}/currency/config`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Currency setup could not be loaded.');
      setConfig(data); setDefaultDisplayCurrency(data.defaultDisplayCurrency); setDefaultLocale(data.defaultLocale); setRateStaleAfterHours(data.rateStaleAfterHours);
      setRates(Object.fromEntries(data.currencies.filter((row: CurrencyRow) => row.rate !== null).map((row: CurrencyRow) => [row.code, String(row.rate)])));
      setError('');
    } catch (e: any) { setError(e.message || 'Currency setup is unavailable.'); }
    finally { setBusy(''); }
  };
  useEffect(() => { void refresh(); }, []);

  const rows = useMemo(() => (config?.currencies || []).filter(row => !search || `${row.code} ${row.name}`.toLowerCase().includes(search.toLowerCase())), [config, search]);
  const saveDefaults = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy('defaults'); setError('');
    try {
      const response = await apiFetch(`${API_BASE}/admin/currency/config`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ defaultDisplayCurrency, defaultLocale, rateStaleAfterHours }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Currency defaults could not be saved.');
      setNotice(data.message); await refresh();
    } catch (e: any) { setError(e.message || 'Currency defaults could not be saved.'); }
    finally { setBusy(''); }
  };
  const saveRate = async (row: CurrencyRow) => {
    if (row.code === 'USD') return;
    const unitsPerUsd = Number(rates[row.code]);
    if (!Number.isFinite(unitsPerUsd) || unitsPerUsd <= 0 || !source.trim()) { setError('Enter a positive FX rate and a source.'); return; }
    setBusy(row.code); setError('');
    try {
      const response = await apiFetch(`${API_BASE}/admin/currency/rates/${row.code}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ unitsPerUsd, source }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'FX rate could not be saved.');
      setNotice(`${row.code} rate saved at ${new Date(data.asOf).toLocaleString()}.`); await refresh();
    } catch (e: any) { setError(e.message || 'FX rate could not be saved.'); }
    finally { setBusy(''); }
  };
  const loadHistory = async (code: string) => {
    setBusy(`history-${code}`); setError('');
    try { const response = await apiFetch(`${API_BASE}/admin/currency/rates/${code}/history`, { headers: authHeaders() }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Rate history could not be loaded.'); setHistory(current => ({ ...current, [code]: data })); }
    catch (e: any) { setError(e.message || 'Rate history could not be loaded.'); } finally { setBusy(''); }
  };
  const removeRate = async (code: string) => {
    setBusy(code); setError('');
    try { const response = await apiFetch(`${API_BASE}/admin/currency/rates/${code}`, { method: 'DELETE', headers: authHeaders() }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Rate could not be removed.'); setNotice(data.message); await refresh(); }
    catch (e: any) { setError(e.message || 'Rate could not be removed.'); }
    finally { setBusy(''); }
  };

  return <main className="space-y-5 pb-10 text-slate-100">
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-cyan-200/10 bg-gradient-to-br from-[#122337] via-[#111a28] to-[#101319] p-6">
      <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-cyan-200"><Globe2 size={15}/> Global currency controls</div><h1 className="mt-2 text-2xl font-semibold">One ledger. Local views.</h1><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">ALTIL records revenue, usage and accounting in USD. Each customer can choose a local display currency; converted amounts are estimates with an attributed rate and timestamp.</p></div>
      <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"><RefreshCw size={13} className={busy === 'loading' ? 'animate-spin' : ''}/>Reload FX book</button>
    </header>
    {(error || notice) && <div role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-xs ${error ? 'border-rose-300/20 bg-rose-300/5 text-rose-200' : 'border-emerald-300/15 bg-emerald-300/5 text-emerald-100'}`}>{error || notice}</div>}
    <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <div className="rounded-2xl border border-white/[.07] bg-[#111722] p-5"><div className="flex items-center gap-2 text-cyan-100"><CircleDollarSign size={18}/><h2 className="text-sm font-semibold">Accounting base</h2></div><div className="mt-4 flex items-end gap-3"><b className="text-4xl tracking-tight">USD</b><span className="mb-1 rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] text-emerald-200">Locked for now</span></div><p className="mt-3 text-xs leading-5 text-slate-400">New ALTIL AI usage is metered in USD. Posted invoices and journals retain their source currency; a portal display choice never rewrites them.</p><div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200/10 bg-amber-200/[.035] p-3 text-[10px] leading-5 text-amber-100/75"><ShieldCheck size={14} className="mt-0.5 shrink-0"/>No FX rate is guessed. If a currency rate is missing or not configured, ALTIL shows the source currency until a finance administrator adds a rate.</div></div>
      <form onSubmit={saveDefaults} className="rounded-2xl border border-white/[.07] bg-[#111722] p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Display defaults</h2><p className="mt-1 text-[10px] text-slate-500">Tenant preferences override these defaults.</p></div><button disabled={busy === 'defaults'} className="inline-flex items-center gap-2 rounded-lg bg-cyan-200 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"><Save size={13}/>{busy === 'defaults' ? 'Saving…' : 'Save defaults'}</button></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-[10px] text-slate-400">Default display currency<select value={defaultDisplayCurrency} onChange={e => setDefaultDisplayCurrency(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c111a] px-3 py-2 text-xs text-white">{(config?.currencies || []).filter(row => row.rate !== null && row.isFresh).map(row => <option key={row.code} value={row.code}>{row.code} · {row.name}</option>)}</select></label><label className="text-[10px] text-slate-400">Number format locale<input value={defaultLocale} onChange={e => setDefaultLocale(e.target.value)} placeholder="en-ZA" className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c111a] px-3 py-2 text-xs text-white"/></label><label className="text-[10px] text-slate-400">Rate freshness (hours)<input type="number" min="1" max="720" value={rateStaleAfterHours} onChange={e => setRateStaleAfterHours(Number(e.target.value))} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c111a] px-3 py-2 text-xs text-white"/></label></div><p className="mt-3 flex items-center gap-1.5 text-[9px] text-slate-600"><Clock3 size={11}/> Last FX table update: {config?.lastUpdatedAt ? new Date(config.lastUpdatedAt).toLocaleString() : 'Not yet configured'}</p></form>
    </section>
    <section className="overflow-hidden rounded-2xl border border-white/[.07] bg-[#111722]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[.06] p-5"><div><h2 className="text-sm font-semibold">Exchange-rate book</h2><p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-500">Enter units of local currency for one USD. Every update records its source, editor and effective timestamp; use your approved rate source and accounting policy.</p></div><label className="text-[9px] text-slate-500">Rate source<input value={source} onChange={e => setSource(e.target.value)} className="mt-1 block w-64 max-w-full rounded-lg border border-white/10 bg-[#0c111a] px-3 py-2 text-[10px] text-white"/></label><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter currencies" className="rounded-lg border border-white/10 bg-[#0c111a] px-3 py-2 text-xs text-white"/></div>
      <div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="sticky top-0 bg-[#0d131d] text-[9px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Currency</th><th className="px-3 py-3">1 USD =</th><th className="px-3 py-3">Rate source & timestamp</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-white/[.045]">{rows.map(row => <React.Fragment key={row.code}>
        <tr className="hover:bg-white/[.018]">
          <td className="px-5 py-3"><b>{row.code}</b><span className="ml-2 text-[10px] text-slate-500">{row.name}</span></td>
          <td className="px-3 py-3">{row.code === 'USD' ? <span className="font-mono text-emerald-200">1.000000 · Base</span> : <input aria-label={`Units of ${row.code} per USD`} type="number" min="0.000000000001" step="any" value={rates[row.code] || ''} onChange={e => setRates(current => ({ ...current, [row.code]: e.target.value }))} placeholder="Not configured" className="w-48 rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5 font-mono text-[10px] text-white placeholder:text-slate-700"/>}</td>
          <td className="px-3 py-3"><span className="block text-[10px] text-slate-300">{row.source || 'Rate not configured'}</span><span className="mt-1 block text-[9px] text-slate-600">{row.asOf ? `${new Date(row.asOf).toLocaleString()} · ${row.updatedBy || '—'}` : '—'}</span></td>
          <td className="px-5 py-3 text-right"><span className="inline-flex gap-2"><button type="button" disabled={busy === `history-${row.code}`} onClick={() => void loadHistory(row.code)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[9px] text-slate-400 hover:text-cyan-100">{busy === `history-${row.code}` ? 'Loading…' : 'History'}</button>{row.code !== 'USD' && <>{row.rate !== null && <button type="button" disabled={busy === row.code} onClick={() => void removeRate(row.code)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[9px] text-slate-500 hover:text-rose-200">Remove</button>}<button type="button" disabled={busy === row.code} onClick={() => void saveRate(row)} className="inline-flex items-center gap-1 rounded-lg border border-cyan-200/15 px-2.5 py-1.5 text-[9px] text-cyan-100 hover:bg-cyan-200/5 disabled:opacity-50">{busy === row.code ? <RefreshCw size={11} className="animate-spin"/> : <Check size={11}/>}Save rate</button></>}</span></td>
        </tr>
        {history[row.code] && <tr><td colSpan={4} className="bg-black/10 px-5 py-3"><div className="flex flex-wrap gap-x-5 gap-y-2">{history[row.code].map((entry: any, index: number) => <span key={`${entry.as_of}-${index}`} className="text-[9px] text-slate-400">{Number(entry.units_per_usd).toPrecision(8)} {row.code}/USD · {entry.source} · {new Date(entry.as_of).toLocaleString()} · {entry.changed_by}</span>)}</div>{!history[row.code].length && <span className="text-[9px] text-slate-600">No rate changes recorded.</span>}</td></tr>}
      </React.Fragment>)}</tbody></table></div>
      <footer className="flex items-center gap-2 border-t border-white/[.06] px-5 py-3 text-[9px] text-slate-600"><ArrowDownToLine size={12}/>Rates are for indicative display unless an invoice explicitly records an FX conversion and settlement currency.</footer>
    </section>
  </main>;
};
