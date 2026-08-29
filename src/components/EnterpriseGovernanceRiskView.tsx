import React, { useState } from 'react';
import {
  ShieldAlert,
  FileCheck,
  Database,
  ShieldCheck,
  AlertOctagon,
  FileText,
  Lock,
  Layers,
  CheckCircle2,
  Download
} from 'lucide-react';
import {
  EnterpriseRiskItem,
  ComplianceControl,
  EvidenceItem,
  SecurityPostureScorecard
} from '../types';
import {
  initialRiskRegister,
  initialComplianceControls,
  initialEvidence,
  initialSecurityPosture
} from '../data/initialState';

export const EnterpriseGovernanceRiskView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'risk_register' | 'security_posture' | 'data_gov' | 'evidence_centre'>('risk_register');

  // Risk Register State
  const [risks, setRisks] = useState<EnterpriseRiskItem[]>(initialRiskRegister);

  // Compliance Controls & Evidence State
  const [controls, setControls] = useState<ComplianceControl[]>(initialComplianceControls);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(initialEvidence);

  // Security Posture State
  const [posture, setPosture] = useState<SecurityPostureScorecard>(initialSecurityPosture);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
              Enterprise Risk & Security Governance
            </span>
            <span className="text-xs text-emerald-400 font-mono">Control Mapping & Audit Readiness</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Enterprise Risk Register, Security Posture & Controls</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Manage enterprise risks, inspect visual 5x5 heatmaps, audit data classification flows, and verify mapped framework controls.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222636] pb-3 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('risk_register')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'risk_register' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          Risk Register & 5x5 Heatmap
        </button>
        <button
          onClick={() => setActiveTab('security_posture')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'security_posture' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          Security Posture Executive Dashboard
        </button>
        <button
          onClick={() => setActiveTab('data_gov')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'data_gov' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <Database className="w-3.5 h-3.5 text-purple-400" />
          Data Governance & Classification
        </button>
        <button
          onClick={() => setActiveTab('evidence_centre')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'evidence_centre' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
          Evidence & Mapped Framework Audit Centre
        </button>
      </div>

      {/* 1. RISK REGISTER & 5x5 HEATMAP */}
      {activeTab === 'risk_register' && (
        <div className="space-y-6">
          {/* Visual 5x5 Risk Heatmap */}
          <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Enterprise 5x5 Risk Heatmap Matrix (Probability vs Impact)</h3>
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
              <div className="p-3 bg-rose-500/30 border border-rose-500/50 rounded-lg text-rose-300 font-bold">5. Catastrophic Impact (CRITICAL)</div>
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 font-bold">4. High Impact (HIGH)</div>
              <div className="p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-300 font-bold">3. Moderate Impact (MEDIUM)</div>
              <div className="p-3 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-300 font-bold">2. Minor Impact (LOW)</div>
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 font-bold">1. Negligible (INFORMATIONAL)</div>
            </div>
          </div>

          <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Enterprise Risk Register</h3>
              <button className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono">
                + Register Enterprise Risk
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#181c28] text-[#77809a] uppercase border-b border-[#242c40]">
                  <tr>
                    <th className="py-2.5 px-3">Risk ID</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Tenant / Scope</th>
                    <th className="py-2.5 px-3">Inherent Risk</th>
                    <th className="py-2.5 px-3">Mitigating Controls</th>
                    <th className="py-2.5 px-3">Residual Risk</th>
                    <th className="py-2.5 px-3">Risk Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2436] text-[#b0b8d0]">
                  {risks.map(r => (
                    <tr key={r.id} className="hover:bg-[#161a26]">
                      <td className="py-2.5 px-3 font-bold text-amber-400">{r.id}</td>
                      <td className="py-2.5 px-3 text-purple-400">{r.category}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{r.tenantName || 'Global Platform'}</td>
                      <td className="py-2.5 px-3 text-rose-400 font-bold">{r.inherentRiskLevel} ({r.inherentRiskScore})</td>
                      <td className="py-2.5 px-3 text-[#8890a6]">{r.controls.join(', ')}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{r.residualRiskLevel} ({r.residualRiskScore})</td>
                      <td className="py-2.5 px-3 text-white">{r.riskOwner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECURITY POSTURE */}
      {activeTab === 'security_posture' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Executive Security Posture Scorecard
              </h3>
              <p className="text-xs text-[#8890a6]">Overall Score 94/100 across 7 core security domains.</p>
            </div>
            <span className="text-2xl font-bold font-mono text-emerald-400">94 / 100</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-1">
              <span className="text-[#77809a] text-[10px] uppercase">Identity & Auth</span>
              <p className="text-lg font-bold text-emerald-400">{posture.domainScores.identityScore}/100</p>
            </div>
            <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-1">
              <span className="text-[#77809a] text-[10px] uppercase">API Gateway Security</span>
              <p className="text-lg font-bold text-emerald-400">{posture.domainScores.apiSecurityScore}/100</p>
            </div>
            <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-1">
              <span className="text-[#77809a] text-[10px] uppercase">AI Guardrails</span>
              <p className="text-lg font-bold text-blue-400">{posture.domainScores.aiSecurityScore}/100</p>
            </div>
            <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-1">
              <span className="text-[#77809a] text-[10px] uppercase">Data Encryption</span>
              <p className="text-lg font-bold text-emerald-400">{posture.domainScores.dataSecurityScore}/100</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. DATA GOVERNANCE */}
      {activeTab === 'data_gov' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            Data Classification & Processing Traceability
          </h3>
          <p className="text-xs text-[#8890a6]">Data Flow Traceability: Tenant → Data → Processing → Provider → Country</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#181c28] text-[#77809a] uppercase border-b border-[#242c40]">
                <tr>
                  <th className="py-2.5 px-3">Data Classification</th>
                  <th className="py-2.5 px-3">Owner & Custodian</th>
                  <th className="py-2.5 px-3">Processing Purpose</th>
                  <th className="py-2.5 px-3">AI Processing Permission</th>
                  <th className="py-2.5 px-3">Cross-Border Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2436] text-[#b0b8d0]">
                <tr className="hover:bg-[#161a26]">
                  <td className="py-2.5 px-3 font-bold text-rose-400 uppercase">SPECIAL PERSONAL INFORMATION</td>
                  <td className="py-2.5 px-3 text-white">Adv. Willem Van Zyl</td>
                  <td className="py-2.5 px-3 text-[#8890a6]">Clinical note summarization</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">Local Ollama On-Prem Only</td>
                  <td className="py-2.5 px-3 text-white">South Africa (Zero Egress)</td>
                </tr>
                <tr className="hover:bg-[#161a26]">
                  <td className="py-2.5 px-3 font-bold text-amber-400 uppercase">CONFIDENTIAL BANKING RECORDS</td>
                  <td className="py-2.5 px-3 text-white">Dr. Michael Chen</td>
                  <td className="py-2.5 px-3 text-[#8890a6]">Fraud pattern detection</td>
                  <td className="py-2.5 px-3 text-blue-400 font-bold">Groq LPU Sovereign EU Node</td>
                  <td className="py-2.5 px-3 text-white">Frankfurt, EU (Article 45 Parity)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. EVIDENCE & AUDIT CENTRE */}
      {activeTab === 'evidence_centre' && (
        <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Audit Evidence Repository & Mapped Framework Controls
              </h3>
              <p className="text-xs text-[#8890a6]">Architectural Rule: Controls are designated "CONTROL MAPPED" with verifiable audit evidence artifacts.</p>
            </div>
            <button className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Download Audit Evidence Pack (ZIP)
            </button>
          </div>

          <div className="space-y-3">
            {controls.map(ctrl => (
              <div key={ctrl.id} className="bg-[#161a26] border border-[#242c40] rounded-xl p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400">{ctrl.code}</span>
                    <span className="text-white font-bold">{ctrl.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    CONTROL MAPPED
                  </span>
                </div>
                <p className="text-[11px] text-[#8890a6] normal-case">{ctrl.requirement}</p>
                <div className="pt-2 border-t border-[#242c40] flex items-center justify-between text-[11px] text-[#77809a]">
                  <span>Control Owner: <strong className="text-white">{ctrl.owner}</strong></span>
                  <span>Review Date: <strong className="text-white">{ctrl.lastReviewDate}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
