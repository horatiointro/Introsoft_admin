import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';

const API = `${import.meta.env.BASE_URL}api/v1/auth/users/activate`;

export const AccountActivationPage: React.FC = () => {
  const token = window.location.hash.slice(1);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const activate = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!token) return setError('This activation link does not contain a token. Request a new invitation.');
    if (password !== confirmation) return setError('The passwords do not match.');
    setBusy(true);
    try {
      const response = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Account activation failed.');
      setDone(true); setPassword(''); setConfirmation('');
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    } catch (failure: any) { setError(failure.message || 'Account activation failed.'); }
    finally { setBusy(false); }
  };

  return <main className="grid min-h-screen place-items-center bg-[#090d14] px-5 text-slate-100"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111824] p-8"><a href="/" className="mb-7 flex items-center gap-3 text-lg font-semibold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-indigo-400 text-slate-950"><Sparkles size={20}/></span>ALTIL</a><h1 className="text-2xl font-semibold">Activate your account</h1><p className="mt-2 text-sm leading-6 text-slate-400">Choose a password to activate the invited user account.</p>{error && <div role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-200">{error}</div>}{done ? <div className="mt-6 space-y-4"><p className="rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm text-emerald-100">Your account is active. You can now sign in.</p><a href="/" className="block rounded-xl bg-cyan-300 px-4 py-3 text-center font-semibold text-slate-950">Continue to sign in <ArrowRight size={15} className="ml-2 inline"/></a></div> : <form onSubmit={activate} className="mt-6 space-y-4"><label className="block text-sm text-slate-300">New password<input required minLength={14} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#090d14] px-4 py-3 text-white"/></label><label className="block text-sm text-slate-300">Confirm password<input required minLength={14} maxLength={128} type="password" autoComplete="new-password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#090d14] px-4 py-3 text-white"/></label><p className="flex items-center gap-2 text-xs text-slate-500"><LockKeyhole size={13}/>Use 14+ characters with uppercase, lowercase, number and symbol.</p><button disabled={busy||!token} className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy?'Activating…':'Activate account'}</button></form>}</section></main>;
};
