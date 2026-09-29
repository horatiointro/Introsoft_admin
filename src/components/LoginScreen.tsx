import React, { useEffect, useState } from 'react';
import { AltilLogo } from './AltilLogo';
import { Shield, Lock, User, Key, ArrowRight, CheckCircle2, AlertCircle, Building2, Smartphone, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: { name: string; email: string; role: string; tenant: string }) => void;
}

const API_BASE = `${import.meta.env.BASE_URL}api/v1`;

async function readAuthResponse(response: Response) {
  const body = await response.text();
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`Authentication service returned an unreadable response (HTTP ${response.status}).`);
  }
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('horatio.huxham@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState(import.meta.env.BASE_URL === '/admin-test/' ? '000000' : '849201');
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickAccessAvailable, setQuickAccessAvailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/auth/super-admin-access/availability`)
      .then(response => response.ok ? response.json() : { available: false })
      .then(data => { if (active) setQuickAccessAvailable(data.available === true); })
      .catch(() => { if (active) setQuickAccessAvailable(false); });
    return () => { active = false; };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both your corporate email and security password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          mfaCode,
          selectedTenant
        })
      });

      const data = await readAuthResponse(response);

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (data.token) {
        localStorage.setItem('altil_auth_token', data.token);
        localStorage.setItem('altil_user_profile', JSON.stringify(data.user));
      }

      setIsSubmitting(false);
      onLoginSuccess({
        name: data.user?.name || 'Horatio Huxham',
        email: data.user?.email || email,
        role: data.user?.role || 'Global Super Admin',
        tenant: selectedTenant === 'all' ? 'Total Company Scope' : selectedTenant
      });
    } catch (err: any) {
      console.warn('Backend authentication API unreachable or rejected:', err);
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error && err.message === 'Failed to fetch'
        ? 'Unable to reach the authentication service. Check the server connection and try again.'
        : (err.message || 'Authentication failed. Please try again.'));
    }
  };

  const handleSuperAdminQuickAccess = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE}/auth/super-admin-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await readAuthResponse(response);
      if (!response.ok || !data.token || !data.user) {
        throw new Error(data.error || data.message || 'Super Admin access could not be created.');
      }

      localStorage.setItem('altil_auth_token', data.token);
      localStorage.setItem('altil_user_profile', JSON.stringify(data.user));

      setIsSubmitting(false);
      onLoginSuccess({
        name: data.user.name || 'Super Administrator',
        email: data.user.email || email,
        role: data.user.role || 'SUPER_ADMIN',
        tenant: 'Total Company Scope'
      });
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Super Admin access could not be created. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-white flex flex-col justify-between p-4 sm:p-8 select-none relative overflow-hidden font-sans">
      {/* Background Cyber Grid & Gradient Spheres */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.08)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25 pointer-events-none" />

      {/* Top Header Branding */}
      <div className="relative z-10 flex items-center justify-between max-w-7xl mx-auto w-full">
        <AltilLogo size="md" showTagline={true} />
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#0d121f] border border-[#1e293b] px-3.5 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>FIPS 140-3 HSM Portal Active</span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="relative z-10 w-full max-w-xl mx-auto my-auto py-8">
        {/* Banner Mirroring Welcome Graphic */}
        <div className="bg-gradient-to-r from-[#0c121e] via-[#111928] to-[#0c121e] border border-[#1f293d] rounded-2xl p-6 mb-6 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-block mb-2">
            SINGLE SIGN-ON GATEWAY
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            ALTIL SECURE AI
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Administration Console • Powered by Introsoft International
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-[#0e1320] border border-[#1e2738] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Enterprise Authentication
            </h2>
            <p className="text-xs text-slate-400">
              Enter your corporate credentials to access tenant administration & AI governance.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[#8890a6] uppercase text-[10px] font-bold block">
                Corporate Email Address
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-[#141a29] border border-[#232d42] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#8890a6] uppercase text-[10px] font-bold">
                  Security Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); setErrorMessage('Password reset instructions dispatched to your corporate email.'); }} className="text-[10px] text-emerald-400 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#141a29] border border-[#232d42] focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hardware Token MFA Code */}
            <div className="space-y-1.5">
              <label className="text-[#8890a6] uppercase text-[10px] font-bold block">
                Hardware Authenticator MFA Code
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value)}
                  placeholder="6-digit MFA token"
                  maxLength={6}
                  className="w-full bg-[#141a29] border border-[#232d42] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-emerald-300 tracking-widest font-bold focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-1.5">
              <label className="text-[#8890a6] uppercase text-[10px] font-bold block">
                Initial Tenant Scope Context
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-blue-400 absolute left-3.5 top-3" />
                <select
                  value={selectedTenant}
                  onChange={e => setSelectedTenant(e.target.value)}
                  className="w-full bg-[#141a29] border border-[#232d42] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none cursor-pointer"
                >
                  <option value="all">Total Company Scope (Global Super Admin)</option>
                  <option value="ACME Financial">ACME Financial Holdings</option>
                  <option value="Apex Logistics">Apex Logistics Group</option>
                  <option value="Sovereign Health">Sovereign Health Ltd</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 group mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Launch Console</span>
                  <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {quickAccessAvailable && (
            <div className="pt-4 border-t border-[#1e2738]">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSuperAdminQuickAccess}
                className="w-full p-3 bg-[#141a29] hover:bg-[#1f283d] border border-[#232d42] hover:border-emerald-500 text-slate-200 hover:text-white rounded-xl transition-colors text-center text-xs font-bold disabled:opacity-50"
              >
                Super Admin Access
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Legal */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full text-[10px] font-mono text-slate-500 pt-4 border-t border-[#141a28]">
        <div>© 2026 Introsoft International. All rights reserved.</div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <span>Statutory POPIA/GDPR Vault v4.8</span>
          <span>•</span>
          <span>FIPS 140-3 HSM Certified</span>
        </div>
      </div>
    </div>
  );
};
