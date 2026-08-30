import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Lock,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Key,
  Globe,
  Sliders,
  Check,
  Download,
  Upload,
  UserCheck,
  UserX,
  LogIn,
  Eye,
  Shield
} from 'lucide-react';
import { IamUser, IamRole, Customer } from '../types';

export const PERMISSION_CATALOG = [
  { category: 'Tenant Governance', id: 'tenant.read', label: 'View Tenant Profile & Metrics' },
  { category: 'Tenant Governance', id: 'tenant.write', label: 'Create & Update Tenants' },
  { category: 'Tenant Governance', id: 'tenant.delete', label: 'Delete Tenant Account' },
  { category: 'Tenant Governance', id: 'tenant.offboard', label: 'Execute Offboarding Wizard' },

  { category: 'API Ingress & Keys', id: 'apikeys.read', label: 'View API Key Hashes' },
  { category: 'API Ingress & Keys', id: 'apikeys.create', label: 'Generate New API Keys' },
  { category: 'API Ingress & Keys', id: 'apikeys.revoke', label: 'Revoke Ingress API Keys' },

  { category: 'AI Models & Router', id: 'models.read', label: 'View Model Performance' },
  { category: 'AI Models & Router', id: 'models.configure', label: 'Update Fallbacks & Model Config' },
  { category: 'AI Models & Router', id: 'routing.edit', label: 'Modify Load Balancing Rules' },

  { category: 'Policy & Guardrails', id: 'policies.read', label: 'View Guardrails & Rules' },
  { category: 'Policy & Guardrails', id: 'policies.write', label: 'Modify POPIA/GDPR Filters' },
  { category: 'Policy & Guardrails', id: 'popia.audit', label: 'Access Statutory Officer Audits' },

  { category: 'FinOps & Billing', id: 'billing.read', label: 'View Spend & Token Usage' },
  { category: 'FinOps & Billing', id: 'billing.write', label: 'Modify Budget Caps & Quotas' },
  { category: 'FinOps & Billing', id: 'invoices.download', label: 'Download Itemized Invoices' },

  { category: 'SecOps & Audit', id: 'security.read', label: 'View Threat Alerts & SOC Logs' },
  { category: 'SecOps & Audit', id: 'security.write', label: 'Execute Mitigation Playbooks' },
  { category: 'SecOps & Audit', id: 'audit.read', label: 'View Activity Audit Trail' },
  { category: 'SecOps & Audit', id: 'audit.export', label: 'Export Compliance Audits' },

  { category: 'IAM Administration', id: 'iam.users.read', label: 'View User Directory' },
  { category: 'IAM Administration', id: 'iam.users.write', label: 'Provision & Edit Users' },
  { category: 'IAM Administration', id: 'iam.roles.write', label: 'Create & Modify Custom Roles' },
  { category: 'IAM Administration', id: 'iam.mfa.force', label: 'Enforce MFA & Revoke Tokens' }
];

interface IamAdminViewProps {
  users: IamUser[];
  roles: IamRole[];
  customers?: Customer[];
  onAddUser?: (user: IamUser) => void;
  onUpdateUser?: (id: string, updates: Partial<IamUser>) => void;
  onDeleteUser?: (id: string) => void;
  onAddRole?: (role: IamRole) => void;
  onUpdateRole?: (id: string, updates: Partial<IamRole>) => void;
  onDeleteRole?: (id: string) => void;
}

export const IamAdminView: React.FC<IamAdminViewProps> = ({
  users,
  roles,
  customers = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddRole,
  onUpdateRole,
  onDeleteRole
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'security_policies' | 'audit_log'>('users');

  // User Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modals state
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [editUserModal, setEditUserModal] = useState<IamUser | null>(null);
  const [userSecurityModal, setUserSecurityModal] = useState<IamUser | null>(null);
  const [offboardUserModal, setOffboardUserModal] = useState<IamUser | null>(null);
  const [roleModal, setRoleModal] = useState<IamRole | null | 'new'>(null);

  // Form States for Provision User
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('AI Platform Engineering');
  const [newUserDesignation, setNewUserDesignation] = useState('Senior Platform Specialist');
  const [newUserTenantId, setNewUserTenantId] = useState('system');
  const [newUserRoleId, setNewUserRoleId] = useState(roles[0]?.id || 'role-plat-admin');
  const [newUserAuthMethod, setNewUserAuthMethod] = useState<'sso_saml' | 'oauth_google' | 'mfa_password' | 'fido2_webauthn'>('sso_saml');
  const [newUserMfaEnabled, setNewUserMfaEnabled] = useState(true);
  const [newUserIpWhitelist, setNewUserIpWhitelist] = useState('');

  // Form State for Role Builder Modal
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormDesc, setRoleFormDesc] = useState('');
  const [roleFormIsSystem, setRoleFormIsSystem] = useState(false);
  const [roleFormPermissions, setRoleFormPermissions] = useState<string[]>([]);

  // Offboard User Form State
  const [offboardAction, setOffboardAction] = useState<'suspend' | 'lock' | 'offboarded'>('offboarded');
  const [offboardReason, setOffboardReason] = useState('Employee departure / enterprise role transition compliance revocation');
  const [offboardRevokeTokens, setOffboardRevokeTokens] = useState(true);
  const [offboardCertJson, setOffboardCertJson] = useState<string | null>(null);

  // Security Policy Toggles State
  const [mfaEnforcementMode, setMfaEnforcementMode] = useState<'mandatory_all' | 'admins_only' | 'optional'>('mandatory_all');
  const [minPasswordLength, setMinPasswordLength] = useState(14);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(30);
  const [maxFailedLogins, setMaxFailedLogins] = useState(5);

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTenant =
      selectedTenantFilter === 'all'
        ? true
        : selectedTenantFilter === 'system'
        ? !u.tenantId
        : u.tenantId === selectedTenantFilter;

    const matchesStatus =
      selectedStatusFilter === 'all' ? true : u.status === selectedStatusFilter;

    const matchesRole =
      selectedRoleFilter === 'all' ? true : u.roleId === selectedRoleFilter;

    return matchesSearch && matchesTenant && matchesStatus && matchesRole;
  });

  // Calculate Metrics
  const activeCount = users.filter(u => u.status === 'active').length;
  const mfaEnforcedCount = users.filter(u => u.mfaEnabled).length;
  const mfaPercent = Math.round((mfaEnforcedCount / (users.length || 1)) * 100);
  const systemUsersCount = users.filter(u => !u.tenantId).length;
  const tenantUsersCount = users.filter(u => u.tenantId).length;

  // Handle Provisioning New User
  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const tenantObj = customers.find(c => c.id === newUserTenantId);
    const roleObj = roles.find(r => r.id === newUserRoleId);

    const userObj: IamUser = {
      id: `usr-${Date.now().toString(36)}`,
      name: newUserName,
      email: newUserEmail,
      department: newUserDept,
      designation: newUserDesignation,
      roleId: newUserRoleId,
      roleName: roleObj ? roleObj.name : 'Custom Role',
      tenantId: newUserTenantId === 'system' ? undefined : newUserTenantId,
      tenantName: newUserTenantId === 'system' ? 'System Administrator Level' : tenantObj?.name,
      status: 'active',
      mfaEnabled: newUserMfaEnabled,
      authMethod: newUserAuthMethod,
      lastLogin: 'Never (Pending First Login)',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipWhitelist: newUserIpWhitelist ? newUserIpWhitelist.split(',').map(s => s.trim()) : undefined
    };

    if (onAddUser) onAddUser(userObj);

    setProvisionModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  // Handle Save Role
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormName) return;

    if (roleModal === 'new') {
      const newRole: IamRole = {
        id: `role-${Date.now().toString(36)}`,
        name: roleFormName,
        description: roleFormDesc,
        isSystemRole: roleFormIsSystem,
        permissions: roleFormPermissions,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 10)
      };
      if (onAddRole) onAddRole(newRole);
    } else if (roleModal && typeof roleModal === 'object') {
      if (onUpdateRole) {
        onUpdateRole(roleModal.id, {
          name: roleFormName,
          description: roleFormDesc,
          isSystemRole: roleFormIsSystem,
          permissions: roleFormPermissions
        });
      }
    }

    setRoleModal(null);
  };

  // Handle Execute Offboarding
  const handleExecuteUserOffboarding = () => {
    if (!offboardUserModal) return;

    const cert = {
      certificateId: `ALTIL-IAM-OFFBOARD-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      userId: offboardUserModal.id,
      userName: offboardUserModal.name,
      userEmail: offboardUserModal.email,
      department: offboardUserModal.department,
      tenantName: offboardUserModal.tenantName || 'System Platform Level',
      executedStatus: offboardAction,
      revocationRationale: offboardReason,
      sessionsRevoked: offboardRevokeTokens,
      certifiedBy: "ALTIL IAM Enterprise Governance Engine"
    };

    if (onUpdateUser) {
      onUpdateUser(offboardUserModal.id, {
        status: offboardAction as any,
        sessionTokenRevokedAt: new Date().toISOString(),
        offboardedAt: new Date().toISOString(),
        offboardedReason: offboardReason
      });
    }

    setOffboardCertJson(JSON.stringify(cert, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Ribbon */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                Zero-Trust Multi-Tenant IAM
              </span>
              <span className="text-xs text-emerald-400 font-mono font-medium">SAM / SSO Enterprise OAuth Directory</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Identity & Access Management (IAM) Directory</h1>
            <p className="text-xs text-[#888888] mt-0.5">
              Manage platform administrators, tenant operators, statutory Information Officers, granular RBAC permissions, and automated user lifecycle offboarding.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const dataStr = JSON.stringify({ users, roles }, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ALTIL-IAM-Directory-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2c2c2c] text-xs font-semibold text-[#cccccc] hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export IAM Directory</span>
            </button>

            <button
              onClick={() => {
                setRoleFormName('');
                setRoleFormDesc('');
                setRoleFormIsSystem(false);
                setRoleFormPermissions(['tenant.read', 'apikeys.read', 'audit.read']);
                setRoleModal('new');
              }}
              className="px-3.5 py-2 rounded bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Create Custom Role</span>
            </button>

            <button
              onClick={() => {
                setNewUserName('');
                setNewUserEmail('');
                setProvisionModalOpen(true);
              }}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision New User</span>
            </button>
          </div>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-[#222222]">
          <div className="bg-[#161616] border border-[#222222] rounded p-3 space-y-1">
            <div className="text-xs text-[#888888] flex items-center justify-between">
              <span>Total Provisioned Users</span>
              <Users className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{users.length}</div>
            <div className="text-[10px] text-[#666666] font-mono">
              {systemUsersCount} System | {tenantUsersCount} Tenant Users
            </div>
          </div>

          <div className="bg-[#161616] border border-[#222222] rounded p-3 space-y-1">
            <div className="text-xs text-[#888888] flex items-center justify-between">
              <span>Active Active Identity Rate</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{activeCount}</div>
            <div className="text-[10px] text-emerald-500/80 font-mono">
              {Math.round((activeCount / (users.length || 1)) * 100)}% Operational Readiness
            </div>
          </div>

          <div className="bg-[#161616] border border-[#222222] rounded p-3 space-y-1">
            <div className="text-xs text-[#888888] flex items-center justify-between">
              <span>MFA Enforced Rate</span>
              <Lock className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400 font-mono">{mfaPercent}%</div>
            <div className="text-[10px] text-purple-400/80 font-mono">{mfaEnforcedCount} / {users.length} Users Guarded</div>
          </div>

          <div className="bg-[#161616] border border-[#222222] rounded p-3 space-y-1">
            <div className="text-xs text-[#888888] flex items-center justify-between">
              <span>RBAC Roles Matrix</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{roles.length}</div>
            <div className="text-[10px] text-[#666666] font-mono">
              {roles.filter(r => r.isSystemRole).length} System | {roles.filter(r => !r.isSystemRole).length} Custom
            </div>
          </div>

          <div className="bg-[#161616] border border-[#222222] rounded p-3 space-y-1">
            <div className="text-xs text-[#888888] flex items-center justify-between">
              <span>Auth Strategy Status</span>
              <Globe className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xs font-bold text-amber-300 font-mono uppercase mt-1">
              SSO SAML + TOTP
            </div>
            <div className="text-[10px] text-amber-500/80 font-mono">Enterprise Okta / Entra Ready</div>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center space-x-1 border-b border-[#222222] pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded transition-all flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20'
              : 'text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Identity Directory ({filteredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3.5 py-2 rounded transition-all flex items-center gap-1.5 ${
            activeTab === 'roles'
              ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/20'
              : 'text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RBAC Roles & Matrix ({roles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security_policies')}
          className={`px-3.5 py-2 rounded transition-all flex items-center gap-1.5 ${
            activeTab === 'security_policies'
              ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20'
              : 'text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Auth Enforcer</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_log')}
          className={`px-3.5 py-2 rounded transition-all flex items-center gap-1.5 ${
            activeTab === 'audit_log'
              ? 'bg-amber-600 text-white font-bold shadow-lg shadow-amber-600/20'
              : 'text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>IAM Event Audit Trail</span>
        </button>
      </div>

      {/* SUBTAB 1: USER IDENTITY DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filter Ribbon */}
          <div className="bg-[#111111] border border-[#222222] rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by user name, email address, or department..."
                className="w-full bg-[#181818] border border-[#282828] rounded pl-9 pr-3 py-1.5 text-white placeholder-[#555555] outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-[#161616] border border-[#282828] rounded px-2 py-1">
                <Filter className="w-3 h-3 text-[#777777]" />
                <span className="text-[#888888] font-mono">Tenant:</span>
                <select
                  value={selectedTenantFilter}
                  onChange={e => setSelectedTenantFilter(e.target.value)}
                  className="bg-transparent text-white font-mono outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#161616]">All Tenants & System</option>
                  <option value="system" className="bg-[#161616]">System Platform Level</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#161616]">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1 bg-[#161616] border border-[#282828] rounded px-2 py-1">
                <span className="text-[#888888] font-mono">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  className="bg-transparent text-white font-mono outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#161616]">All Statuses</option>
                  <option value="active" className="bg-[#161616]">Active</option>
                  <option value="inactive" className="bg-[#161616]">Inactive</option>
                  <option value="locked" className="bg-[#161616]">Locked</option>
                  <option value="suspended" className="bg-[#161616]">Suspended</option>
                  <option value="offboarded" className="bg-[#161616]">Offboarded</option>
                </select>
              </div>

              <div className="flex items-center space-x-1 bg-[#161616] border border-[#282828] rounded px-2 py-1">
                <span className="text-[#888888] font-mono">Role:</span>
                <select
                  value={selectedRoleFilter}
                  onChange={e => setSelectedRoleFilter(e.target.value)}
                  className="bg-transparent text-white font-mono outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#161616]">All Roles</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id} className="bg-[#161616]">{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* User Directory Table */}
          <div className="bg-[#111111] border border-[#222222] rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#161616] text-[#888888] font-semibold border-b border-[#222222]">
                    <th className="p-3">User Identity</th>
                    <th className="p-3">Tenant Jurisdiction</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Auth Strategy & MFA</th>
                    <th className="p-3">Lifecycle Status</th>
                    <th className="p-3 text-right">Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f1f]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#666666]">
                        No user records found matching the specified filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      return (
                        <tr key={u.id} className="hover:bg-[#141414] transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{u.name}</span>
                              <span className="text-[10px] text-[#666666] font-mono">({u.id})</span>
                            </div>
                            <div className="text-[11px] text-[#888888] font-mono">{u.email}</div>
                            <div className="text-[10px] text-[#555555] mt-0.5">
                              {u.department} {u.designation ? `• ${u.designation}` : ''}
                            </div>
                          </td>

                          <td className="p-3">
                            {u.tenantName ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/60 inline-block">
                                  {u.tenantName}
                                </span>
                                <div className="text-[10px] text-[#666666] font-mono">{u.tenantId}</div>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800/60 inline-block">
                                System Platform Admin
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            <span className="font-bold text-purple-300 text-[11px] block">{u.roleName}</span>
                            <span className="text-[10px] text-[#666666] font-mono">ID: {u.roleId}</span>
                          </td>

                          <td className="p-3">
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1a1a1a] text-[#cccccc] border border-[#2a2a2a] inline-block">
                                {u.authMethod.replace('_', ' ')}
                              </span>

                              <div>
                                {u.mfaEnabled ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 w-fit">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    MFA Enforced
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 flex items-center gap-1 w-fit">
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                    MFA Disabled
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${
                                u.status === 'active'
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                                  : u.status === 'locked'
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                                  : u.status === 'suspended'
                                  ? 'bg-red-950/80 text-red-300 border-red-700/60'
                                  : 'bg-slate-900 text-slate-400 border-slate-700'
                              }`}
                            >
                              {u.status}
                            </span>
                            <div className="text-[10px] text-[#666666] font-mono mt-1">
                              Last Login: {u.lastLogin}
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setUserSecurityModal(u)}
                                className="p-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-cyan-400 rounded transition-colors"
                                title="Inspect Security Token & Revoke Sessions"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setEditUserModal(u)}
                                className="p-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-blue-400 rounded transition-colors"
                                title="Edit User Identity & Roles"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setOffboardUserModal(u);
                                  setOffboardCertJson(null);
                                }}
                                className="px-2 py-1 bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors"
                                title="Execute Offboarding Wizard"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Offboard</span>
                              </button>

                              {onDeleteUser && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Permanently remove user ${u.name} (${u.email}) from IAM directory?`)) {
                                      onDeleteUser(u.id);
                                    }
                                  }}
                                  className="p-1.5 bg-[#1a1a1a] hover:bg-red-950 border border-[#2a2a2a] text-[#777777] hover:text-red-400 rounded transition-colors"
                                  title="Delete User Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: RBAC ROLES & PERMISSION MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Configured System & Tenant Roles ({roles.length})
              </h2>
              <p className="text-xs text-[#888888]">
                Role-Based Access Control defines feature entitlement matrix, tenant isolation guardrails, and administrative privileges.
              </p>
            </div>

            <button
              onClick={() => {
                setRoleFormName('');
                setRoleFormDesc('');
                setRoleFormIsSystem(false);
                setRoleFormPermissions(['tenant.read', 'apikeys.read', 'audit.read']);
                setRoleModal('new');
              }}
              className="px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map(r => (
              <div key={r.id} className="bg-[#111111] border border-[#222222] rounded-lg p-4 space-y-3 flex flex-col justify-between hover:border-[#333333] transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{r.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold uppercase ${
                        r.isSystemRole
                          ? 'bg-blue-950 text-blue-300 border-blue-800/60'
                          : 'bg-purple-950 text-purple-300 border-purple-800/60'
                      }`}
                    >
                      {r.isSystemRole ? 'System Built-In' : 'Custom Role'}
                    </span>
                  </div>

                  <p className="text-xs text-[#888888] leading-relaxed">{r.description}</p>

                  <div className="pt-2">
                    <div className="text-[10px] text-[#666666] font-mono mb-1.5 uppercase font-bold">
                      Assigned Permissions ({r.permissions.length}):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {r.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-mono px-2 py-0.5 bg-[#181818] text-purple-300 rounded border border-[#262626]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1f1f1f] text-xs">
                  <span className="text-[11px] text-[#666666] font-mono">
                    Users: {users.filter(u => u.roleId === r.id).length} Active
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setRoleFormName(r.name);
                        setRoleFormDesc(r.description);
                        setRoleFormIsSystem(r.isSystemRole);
                        setRoleFormPermissions(r.permissions);
                        setRoleModal(r);
                      }}
                      className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-blue-400 rounded text-xs font-semibold transition-colors"
                    >
                      Edit Role
                    </button>

                    {!r.isSystemRole && onDeleteRole && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete custom role ${r.name}?`)) {
                            onDeleteRole(r.id);
                          }
                        }}
                        className="p-1 bg-[#1a1a1a] hover:bg-red-950 border border-[#2a2a2a] text-[#777777] hover:text-red-400 rounded transition-colors"
                        title="Delete Custom Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Visual RBAC Permission Matrix Grid */}
          <div className="bg-[#111111] border border-[#222222] rounded p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Interactive Permission Coverage Matrix
            </h3>
            <p className="text-xs text-[#888888]">
              Comprehensive cross-tabulation of system and custom roles against domain capabilities.
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#161616] text-[#888888] font-semibold border-b border-[#222222]">
                    <th className="p-2.5 min-w-[200px]">Permission Capability</th>
                    {roles.map(r => (
                      <th key={r.id} className="p-2.5 text-center min-w-[100px] font-mono text-[11px] text-purple-300">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f1f]">
                  {PERMISSION_CATALOG.map(perm => (
                    <tr key={perm.id} className="hover:bg-[#141414] transition-colors">
                      <td className="p-2.5">
                        <div className="font-mono text-white text-[11px]">{perm.id}</div>
                        <div className="text-[10px] text-[#777777]">{perm.label} ({perm.category})</div>
                      </td>

                      {roles.map(r => {
                        const hasPerm = r.permissions.includes(perm.id);
                        return (
                          <td key={r.id} className="p-2.5 text-center">
                            {hasPerm ? (
                              <div className="w-5 h-5 rounded bg-emerald-950 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                                <Check className="w-3 h-3" />
                              </div>
                            ) : (
                              <span className="text-[#444444] font-mono text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SECURITY & AUTH ENFORCER */}
      {activeTab === 'security_policies' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MFA Policy Configuration */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-[#222222] pb-3">
                <Lock className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Multi-Factor Authentication (MFA) Policy</h3>
                  <p className="text-xs text-[#888888]">Enforce step-up TOTP / WebAuthn tokens across identity profiles.</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <label className="block text-[#cccccc] font-semibold">Enforcement Mode:</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-white cursor-pointer bg-[#161616] p-3 rounded border border-[#222222] hover:border-[#333333]">
                    <input
                      type="radio"
                      name="mfaMode"
                      checked={mfaEnforcementMode === 'mandatory_all'}
                      onChange={() => setMfaEnforcementMode('mandatory_all')}
                      className="text-emerald-500 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold">Mandatory for All Users (Zero-Trust Standard)</div>
                      <div className="text-[10px] text-[#888888]">Requires MFA setup upon first login for all tenants.</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 text-white cursor-pointer bg-[#161616] p-3 rounded border border-[#222222] hover:border-[#333333]">
                    <input
                      type="radio"
                      name="mfaMode"
                      checked={mfaEnforcementMode === 'admins_only'}
                      onChange={() => setMfaEnforcementMode('admins_only')}
                      className="text-emerald-500 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold">Mandatory for Administrators Only</div>
                      <div className="text-[10px] text-[#888888]">Enforced for System Admins and Tenant Owners only.</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 text-white cursor-pointer bg-[#161616] p-3 rounded border border-[#222222] hover:border-[#333333]">
                    <input
                      type="radio"
                      name="mfaMode"
                      checked={mfaEnforcementMode === 'optional'}
                      onChange={() => setMfaEnforcementMode('optional')}
                      className="text-emerald-500 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold">Optional / Recommended</div>
                      <div className="text-[10px] text-[#888888]">Users may opt-in voluntarily.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Password Complexity & Session Lockout */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-[#222222] pb-3">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Password & Session Safeguards</h3>
                  <p className="text-xs text-[#888888]">Set complexity thresholds, session timeouts, and lockout limits.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-[#cccccc] font-semibold mb-1">
                    <span>Minimum Password Length:</span>
                    <span className="font-mono text-amber-400">{minPasswordLength} Characters</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={32}
                    value={minPasswordLength}
                    onChange={e => setMinPasswordLength(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#888888] font-mono text-[11px] mb-1">Session Inactivity Timeout:</label>
                    <select
                      value={sessionTimeoutMins}
                      onChange={e => setSessionTimeoutMins(Number(e.target.value))}
                      className="w-full bg-[#161616] border border-[#2a2a2a] rounded p-2 text-white outline-none"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes</option>
                      <option value={120}>2 Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#888888] font-mono text-[11px] mb-1">Max Failed Logins Lockout:</label>
                    <select
                      value={maxFailedLogins}
                      onChange={e => setMaxFailedLogins(Number(e.target.value))}
                      className="w-full bg-[#161616] border border-[#2a2a2a] rounded p-2 text-white outline-none"
                    >
                      <option value={3}>3 Attempts (Strict)</option>
                      <option value={5}>5 Attempts (Standard)</option>
                      <option value={10}>10 Attempts</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded text-blue-300 text-[11px]">
                  <strong>Enterprise SSO Active:</strong> SAML 2.0 and Google Workspace OAuth integrations bypass local password parameters and inherit identity policies from Okta / Entra ID.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: IAM EVENT AUDIT TRAIL */}
      {activeTab === 'audit_log' && (
        <div className="bg-[#111111] border border-[#222222] rounded p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                IAM & Identity Audit Trail
              </h3>
              <p className="text-xs text-[#888888]">
                Real-time statutory record of user provisioning, role modifications, session terminations, and offboarding signoffs.
              </p>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-3 bg-[#161616] border border-[#222222] rounded flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-white font-bold">[PROVISION]</span>
                <span className="text-[#cccccc]">User Dr. Alexander Turner provisioned with role Principal Researcher</span>
              </div>
              <span className="text-[10px] text-[#666666]">2026-08-28 12:00:00</span>
            </div>

            <div className="p-3 bg-[#161616] border border-[#222222] rounded flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span className="text-white font-bold">[MFA_CHALLENGE]</span>
                <span className="text-[#cccccc]">MFA TOTP verified for Horatio Huxham (Executive Platform Architecture)</span>
              </div>
              <span className="text-[10px] text-[#666666]">2026-08-29 08:50:00</span>
            </div>

            <div className="p-3 bg-[#161616] border border-[#222222] rounded flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span className="text-white font-bold">[ROLE_UPDATE]</span>
                <span className="text-[#cccccc]">Custom Role "Compliance Officer" permissions updated for POPIA Section 72</span>
              </div>
              <span className="text-[10px] text-[#666666]">2026-08-29 09:15:00</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROVISION NEW USER                                                */}
      {/* ========================================================================= */}
      {provisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleProvisionSubmit} className="bg-[#141414] border border-[#2a2a2a] rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Provision New IAM User</h3>
              </div>
              <button type="button" onClick={() => setProvisionModalOpen(false)} className="text-[#777777] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#aaaaaa] font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[#aaaaaa] font-semibold mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="j.smith@company.com"
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#aaaaaa] font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={e => setNewUserDept(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#aaaaaa] font-semibold mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={newUserDesignation}
                    onChange={e => setNewUserDesignation(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#aaaaaa] font-semibold mb-1">Tenant Jurisdiction</label>
                  <select
                    value={newUserTenantId}
                    onChange={e => setNewUserTenantId(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none cursor-pointer"
                  >
                    <option value="system">System Platform Level</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#aaaaaa] font-semibold mb-1">Assigned Role</label>
                  <select
                    value={newUserRoleId}
                    onChange={e => setNewUserRoleId(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none cursor-pointer"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#aaaaaa] font-semibold mb-1">Auth Strategy</label>
                  <select
                    value={newUserAuthMethod}
                    onChange={e => setNewUserAuthMethod(e.target.value as any)}
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none"
                  >
                    <option value="sso_saml">SSO SAML 2.0 (Okta/Entra)</option>
                    <option value="oauth_google">Google Workspace OAuth</option>
                    <option value="mfa_password">MFA Password Credentials</option>
                    <option value="fido2_webauthn">FIDO2 Hardware YubiKey</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserMfaEnabled}
                      onChange={e => setNewUserMfaEnabled(e.target.checked)}
                      className="rounded border-[#333333] bg-[#111111] text-emerald-500 focus:ring-0"
                    />
                    <span className="font-semibold">Enforce MFA on First Login</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setProvisionModalOpen(false)}
                className="px-4 py-2 bg-[#1a1a1a] text-[#888888] hover:text-white rounded font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition-colors"
              >
                Provision User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT USER IDENTITY                                                */}
      {/* ========================================================================= */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-base font-bold text-white">Edit User: {editUserModal.name}</h3>
              <button onClick={() => setEditUserModal(null)} className="text-[#777777] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#aaaaaa] font-semibold mb-1">Assigned Role:</label>
                <select
                  value={editUserModal.roleId}
                  onChange={e => {
                    const rObj = roles.find(r => r.id === e.target.value);
                    setEditUserModal({
                      ...editUserModal,
                      roleId: e.target.value,
                      roleName: rObj ? rObj.name : editUserModal.roleName
                    });
                  }}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#aaaaaa] font-semibold mb-1">Status:</label>
                <select
                  value={editUserModal.status}
                  onChange={e => setEditUserModal({ ...editUserModal, status: e.target.value as any })}
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none font-bold uppercase"
                >
                  <option value="active">ACTIVE</option>
                  <option value="inactive">INACTIVE</option>
                  <option value="locked">LOCKED</option>
                  <option value="suspended">SUSPENDED</option>
                  <option value="offboarded">OFFBOARDED</option>
                </select>
              </div>

              <div>
                <label className="block text-[#aaaaaa] font-semibold mb-1">MFA Enforcement Status:</label>
                <button
                  type="button"
                  onClick={() => setEditUserModal({ ...editUserModal, mfaEnabled: !editUserModal.mfaEnabled })}
                  className={`w-full p-2.5 rounded border text-left font-semibold ${
                    editUserModal.mfaEnabled
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-500 text-amber-300'
                  }`}
                >
                  {editUserModal.mfaEnabled ? 'MFA Currently Enforced (Click to Disable)' : 'MFA Currently Disabled (Click to Enforce)'}
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#222222]">
              <button
                onClick={() => setEditUserModal(null)}
                className="px-4 py-2 bg-[#1a1a1a] text-[#888888] hover:text-white rounded font-semibold text-xs"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (onUpdateUser) {
                    onUpdateUser(editUserModal.id, editUserModal);
                  }
                  setEditUserModal(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded"
              >
                Save User Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SECURITY & SESSION INSPECTOR                                      */}
      {/* ========================================================================= */}
      {userSecurityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Security & Active Tokens</h3>
              </div>
              <button onClick={() => setUserSecurityModal(null)} className="text-[#777777] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#181818] p-3 rounded border border-[#2a2a2a] space-y-1 font-mono">
                <div className="text-white font-bold">{userSecurityModal.name}</div>
                <div className="text-[#888888]">{userSecurityModal.email}</div>
                <div className="text-[10px] text-cyan-400">Auth: {userSecurityModal.authMethod}</div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateUser) {
                      onUpdateUser(userSecurityModal.id, {
                        sessionTokenRevokedAt: new Date().toISOString()
                      });
                    }
                    alert(`Revoked all active JWT/SAML sessions for ${userSecurityModal.name}.`);
                    setUserSecurityModal(null);
                  }}
                  className="w-full p-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded text-left font-bold transition-colors flex items-center justify-between"
                >
                  <span>Revoke All Active Sessions (Force Re-Auth)</span>
                  <ShieldAlert className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    alert(`Temporary password reset token dispatched to ${userSecurityModal.email}.`);
                    setUserSecurityModal(null);
                  }}
                  className="w-full p-3 bg-[#181818] hover:bg-[#252525] border border-[#2a2a2a] text-white rounded text-left font-bold transition-colors"
                >
                  Force Password Reset Token
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#222222]">
              <button
                onClick={() => setUserSecurityModal(null)}
                className="px-4 py-2 bg-[#222222] text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ROLE BUILDER / EDITOR                                             */}
      {/* ========================================================================= */}
      {roleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveRole} className="bg-[#141414] border border-[#2a2a2a] rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {roleModal === 'new' ? 'Create Custom RBAC Role' : `Edit Role: ${roleModal.name}`}
                </h3>
              </div>
              <button type="button" onClick={() => setRoleModal(null)} className="text-[#777777] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#aaaaaa] font-semibold mb-1">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleFormName}
                    onChange={e => setRoleFormName(e.target.value)}
                    placeholder="e.g. Lead Prompt Auditor"
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleFormIsSystem}
                      onChange={e => setRoleFormIsSystem(e.target.checked)}
                      className="rounded border-[#333333] bg-[#111111] text-purple-500 focus:ring-0"
                    />
                    <span className="font-semibold">System Built-In Role</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[#aaaaaa] font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={roleFormDesc}
                  onChange={e => setRoleFormDesc(e.target.value)}
                  placeholder="Describe the responsibilities and scope of this role..."
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              {/* Permission Checkboxes grouped by Category */}
              <div className="space-y-3">
                <label className="block text-[#cccccc] font-bold">Granted Permissions Matrix:</label>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {Array.from(new Set(PERMISSION_CATALOG.map(p => p.category))).map(cat => (
                    <div key={cat} className="bg-[#181818] border border-[#262626] rounded p-3 space-y-2">
                      <div className="font-mono font-bold text-purple-300 text-[11px] uppercase border-b border-[#282828] pb-1">
                        {cat}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {PERMISSION_CATALOG.filter(p => p.category === cat).map(perm => {
                          const checked = roleFormPermissions.includes(perm.id);
                          return (
                            <label key={perm.id} className="flex items-center space-x-2 text-[#cccccc] hover:text-white cursor-pointer text-[11px]">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setRoleFormPermissions([...roleFormPermissions, perm.id]);
                                  } else {
                                    setRoleFormPermissions(roleFormPermissions.filter(p => p !== perm.id));
                                  }
                                }}
                                className="rounded border-[#333333] bg-[#111111] text-purple-500 focus:ring-0"
                              />
                              <span className="font-mono text-white">{perm.id}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setRoleModal(null)}
                className="px-4 py-2 bg-[#1a1a1a] text-[#888888] hover:text-white rounded font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded"
              >
                Save Role
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: USER OFFBOARDING WIZARD                                           */}
      {/* ========================================================================= */}
      {offboardUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center space-x-2">
                <UserX className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-bold text-white">User Offboarding Wizard: {offboardUserModal.name}</h3>
              </div>
              <button onClick={() => setOffboardUserModal(null)} className="text-[#777777] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!offboardCertJson ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#aaaaaa] font-semibold mb-1">Select Offboarding Action:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOffboardAction('suspend')}
                      className={`p-2.5 rounded border text-left ${
                        offboardAction === 'suspend'
                          ? 'bg-amber-950/40 border-amber-500 text-amber-300 font-bold'
                          : 'bg-[#181818] border-[#262626] text-[#777777]'
                      }`}
                    >
                      Suspend User
                    </button>

                    <button
                      type="button"
                      onClick={() => setOffboardAction('lock')}
                      className={`p-2.5 rounded border text-left ${
                        offboardAction === 'lock'
                          ? 'bg-amber-950/40 border-amber-500 text-amber-300 font-bold'
                          : 'bg-[#181818] border-[#262626] text-[#777777]'
                      }`}
                    >
                      Lock User
                    </button>

                    <button
                      type="button"
                      onClick={() => setOffboardAction('offboarded')}
                      className={`p-2.5 rounded border text-left ${
                        offboardAction === 'offboarded'
                          ? 'bg-red-950/40 border-red-500 text-red-300 font-bold'
                          : 'bg-[#181818] border-[#262626] text-[#777777]'
                      }`}
                    >
                      Permanent Offboard
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[#aaaaaa] font-semibold mb-1">Offboarding Audit Rationale:</label>
                  <textarea
                    rows={2}
                    value={offboardReason}
                    onChange={e => setOffboardReason(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded p-2 text-white font-mono outline-none"
                  />
                </div>

                <div className="bg-[#181818] p-3 rounded border border-[#262626]">
                  <label className="flex items-center space-x-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={offboardRevokeTokens}
                      onChange={e => setOffboardRevokeTokens(e.target.checked)}
                      className="rounded border-[#333333] bg-[#111111] text-red-500 focus:ring-0"
                    />
                    <span>Revoke all active session tokens and invalidate JWT bearer secrets</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#222222]">
                  <button
                    type="button"
                    onClick={() => setOffboardUserModal(null)}
                    className="px-4 py-2 bg-[#1a1a1a] text-[#888888] hover:text-white rounded font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteUserOffboarding}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded flex items-center gap-1.5 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Execute User Offboarding</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded flex items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-sm">User Offboarding Executed Successfully</div>
                    <div className="text-[#888888]">Status set to {offboardAction.toUpperCase()}. Statutory audit certificate generated.</div>
                  </div>
                </div>

                <pre className="bg-[#0c0c0c] p-3 rounded border border-[#222222] font-mono text-[11px] text-emerald-300 max-h-48 overflow-y-auto">
                  {offboardCertJson}
                </pre>

                <div className="flex justify-end space-x-2 pt-2 border-t border-[#222222]">
                  <button
                    onClick={() => setOffboardUserModal(null)}
                    className="px-4 py-2 bg-[#222222] text-white rounded font-bold"
                  >
                    Close Wizard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
