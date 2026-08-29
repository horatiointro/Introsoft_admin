import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Lock,
  Unlock,
  Shield,
  Clock,
  Globe,
  AppWindow,
  X,
  AlertTriangle
} from 'lucide-react';
import { ApiKey, Application } from '../types';

interface ApiKeysViewProps {
  apiKeys: ApiKey[];
  applications: Application[];
  onAddApiKey: (keyData: Partial<ApiKey>) => void;
  onRevokeApiKey: (id: string) => void;
  onDeleteApiKey: (id: string) => void;
}

export const ApiKeysView: React.FC<ApiKeysViewProps> = ({
  apiKeys,
  applications,
  onAddApiKey,
  onRevokeApiKey,
  onDeleteApiKey
}) => {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    appId: applications[0]?.id || '',
    name: 'Production Ingress Token',
    rateLimitRpm: 120,
    expiresInDays: 365,
    ipWhitelistRaw: '',
    scopes: ['read:inference', 'read:models']
  });

  const handleCopy = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const rawKey = `ALTIL-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + Number(formData.expiresInDays));

    const ipList = formData.ipWhitelistRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    onAddApiKey({
      appId: formData.appId,
      name: formData.name,
      key: rawKey,
      prefix: `${rawKey.slice(0, 10)}...${rawKey.slice(-4)}`,
      status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      expiresAt: formData.expiresInDays > 0 ? expiresDate.toISOString().replace('T', ' ').slice(0, 19) : null,
      rateLimitRpm: Number(formData.rateLimitRpm),
      ipWhitelist: ipList,
      scopes: formData.scopes
    });

    setNewlyCreatedKey(rawKey);
  };

  const availableScopes = [
    { id: 'read:inference', label: 'Inference Access (ALTIL API)' },
    { id: 'read:models', label: 'Models Discovery & Status' },
    { id: 'read:capabilities', label: 'Capabilities Catalog Query' },
    { id: 'write:telemetry', label: 'Telemetry & Logging Egress' }
  ];

  const toggleScope = (scopeId: string) => {
    if (formData.scopes.includes(scopeId)) {
      setFormData({
        ...formData,
        scopes: formData.scopes.filter(s => s !== scopeId)
      });
    } else {
      setFormData({
        ...formData,
        scopes: [...formData.scopes, scopeId]
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              API Keys & Authentication Tokens
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Layer 2 • Access Control
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-0.5">
            Issue and revoke cryptographically scoped ALTIL keys for consuming applications with rate limits and IP filters.
          </p>
        </div>

        <button
          id="btn-generate-api-key"
          onClick={() => {
            setNewlyCreatedKey(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* Keys Table */}
      <div className="bg-[#141414] border border-[#222222] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#222222] bg-[#141414] text-[#666666] font-bold font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">APPLICATION</th>
                <th className="py-3 px-4">TOKEN IDENTIFIER / PREFIX</th>
                <th className="py-3 px-4">CREATED</th>
                <th className="py-3 px-4">RATE LIMIT</th>
                <th className="py-3 px-4">IP RESTRICTIONS</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a] font-mono">
              {apiKeys.map(k => {
                const app = applications.find(a => a.id === k.appId);
                const isRevoked = k.status === 'revoked' || k.status === 'expired';
                return (
                  <tr
                    key={k.id}
                    className={`transition-colors ${
                      isRevoked ? 'bg-[#0d0d0d] opacity-60' : 'hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5 font-sans">
                        <AppWindow className="w-3.5 h-3.5 text-blue-400" />
                        <span>{app?.name || 'Unassigned Application'}</span>
                      </div>
                      <div className="text-[10px] text-[#666666] mt-0.5">
                        {k.name}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2 text-blue-300 font-semibold text-[11px]">
                        <span>{k.prefix}</span>
                        <button
                          onClick={() => handleCopy(k.key, k.id)}
                          className="p-1 rounded hover:bg-[#1a1a1a] text-[#666666] hover:text-white transition-colors"
                          title="Copy Full Token"
                        >
                          {copiedKeyId === k.id ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#666666] text-[11px] whitespace-nowrap">
                      {k.createdAt.slice(0, 10)}
                    </td>

                    <td className="py-3 px-4 text-[#888888]">
                      {k.rateLimitRpm} RPM
                    </td>

                    <td className="py-3 px-4">
                      {k.ipWhitelist && k.ipWhitelist.length > 0 ? (
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {k.ipWhitelist.map(ip => (
                            <span
                              key={ip}
                              className="px-1.5 py-0.5 rounded bg-[#0a0a0a] text-[#888888] border border-[#222222]"
                            >
                              {ip}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#666666]">Any IP Allowed</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono flex items-center gap-1 ${
                          k.status === 'active' ? 'text-green-500' : 'text-red-400'
                        }`}
                      >
                        <span>●</span>
                        <span>{k.status.toUpperCase()}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      {k.status === 'active' ? (
                        <button
                          onClick={() => onRevokeApiKey(k.id)}
                          className="px-2 py-0.5 rounded bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-semibold border border-red-500/20 transition-colors inline-flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onDeleteApiKey(k.id)}
                          className="p-1 rounded text-[#666666] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate API Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111111] border border-[#222222] rounded max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#e5e5e5]">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-400" />
                {newlyCreatedKey ? 'New API Key Provisioned' : 'Generate Application API Key'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {newlyCreatedKey ? (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded bg-green-500/5 border border-green-500/20 text-green-300 text-xs leading-relaxed font-mono">
                  <strong>API Key generated successfully!</strong> Store this key securely. Consuming applications will use this token in HTTP Authorization headers.
                </div>

                <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222] font-mono text-xs text-blue-300 flex items-center justify-between break-all">
                  <span>{newlyCreatedKey}</span>
                  <button
                    onClick={() => handleCopy(newlyCreatedKey, 'new-key')}
                    className="ml-3 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold shrink-0"
                  >
                    {copiedKeyId === 'new-key' ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>

                <div className="pt-2 border-t border-[#222222] flex justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded bg-[#1a1a1a] hover:bg-[#222222] text-white text-xs font-bold border border-[#222222]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Select Target Application
                  </label>
                  <select
                    value={formData.appId}
                    onChange={e => setFormData({ ...formData, appId: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.name} ({app.appIdentifier})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    Key Label / Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Introsoft Web Ingress Key"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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

                  <div>
                    <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                      Expiration (Days)
                    </label>
                    <input
                      type="number"
                      value={formData.expiresInDays}
                      onChange={e => setFormData({ ...formData, expiresInDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1 font-mono text-[11px]">
                    IP Whitelist / CIDR (Optional, comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10.0.0.0/16, 192.168.1.50"
                    value={formData.ipWhitelistRaw}
                    onChange={e => setFormData({ ...formData, ipWhitelistRaw: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#222222] text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-[#888888] font-semibold mb-1.5 font-mono text-[11px]">
                    Authorized Scopes
                  </label>
                  <div className="space-y-1.5">
                    {availableScopes.map(scope => {
                      const isChecked = formData.scopes.includes(scope.id);
                      return (
                        <label
                          key={scope.id}
                          className="flex items-center space-x-2 p-2 rounded bg-[#0a0a0a] border border-[#222222] cursor-pointer text-[#e5e5e5]"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleScope(scope.id)}
                            className="w-4 h-4 rounded text-blue-600 bg-[#141414] border-[#222222]"
                          />
                          <span className="font-mono text-[11px] text-white">{scope.label}</span>
                        </label>
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
                    Generate Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
