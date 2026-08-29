import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  Server,
  Activity,
  UserCheck,
  KeyRound,
  FileCheck,
  Database,
  BarChart3,
  Sliders
} from 'lucide-react';
import { Customer, EntitlementQuota } from '../types';
import { initialEntitlements } from '../data/initialState';

interface Tenant360ViewProps {
  customers: Customer[];
  selectedTenantId?: string;
  onSelectTenantId?: (id: string) => void;
}

export const Tenant360View: React.FC<Tenant360ViewProps> = ({
  customers,
  selectedTenantId = customers[0]?.id || 'cust-discovery'
}) => {
  const [activeTenantId, setActiveTenantId] = useState<string>(selectedTenantId);
  const [configSubTab, setConfigSubTab] = useState<'commercial' | 'service' | 'security' | 'compliance' | 'entitlements' | 'scorecard'>('commercial');

  const tenant = customers.find(c => c.id === activeTenantId) || customers[0];

  const entitlements: EntitlementQuota[] = initialEntitlements;

  // Domain score card calculation with weighted scoring
  const domainScores = [
    { domain: 'Availability', weight: 20, score: 99, status: 'optimal', details: '99.98% uptime achieved against 99.95% target' },
    { domain: 'Performance', weight: 15, score: 96, status: 'optimal', details: 'P95 latency 412ms, well under <800ms limit' },
    { domain: 'Security', weight: 20, score: 98, status: 'optimal', details: 'Zero prompt injection breaches; TLS 1.3 enforced' },
    { domain: 'Compliance', weight: 15, score: 100, status: 'optimal', details: 'POPIA Section 72 cross-border consent active' },
    { domain: 'FinOps', weight: 10, score: 87, status: 'good', details: '14.2% budget remaining for current billing cycle' },
    { domain: 'Support', weight: 10, score: 91, status: 'optimal', details: 'Average P1 response time 8 mins (<15m target)' },
    { domain: 'AI Quality', weight: 10, score: 92, status: 'optimal', details: 'Hallucination rate 1.2% with Groq/Ollama fallbacks' }
  ];

  const overallScore = Math.round(
    domainScores.reduce((acc, curr) => acc + (curr.score * curr.weight) / 100, 0)
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Tenant Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              Tenant 360 Diagnostic
            </span>
            <span className="text-xs text-emerald-400 font-mono">Real-time Service Profile</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            {tenant.name} ({tenant.code})
          </h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Complete 360-degree operational, commercial, security, statutory compliance, and weighted scorecard diagnostics.
          </p>
        </div>

        {/* Tenant Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#8890a6] font-mono whitespace-nowrap">Select Tenant:</label>
          <select
            value={activeTenantId}
            onChange={(e) => setActiveTenantId(e.target.value)}
            className="bg-[#181c28] border border-[#283046] text-white text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-blue-500"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.tier.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 360 Overview Diagnostic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status & Health */}
        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-2">
          <span className="text-[10px] font-mono text-[#77809a] uppercase">Health Score & Status</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-emerald-400">{overallScore}/100</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              HEALTHY
            </span>
          </div>
          <div className="text-xs text-[#8890a6] font-mono flex items-center justify-between pt-1 border-t border-[#1d2232]">
            <span>Account Status:</span>
            <span className="text-white font-semibold uppercase">{tenant.status}</span>
          </div>
        </div>

        {/* Owners & Governance */}
        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-1.5 text-xs">
          <span className="text-[10px] font-mono text-[#77809a] uppercase">Designated Owners</span>
          <div className="flex justify-between font-mono">
            <span className="text-[#77809a]">Account:</span>
            <span className="text-white truncate">{tenant.statutoryOfficers?.informationOfficer || 'Horatio Huxham'}</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#77809a]">Technical:</span>
            <span className="text-white truncate">Tebogo Molefe</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#77809a]">Security / DPO:</span>
            <span className="text-white truncate">{tenant.statutoryOfficers?.dataProtectionOfficer || 'Elena Rostova'}</span>
          </div>
        </div>

        {/* Financial & Token Consumption */}
        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-1.5 text-xs">
          <span className="text-[10px] font-mono text-[#77809a] uppercase">Spend & Consumption</span>
          <div className="flex justify-between font-mono">
            <span className="text-[#77809a]">Monthly Spend:</span>
            <span className="text-emerald-400 font-bold">${tenant.monthlySpendUsd.toLocaleString()} / R{(tenant.monthlySpendUsd * 18).toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#77809a]">Monthly Tokens:</span>
            <span className="text-blue-400 font-bold">{(tenant.monthlyTokenUsage / 1_000_000).toFixed(1)}M</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#77809a]">Service Credits:</span>
            <span className="text-amber-400 font-bold">$0.00</span>
          </div>
        </div>

        {/* Operational Indicators */}
        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-1.5 text-xs">
          <span className="text-[10px] font-mono text-[#77809a] uppercase">Open Operational Items</span>
          <div className="flex justify-between font-mono">
            <span className="text-[#77809a]">Open Incidents:</span>
            <span className="text-white font-bold">0 Active</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#77809a]">Open Problems:</span>
            <span className="text-white font-bold">1 Under Review</span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-[#77809a]">Compliance Actions:</span>
            <span className="text-emerald-400 font-bold">0 Pending</span>
          </div>
        </div>
      </div>

      {/* Configuration Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#222636] pb-3 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setConfigSubTab('commercial')}
          className={`px-3 py-1.5 rounded transition-colors ${configSubTab === 'commercial' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          Commercial Terms
        </button>
        <button
          onClick={() => setConfigSubTab('service')}
          className={`px-3 py-1.5 rounded transition-colors ${configSubTab === 'service' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          Service & SLA Configuration
        </button>
        <button
          onClick={() => setConfigSubTab('security')}
          className={`px-3 py-1.5 rounded transition-colors ${configSubTab === 'security' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          Security & Access Rules
        </button>
        <button
          onClick={() => setConfigSubTab('compliance')}
          className={`px-3 py-1.5 rounded transition-colors ${configSubTab === 'compliance' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          Statutory POPIA / GDPR
        </button>
        <button
          onClick={() => setConfigSubTab('entitlements')}
          className={`px-3 py-1.5 rounded transition-colors ${configSubTab === 'entitlements' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          Contracted vs Entitled Matrix
        </button>
        <button
          onClick={() => setConfigSubTab('scorecard')}
          className={`px-3 py-1.5 rounded transition-colors ${configSubTab === 'scorecard' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          Weighted Health Scorecard
        </button>
      </div>

      {/* Sub-Tab Content Display */}
      {configSubTab === 'commercial' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Commercial & Contractual Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-2">
              <span className="text-[#77809a] text-[10px] uppercase block">Contract Lifecycle</span>
              <div className="flex justify-between"><span className="text-[#8890a6]">Contract Start:</span><span className="text-white">{tenant.contractTerms?.contractStartDate || '2026-01-01'}</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Contract End:</span><span className="text-white">{tenant.contractTerms?.contractEndDate || '2027-12-31'}</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Renewal Date:</span><span className="text-amber-400">{tenant.contractTerms?.renewalDate || '2027-11-30'}</span></div>
            </div>

            <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-2">
              <span className="text-[#77809a] text-[10px] uppercase block">Billing & Currency</span>
              <div className="flex justify-between"><span className="text-[#8890a6]">Service Tier:</span><span className="text-blue-400 font-bold uppercase">{tenant.tier}</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Billing Currency:</span><span className="text-white font-bold">{tenant.contractTerms?.currency || 'USD'} / ZAR</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Payment Terms:</span><span className="text-white uppercase">{tenant.contractTerms?.billingTerms || 'NET_30'}</span></div>
            </div>

            <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-2">
              <span className="text-[#77809a] text-[10px] uppercase block">Spend Ceilings & Overages</span>
              <div className="flex justify-between"><span className="text-[#8890a6]">Monthly Minimum:</span><span className="text-white">${tenant.contractTerms?.monthlyMinimumUsd || 1500}</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Spend Ceiling:</span><span className="text-emerald-400 font-bold">${tenant.contractTerms?.spendCeilingUsd || 5000}</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Limit Action:</span><span className="text-amber-400 uppercase">{tenant.contractTerms?.budgetActionOn100Percent || 'BLOCK'}</span></div>
            </div>
          </div>
        </div>
      )}

      {configSubTab === 'service' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Service Level Agreement (SLA) & Targets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-2">
              <span className="text-[#77809a] text-[10px] uppercase block">Availability & Latency Targets</span>
              <div className="flex justify-between"><span className="text-[#8890a6]">Availability Target:</span><span className="text-emerald-400 font-bold">{tenant.slaProfile?.availabilityTargetPercent || 99.95}%</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">P95 Latency Target:</span><span className="text-white">&lt;{tenant.slaProfile?.p95LatencyMsTarget || 800}ms</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">P99 Latency Target:</span><span className="text-white">&lt;{tenant.slaProfile?.p99LatencyMsTarget || 2000}ms</span></div>
            </div>

            <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-2">
              <span className="text-[#77809a] text-[10px] uppercase block">Incident Response Targets</span>
              <div className="flex justify-between"><span className="text-[#8890a6]">P1 Ack SLA:</span><span className="text-blue-400">&lt;{tenant.slaProfile?.p1ResponseMinutes || 15} mins</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">P2 Ack SLA:</span><span className="text-white">&lt;{tenant.slaProfile?.p2ResponseMinutes || 30} mins</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Support Hours:</span><span className="text-emerald-400">{tenant.slaProfile?.supportHours || '24/7/365'}</span></div>
            </div>

            <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-2">
              <span className="text-[#77809a] text-[10px] uppercase block">Resilience & DR Commitments</span>
              <div className="flex justify-between"><span className="text-[#8890a6]">RTO (Recovery Time):</span><span className="text-white font-bold">{tenant.slaProfile?.rtoHours || 1} Hour</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">RPO (Recovery Point):</span><span className="text-white font-bold">{tenant.slaProfile?.rpoMinutes || 15} Minutes</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Penalty Credit:</span><span className="text-amber-400 font-bold">{tenant.slaProfile?.penaltyCreditRatePercent || 10}% Per Breach</span></div>
            </div>
          </div>
        </div>
      )}

      {configSubTab === 'security' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            Tenant Security & Data Guardrails
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#161a26] p-4 rounded-lg border border-[#242c40] space-y-2.5">
              <span className="text-[#77809a] text-[10px] uppercase block font-bold">Access Controls & IP Whitelist</span>
              <div className="flex justify-between"><span className="text-[#8890a6]">Allowed CIDR IP Ranges:</span><span className="text-emerald-400">196.25.1.0/24, 102.130.0.0/16</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">MFA Enforcement:</span><span className="text-emerald-400 font-bold">REQUIRED (SAML SSO)</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">SSO Identity Provider:</span><span className="text-blue-400">Azure AD / Okta SAML 2.0</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Encryption Standard:</span><span className="text-white">AES-256 (At Rest) / TLS 1.3 (In Transit)</span></div>
            </div>

            <div className="bg-[#161a26] p-4 rounded-lg border border-[#242c40] space-y-2.5">
              <span className="text-[#77809a] text-[10px] uppercase block font-bold">Model Restrictions & Data Sensitivity</span>
              <div className="flex justify-between"><span className="text-[#8890a6]">Data Classification:</span><span className="text-amber-400 font-bold uppercase">{tenant.securityProfile?.dataClassification || 'special_personal_information'}</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Approved AI Providers:</span><span className="text-emerald-400">Ollama Local GPU, Groq LPU Cloud</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Prohibited Providers:</span><span className="text-rose-400 font-bold">Unencrypted Public Endpoints</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Max Data Sensitivity:</span><span className="text-purple-400 font-bold">Category 5 (Special Personal Records)</span></div>
            </div>
          </div>
        </div>
      )}

      {configSubTab === 'compliance' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            Statutory POPIA & GDPR Compliance Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#161a26] p-4 rounded-lg border border-[#242c40] space-y-2.5">
              <span className="text-[#77809a] text-[10px] uppercase block font-bold">POPIA / GDPR Statutory Mandates</span>
              <div className="flex justify-between"><span className="text-[#8890a6]">POPIA Adequacy:</span><span className="text-emerald-400 font-bold">Section 72 Certified</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">GDPR Adequacy:</span><span className="text-emerald-400 font-bold">Article 45 Parity</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Data Residency:</span><span className="text-white font-bold">{tenant.securityProfile?.dataResidencyRestrictions?.join(', ') || 'South Africa Only'}</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Cross-Border Transfer:</span><span className="text-amber-400">Prior Written Legal Consent Required</span></div>
            </div>

            <div className="bg-[#161a26] p-4 rounded-lg border border-[#242c40] space-y-2.5">
              <span className="text-[#77809a] text-[10px] uppercase block font-bold">DSAR & Breach Protocol</span>
              <div className="flex justify-between"><span className="text-[#8890a6]">Retention Period:</span><span className="text-white">{tenant.securityProfile?.retentionPolicyDays || 90} Days (Zero Payload Log)</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">DSAR SLA:</span><span className="text-blue-400">&lt;14 Days Automated Export</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Breach Notification:</span><span className="text-rose-400 font-bold">Immediate (&lt;72 Hours Regulator Mandate)</span></div>
              <div className="flex justify-between"><span className="text-[#8890a6]">Information Officer:</span><span className="text-white">{tenant.statutoryOfficers?.informationOfficer || 'Adv. Willem Van Zyl'}</span></div>
            </div>
          </div>
        </div>
      )}

      {configSubTab === 'entitlements' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            Contracted vs Entitled vs Consumed Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#181c28] border-b border-[#242c40] text-[#77809a] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Service Feature / Entitlement</th>
                  <th className="py-2.5 px-3">Contracted Limit</th>
                  <th className="py-2.5 px-3">Entitled Allocation</th>
                  <th className="py-2.5 px-3">Consumed to Date</th>
                  <th className="py-2.5 px-3">Remaining Capacity</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2436] text-[#b0b8d0]">
                {entitlements.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#161a26]">
                    <td className="py-2.5 px-3 font-semibold text-white">{item.feature}</td>
                    <td className="py-2.5 px-3 text-[#77809a]">{item.contracted}</td>
                    <td className="py-2.5 px-3 text-blue-400 font-bold">{item.entitled}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{item.consumed}</td>
                    <td className="py-2.5 px-3 text-white">{item.remaining}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {configSubTab === 'scorecard' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Configurable Weighted Tenant Health Scorecard
              </h3>
              <p className="text-xs text-[#8890a6]">Weighted mathematical aggregation across seven key operational domains.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-emerald-400">{overallScore}/100</span>
              <span className="text-[10px] text-[#77809a] block font-mono">WEIGHTED TOTAL</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {domainScores.map((ds, idx) => (
              <div key={idx} className="bg-[#161a26] border border-[#242c40] p-3.5 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{ds.domain}</span>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      Weight: {ds.weight}%
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-400">{ds.score}/100</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#22283a] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ds.score}%` }} />
                </div>
                <p className="text-[11px] text-[#8890a6] font-mono">{ds.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
