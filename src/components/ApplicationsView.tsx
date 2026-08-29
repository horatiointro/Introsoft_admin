import React, { useState } from 'react';
import {
  AppWindow,
  Plus,
  KeyRound,
  Shield,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Lock,
  Unlock,
  Sparkles,
  AlertTriangle,
  X
} from 'lucide-react';
import { Application, ApiKey, AIPolicy, ApplicationStatus } from '../types';

interface ApplicationsViewProps {
  applications: Application[];
  apiKeys: ApiKey[];
  policies: AIPolicy[];
  onAddApplication: (app: Partial<Application>) => void;
  onUpdateApplication: (id: string, app: Partial<Application>) => void;
  onDeleteApplication: (id: string) => void;
  onToggleStatus: (id: string, status: ApplicationStatus) => void;
  onSelectAppForPlayground: (appId: string) => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  applications,
  apiKeys,
  policies,
  onAddApplication,
  onUpdateApplication,
  onDeleteApplication,
  onToggleStatus,
  onSelectAppForPlayground
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    appIdentifier: '',
    description: '',
    environment: 'production' as 'production' | 'staging' | 'development',
    status: 'active' as ApplicationStatus,
    rateLimitRpm: 120,
    quotaMonthlyRequests: 50000,
    allowedCapabilities: ['general_ai', 'fast_chat'],
    assignedPolicyIds: ['pol-global-safety'],
    contactEmail: 'admin@introsoft.internal'
  });

  const availableCapabilities = [
    'general_ai',
    'security_analysis',
    'financial_summary',
    'document_analysis',
    'code_generation',
    'fast_chat',
    'data_extraction'
  ];

  const handleOpenCreate = () => {
    setEditingApp(null);
    setFormData({
      name: '',
      appIdentifier: '',
      description: '',
      environment: 'production',
      status: 'active',
      rateLimitRpm: 120,
      quotaMonthlyRequests: 50000,
      allowedCapabilities: ['general_ai', 'fast_chat'],
      assignedPolicyIds: ['pol-global-safety'],
      contactEmail: 'admin@introsoft.internal'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app: Application) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      appIdentifier: app.appIdentifier,
      description: app.description,
      environment: app.environment,
      status: app.status,
      rateLimitRpm: app.rateLimitRpm,
      quotaMonthlyRequests: app.quotaMonthlyRequests,
      allowedCapabilities: app.allowedCapabilities,
      assignedPolicyIds: app.assignedPolicyIds,
      contactEmail: app.contactEmail
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingApp) {
      onUpdateApplication(editingApp.id, formData);
    } else {
      onAddApplication(formData);
    }
    setIsModalOpen(false);
  };

  const togglePolicy = (polId: string) => {
    if (formData.assignedPolicyIds.includes(polId)) {
      setFormData({
        ...formData,
        assignedPolicyIds: formData.assignedPolicyIds.filter(id => id !== polId)
      });
    } else {
      setFormData({
        ...formData,
        assignedPolicyIds: [...formData.assignedPolicyIds, polId]
      });
    }
  };

  const toggleCapability = (cap: string) => {
    if (formData.allowedCapabilities.includes(cap)) {
      setFormData({
        ...formData,
        allowedCapabilities: formData.allowedCapabilities.filter(c => c !== cap)
      });
    } else {
      setFormData({
        ...formData,
        allowedCapabilities: [...formData.allowedCapabilities, cap]
      });
    }
  };

  const filteredApps = applications.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.appIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Application Management
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Layer 1 • Consuming Ecosystem
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-0.5">
            Register and govern consumer applications. Instant access revocation without modifying consuming codebase.
          </p>
        </div>

        <button
          id="btn-register-app"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register New Application</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded bg-[#141414] border border-[#222222] text-xs">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search applications by name, ID, or contact email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>
      </div>

      {/* Applications Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map(app => {
          const appKeys = apiKeys.filter(k => k.appId === app.id);
          const activeKey = appKeys.find(k => k.status === 'active') || appKeys[0];
          const appPolicies = policies.filter(p => app.assignedPolicyIds.includes(p.id));
          const isRevoked = app.status === 'revoked' || app.status === 'suspended';

          return (
            <div
              key={app.id}
              className={`rounded bg-[#141414] border p-4 flex flex-col justify-between transition-colors ${
                app.status === 'active'
                  ? 'border-[#222222] hover:border-[#333333]'
                  : 'border-red-900/30 bg-[#0d0d0d] opacity-80'
              }`}
            >
              <div>
                {/* Top header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded bg-[#1a1a1a] border border-[#222222] flex items-center justify-center text-blue-400 font-bold text-xs">
                      <AppWindow className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {app.name}
                      </h3>
                      <div className="text-[10px] font-mono text-[#666666] mt-0.5">
                        ID: <span className="text-blue-400">{app.appIdentifier}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span
                    className={`text-[10px] font-mono flex items-center gap-1 ${
                      app.status === 'active' ? 'text-green-500' : 'text-red-400'
                    }`}
                  >
                    <span>●</span>
                    <span>{app.status.toUpperCase()}</span>
                  </span>
                </div>

                <p className="text-xs text-[#888888] mt-1 line-clamp-2 leading-relaxed">
                  {app.description}
                </p>

                {/* API Key Box */}
                <div className="mt-3 p-2.5 rounded bg-[#0a0a0a] border border-[#222222] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#888888] flex items-center gap-1 font-mono text-[10px]">
                      <KeyRound className="w-3 h-3 text-blue-400" />
                      Assigned Token:
                    </span>
                    <span className="font-mono text-blue-300 font-semibold text-[10px]">
                      {activeKey ? activeKey.prefix : 'No Active Key'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#666666] font-mono">
                    <span>Rate Limit: {app.rateLimitRpm} RPM</span>
                    <span>Env: {app.environment}</span>
                  </div>
                </div>

                {/* Usage Quota Progress */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] text-[#888888] font-mono">
                    <span>Monthly Quota</span>
                    <span className="text-white">
                      {app.quotaUsedRequests.toLocaleString()} / {app.quotaMonthlyRequests.toLocaleString()} reqs
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#222222] rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((app.quotaUsedRequests / app.quotaMonthlyRequests) * 100)
                        )}%`
                      }}
                    />
                  </div>
                </div>

                {/* Assigned Policies */}
                <div className="mt-3 pt-2 border-t border-[#222222]">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-[#666666] mb-1 font-mono">
                    Enforced Governance Policies
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {appPolicies.map(pol => (
                      <span
                        key={pol.id}
                        className="px-1.5 py-0.5 rounded bg-[#0a0a0a] text-blue-300 text-[10px] font-mono border border-[#222222] flex items-center gap-1"
                      >
                        <Shield className="w-2.5 h-2.5 text-blue-400" />
                        {pol.name}
                      </span>
                    ))}
                    {appPolicies.length === 0 && (
                      <span className="text-[10px] text-[#666666] font-mono">Global Safety Only</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectAppForPlayground(app.id)}
                  className="flex-1 px-2.5 py-1 rounded text-xs font-mono bg-[#1a1a1a] hover:bg-[#222222] text-[#e5e5e5] border border-[#222222] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Simulate Caller</span>
                </button>

                {/* Quick Revocation Toggle */}
                <button
                  onClick={() =>
                    onToggleStatus(app.id, app.status === 'active' ? 'revoked' : 'active')
                  }
                  className={`px-2 py-1 rounded text-xs font-mono border transition-colors flex items-center gap-1 ${
                    app.status === 'active'
                      ? 'bg-red-500/5 text-red-400 border-red-500/20 hover:bg-red-500/10'
                      : 'bg-green-500/5 text-green-400 border-green-500/20 hover:bg-green-500/10'
                  }`}
                  title={app.status === 'active' ? 'Instant Revoke Access' : 'Restore Application Access'}
                >
                  {app.status === 'active' ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Revoke</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>Restore</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleOpenEdit(app)}
                  className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteApplication(app.id)}
                  className="p-1 rounded text-[#888888] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111111] border border-[#222222] rounded max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#e5e5e5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingApp ? `Edit Application: ${editingApp.name}` : 'Register New Application'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Application Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Introsoft Website"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Application ID (Slug)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. introsoft-web"
                    value={formData.appIdentifier}
                    onChange={e => setFormData({ ...formData, appIdentifier: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  Description & Functional Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Primary role in the Introsoft software suite..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Environment
                  </label>
                  <select
                    value={formData.environment}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        environment: e.target.value as 'production' | 'staging' | 'development'
                      })
                    }
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Rate Limit (RPM)
                  </label>
                  <input
                    type="number"
                    value={formData.rateLimitRpm}
                    onChange={e => setFormData({ ...formData, rateLimitRpm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  Monthly Quota Limit (Requests)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={formData.quotaMonthlyRequests}
                  onChange={e => setFormData({ ...formData, quotaMonthlyRequests: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Assign AI Policies */}
              <div>
                <label className="block text-[#888888] font-semibold mb-1.5 font-mono text-[11px]">
                  Assign Governance Policies
                </label>
                <div className="space-y-1.5">
                  {policies.map(pol => {
                    const isChecked = formData.assignedPolicyIds.includes(pol.id);
                    return (
                      <label
                        key={pol.id}
                        className="flex items-center space-x-2.5 p-2 rounded bg-[#0a0a0a] border border-[#222222] cursor-pointer hover:border-[#333333] text-[#e5e5e5]"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePolicy(pol.id)}
                          className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#222222]"
                        />
                        <div>
                          <span className="font-semibold text-white">{pol.name}</span>
                          <span className="text-[10px] text-[#666666] block font-mono">{pol.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Allowed Capabilities */}
              <div>
                <label className="block text-[#888888] font-semibold mb-1.5 font-mono text-[11px]">
                  Allowed AI Capabilities
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableCapabilities.map(cap => {
                    const isSelected = formData.allowedCapabilities.includes(cap);
                    return (
                      <button
                        type="button"
                        key={cap}
                        onClick={() => toggleCapability(cap)}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                          isSelected
                            ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                            : 'bg-[#0a0a0a] text-[#888888] border-[#222222]'
                        }`}
                      >
                        {cap}
                      </button>
                    );
                  })}
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
                  {editingApp ? 'Update Application' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
