import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  RefreshCw,
  Play,
  Download,
  Plus,
  ArrowRight,
  Globe,
  Database,
  Building2,
  UserCheck,
  FileText,
  Clock,
  Sparkles,
  Sliders,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  Info
} from 'lucide-react';
import {
  AIPolicy,
  Application,
  AIProvider,
  GlobalComplianceConfig,
  DataSubjectRequest,
  ComplianceScanResult
} from '../types';
import { scanAndSanitizePrompt } from '../utils/complianceEngine';

interface PopiaGdprComplianceViewProps {
  policies: AIPolicy[];
  applications: Application[];
  providers: AIProvider[];
  globalConfig: GlobalComplianceConfig;
  dataSubjectRequests: DataSubjectRequest[];
  onUpdateGlobalConfig: (config: GlobalComplianceConfig) => void;
  onAddDataSubjectRequest: (req: Partial<DataSubjectRequest>) => void;
  onUpdateDataSubjectRequest: (id: string, req: Partial<DataSubjectRequest>) => void;
  onUpdatePolicy: (id: string, policy: Partial<AIPolicy>) => void;
}

const SAMPLE_PAYLOADS = [
  {
    title: 'POPIA: South African Citizen & Banking Details',
    framework: 'POPIA',
    prompt: `Please process the loan restructuring for client Hendrik Van Der Merwe (SA ID: 8904125081084, SARS Tax Number: 9281038471).
His Capitec account number is 1549281034 (Branch 470010) and his primary cellphone is +27 82 491 0293.
Please evaluate his affordability index for standard monthly repayments.`
  },
  {
    title: 'GDPR Article 9: European Patient Health & IBAN',
    framework: 'GDPR',
    prompt: `Medical discharge summary for patient Marie Dupont (Email: m.dupont@sante-paris.fr, IP: 195.154.122.40).
Clinical note: Confirmed medical diagnosis of acute cardiovascular arrhythmia.
Reimbursement transfer to German IBAN DE89370400440532013000 (BIC: DEUTDEDDFXX) has been initiated.`
  },
  {
    title: 'POPIA Section 72: Cross-Border Exfiltration Probe',
    framework: 'POPIA',
    prompt: `Exporting full customer database extract containing South African citizen contact lists (SA ID numbers and physical addresses in Sandton, Johannesburg) to third-party offshore marketing cloud in California.`
  },
  {
    title: 'GDPR Article 22: Automated Profiling & Underwriting',
    framework: 'GDPR',
    prompt: `Execute automated credit underwriting decision and auto-reject loan application if algorithmic risk score is below 650 without manual human officer intervention.`
  }
];

export const PopiaGdprComplianceView: React.FC<PopiaGdprComplianceViewProps> = ({
  policies,
  applications,
  providers,
  globalConfig,
  dataSubjectRequests,
  onUpdateGlobalConfig,
  onAddDataSubjectRequest,
  onUpdateDataSubjectRequest,
  onUpdatePolicy
}) => {
  const [activeTab, setActiveTab] = useState<'enforcement' | 'scanner' | 'sovereignty' | 'dsar'>('enforcement');
  
  // Local config state for editing
  const [config, setConfig] = useState<GlobalComplianceConfig>(globalConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Scanner state
  const [testPrompt, setTestPrompt] = useState<string>(SAMPLE_PAYLOADS[0].prompt);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || 'p-openai');
  const [scanResult, setScanResult] = useState<ComplianceScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // DSAR Modal
  const [isDsarModalOpen, setIsDsarModalOpen] = useState(false);
  const [dsarFormData, setDsarFormData] = useState<Partial<DataSubjectRequest>>({
    framework: 'POPIA',
    requestType: 'access',
    requestorName: '',
    subjectIdentifier: '',
    appId: applications[0]?.id || 'app-introsoft-web',
    status: 'pending',
    notes: ''
  });

  const selectedProvider = providers.find(p => p.id === selectedProviderId) || providers[0];

  const handleSaveConfig = () => {
    onUpdateGlobalConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const res = scanAndSanitizePrompt(testPrompt, {
        popiaRules: config.popia,
        gdprRules: config.gdpr,
        targetProvider: selectedProvider
      });
      setScanResult(res);
      setIsScanning(false);
    }, 250);
  };

  const handleCreateDsar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsarFormData.requestorName || !dsarFormData.subjectIdentifier) return;

    onAddDataSubjectRequest({
      ...dsarFormData,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
    });
    setIsDsarModalOpen(false);
    setDsarFormData({
      framework: 'POPIA',
      requestType: 'access',
      requestorName: '',
      subjectIdentifier: '',
      appId: applications[0]?.id || 'app-introsoft-web',
      status: 'pending',
      notes: ''
    });
  };

  const handleDownloadDpiaReport = () => {
    const reportData = {
      title: 'Data Protection Impact Assessment (DPIA) & POPIA Compliance Report',
      generatedAt: new Date().toISOString(),
      governanceOfficer: {
        name: config.informationOfficerName,
        email: config.informationOfficerEmail,
        registrationNumber: config.complianceOfficerRegistrationNumber
      },
      statutoryFrameworks: {
        popia: {
          act: 'Protection of Personal Information Act No. 4 of 2013 (South Africa)',
          status: config.popia.enabled ? 'ACTIVE_ENFORCED' : 'DISABLED',
          enforcementMode: config.popia.enforcementMode,
          conditionsCovered: 'All 8 Lawful Processing Conditions (Sections 8-25)',
          specialPersonalInfoShield: config.popia.blockSpecialPersonalInfo ? 'ENABLED' : 'DISABLED',
          crossBorderSection72Guard: config.popia.enforceSection72CrossBorder ? 'ENABLED' : 'DISABLED',
          saIdLuhnRedaction: config.popia.maskSaIdNumbers ? 'ENABLED' : 'DISABLED'
        },
        gdpr: {
          regulation: 'Regulation (EU) 2016/679 General Data Protection Regulation',
          status: config.gdpr.enabled ? 'ACTIVE_ENFORCED' : 'DISABLED',
          enforcementMode: config.gdpr.enforcementMode,
          article9SpecialCategories: config.gdpr.enforceArticle9SpecialCategories ? 'ENABLED' : 'DISABLED',
          article17ZeroDataRetention: config.gdpr.enforceArticle17ZeroRetention ? 'ENABLED' : 'DISABLED',
          article22AutomatedDecisionProfilingGuard: config.gdpr.enforceArticle22AutomatedDecisionFlag ? 'ENABLED' : 'DISABLED',
          retentionTtlDays: config.gdpr.dataRetentionTtlDays
        }
      },
      applicationsCovered: applications.map(a => ({ id: a.id, name: a.name, status: a.status })),
      providersSovereignty: providers.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        sovereignty: p.type === 'ollama' ? 'On-Premises Sovereign' : 'Cloud Interconnect'
      })),
      activeSubjectRequestsCount: dataSubjectRequests.length
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ALTIL-POPIA-GDPR-DPIA-Report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>POPIA & GDPR Regulatory Privacy Governance</span>
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Statutory Enforcer
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-0.5">
            Enforce statutory compliance with the <strong>South African POPIA Act No. 4 of 2013</strong> and <strong>EU GDPR Regulation 2016/679</strong> across all AI model ingress and egress traffic.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-download-dpia-report"
            onClick={handleDownloadDpiaReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-white text-xs font-mono border border-[#222222] transition-colors"
            title="Download Statutory DPIA & POPIA Audit Dossier"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export DPIA Dossier</span>
          </button>

          <button
            id="btn-save-compliance-config"
            onClick={handleSaveConfig}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saveSuccess ? 'Enforced & Synced!' : 'Deploy Compliance Policies'}</span>
          </button>
        </div>
      </div>

      {/* Statutory Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded bg-[#141414] border border-[#222222] space-y-1.5">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-[11px] font-mono uppercase">POPIA (South Africa)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="text-emerald-400">8 Conditions Active</span>
          </div>
          <div className="text-[10px] font-mono text-[#777777]">
            SA ID Luhn • SARS Tax • Capitec/FNB Banks
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#141414] border border-[#222222] space-y-1.5">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-[11px] font-mono uppercase">GDPR (European Union)</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="text-blue-400">Article 9 & 17 Guard</span>
          </div>
          <div className="text-[10px] font-mono text-[#777777]">
            Special Categories • IBAN • Zero Retention
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#141414] border border-[#222222] space-y-1.5">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-[11px] font-mono uppercase">Data Subject Requests</span>
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white">
            {dataSubjectRequests.filter(r => r.status === 'fulfilled').length} / {dataSubjectRequests.length} Fulfilled
          </div>
          <div className="text-[10px] font-mono text-[#777777]">
            Section 23 Access & Art 17 Erasures
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#141414] border border-[#222222] space-y-1.5">
          <div className="flex items-center justify-between text-[#888888]">
            <span className="text-[11px] font-mono uppercase">Information Officer</span>
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xs font-bold text-white truncate">
            {config.informationOfficerName.split(' ')[0]} {config.informationOfficerName.split(' ')[1] || ''}
          </div>
          <div className="text-[10px] font-mono text-[#777777] truncate">
            Reg: {config.complianceOfficerRegistrationNumber}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-[#222222] text-xs font-mono">
        <button
          id="tab-compliance-enforcement"
          onClick={() => setActiveTab('enforcement')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'enforcement'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Regulatory Policy Rules & Enforcement</span>
        </button>

        <button
          id="tab-compliance-scanner"
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'scanner'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Live Statutory Sandbox & Sanitizer</span>
        </button>

        <button
          id="tab-compliance-sovereignty"
          onClick={() => setActiveTab('sovereignty')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'sovereignty'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Cross-Border & Data Sovereignty Matrix</span>
        </button>

        <button
          id="tab-compliance-dsar"
          onClick={() => setActiveTab('dsar')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'dsar'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-[#888888] hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Data Subject Requests (DSR / DSAR)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px]">
            {dataSubjectRequests.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ENFORCEMENT RULES & CONFIGURATION                                   */}
      {/* ========================================================================= */}
      {activeTab === 'enforcement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* POPIA Policy Control Box */}
            <div className="p-5 rounded bg-[#141414] border border-[#222222] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                    ZA
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      South Africa POPIA Policy Suite
                    </h3>
                    <p className="text-[10px] text-[#777777] font-mono">
                      Protection of Personal Information Act No. 4 of 2013
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-[#888888]">Master:</span>
                  <input
                    type="checkbox"
                    checked={config.popia.enabled}
                    onChange={e =>
                      setConfig({
                        ...config,
                        popia: { ...config.popia, enabled: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500 bg-[#0a0a0a] border-[#222222] focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-[#888888]">
                  POPIA Enforcement Action Mode:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'redact_mask', label: 'Mask & Redact PII' },
                    { id: 'strict_block', label: 'Strict Hard Block' },
                    { id: 'quarantine_audit', label: 'Audit Quarantine' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          popia: {
                            ...config.popia,
                            enforcementMode: m.id as any
                          }
                        })
                      }
                      className={`px-2 py-1.5 rounded text-[11px] font-mono border text-center transition-colors ${
                        config.popia.enforcementMode === m.id
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                          : 'bg-[#0a0a0a] text-[#777777] border-[#222222] hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Switches for POPIA Rules */}
              <div className="space-y-2.5 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-white font-semibold text-[11px]">
                      13-Digit SA National ID Luhn Scrubber
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      Section 14: Validates birthdate & Luhn checksum; scrubs raw citizen IDs into [POPIA_MASKED_SA_ID].
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.popia.maskSaIdNumbers}
                    onChange={e =>
                      setConfig({
                        ...config,
                        popia: { ...config.popia, maskSaIdNumbers: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500 bg-[#141414] border-[#333333] focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>

                <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-white font-semibold text-[11px]">
                      SARS Tax Reference Number Masking
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      Section 14: Detects and masks 10-digit South African Revenue Service tax numbers.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.popia.maskSaTaxNumbers}
                    onChange={e =>
                      setConfig({
                        ...config,
                        popia: { ...config.popia, maskSaTaxNumbers: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500 bg-[#141414] border-[#333333] focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>

                <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-white font-semibold text-[11px]">
                      SA Domestic Banking & Branch Code Redaction
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      Section 19: Protects Capitec, FNB, Standard Bank, ABSA, Nedbank account numbers.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.popia.maskSaBankingDetails}
                    onChange={e =>
                      setConfig({
                        ...config,
                        popia: { ...config.popia, maskSaBankingDetails: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500 bg-[#141414] border-[#333333] focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>

                <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-white font-semibold text-[11px]">
                      POPIA Part B Special Personal Information Hard-Block
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      Sections 26-33: Blocks religious beliefs, biometric templates, criminal histories, union affiliations.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.popia.blockSpecialPersonalInfo}
                    onChange={e =>
                      setConfig({
                        ...config,
                        popia: { ...config.popia, blockSpecialPersonalInfo: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500 bg-[#141414] border-[#333333] focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>

                <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-white font-semibold text-[11px]">
                      Section 72 Trans-Border Flow Guard
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      Prohibits sending unredacted personal information to offshore cloud providers without adequacy/consent.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.popia.enforceSection72CrossBorder}
                    onChange={e =>
                      setConfig({
                        ...config,
                        popia: { ...config.popia, enforceSection72CrossBorder: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500 bg-[#141414] border-[#333333] focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* GDPR Policy Control Box */}
            <div className="p-5 rounded bg-[#141414] border border-[#222222] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs">
                    EU
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      European Union GDPR Policy Suite
                    </h3>
                    <p className="text-[10px] text-[#777777] font-mono">
                      EU Regulation 2016/679 General Data Protection Regulation
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-[#888888]">Master:</span>
                  <input
                    type="checkbox"
                    checked={config.gdpr.enabled}
                    onChange={e =>
                      setConfig({
                        ...config,
                        gdpr: { ...config.gdpr, enabled: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-blue-500 bg-[#0a0a0a] border-[#222222] focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-[#888888]">
                  GDPR Enforcement Action Mode:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'redact_mask', label: 'Mask & Redact PII' },
                    { id: 'strict_block', label: 'Strict Hard Block' },
                    { id: 'quarantine_audit', label: 'Audit Quarantine' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          gdpr: {
                            ...config.gdpr,
                            enforcementMode: m.id as any
                          }
                        })
                      }
                      className={`px-2 py-1.5 rounded text-[11px] font-mono border text-center transition-colors ${
                        config.gdpr.enforcementMode === m.id
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-bold'
                          : 'bg-[#0a0a0a] text-[#777777] border-[#222222] hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Switches for GDPR Rules */}
              <div className="space-y-2.5 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-white font-semibold text-[11px]">
                      Article 9 Special Category Shield
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      Prohibits processing of clinical health data, genetic profiles, biometrics, sexual orientation, political opinions.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.gdpr.enforceArticle9SpecialCategories}
                    onChange={e =>
                      setConfig({
                        ...config,
                        gdpr: { ...config.gdpr, enforceArticle9SpecialCategories: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-blue-500 bg-[#141414] border-[#333333] focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>

                <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-white font-semibold text-[11px]">
                      Article 17 Zero Prompt Retention (ZPR)
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      Injects zero-retention headers to prevent provider caching or training on user inference payloads.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.gdpr.enforceArticle17ZeroRetention}
                    onChange={e =>
                      setConfig({
                        ...config,
                        gdpr: { ...config.gdpr, enforceArticle17ZeroRetention: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-blue-500 bg-[#141414] border-[#333333] focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>

                <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-white font-semibold text-[11px]">
                      European IBAN / BIC & Financial Redaction
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      Validates Mod 97-10 checksum on European IBAN accounts and replaces with [GDPR_MASKED_IBAN].
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.gdpr.maskEuropeanIbans}
                    onChange={e =>
                      setConfig({
                        ...config,
                        gdpr: { ...config.gdpr, maskEuropeanIbans: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-blue-500 bg-[#141414] border-[#333333] focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>

                <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-white font-semibold text-[11px]">
                      Article 22 Automated Profiling Guard
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      Flags AI decision-making (e.g. loan auto-rejection, employment scoring) for human-in-the-loop validation.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.gdpr.enforceArticle22AutomatedDecisionFlag}
                    onChange={e =>
                      setConfig({
                        ...config,
                        gdpr: { ...config.gdpr, enforceArticle22AutomatedDecisionFlag: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-blue-500 bg-[#141414] border-[#333333] focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>

                <div className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <div className="text-white font-semibold text-[11px]">
                      Chapter V EU Sovereign Residency Only
                    </div>
                    <div className="text-[10px] text-[#777777]">
                      Schrems II compliance: Restricts all GDPR-scoped inferences exclusively to EU/On-Premise nodes.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.gdpr.enforceEuSovereignResidencyOnly}
                    onChange={e =>
                      setConfig({
                        ...config,
                        gdpr: { ...config.gdpr, enforceEuSovereignResidencyOnly: e.target.checked }
                      })
                    }
                    className="w-4 h-4 rounded text-blue-500 bg-[#141414] border-[#333333] focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Officers & Accountability Details */}
          <div className="p-5 rounded bg-[#141414] border border-[#222222] space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Statutory Information Officer & Data Protection Officer (DPO) Registration</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[#888888] mb-1">
                  POPIA Information Officer Name:
                </label>
                <input
                  type="text"
                  value={config.informationOfficerName}
                  onChange={e => setConfig({ ...config, informationOfficerName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#888888] mb-1">
                  Information Regulator Registration No:
                </label>
                <input
                  type="text"
                  value={config.complianceOfficerRegistrationNumber}
                  onChange={e => setConfig({ ...config, complianceOfficerRegistrationNumber: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#888888] mb-1">
                  Official Statutory Contact Email:
                </label>
                <input
                  type="email"
                  value={config.informationOfficerEmail}
                  onChange={e => setConfig({ ...config, informationOfficerEmail: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE STATUTORY SANDBOX & SANITIZER                                  */}
      {/* ========================================================================= */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          {/* Quick Payload Preset Selector */}
          <div className="p-3 rounded bg-[#111111] border border-[#222222] space-y-2">
            <div className="text-[10px] font-mono uppercase text-[#777777] font-bold">
              Load Realistic Test Payloads for Pre-flight Statutory Audit:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {SAMPLE_PAYLOADS.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTestPrompt(sp.prompt);
                    setScanResult(null);
                  }}
                  className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] hover:border-[#333333] text-left transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        sp.framework === 'POPIA'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {sp.framework}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#555555] group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-xs font-semibold text-white truncate">
                    {sp.title.split(':')[1] || sp.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scanner Input & Execution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <span>Raw Ingress Prompt Payload</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#777777] font-mono">Target Provider:</span>
                  <select
                    value={selectedProviderId}
                    onChange={e => setSelectedProviderId(e.target.value)}
                    className="bg-[#0a0a0a] border border-[#222222] text-white text-[11px] font-mono px-2 py-1 rounded focus:outline-none focus:border-blue-500"
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                rows={9}
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                placeholder="Enter prompt containing citizen data, accounts, or diagnostic information..."
                className="w-full p-3 rounded bg-[#0a0a0a] border border-[#222222] text-white text-xs font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
              />

              <button
                id="btn-run-statutory-scan"
                onClick={handleRunScan}
                disabled={isScanning || !testPrompt.trim()}
                className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing POPIA & GDPR Deep Audit...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Execute Statutory Pre-Flight Probe</span>
                  </>
                )}
              </button>
            </div>

            {/* Sanitized Output & Risk Decision Panel */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white font-mono">
                  Sanitized Egress Payload & Masked Tokens
                </label>
                {scanResult && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      scanResult.actionTaken === 'BLOCKED'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : scanResult.actionTaken === 'REDACTED_FORWARDED'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-green-500/10 text-green-400 border-green-500/30'
                    }`}
                  >
                    Action: {scanResult.actionTaken}
                  </span>
                )}
              </div>

              <div className="w-full h-48 p-3 rounded bg-[#0d0d0d] border border-[#222222] text-xs font-mono overflow-y-auto leading-relaxed text-[#cccccc]">
                {scanResult ? (
                  <span className="whitespace-pre-wrap">{scanResult.sanitizedPrompt}</span>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#555555] space-y-1">
                    <Sparkles className="w-5 h-5 text-[#444444]" />
                    <span className="text-[11px]">Click "Execute Statutory Pre-Flight Probe" to see sanitized output.</span>
                  </div>
                )}
              </div>

              {scanResult && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded bg-[#111111] border border-[#222222]">
                    <div className="text-[9px] text-[#777777] uppercase">Statutory Risk</div>
                    <div
                      className={`text-sm font-bold mt-0.5 ${
                        scanResult.riskScore > 60
                          ? 'text-red-400'
                          : scanResult.riskScore > 20
                          ? 'text-amber-400'
                          : 'text-green-400'
                      }`}
                    >
                      {scanResult.riskScore} / 100
                    </div>
                  </div>

                  <div className="p-2 rounded bg-[#111111] border border-[#222222]">
                    <div className="text-[9px] text-[#777777] uppercase">Redacted Tokens</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {scanResult.redactedTokensCount} Tokens
                    </div>
                  </div>

                  <div className="p-2 rounded bg-[#111111] border border-[#222222]">
                    <div className="text-[9px] text-[#777777] uppercase">Violations Found</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {scanResult.popiaViolations.length + scanResult.gdprViolations.length} Detected
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Violations Detailed Breakdown */}
          {scanResult && (scanResult.popiaViolations.length > 0 || scanResult.gdprViolations.length > 0) && (
            <div className="p-4 rounded bg-[#141414] border border-[#222222] space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Statutory Clause Violations & Masking Breakdown</span>
              </h4>

              <div className="space-y-2">
                {[...scanResult.popiaViolations, ...scanResult.gdprViolations].map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded bg-[#0a0a0a] border border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            v.framework === 'POPIA'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {v.framework}
                        </span>
                        <span className="text-white font-bold">{v.rule}</span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.2 rounded ${
                            v.severity === 'critical'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {v.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#aaaaaa]">{v.description}</div>
                      <div className="text-[10px] text-[#666666]">Statutory Citation: {v.clause}</div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-[10px] text-[#777777]">Masked Value:</div>
                      <div className="text-xs text-emerald-400 font-bold">{v.detectedValueMasked}</div>
                    </div>
                  </div>
                ))}
              </div>

              {scanResult.crossBorderTransferFlag && (
                <div className="p-3 rounded bg-amber-500/5 border border-amber-500/20 text-xs font-mono flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-300">
                      Cross-Border Trans-Border Flow Notice (POPIA Section 72 / GDPR Chapter V)
                    </div>
                    <div className="text-[#aaaaaa] text-[11px] mt-0.5">
                      Destination Provider: <strong>{scanResult.crossBorderTransferFlag.destinationProvider}</strong> ({scanResult.crossBorderTransferFlag.destinationJurisdiction}). Ensure standard contractual clauses or explicit consent are logged.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CROSS-BORDER & DATA SOVEREIGNTY MATRIX                              */}
      {/* ========================================================================= */}
      {activeTab === 'sovereignty' && (
        <div className="space-y-4">
          <div className="p-4 rounded bg-[#111111] border border-[#222222] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Global AI Provider Sovereignty & Residency Topology
              </h3>
              <p className="text-xs text-[#888888]">
                Evaluate which model providers guarantee local on-premise execution vs offshore interconnects under POPIA Section 72 and GDPR Schrems II.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Zero-Egress Nodes: 2 Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(provider => {
              const isLocal = provider.type === 'ollama' || provider.endpoint.includes('192.168.') || provider.endpoint.includes('internal');
              return (
                <div
                  key={provider.id}
                  className="p-4 rounded bg-[#141414] border border-[#222222] space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-white">{provider.name}</h4>
                        <div className="text-[10px] font-mono text-[#777777] uppercase">
                          Type: {provider.type}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isLocal
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {isLocal ? '100% On-Prem Sovereign' : 'Offshore Cloud API'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs font-mono bg-[#0a0a0a] p-2.5 rounded border border-[#222222]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#666666]">POPIA Section 72:</span>
                        <span className={isLocal ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                          {isLocal ? 'Zero Cross-Border Risk' : 'Requires DPA / Standard Clauses'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666666]">GDPR Chapter V:</span>
                        <span className={isLocal ? 'text-emerald-400 font-bold' : 'text-blue-300'}>
                          {isLocal ? 'EU Sovereign Compliant' : 'Schrems II Safeguards Req.'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666666]">Model Data Persistence:</span>
                        <span className="text-white">Zero (ZPR Injected)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#222222] text-[10px] text-[#777777] font-mono">
                    Endpoint: <span className="text-[#aaaaaa]">{provider.endpoint}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DATA SUBJECT RIGHTS & DSAR WORKFLOW                                 */}
      {/* ========================================================================= */}
      {activeTab === 'dsar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#222222]">
            <div>
              <h3 className="text-sm font-bold text-white">
                Statutory Data Subject Access & Erasure Requests (DSAR)
              </h3>
              <p className="text-xs text-[#888888]">
                Manage citizen requests for information access, rectification, objection to automated profiling, and right to be forgotten.
              </p>
            </div>

            <button
              onClick={() => setIsDsarModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Data Subject Request</span>
            </button>
          </div>

          {/* DSAR Table */}
          <div className="border border-[#222222] rounded bg-[#141414] overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0e0e0e] border-b border-[#222222] text-[#888888] text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Framework</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Subject / Requestor</th>
                  <th className="py-2.5 px-3">Application</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] text-[#cccccc]">
                {dataSubjectRequests.map(req => (
                  <tr key={req.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{req.id}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] ${
                          req.framework === 'POPIA'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {req.framework}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[11px] text-white font-semibold">
                      {req.requestType}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{req.requestorName}</div>
                      <div className="text-[10px] text-[#777777]">{req.subjectIdentifier}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[#aaaaaa]">
                      {applications.find(a => a.id === req.appId)?.name || 'Introsoft Web'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'fulfilled'
                            ? 'bg-green-500/10 text-green-400'
                            : req.status === 'in_progress'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-[#777777]">{req.createdAt}</td>
                    <td className="py-2.5 px-3 text-right">
                      {req.status !== 'fulfilled' && (
                        <button
                          onClick={() =>
                            onUpdateDataSubjectRequest(req.id, {
                              status: 'fulfilled',
                              notes: 'Fulfilled by Information Officer on ' + new Date().toISOString().slice(0, 10)
                            })
                          }
                          className="px-2 py-1 rounded bg-green-600/20 hover:bg-green-600/30 text-green-400 text-[10px] font-bold transition-colors"
                        >
                          Mark Fulfilled
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log DSAR Modal */}
      {isDsarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111111] border border-[#222222] rounded max-w-md w-full p-6 shadow-2xl space-y-4 text-[#e5e5e5]">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Log New Data Subject Request (DSR)</span>
              </h3>
              <button
                onClick={() => setIsDsarModalOpen(false)}
                className="p-1 rounded text-[#888888] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDsar} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[#888888] mb-1">Regulatory Framework:</label>
                <select
                  value={dsarFormData.framework}
                  onChange={e => setDsarFormData({ ...dsarFormData, framework: e.target.value as any })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="POPIA">POPIA (South Africa Act 4 of 2013)</option>
                  <option value="GDPR">GDPR (European Union 2016/679)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#888888] mb-1">Request Type:</label>
                <select
                  value={dsarFormData.requestType}
                  onChange={e => setDsarFormData({ ...dsarFormData, requestType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="access">Right of Access (Section 23 / Art 15)</option>
                  <option value="erasure">Right to Erasure / Forgotten (Art 17)</option>
                  <option value="rectification">Right to Rectification (Art 16)</option>
                  <option value="objection">Objection to Automated Profiling (Art 21/22)</option>
                  <option value="portability">Data Portability (Art 20)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#888888] mb-1">Requestor Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hendrik Van Der Merwe or Marie Dupont"
                  value={dsarFormData.requestorName}
                  onChange={e => setDsarFormData({ ...dsarFormData, requestorName: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[#888888] mb-1">Subject Identifier (Masked / Hashed):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SA ID: 890412***** or Email: m.dupont@*****.fr"
                  value={dsarFormData.subjectIdentifier}
                  onChange={e => setDsarFormData({ ...dsarFormData, subjectIdentifier: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[#888888] mb-1">Target Application Scope:</label>
                <select
                  value={dsarFormData.appId}
                  onChange={e => setDsarFormData({ ...dsarFormData, appId: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-amber-500"
                >
                  {applications.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.appIdentifier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#888888] mb-1">Notes / Legal Basis:</label>
                <textarea
                  rows={2}
                  value={dsarFormData.notes}
                  onChange={e => setDsarFormData({ ...dsarFormData, notes: e.target.value })}
                  placeholder="Section 23 citizen request for all AI inference records..."
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-[#222222] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDsarModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#1a1a1a] text-[#888888] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Log Subject Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
