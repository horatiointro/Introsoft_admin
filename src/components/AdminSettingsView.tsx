import React, { useState } from 'react';
import { AltilLogo } from './AltilLogo';
import {
  Settings,
  DollarSign,
  Globe,
  ShieldCheck,
  Database,
  Save,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Percent,
  Coins
} from 'lucide-react';

interface AdminSettingsViewProps {
  onSaveSettings?: (settings: any) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onSaveSettings }) => {
  const [currencyCode, setCurrencyCode] = useState('ZAR');
  const [currencySymbol, setCurrencySymbol] = useState('R');
  const [defaultVatRate, setDefaultVatRate] = useState(15.0); // 15% South African VAT
  const [defaultCreditLimit, setDefaultCreditLimit] = useState(50000); // 50,000 ZAR
  const [defaultCreditBalance, setDefaultCreditBalance] = useState(15000); // 15,000 ZAR
  const [autoOverageEnabled, setAutoOverageEnabled] = useState(true);
  const [defaultBillingCycle, setDefaultBillingCycle] = useState('monthly');
  const [exchangeRateUsdToZar, setExchangeRateUsdToZar] = useState(18.50);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = {
      currencyCode,
      currencySymbol,
      defaultVatRate,
      defaultCreditLimit,
      defaultCreditBalance,
      autoOverageEnabled,
      defaultBillingCycle,
      exchangeRateUsdToZar
    };
    if (onSaveSettings) onSaveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div className="flex items-center gap-3.5">
          <AltilLogo size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Admin Control Panel: Currency & System Variables
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Primary Currency: ZAR (R)
              </span>
            </div>
            <p className="text-xs text-[#888888] mt-0.5">
              Configure global monetary standards, VAT tax rates, default billing limits, and multi-tenant system variables.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg flex items-center gap-2.5 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>System configuration and currency parameters updated successfully across Introsoft Enterprise Gateway.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Currency & Financial Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121212] border border-[#222222] rounded-lg p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-[#222222] pb-4">
              <div className="w-8 h-8 rounded bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Currency & Monetary Standards</h2>
                <p className="text-xs text-[#888888]">Enforces South African Rand (ZAR / R) across all tenant invoicing and ledgers.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#888888] mb-1 font-mono">Default Currency Code</label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] text-white rounded px-3 py-2 outline-none font-medium"
                >
                  <option value="ZAR">ZAR (South African Rand)</option>
                  <option value="USD" disabled>USD ($) [Restricted by Admin Policy]</option>
                </select>
              </div>

              <div>
                <label className="block text-[#888888] mb-1 font-mono">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] text-white rounded px-3 py-2 outline-none font-mono font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[#888888] mb-1 font-mono">Default Statutory VAT Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={defaultVatRate}
                    onChange={(e) => setDefaultVatRate(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#2a2a2a] text-white rounded px-3 py-2 pl-7 outline-none font-mono"
                  />
                  <Percent className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2.5" />
                </div>
                <span className="text-[11px] text-[#666666] mt-1 block">Standard South African VAT (SARS compliant: 15.0%)</span>
              </div>

              <div>
                <label className="block text-[#888888] mb-1 font-mono">USD to ZAR Conversion Multiplier</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={exchangeRateUsdToZar}
                    onChange={(e) => setExchangeRateUsdToZar(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#2a2a2a] text-white rounded px-3 py-2 pl-7 outline-none font-mono"
                  />
                  <span className="text-[#888888] absolute left-2.5 top-2 text-xs font-bold">R</span>
                </div>
                <span className="text-[11px] text-[#666666] mt-1 block">Base gateway telemetry rate normalization</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#222222] rounded-lg p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-[#222222] pb-4">
              <div className="w-8 h-8 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Default Tenant Onboarding & Credit Variables</h2>
                <p className="text-xs text-[#888888]">Default credit limits, initial balances, and billing cycle configurations for newly provisioned entities.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#888888] mb-1 font-mono">Default Credit Limit (ZAR)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={defaultCreditLimit}
                    onChange={(e) => setDefaultCreditLimit(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#2a2a2a] text-white rounded px-3 py-2 pl-7 outline-none font-mono"
                  />
                  <span className="text-[#888888] absolute left-2.5 top-2 text-xs font-bold">R</span>
                </div>
              </div>

              <div>
                <label className="block text-[#888888] mb-1 font-mono">Default Opening Credit Balance (ZAR)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={defaultCreditBalance}
                    onChange={(e) => setDefaultCreditBalance(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#2a2a2a] text-white rounded px-3 py-2 pl-7 outline-none font-mono"
                  />
                  <span className="text-[#888888] absolute left-2.5 top-2 text-xs font-bold">R</span>
                </div>
              </div>

              <div>
                <label className="block text-[#888888] mb-1 font-mono">Default Billing Frequency</label>
                <select
                  value={defaultBillingCycle}
                  onChange={(e) => setDefaultBillingCycle(e.target.value)}
                  className="w-full bg-[#181818] border border-[#2a2a2a] text-white rounded px-3 py-2 outline-none font-medium"
                >
                  <option value="monthly">Monthly Recurring Billing</option>
                  <option value="quarterly">Quarterly Billing</option>
                  <option value="annual">Annual Billing (15% Discount)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-5">
                <div>
                  <div className="font-bold text-white">Allow Overage & Overdraft</div>
                  <div className="text-[11px] text-[#888888]">Permit tenants to exceed monthly budget up to credit limit</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoOverageEnabled}
                  onChange={(e) => setAutoOverageEnabled(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Admin Actions & Summary */}
        <div className="space-y-6">
          <div className="bg-[#121212] border border-[#222222] rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Admin Actions</h2>
            <p className="text-xs text-[#888888]">
              Apply changes immediately across all active subsidiary, partner, and client tenant ledgers.
            </p>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold text-xs transition-colors shadow-lg shadow-cyan-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Settings</span>
            </button>
          </div>

          <div className="bg-[#161616] border border-[#222222] rounded-lg p-5 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compliance & Governance</span>
            </div>
            <ul className="text-xs text-[#888888] space-y-2 list-disc list-inside">
              <li>SARS VAT Compliance Active (15%)</li>
              <li>ZAR Monetary Locking Enabled</li>
              <li>Multi-Tenant Root: Introsoft Corp</li>
              <li>Encrypted Ledger Backups Active</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
};
