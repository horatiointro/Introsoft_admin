import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Server,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  Tag,
  Search,
  Filter,
  X,
  Layers,
  DollarSign
} from 'lucide-react';
import { AIModel, AIProvider } from '../types';

interface ModelsViewProps {
  models: AIModel[];
  providers: AIProvider[];
  onAddModel: (model: Partial<AIModel>) => void;
  onUpdateModel: (id: string, model: Partial<AIModel>) => void;
  onDeleteModel: (id: string) => void;
}

export const ModelsView: React.FC<ModelsViewProps> = ({
  models,
  providers,
  onAddModel,
  onUpdateModel,
  onDeleteModel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('all');

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);

  const [formData, setFormData] = useState({
    modelIdentifier: '',
    displayName: '',
    providerId: providers[0]?.id || 'p-ollama',
    status: 'online' as 'online' | 'offline',
    contextWindow: 32768,
    maxOutputTokens: 4096,
    enabled: true,
    capabilities: ['general_ai'],
    costPer1kInput: 0.0,
    costPer1kOutput: 0.0,
    averageLatencyMs: 180,
    description: ''
  });

  const availableCapabilities = [
    { id: 'general_ai', label: 'General AI' },
    { id: 'security_analysis', label: 'Security Analysis' },
    { id: 'financial_summary', label: 'Financial Summary' },
    { id: 'document_analysis', label: 'Document Analysis' },
    { id: 'code_generation', label: 'Code Generation' },
    { id: 'fast_chat', label: 'Fast Chat' },
    { id: 'data_extraction', label: 'Structured Extraction' }
  ];

  const handleOpenCreate = () => {
    setEditingModel(null);
    setFormData({
      modelIdentifier: '',
      displayName: '',
      providerId: providers[0]?.id || 'p-ollama',
      status: 'online',
      contextWindow: 32768,
      maxOutputTokens: 4096,
      enabled: true,
      capabilities: ['general_ai', 'fast_chat'],
      costPer1kInput: 0.0,
      costPer1kOutput: 0.0,
      averageLatencyMs: 150,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: AIModel) => {
    setEditingModel(m);
    setFormData({
      modelIdentifier: m.modelIdentifier,
      displayName: m.displayName,
      providerId: m.providerId,
      status: m.status,
      contextWindow: m.contextWindow,
      maxOutputTokens: m.maxOutputTokens,
      enabled: m.enabled,
      capabilities: m.capabilities,
      costPer1kInput: m.costPer1kInput,
      costPer1kOutput: m.costPer1kOutput,
      averageLatencyMs: m.averageLatencyMs,
      description: m.description
    });
    setIsModalOpen(true);
  };

  const toggleCapability = (capId: string) => {
    if (formData.capabilities.includes(capId)) {
      setFormData({
        ...formData,
        capabilities: formData.capabilities.filter(c => c !== capId)
      });
    } else {
      setFormData({
        ...formData,
        capabilities: [...formData.capabilities, capId]
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelIdentifier.trim()) return;

    if (editingModel) {
      onUpdateModel(editingModel.id, formData);
    } else {
      onAddModel(formData);
    }
    setIsModalOpen(false);
  };

  const filteredModels = models.filter(m => {
    const matchesSearch =
      m.modelIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.capabilities.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesProvider =
      selectedProviderFilter === 'all' || m.providerId === selectedProviderFilter;
    return matchesSearch && matchesProvider;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Model Registry & Catalog
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Provider-Decoupled Matrix
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-0.5">
            Manage models separately from providers, map capabilities, token contexts, pricing, and latency benchmarks.
          </p>
        </div>

        <button
          id="btn-register-model"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register New Model</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded bg-[#141414] border border-[#222222] text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search models, identifiers, capabilities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#666666]" />
          <span className="text-[#888888]">Filter by Provider:</span>
          <select
            value={selectedProviderFilter}
            onChange={e => setSelectedProviderFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="all">All Providers ({models.length})</option>
            {providers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-[#141414] border border-[#222222] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#222222] bg-[#141414] text-[#666666] font-bold font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">MODEL / IDENTIFIER</th>
                <th className="py-3 px-4">PROVIDER</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">CONTEXT</th>
                <th className="py-3 px-4">CAPABILITIES</th>
                <th className="py-3 px-4">COST / 1K</th>
                <th className="py-3 px-4">ENABLED</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a] font-mono">
              {filteredModels.map(model => {
                const provider = providers.find(p => p.id === model.providerId);
                return (
                  <tr
                    key={model.id}
                    className="hover:bg-[#1a1a1a] transition-colors group cursor-pointer"
                    onClick={() => handleOpenEdit(model)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white group-hover:text-blue-400 transition-colors font-sans">
                        {model.displayName}
                      </div>
                      <div className="text-[10px] text-[#666666] mt-0.5">
                        {model.modelIdentifier}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 text-[#888888]">
                        <Server className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-white">{provider?.name || 'Unknown Provider'}</span>
                      </div>
                      <div className="text-[10px] text-[#666666] uppercase">
                        {provider?.type}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-green-500 font-mono text-[11px] flex items-center gap-1">
                        <span>●</span>
                        <span>{model.status.toUpperCase()}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#888888]">
                      <div>{(model.contextWindow / 1024).toFixed(0)}K tokens</div>
                      <div className="text-[10px] text-[#666666]">Max: {model.maxOutputTokens} out</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {model.capabilities.slice(0, 3).map(cap => (
                          <span
                            key={cap}
                            className="px-1.5 py-0.5 rounded bg-[#0a0a0a] text-blue-300 text-[10px] border border-[#222222]"
                          >
                            {cap}
                          </span>
                        ))}
                        {model.capabilities.length > 3 && (
                          <span className="text-[10px] text-[#666666] self-center">
                            +{model.capabilities.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-[#888888]">
                      {model.costPer1kInput === 0 ? (
                        <span className="text-green-400 font-semibold">Free (Local)</span>
                      ) : (
                        <div>
                          <span>${model.costPer1kInput.toFixed(4)} in</span>
                          <div className="text-[10px] text-[#666666]">
                            ${model.costPer1kOutput.toFixed(4)} out
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          model.enabled
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-[#1a1a1a] text-[#666666]'
                        }`}
                      >
                        {model.enabled ? 'YES' : 'NO'}
                      </span>
                    </td>

                    <td
                      className="py-3 px-4 text-right space-x-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenEdit(model)}
                        className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                        title="Configure Model"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteModel(model.id)}
                        className="p-1 rounded text-[#888888] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove Model"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Model Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111111] border border-[#222222] rounded max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#e5e5e5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingModel ? `Configure Model: ${editingModel.displayName}` : 'Register New AI Model'}
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
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Qwen 3.6 (16K Context)"
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Target Provider
                  </label>
                  <select
                    value={formData.providerId}
                    onChange={e => setFormData({ ...formData, providerId: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  Model Identifier (API Parameter)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. qwen3.6:16k or llama-3.3-70b-versatile or gemini-2.5-flash"
                  value={formData.modelIdentifier}
                  onChange={e => setFormData({ ...formData, modelIdentifier: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Context Window (tokens)
                  </label>
                  <input
                    type="number"
                    step="1024"
                    value={formData.contextWindow}
                    onChange={e => setFormData({ ...formData, contextWindow: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Max Output Tokens
                  </label>
                  <input
                    type="number"
                    step="512"
                    value={formData.maxOutputTokens}
                    onChange={e => setFormData({ ...formData, maxOutputTokens: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Cost per 1K Input ($)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.costPer1kInput}
                    onChange={e => setFormData({ ...formData, costPer1kInput: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Cost per 1K Output ($)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.costPer1kOutput}
                    onChange={e => setFormData({ ...formData, costPer1kOutput: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Capabilities Tags */}
              <div>
                <label className="block text-[#888888] font-semibold mb-1.5 font-mono text-[11px]">
                  Supported Capabilities
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableCapabilities.map(cap => {
                    const isSelected = formData.capabilities.includes(cap.id);
                    return (
                      <button
                        type="button"
                        key={cap.id}
                        onClick={() => toggleCapability(cap.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                          isSelected
                            ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                            : 'bg-[#0a0a0a] text-[#888888] border-[#222222] hover:border-[#333333]'
                        }`}
                      >
                        {cap.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-model-enabled"
                  checked={formData.enabled}
                  onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 bg-[#0a0a0a] border-[#222222] focus:ring-0"
                />
                <label htmlFor="chk-model-enabled" className="text-white font-semibold cursor-pointer">
                  Enable Model for Intelligent Routing Fallback
                </label>
              </div>

              <div>
                <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500"
                />
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
                  {editingModel ? 'Update Model' : 'Save Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
