import React, { useState } from 'react';
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
import { AIPolicy, Application, AIProvider } from '../types';

interface PoliciesViewProps {
  policies: AIPolicy[];
  applications: Application[];
  providers: AIProvider[];
  onAddPolicy: (policy: Partial<AIPolicy>) => void;
  onUpdatePolicy: (id: string, policy: Partial<AIPolicy>) => void;
  onDeletePolicy: (id: string) => void;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies,
  applications,
  providers,
  onAddPolicy,
  onUpdatePolicy,
  onDeletePolicy
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AIPolicy | null>(null);

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
      onAddPolicy(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
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
                      <h3 className="text-sm font-bold text-white tracking-tight">
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
                <span className="text-green-400 font-mono text-[10px] flex items-center gap-1">
                  <span>●</span>
                  <span>ENFORCING</span>
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
              <h3 className="text-sm font-bold text-white">
                {editingPolicy ? 'Configure AI Policy' : 'Create AI Governance Policy'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                  onClick={() => setIsModalOpen(false)}
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
