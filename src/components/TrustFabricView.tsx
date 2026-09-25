import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Key,
  Smartphone,
  Users,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ExternalLink,
  Search,
  Check,
  X,
  Cpu,
  Link as LinkIcon
} from 'lucide-react';

interface TenantRecord {
  id: string;
  name: string;
  domain?: string;
  status: string;
  planId?: string;
  createdAt: string;
}

interface PrincipalRecord {
  id: string;
  tenantId: string;
  principalType: string;
  displayName: string;
  status: string;
}

interface IdentityRecord {
  id: string;
  principalId: string;
  altilId: string;
  createdAt: string;
}

interface DeviceRecord {
  id: string;
  identityId: string;
  deviceFingerprintHash: string;
  secureEnclaveStatus: string;
  trustLevel: string;
  registeredAt: string;
}

interface CredentialRecord {
  id: string;
  tenantId: string;
  principalId: string;
  credentialType: string;
  keyPrefix: string;
  scopes: string[];
  status: string;
  createdAt: string;
}

interface EvidenceRecord {
  eventId: string;
  eventType: string;
  tenantId: string;
  action: string;
  timestamp: string;
  previousEventHash: string;
  eventHash: string;
}

export function TrustFabricView() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'identities' | 'devices' | 'credentials' | 'evidence'>('tenants');
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [principals, setPrincipals] = useState<PrincipalRecord[]>([]);
  const [identities, setIdentities] = useState<IdentityRecord[]>([]);
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // New item modals
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantDomain, setNewTenantDomain] = useState('');

  const [showCredModal, setShowCredModal] = useState(false);
  const [newCredTenantId, setNewCredTenantId] = useState('tenant-enterprise-1');
  const [newCredPrincipalId, setNewCredPrincipalId] = useState('prin-1');
  const [newCredType, setNewCredType] = useState('APPLICATION_API_KEY');
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  useEffect(() => {
    fetchAllTrustData();
  }, []);

  const fetchAllTrustData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes, iRes, dRes, cRes, eRes] = await Promise.all([
        fetch('/api/v1/trust/tenants').then(r => r.json()),
        fetch('/api/v1/trust/principals').then(r => r.json()),
        fetch('/api/v1/trust/identities').then(r => r.json()),
        fetch('/api/v1/trust/devices').then(r => r.json()),
        fetch('/api/v1/trust/credentials').then(r => r.json()),
        fetch('/api/v1/trust/evidence').then(r => r.json()),
      ]);
      setTenants(Array.isArray(tRes) ? tRes : []);
      setPrincipals(Array.isArray(pRes) ? pRes : []);
      setIdentities(Array.isArray(iRes) ? iRes : []);
      setDevices(Array.isArray(dRes) ? dRes : []);
      setCredentials(Array.isArray(cRes) ? cRes : []);
      setEvidence(Array.isArray(eRes) ? eRes : []);
    } catch (err) {
      console.error('Failed to load trust fabric data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/trust/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTenantName, domain: newTenantDomain })
      });
      const data = await res.json();
      if (res.ok) {
        setTenants(prev => [data, ...prev]);
        setShowTenantModal(false);
        setNewTenantName('');
        setNewTenantDomain('');
      }
    } catch (err) {
      console.error('Failed to create tenant:', err);
    }
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/trust/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: newCredTenantId, principalId: newCredPrincipalId, credentialType: newCredType })
      });
      const data = await res.json();
      if (res.ok) {
        setCredentials(prev => [data.credential, ...prev]);
        setCreatedRawKey(data.rawApiKey);
      }
    } catch (err) {
      console.error('Failed to create credential:', err);
    }
  };

  return (
    <div className="space-y-6 text-[#e5e5e5]">
      {/* Header Banner */}
      <div className="p-6 rounded-lg bg-[#141414] border border-[#222222] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold tracking-wider uppercase">
              ALTIL Trust Fabric & Identity Layer
            </span>
            <span className="text-xs font-mono text-[#777]">Zero-Trust Cryptographic Control Plane</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>Identity, Device Attestation & Tamper-Evident Evidence</span>
          </h1>
          <p className="text-xs text-[#888888] mt-1 max-w-3xl">
            Enforces strict cryptographic tenant isolation, principal identity resolution, hardware enclave device binding, and append-only tamper-evident audit chains under POPIA and GDPR mandates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllTrustData}
            className="px-3 py-2 rounded bg-[#222] hover:bg-[#333] text-[#aaa] hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Ledger</span>
          </button>
          <button
            onClick={() => setShowTenantModal(true)}
            className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Tenant</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#222] pb-3 overflow-x-auto">
        {[
          { id: 'tenants', label: `Tenants (${tenants.length})`, icon: Building2 },
          { id: 'identities', label: `Identities (${identities.length})`, icon: Users },
          { id: 'devices', label: `Bound Devices (${devices.length})`, icon: Smartphone },
          { id: 'credentials', label: `Credentials (${credentials.length})`, icon: Key },
          { id: 'evidence', label: `Evidence Chain (${evidence.length})`, icon: LinkIcon }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'bg-[#141414] text-[#888] hover:text-white border border-[#222]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tenants.map(t => (
              <div key={t.id} className="p-5 rounded bg-[#141414] border border-[#222] space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    {t.status}
                  </span>
                  <span className="text-[11px] font-mono text-[#777]">{t.id}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t.name}</h3>
                  <p className="text-xs font-mono text-emerald-400 mt-0.5">{t.domain || 'No custom domain'}</p>
                </div>
                <div className="pt-2 border-t border-[#222] flex items-center justify-between text-[11px] font-mono text-[#888]">
                  <span>Plan: {t.planId || 'Enterprise'}</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'identities' && (
        <div className="p-5 rounded bg-[#141414] border border-[#222] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Universal ALTIL Identities & Principals</span>
            </h3>
            <span className="text-xs font-mono text-[#777]">Immutable Identifier Registry</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#777] border-b border-[#222]">
                  <th className="py-2.5 px-3">ALTIL Identifier</th>
                  <th className="py-2.5 px-3">Principal ID</th>
                  <th className="py-2.5 px-3">Created Timestamp</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {identities.map(id => (
                  <tr key={id.id} className="hover:bg-[#161616]">
                    <td className="py-3 px-3 text-emerald-400 font-bold">{id.altilId}</td>
                    <td className="py-3 px-3 text-[#ccc]">{id.principalId}</td>
                    <td className="py-3 px-3 text-[#888]">{new Date(id.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="p-5 rounded bg-[#141414] border border-[#222] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Bound Mobile & Hardware Enclave Devices</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400">Cryptographically Attested</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map(d => (
              <div key={d.id} className="p-4 rounded bg-[#0d0d0d] border border-[#222] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {d.trustLevel}
                  </span>
                  <span className="text-[11px] font-mono text-[#777]">{d.id}</span>
                </div>
                <div className="text-xs font-mono text-white">Fingerprint: {d.deviceFingerprintHash}</div>
                <div className="text-xs font-mono text-[#888]">Enclave: {d.secureEnclaveStatus}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'credentials' && (
        <div className="p-5 rounded bg-[#141414] border border-[#222] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Enterprise Credentials & Bearer Tokens</span>
            </h3>
            <button
              onClick={() => setShowCredModal(true)}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold"
            >
              Issue Credential
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#777] border-b border-[#222]">
                  <th className="py-2.5 px-3">Credential Type</th>
                  <th className="py-2.5 px-3">Key Prefix</th>
                  <th className="py-2.5 px-3">Tenant ID</th>
                  <th className="py-2.5 px-3">Scopes</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {credentials.map(c => (
                  <tr key={c.id} className="hover:bg-[#161616]">
                    <td className="py-3 px-3 text-white font-bold">{c.credentialType}</td>
                    <td className="py-3 px-3 text-emerald-400 font-mono">{c.keyPrefix}...</td>
                    <td className="py-3 px-3 text-[#ccc]">{c.tenantId}</td>
                    <td className="py-3 px-3 text-[#888]">{c.scopes.join(', ')}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="p-5 rounded bg-[#141414] border border-[#222] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-emerald-400" />
              <span>Tamper-Evident Cryptographic Evidence Chain</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400">Append-Only SHA-256 Hash Chain</span>
          </div>
          <div className="space-y-3">
            {evidence.map((ev, idx) => (
              <div key={ev.eventId} className="p-4 rounded bg-[#0d0d0d] border border-[#222] font-mono text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                      #{evidence.length - idx} {ev.eventType}
                    </span>
                    <span className="text-[#888]">{ev.eventId}</span>
                  </div>
                  <span className="text-[#777]">{new Date(ev.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-white">Action: <span className="text-emerald-400 font-bold">{ev.action}</span> (Tenant: {ev.tenantId})</div>
                <div className="text-[10px] text-[#777] truncate">Prev Hash: {ev.previousEventHash}</div>
                <div className="text-[10px] text-emerald-500/80 truncate">Event Hash: {ev.eventHash}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onboard Tenant Modal */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#111] border border-[#222] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Onboard New Enterprise Tenant</span>
              </h3>
              <button onClick={() => setShowTenantModal(false)} className="text-[#888] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#aaa] mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={e => setNewTenantName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Capitec Bank Ltd"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#aaa] mb-1">Corporate Domain</label>
                <input
                  type="text"
                  value={newTenantDomain}
                  onChange={e => setNewTenantDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="capitec.co.za"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTenantModal(false)}
                  className="px-3 py-1.5 rounded bg-[#222] text-[#aaa] hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono"
                >
                  Create Tenant & Identity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Credential Modal */}
      {showCredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#111] border border-[#222] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Issue Cryptographic Bearer Credential</span>
              </h3>
              <button onClick={() => { setShowCredModal(false); setCreatedRawKey(null); }} className="text-[#888] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {createdRawKey ? (
              <div className="space-y-4">
                <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                  Credential successfully generated! Copy this secret now — it will not be shown again.
                </div>
                <div className="p-3 rounded bg-[#0a0a0a] border border-[#333] text-white font-mono text-xs select-all break-all">
                  {createdRawKey}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => { setShowCredModal(false); setCreatedRawKey(null); }}
                    className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateCredential} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#aaa] mb-1">Target Tenant ID</label>
                  <input
                    type="text"
                    value={newCredTenantId}
                    onChange={e => setNewCredTenantId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#aaa] mb-1">Principal ID</label>
                  <input
                    type="text"
                    value={newCredPrincipalId}
                    onChange={e => setNewCredPrincipalId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#aaa] mb-1">Credential Type</label>
                  <select
                    value={newCredType}
                    onChange={e => setNewCredType(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="APPLICATION_API_KEY">APPLICATION_API_KEY</option>
                    <option value="USER_CREDENTIAL">USER_CREDENTIAL</option>
                    <option value="DEVICE_CREDENTIAL">DEVICE_CREDENTIAL</option>
                    <option value="SERVICE_CREDENTIAL">SERVICE_CREDENTIAL</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCredModal(false)}
                    className="px-3 py-1.5 rounded bg-[#222] text-[#aaa] hover:text-white text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono"
                  >
                    Generate Bearer Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
