import React, { useState } from 'react';
import {
  GitFork,
  Plus,
  ArrowRight,
  Server,
  Boxes,
  Shield,
  Edit2,
  Trash2,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  X
} from 'lucide-react';
import { RoutingRule, AIModel, AIProvider, Application } from '../types';

interface RoutingViewProps {
  routingRules: RoutingRule[];
  models: AIModel[];
  providers: AIProvider[];
  applications: Application[];
  onAddRoute: (route: Partial<RoutingRule>) => void;
  onUpdateRoute: (id: string, route: Partial<RoutingRule>) => void;
  onDeleteRoute: (id: string) => void;
}

export const RoutingView: React.FC<RoutingViewProps> = ({
  routingRules,
  models,
  providers,
  applications,
  onAddRoute,
  onUpdateRoute,
  onDeleteRoute
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RoutingRule | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    taskOrCapability: 'general_ai',
    appId: 'all',
    primaryModelId: models[0]?.id || '',
    firstFallbackModelId: models[1]?.id || '',
    secondFallbackModelId: models[2]?.id || '',
    maxTokens: 4096,
    timeoutMs: 8000,
    fallbackTriggers: ['on_error', 'on_timeout'] as ('on_error' | 'on_timeout' | 'on_rate_limit')[],
    loadBalancingStrategy: 'priority_fallback' as 'priority_fallback' | 'round_robin' | 'lowest_latency' | 'cost_optimized',
    enabled: true,
    description: ''
  });

  const handleOpenCreate = () => {
    setEditingRoute(null);
    setFormData({
      name: '',
      taskOrCapability: 'general_ai',
      appId: 'all',
      primaryModelId: models[0]?.id || '',
      firstFallbackModelId: models[1]?.id || '',
      secondFallbackModelId: models[2]?.id || '',
      maxTokens: 4096,
      timeoutMs: 8000,
      fallbackTriggers: ['on_error', 'on_timeout'],
      loadBalancingStrategy: 'priority_fallback',
      enabled: true,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: RoutingRule) => {
    setEditingRoute(r);
    setFormData({
      name: r.name,
      taskOrCapability: r.taskOrCapability,
      appId: r.appId,
      primaryModelId: r.primaryModelId,
      firstFallbackModelId: r.firstFallbackModelId || '',
      secondFallbackModelId: r.secondFallbackModelId || '',
      maxTokens: r.maxTokens,
      timeoutMs: r.timeoutMs,
      fallbackTriggers: r.fallbackTriggers,
      loadBalancingStrategy: r.loadBalancingStrategy,
      enabled: r.enabled,
      description: r.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingRoute) {
      onUpdateRoute(editingRoute.id, formData);
    } else {
      onAddRoute(formData);
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
              Model Routing & Fallback Chains
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Layer 2 • Intelligent Dispatch
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-0.5">
            Define capability-based routing rules. ALTIL automatically cascades across primary and fallback tiers on error or latency spikes.
          </p>
        </div>

        <button
          id="btn-add-routing-rule"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Routing Rule</span>
        </button>
      </div>

      {/* Routing Cards with visual pipeline */}
      <div className="space-y-4">
        {routingRules.map(rule => {
          const app = rule.appId === 'all' ? null : applications.find(a => a.id === rule.appId);
          const primary = models.find(m => m.id === rule.primaryModelId);
          const primaryProv = primary ? providers.find(p => p.id === primary.providerId) : null;

          const fb1 = models.find(m => m.id === rule.firstFallbackModelId);
          const fb1Prov = fb1 ? providers.find(p => p.id === fb1.providerId) : null;

          const fb2 = models.find(m => m.id === rule.secondFallbackModelId);
          const fb2Prov = fb2 ? providers.find(p => p.id === fb2.providerId) : null;

          return (
            <div
              key={rule.id}
              className="p-4 rounded bg-[#141414] border border-[#222222] hover:border-[#333333] space-y-4 transition-colors"
            >
              {/* Rule Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#222222]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-[#0a0a0a] text-blue-400 border border-[#222222]">
                    <GitFork className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {rule.name}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#0a0a0a] text-blue-300 border border-[#222222]">
                        {rule.taskOrCapability}
                      </span>
                    </div>
                    <p className="text-xs text-[#888888] mt-0.5">
                      Applies to:{' '}
                      <span className="font-semibold text-white font-mono">
                        {app ? app.name : 'All Introsoft Applications (Global)'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-green-500 flex items-center gap-1">
                    <span>●</span>
                    <span>ACTIVE ROUTE</span>
                  </span>
                  <button
                    onClick={() => handleOpenEdit(rule)}
                    className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteRoute(rule.id)}
                    className="p-1 rounded text-[#888888] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Visual Fallback Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Primary Tier */}
                <div className="p-3 rounded bg-[#0a0a0a] border border-blue-500/30 relative">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1.5 font-mono">
                    <span>1. Primary Target</span>
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300">
                      Tier 1
                    </span>
                  </div>
                  <div className="font-bold text-white text-xs truncate">
                    {primary?.displayName || 'Unassigned'}
                  </div>
                  <div className="text-[10px] font-mono text-[#666666] mt-0.5 flex items-center gap-1">
                    <Server className="w-3 h-3 text-[#666666]" />
                    <span>{primaryProv?.name || 'Local'}</span>
                  </div>
                </div>

                {/* 1st Fallback */}
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222] relative">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#888888] mb-1.5 font-mono">
                    <span>2. First Fallback</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#1a1a1a] text-[#888888]">
                      Tier 2
                    </span>
                  </div>
                  <div className="font-bold text-white text-xs truncate">
                    {fb1?.displayName || 'None'}
                  </div>
                  <div className="text-[10px] font-mono text-[#666666] mt-0.5 flex items-center gap-1">
                    <Server className="w-3 h-3 text-[#666666]" />
                    <span>{fb1Prov?.name || 'Cloud LPU'}</span>
                  </div>
                </div>

                {/* 2nd Fallback */}
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222] relative">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#888888] mb-1.5 font-mono">
                    <span>3. Second Fallback</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#1a1a1a] text-[#888888]">
                      Tier 3
                    </span>
                  </div>
                  <div className="font-bold text-white text-xs truncate">
                    {fb2?.displayName || 'None'}
                  </div>
                  <div className="text-[10px] font-mono text-[#666666] mt-0.5 flex items-center gap-1">
                    <Server className="w-3 h-3 text-[#666666]" />
                    <span>{fb2Prov?.name || 'Google Cloud'}</span>
                  </div>
                </div>
              </div>

              {/* Execution Constraints Footer */}
              <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-[#888888] pt-2 border-t border-[#222222]">
                <div className="flex items-center space-x-4">
                  <span>Max Tokens: <strong className="text-white">{rule.maxTokens}</strong></span>
                  <span>Timeout: <strong className="text-white">{rule.timeoutMs}ms</strong></span>
                  <span>Strategy: <strong className="text-blue-300 font-mono">{rule.loadBalancingStrategy}</strong></span>
                </div>
                <div className="text-[#666666]">
                  Triggers on: {rule.fallbackTriggers.join(', ')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111111] border border-[#222222] rounded max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#e5e5e5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingRoute ? 'Configure Routing Rule' : 'Create Intelligent Routing Rule'}
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
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General AI Workload Routing"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Task / Capability Hook
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. general_ai or security_analysis"
                    value={formData.taskOrCapability}
                    onChange={e => setFormData({ ...formData, taskOrCapability: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Applicable Application
                  </label>
                  <select
                    value={formData.appId}
                    onChange={e => setFormData({ ...formData, appId: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="all">All Introsoft Apps (Global Default)</option>
                    {applications.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Primary Model Selection */}
              <div>
                <label className="block text-blue-400 font-semibold mb-1 font-mono text-[11px]">
                  Primary Model (Tier 1 Preferred)
                </label>
                <select
                  value={formData.primaryModelId}
                  onChange={e => setFormData({ ...formData, primaryModelId: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-blue-500/40 text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} ({providers.find(p => p.id === m.providerId)?.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fallback 1 Selection */}
              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  First Fallback Model (Tier 2 Failover)
                </label>
                <select
                  value={formData.firstFallbackModelId}
                  onChange={e => setFormData({ ...formData, firstFallbackModelId: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="">None</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} ({providers.find(p => p.id === m.providerId)?.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fallback 2 Selection */}
              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  Second Fallback Model (Tier 3 Failover)
                </label>
                <select
                  value={formData.secondFallbackModelId}
                  onChange={e => setFormData({ ...formData, secondFallbackModelId: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="">None</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} ({providers.find(p => p.id === m.providerId)?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Max Token Envelope
                  </label>
                  <input
                    type="number"
                    value={formData.maxTokens}
                    onChange={e => setFormData({ ...formData, maxTokens: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Timeout Threshold (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.timeoutMs}
                    onChange={e => setFormData({ ...formData, timeoutMs: Number(e.target.value) })}
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
                  {editingRoute ? 'Update Rule' : 'Save Routing Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
