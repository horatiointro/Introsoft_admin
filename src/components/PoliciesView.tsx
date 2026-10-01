import { InfoButton } from './InfoButton';
import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Shield,
  Lock,
  FileCheck,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Sparkles,
  AppWindow
} from 'lucide-react';
import { AIPolicy, Application, AIProvider, Customer } from '../types';

type ImportedPolicyCategory = 'Confidentiality' | 'Data security';
type PolicyImportTemplate = {
  id: string;
  category: ImportedPolicyCategory;
  name: string;
  summary: string;
  rules: Partial<AIPolicy['rules']>;
};

const TEST_POLICY_LIBRARY: PolicyImportTemplate[] = [
  { id: 'confidential-information', category: 'Confidentiality', name: 'Confidential Information Classification and Handling', summary: 'Classify company information and only share it with approved people and systems on a need-to-know basis.', rules: { redactPII: true, anonymizePromptsInAudit: true } },
  { id: 'ai-prompt-confidentiality', category: 'Confidentiality', name: 'Confidential Information in AI Prompts and Outputs', summary: 'Prevent confidential business, customer, employee, and unpublished information from being exposed through prompts or generated outputs.', rules: { redactPII: true, anonymizePromptsInAudit: true, blockSensitiveFinancialData: true } },
  { id: 'trade-secrets-ip', category: 'Confidentiality', name: 'Trade Secrets and Intellectual Property', summary: 'Protect source code, designs, inventions, pricing, strategy, and other proprietary material from unauthorized disclosure or reuse.', rules: { anonymizePromptsInAudit: true, requireApprovedProvider: true } },
  { id: 'confidentiality-agreements', category: 'Confidentiality', name: 'Confidentiality Agreements and Third-Party Disclosure', summary: 'Allow disclosure to suppliers, advisers, and processors only under approved confidentiality terms and documented purpose.', rules: { requireApprovedProvider: true, logRequestMetadata: true } },
  { id: 'purpose-minimization', category: 'Confidentiality', name: 'Purpose Limitation and Data Minimisation', summary: 'Use only the minimum confidential information required for an approved business purpose; remove unrelated context.', rules: { redactPII: true, anonymizePromptsInAudit: true } },
  { id: 'confidential-sharing', category: 'Confidentiality', name: 'Confidential Output and External Sharing', summary: 'Review AI-generated material for confidential content before publication, customer delivery, or external sharing.', rules: { redactPII: true, enableAuditTrail: true } },
  { id: 'least-privilege', category: 'Data security', name: 'Identity, Access Control, and Least Privilege', summary: 'Restrict policy and data access to authenticated users and service identities with approved, minimum necessary permissions.', rules: { enableAuditTrail: true, logRequestMetadata: true } },
  { id: 'secure-authentication', category: 'Data security', name: 'Authentication and Account Security', summary: 'Require strong authentication, protect credentials, and promptly remove access when a person or service no longer needs it.', rules: { enableAuditTrail: true, requireApprovedProvider: true } },
  { id: 'encryption', category: 'Data security', name: 'Encryption in Transit and at Rest', summary: 'Protect company data with approved encryption during transmission and while stored; manage keys separately from data.', rules: { requireApprovedProvider: true } },
  { id: 'data-loss-egress', category: 'Data security', name: 'Data Loss Prevention and Secure Egress', summary: 'Inspect outbound prompts and outputs, block prohibited sensitive data, and restrict transfers to approved destinations.', rules: { blockSensitiveFinancialData: true, redactPII: true, requireApprovedProvider: true } },
  { id: 'secure-dev-config', category: 'Data security', name: 'Secure Configuration and Change Management', summary: 'Use reviewed configurations, separate test and company data, and approve material changes to AI and data-security controls.', rules: { enableAuditTrail: true, logRequestMetadata: true } },
  { id: 'vulnerability-patching', category: 'Data security', name: 'Vulnerability and Patch Management', summary: 'Track security weaknesses in systems that process company data and apply risk-based remediation within defined timeframes.', rules: { requireApprovedProvider: true, enableAuditTrail: true } },
  { id: 'retention-disposal', category: 'Data security', name: 'Data Retention and Secure Disposal', summary: 'Keep prompts, outputs, and derived records only for approved periods, then securely delete or de-identify them.', rules: { anonymizePromptsInAudit: true, logRequestMetadata: true } },
  { id: 'incident-response', category: 'Data security', name: 'Security Incident and Breach Response', summary: 'Detect, contain, investigate, and escalate suspected exposure or compromise of company data and preserve relevant evidence.', rules: { enableAuditTrail: true, logRequestMetadata: true } },
  { id: 'security-monitoring', category: 'Data security', name: 'Security Logging and Monitoring', summary: 'Record access and security-relevant activity without storing secrets or unnecessary raw confidential content.', rules: { enableAuditTrail: true, logRequestMetadata: true, anonymizePromptsInAudit: true } },
  { id: 'backup-recovery', category: 'Data security', name: 'Backup, Recovery, and Resilience', summary: 'Protect recoverable copies of important company data, restrict backup access, and periodically validate restoration procedures.', rules: { requireApprovedProvider: true, enableAuditTrail: true } },
  { id: 'residency-transfer', category: 'Data security', name: 'Data Residency and Cross-Border Transfers', summary: 'Identify where company data is processed and stored, and permit cross-border transfers only after company approval.', rules: { requireApprovedProvider: true, logRequestMetadata: true } },
  { id: 'supplier-security', category: 'Data security', name: 'Supplier and Cloud Service Security', summary: 'Assess providers that process company data, limit their access, and review security commitments and changes.', rules: { requireApprovedProvider: true, enableAuditTrail: true } },
];

interface PoliciesViewProps {
  policies: AIPolicy[];
  applications: Application[];
  providers: AIProvider[];
  customers: Customer[];
  initialTenantId: string;
  onAddPolicy: (policy: Partial<AIPolicy>) => void | Promise<void>;
  onUpdatePolicy: (id: string, policy: Partial<AIPolicy>) => void;
  onDeletePolicy: (id: string) => void;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies,
  applications,
  providers,
  customers,
  initialTenantId,
  onAddPolicy,
  onUpdatePolicy,
  onDeletePolicy
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AIPolicy | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showImportReview, setShowImportReview] = useState(false);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const importInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const importTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companies = customers.filter(customer => customer.type === 'company' && customer.status !== 'archived' && customer.status !== 'terminated');

  useEffect(() => () => {
    if (importInterval.current) clearInterval(importInterval.current);
    if (importTimeout.current) clearTimeout(importTimeout.current);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    appliesToAppIds: ['all'],
    status: 'active' as 'active' | 'draft' | 'disabled',
    rules: {
      blockSensitiveFinancialData: true,
      redactPII: true,
      logRequestMetadata: true,
      anonymizePromptsInAudit: true,
      requireApprovedProvider: false,
      maxContextTokens: 16384,
      maxResponseTokens: 4096,
      enableAuditTrail: true,
      blockPromptInjections: true,
      allowedProviderIds: [] as string[]
    }
  });

  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setSelectedCompanyId(companies.some(company => company.id === initialTenantId) ? initialTenantId : companies[0]?.id || '');
    setImporting(false);
    setImportProgress(0);
    setShowImportReview(false);
    setSelectedImportIds([]);
    setFormData({
      name: '',
      description: '',
      appliesToAppIds: ['all'],
      status: 'active',
      rules: {
        blockSensitiveFinancialData: true,
        redactPII: true,
        logRequestMetadata: true,
        anonymizePromptsInAudit: true,
        requireApprovedProvider: false,
        maxContextTokens: 16384,
        maxResponseTokens: 4096,
        enableAuditTrail: true,
        blockPromptInjections: true,
        allowedProviderIds: []
      }
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: AIPolicy) => {
    setEditingPolicy(p);
    setSelectedCompanyId(p.tenantId || '');
    setShowImportReview(false);
    setFormData({
      name: p.name,
      description: p.description,
      appliesToAppIds: p.appliesToAppIds,
      status: p.status,
      rules: { ...p.rules }
    });
    setIsModalOpen(true);
  };

  const toggleAppTarget = (appId: string) => {
    if (appId === 'all') {
      setFormData({ ...formData, appliesToAppIds: ['all'] });
      return;
    }
    const current = formData.appliesToAppIds.filter(id => id !== 'all');
    if (current.includes(appId)) {
      const updated = current.filter(id => id !== appId);
      setFormData({
        ...formData,
        appliesToAppIds: updated.length === 0 ? ['all'] : updated
      });
    } else {
      setFormData({
        ...formData,
        appliesToAppIds: [...current, appId]
      });
    }
  };

  const toggleRule = (ruleKey: keyof typeof formData.rules) => {
    setFormData({
      ...formData,
      rules: {
        ...formData.rules,
        [ruleKey]: !formData.rules[ruleKey]
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingPolicy) {
      onUpdatePolicy(editingPolicy.id, formData);
    } else {
      if (!selectedCompanyId) return;
      onAddPolicy({ ...formData, tenantId: selectedCompanyId });
    }
    setIsModalOpen(false);
  };

  const startPolicyImport = () => {
    if (!selectedCompanyId || importing) return;
    if (importInterval.current) clearInterval(importInterval.current);
    if (importTimeout.current) clearTimeout(importTimeout.current);
    setShowImportReview(false);
    setSelectedImportIds([]);
    setImportProgress(0);
    setImporting(true);
    const startedAt = Date.now();
    importInterval.current = setInterval(() => {
      setImportProgress(Math.min(99, Math.floor(((Date.now() - startedAt) / 5000) * 100)));
    }, 100);
    importTimeout.current = setTimeout(() => {
      if (importInterval.current) clearInterval(importInterval.current);
      importInterval.current = null;
      importTimeout.current = null;
      setImportProgress(100);
      setImporting(false);
      setShowImportReview(true);
      setSelectedImportIds(TEST_POLICY_LIBRARY.filter(template => !policies.some(policy => policy.tenantId === selectedCompanyId && policy.name === template.name)).map(template => template.id));
    }, 5000);
  };

  const importSelectedPolicies = async () => {
    if (!selectedCompanyId || importing) return;
    const selectedTemplates = TEST_POLICY_LIBRARY.filter(template => selectedImportIds.includes(template.id) && !policies.some(policy => policy.tenantId === selectedCompanyId && policy.name === template.name));
    for (const template of selectedTemplates) {
      await onAddPolicy({
        name: template.name,
        description: `TEST DATA · ${template.category}. ${template.summary} This sample is a draft for company review; it is not an imported company document.`,
        appliesToAppIds: ['all'],
        tenantId: selectedCompanyId,
        status: 'draft',
        rules: {
          blockSensitiveFinancialData: false,
          redactPII: true,
          logRequestMetadata: true,
          anonymizePromptsInAudit: true,
          requireApprovedProvider: true,
          maxContextTokens: 16384,
          maxResponseTokens: 4096,
          enableAuditTrail: true,
          blockPromptInjections: true,
          ...template.rules,
          allowedProviderIds: [],
        },
      });
    }
    setIsModalOpen(false);
    setShowImportReview(false);
    setSelectedImportIds([]);
  };

  const toggleImportedPolicy = (id: string) => {
    setSelectedImportIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  };

  const closeModal = () => {
    if (importInterval.current) clearInterval(importInterval.current);
    if (importTimeout.current) clearTimeout(importTimeout.current);
    importInterval.current = null;
    importTimeout.current = null;
    setImporting(false);
    setIsModalOpen(false);
  };

  const selectedCompany = companies.find(company => company.id === selectedCompanyId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white"><InfoButton />
              AI Policy & Governance Management
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Layer 2 • Governance & Trust
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-0.5">
            Beyond a proxy: enforce strict financial data protection, automated PII scrubbing, approved provider bounds, and immutable audit trails.
          </p>
        </div>

        <button
          id="btn-create-policy"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Define New AI Policy</span>
        </button>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map(policy => {
          const isGlobal = policy.appliesToAppIds.includes('all');
          const targetApps = isGlobal
            ? []
            : applications.filter(a => policy.appliesToAppIds.includes(a.id));

          return (
            <div
              key={policy.id}
              className="p-4 rounded bg-[#141414] border border-[#222222] hover:border-[#333333] space-y-4 flex flex-col justify-between transition-colors"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-[#222222]">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded bg-[#0a0a0a] text-blue-400 border border-[#222222]">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight"><InfoButton />
                        {policy.name}
                      </h3>
                      <div className="text-[10px] font-mono text-[#666666] mt-0.5">
                        Applies to:{' '}
                        <span className="text-blue-300 font-semibold">
                          {isGlobal
                            ? 'All Applications (Global Baseline)'
                            : targetApps.map(a => a.name).join(', ')}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-[#777777]">Company:</span>
                        <span className="text-cyan-200">{customers.find(customer => customer.id === policy.tenantId)?.name || (policy.tenantId ? 'Company unavailable' : 'Global baseline')}</span>
                        {policy.description.startsWith('TEST DATA ·') && <span className="rounded border border-amber-300/20 bg-amber-300/10 px-1.5 py-0.5 font-bold tracking-wide text-amber-200">TEST POLICY · REVIEW REQUIRED</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(policy)}
                      className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeletePolicy(policy.id)}
                      className="p-1 rounded text-[#888888] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#888888] mt-2 leading-relaxed">
                  {policy.description}
                </p>

                {/* Rules Checklist */}
                <div className="mt-4 space-y-2 bg-[#0a0a0a] p-3 rounded border border-[#222222] text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`p-0.5 rounded ${
                        policy.rules.blockSensitiveFinancialData
                          ? 'text-green-400'
                          : 'text-[#666666]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className={policy.rules.blockSensitiveFinancialData ? 'text-[#e5e5e5]' : 'text-[#666666]'}>
                      Do not send sensitive financial / banking data
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`p-0.5 rounded ${
                        policy.rules.redactPII
                          ? 'text-green-400'
                          : 'text-[#666666]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className={policy.rules.redactPII ? 'text-[#e5e5e5]' : 'text-[#666666]'}>
                      Automated PII scrubbing (Emails, Phones, IPs)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`p-0.5 rounded ${
                        policy.rules.logRequestMetadata
                          ? 'text-green-400'
                          : 'text-[#666666]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className={policy.rules.logRequestMetadata ? 'text-[#e5e5e5]' : 'text-[#666666]'}>
                      Log request metadata (Who, What, When, Duration)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`p-0.5 rounded ${
                        policy.rules.requireApprovedProvider
                          ? 'text-green-400'
                          : 'text-[#666666]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className={policy.rules.requireApprovedProvider ? 'text-[#e5e5e5]' : 'text-[#666666]'}>
                      Require approved provider whitelist
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`p-0.5 rounded ${
                        policy.rules.enableAuditTrail
                          ? 'text-green-400'
                          : 'text-[#666666]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className={policy.rules.enableAuditTrail ? 'text-[#e5e5e5]' : 'text-[#666666]'}>
                      Enable immutable audit trail & telemetry
                    </span>
                  </div>
                </div>
              </div>

              {/* Token Bounding Constraints */}
              <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] font-mono text-[#888888]">
                <span>Max Context: <strong className="text-white">{(policy.rules.maxContextTokens / 1024).toFixed(0)}K</strong></span>
                <span>Max Output: <strong className="text-white">{(policy.rules.maxResponseTokens / 1024).toFixed(0)}K</strong></span>
                <span className={`${policy.status === 'active' ? 'text-green-400' : policy.status === 'draft' ? 'text-amber-300' : 'text-slate-500'} font-mono text-[10px] flex items-center gap-1`}>
                  <span>●</span>
                  <span>{policy.status === 'active' ? 'ENFORCING' : policy.status.toUpperCase()}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Policy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111111] border border-[#222222] rounded max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#e5e5e5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-sm font-bold text-white"><InfoButton />
                {editingPolicy ? 'Configure AI Policy' : 'Create AI Governance Policy'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {!editingPolicy && (
                <section className="space-y-3 rounded border border-cyan-500/20 bg-cyan-950/20 p-3">
                  <div>
                    <label htmlFor="policy-company" className="block text-[#b7c4d8] font-semibold mb-1 font-mono text-[11px]">Company this policy set belongs to</label>
                    <select id="policy-company" required value={selectedCompanyId} onChange={event => { setSelectedCompanyId(event.target.value); setShowImportReview(false); }} className="w-full rounded bg-[#0a0a0a] border border-[#26364a] px-3 py-2 text-white focus:outline-none focus:border-cyan-400">
                      <option value="">Select a company</option>
                      {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
                    </select>
                    {!companies.length && <p className="mt-1 text-[10px] text-amber-200">Create or select a company before adding company policies.</p>}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-100/10 pt-3">
                    <div className="min-w-0"><p className="font-semibold text-white">Import confidentiality and data-security policies</p><p className="mt-1 text-[10px] leading-4 text-slate-400">Preview a synthetic policy checklist for {selectedCompany?.name || 'the selected company'}. No company documents are read in this test flow.</p></div>
                    <button type="button" disabled={!selectedCompanyId || importing} onClick={startPolicyImport} className="inline-flex shrink-0 items-center gap-2 rounded bg-cyan-300 px-3 py-2 font-bold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"><FileCheck className="h-3.5 w-3.5" />{importing ? 'Preparing policy list…' : 'Import policies'}</button>
                  </div>

                  {importing && <div role="status" aria-live="polite" className="rounded border border-cyan-300/20 bg-black/20 p-3"><div className="mb-2 flex items-center justify-between text-[10px] text-cyan-100"><span className="inline-flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 animate-pulse" />Preparing test policies for {selectedCompany?.name}</span><span>{importProgress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="Preparing company policy list" aria-valuemin={0} aria-valuemax={100} aria-valuenow={importProgress}><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-[width] duration-100" style={{ width: `${importProgress}%` }} /></div><p className="mt-2 text-[10px] text-slate-500">Checking confidentiality and data-security policy categories…</p></div>}

                  {showImportReview && <div className="space-y-3 rounded border border-amber-300/20 bg-amber-950/10 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-amber-100">Test policy set · {selectedCompany?.name}</p><p className="mt-1 text-[10px] text-slate-400">Synthetic examples only. Selected items will be added as company-scoped drafts for review, not activated.</p></div><span className="rounded-full border border-amber-200/20 px-2 py-1 text-[9px] font-bold tracking-wider text-amber-200">TEST DATA</span></div>
                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">{(['Confidentiality', 'Data security'] as const).map(category => <div key={category}><h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">{category}</h4><div className="space-y-1.5">{TEST_POLICY_LIBRARY.filter(template => template.category === category).map(template => { const alreadyAdded = policies.some(policy => policy.tenantId === selectedCompanyId && policy.name === template.name); const checked = selectedImportIds.includes(template.id); return <label key={template.id} className={`flex gap-2 rounded border p-2 ${alreadyAdded ? 'border-emerald-200/10 bg-emerald-200/[.03] opacity-70' : 'border-white/5 bg-black/20'}`}><input type="checkbox" checked={alreadyAdded || checked} disabled={alreadyAdded} onChange={() => toggleImportedPolicy(template.id)} className="mt-0.5 accent-cyan-300"/><span className="min-w-0"><span className="block font-semibold text-slate-200">{template.name}{alreadyAdded && <span className="ml-2 text-[9px] text-emerald-300">Already added</span>}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-400">{template.summary}</span></span></label>; })}</div></div>)}</div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3"><span className="text-[10px] text-slate-400">{selectedImportIds.length} selected · duplicates are skipped</span><button type="button" disabled={!selectedImportIds.length} onClick={() => void importSelectedPolicies()} className="rounded bg-emerald-400 px-3 py-2 font-bold text-emerald-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">Add selected as company drafts</button></div>
                  </div>}
                </section>
              )}

              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  Policy Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Financial Data Protection"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  Policy Description & Objectives
                </label>
                <textarea
                  rows={2}
                  placeholder="Defines mandatory privacy rules and token limits..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Target Apps */}
              <div>
                <label className="block text-[#888888] font-semibold mb-1.5 font-mono text-[11px]">
                  Applies To Applications
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleAppTarget('all')}
                    className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                      formData.appliesToAppIds.includes('all')
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                        : 'bg-[#0a0a0a] text-[#888888] border-[#222222]'
                    }`}
                  >
                    All Applications
                  </button>
                  {applications.map(app => (
                    <button
                      type="button"
                      key={app.id}
                      onClick={() => toggleAppTarget(app.id)}
                      className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                        formData.appliesToAppIds.includes(app.id)
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                          : 'bg-[#0a0a0a] text-[#888888] border-[#222222]'
                      }`}
                    >
                      {app.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rules Toggles */}
              <div>
                <label className="block text-[#888888] font-semibold mb-1.5 font-mono text-[11px]">
                  Governance Rules & Guardrails
                </label>
                <div className="space-y-2 bg-[#0a0a0a] p-3 rounded border border-[#222222]">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-[#e5e5e5]">
                    <input
                      type="checkbox"
                      checked={formData.rules.blockSensitiveFinancialData}
                      onChange={() => toggleRule('blockSensitiveFinancialData')}
                      className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#222222]"
                    />
                    <span className="font-mono text-xs text-white">Do not send sensitive financial data</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-[#e5e5e5]">
                    <input
                      type="checkbox"
                      checked={formData.rules.redactPII}
                      onChange={() => toggleRule('redactPII')}
                      className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#222222]"
                    />
                    <span className="font-mono text-xs text-white">Redact PII (Personal Identifiable Info)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-[#e5e5e5]">
                    <input
                      type="checkbox"
                      checked={formData.rules.blockPromptInjections}
                      onChange={() => toggleRule('blockPromptInjections')}
                      className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#222222]"
                    />
                    <span className="font-mono text-xs text-white">Block Prompt Injections & Jailbreaks</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-[#e5e5e5]">
                    <input
                      type="checkbox"
                      checked={formData.rules.logRequestMetadata}
                      onChange={() => toggleRule('logRequestMetadata')}
                      className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#222222]"
                    />
                    <span className="font-mono text-xs text-white">Log request metadata & execution metrics</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-[#e5e5e5]">
                    <input
                      type="checkbox"
                      checked={formData.rules.anonymizePromptsInAudit}
                      onChange={() => toggleRule('anonymizePromptsInAudit')}
                      className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#222222]"
                    />
                    <span className="font-mono text-xs text-white">Do not store raw sensitive prompts in logs</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-[#e5e5e5]">
                    <input
                      type="checkbox"
                      checked={formData.rules.enableAuditTrail}
                      onChange={() => toggleRule('enableAuditTrail')}
                      className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#222222]"
                    />
                    <span className="font-mono text-xs text-white">Enable tamper-evident audit trail</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Maximum Context (tokens)
                  </label>
                  <input
                    type="number"
                    value={formData.rules.maxContextTokens}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, maxContextTokens: Number(e.target.value) }
                      })
                    }
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Maximum Response (tokens)
                  </label>
                  <input
                    type="number"
                    value={formData.rules.maxResponseTokens}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, maxResponseTokens: Number(e.target.value) }
                      })
                    }
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#222222] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] font-medium border border-[#222222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
                >
                  {editingPolicy ? 'Update Policy' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
