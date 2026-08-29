import React, { useState } from 'react';
import {
  Customer,
  CustomerUser,
  StatutoryOfficers,
  Application,
  ApiKey,
  AIPolicy,
  CustomerType,
  CustomerStatus,
  CustomerTier,
  UserRole,
  InvoicePreview
} from '../types';
import {
  Building2,
  UserCheck,
  KeyRound,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Users,
  ShieldAlert,
  Edit2,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FileText,
  Briefcase,
  Globe2,
  Lock,
  Calendar,
  Layers,
  Terminal,
  Play,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  Hash,
  Mail,
  Phone,
  ArrowRight,
  RefreshCw,
  X,
  CreditCard,
  DollarSign
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  applications: Application[];
  apiKeys: ApiKey[];
  policies: AIPolicy[];
  onAddCustomer: (customerData: any) => Promise<void>;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onAddUser: (customerId: string, userData: Partial<CustomerUser>) => Promise<void>;
  onUpdateUser: (customerId: string, userId: string, updates: Partial<CustomerUser>) => Promise<void>;
  onDeleteUser: (customerId: string, userId: string) => Promise<void>;
  onGenerateCustomerApiKey: (customerId: string, keyData: { name: string; appId?: string; rateLimitRpm?: number; expiresInDays?: number; ipWhitelist?: string[]; scopes?: string[] }) => Promise<ApiKey | null>;
  onRevokeApiKey: (keyId: string) => Promise<void>;
  onConnectApplication: (customerId: string, appId: string) => Promise<void>;
  onOpenPlaygroundWithCustomerKey?: (key: string, appId?: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  applications,
  apiKeys,
  policies,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onGenerateCustomerApiKey,
  onRevokeApiKey,
  onConnectApplication,
  onOpenPlaygroundWithCustomerKey
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [managingUsersCustomer, setManagingUsersCustomer] = useState<Customer | null>(null);
  const [managingOfficersCustomer, setManagingOfficersCustomer] = useState<Customer | null>(null);
  const [generatingKeyForCustomer, setGeneratingKeyForCustomer] = useState<Customer | null>(null);
  const [createdKeyDetails, setCreatedKeyDetails] = useState<ApiKey | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Billing & Invoice Modal State
  const [billingModalCustomer, setBillingModalCustomer] = useState<Customer | null>(null);
  const [invoicePreviewData, setInvoicePreviewData] = useState<InvoicePreview | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [billingTab, setBillingTab] = useState<'invoice' | 'credits' | 'config'>('invoice');

  const openBillingModal = async (customer: Customer) => {
    setBillingModalCustomer(customer);
    setLoadingInvoice(true);
    try {
      const res = await fetch(`/api/v1/customers/${customer.id}/invoice-preview`);
      if (res.ok) {
        const data = await res.json();
        setInvoicePreviewData(data);
      }
    } catch (err) {
      console.error('Failed to load invoice preview', err);
    } finally {
      setLoadingInvoice(false);
    }
  };

  // New Customer Wizard Form State
  const [newCustType, setNewCustType] = useState<CustomerType>('company');
  const [newCustName, setNewCustName] = useState('');
  const [newCustLegalName, setNewCustLegalName] = useState('');
  const [newCustRegNumber, setNewCustRegNumber] = useState('');
  const [newCustVatNumber, setNewCustVatNumber] = useState('');
  const [newCustIndustry, setNewCustIndustry] = useState('Financial Services');
  const [newCustCountry, setNewCustCountry] = useState('South Africa (ZA)');
  const [newCustTier, setNewCustTier] = useState<CustomerTier>('growth');
  const [newCustBudget, setNewCustBudget] = useState(2500);
  const [newCustRpm, setNewCustRpm] = useState(240);
  const [newCustNotes, setNewCustNotes] = useState('');

  // Primary Contact
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('Chief Technology Officer');

  // Statutory Officers Form
  const [hasInfoOfficer, setHasInfoOfficer] = useState(true);
  const [ioName, setIoName] = useState('');
  const [ioEmail, setIoEmail] = useState('');
  const [ioPhone, setIoPhone] = useState('');
  const [ioDesignation, setIoDesignation] = useState('Information Officer');
  const [ioRegNumber, setIoRegNumber] = useState('');
  const [ioDeputyName, setIoDeputyName] = useState('');
  const [ioDeputyEmail, setIoDeputyEmail] = useState('');

  const [hasDpo, setHasDpo] = useState(false);
  const [dpoName, setDpoName] = useState('');
  const [dpoEmail, setDpoEmail] = useState('');
  const [dpoPhone, setDpoPhone] = useState('');
  const [dpoType, setDpoType] = useState<'internal' | 'external'>('internal');
  const [dpoAuthority, setDpoAuthority] = useState('Information Regulator (South Africa)');
  const [dpoRegNumber, setDpoRegNumber] = useState('');

  // Initial App & Key options
  const [autoCreateApp, setAutoCreateApp] = useState(true);
  const [initialAppName, setInitialAppName] = useState('');
  const [initialAppIdentifier, setInitialAppIdentifier] = useState('');

  // User Management Form State
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CustomerUser | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('developer');
  const [userDesignation, setUserDesignation] = useState('');
  const [userMfa, setUserMfa] = useState(true);
  const [userStatus, setUserStatus] = useState<'active' | 'inactive' | 'suspended'>('active');

  // Key Generation Form State
  const [keyName, setKeyName] = useState('');
  const [keyAppId, setKeyAppId] = useState<string>('all');
  const [keyRpm, setKeyRpm] = useState<number>(240);
  const [keyExpiresDays, setKeyExpiresDays] = useState<number>(365);
  const [keyIpWhitelist, setKeyIpWhitelist] = useState<string>('');
  const [keyScopes, setKeyScopes] = useState<string[]>(['read:inference', 'read:models']);

  // Key Tester & Validator State
  const [testKeyInput, setTestKeyInput] = useState('');
  const [testKeyLoading, setTestKeyLoading] = useState(false);
  const [testKeyResult, setTestKeyResult] = useState<any | null>(null);

  // Tab inside Customers Screen
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'key_tester' | 'statutory_matrix'>('directory');

  // Filter Customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.primaryContact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.primaryContact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.statutoryOfficers?.informationOfficer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.statutoryOfficers?.dataProtectionOfficer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesTier = filterTier === 'all' || c.tier === filterTier;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

    return matchesSearch && matchesType && matchesTier && matchesStatus;
  });

  // Calculate Metrics
  const totalCustomers = customers.length;
  const companyCount = customers.filter(c => c.type === 'company').length;
  const individualCount = customers.filter(c => c.type === 'individual').length;
  const totalOfficersNominated = customers.filter(c => c.statutoryOfficers?.informationOfficer || c.statutoryOfficers?.dataProtectionOfficer).length;
  const totalUsersAcrossTenants = customers.reduce((sum, c) => sum + (c.users?.length || 0), 0);
  const totalMonthlyBudget = customers.reduce((sum, c) => sum + (c.monthlyBudgetUsd || 0), 0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  // Handle Add Customer Submit
  const handleSubmitNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const payload = {
      type: newCustType,
      name: newCustName.trim(),
      legalName: newCustLegalName.trim() || newCustName.trim(),
      registrationNumber: newCustRegNumber.trim(),
      taxVatNumber: newCustVatNumber.trim(),
      industry: newCustIndustry,
      country: newCustCountry,
      tier: newCustTier,
      monthlyBudgetUsd: Number(newCustBudget) || 2500,
      rateLimitRpm: Number(newCustRpm) || 240,
      notes: newCustNotes,
      primaryContact: {
        name: newContactName || 'Primary Contact',
        email: newContactEmail || 'admin@tenant.internal',
        phone: newContactPhone,
        role: newContactRole
      },
      statutoryOfficers: {
        informationOfficer: hasInfoOfficer && ioName.trim() ? {
          name: ioName.trim(),
          email: ioEmail.trim() || newContactEmail,
          phone: ioPhone.trim() || newContactPhone,
          designation: ioDesignation || 'Information Officer',
          registrationNumber: ioRegNumber.trim(),
          registeredDate: new Date().toISOString().slice(0, 10),
          deputyOfficerName: ioDeputyName.trim(),
          deputyOfficerEmail: ioDeputyEmail.trim()
        } : undefined,
        dataProtectionOfficer: hasDpo && dpoName.trim() ? {
          name: dpoName.trim(),
          email: dpoEmail.trim() || newContactEmail,
          phone: dpoPhone.trim() || newContactPhone,
          dpoType,
          leadSupervisoryAuthority: dpoAuthority,
          registrationNumber: dpoRegNumber.trim(),
          registeredDate: new Date().toISOString().slice(0, 10)
        } : undefined
      },
      initialApplicationName: autoCreateApp && initialAppName.trim() ? initialAppName.trim() : (autoCreateApp ? `${newCustName} AI Ingress` : undefined),
      initialApplicationIdentifier: autoCreateApp && initialAppIdentifier.trim() ? initialAppIdentifier.trim() : undefined
    };

    if (editingCustomer) {
      await onUpdateCustomer(editingCustomer.id, payload);
    } else {
      await onAddCustomer(payload);
    }
    setIsAddModalOpen(false);
    setEditingCustomer(null);
    resetNewCustomerForm();
  };

  const resetNewCustomerForm = () => {
    setNewCustType('company');
    setNewCustName('');
    setNewCustLegalName('');
    setNewCustRegNumber('');
    setNewCustVatNumber('');
    setNewCustIndustry('Financial Services');
    setNewCustCountry('South Africa (ZA)');
    setNewCustTier('growth');
    setNewCustBudget(2500);
    setNewCustRpm(240);
    setNewCustNotes('');
    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setNewContactRole('Chief Technology Officer');
    setHasInfoOfficer(true);
    setIoName('');
    setIoEmail('');
    setIoPhone('');
    setIoDesignation('Information Officer');
    setIoRegNumber('');
    setIoDeputyName('');
    setIoDeputyEmail('');
    setHasDpo(false);
    setDpoName('');
    setDpoEmail('');
    setDpoPhone('');
    setDpoType('internal');
    setDpoAuthority('Information Regulator (South Africa)');
    setDpoRegNumber('');
    setAutoCreateApp(true);
    setInitialAppName('');
    setInitialAppIdentifier('');
  };

  // Handle Update Customer Officers
  const handleSaveStatutoryOfficers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingOfficersCustomer) return;

    const updatedOfficers: StatutoryOfficers = {
      informationOfficer: hasInfoOfficer && ioName.trim() ? {
        name: ioName.trim(),
        email: ioEmail.trim(),
        phone: ioPhone.trim(),
        designation: ioDesignation.trim() || 'Information Officer',
        registrationNumber: ioRegNumber.trim(),
        registeredDate: managingOfficersCustomer.statutoryOfficers?.informationOfficer?.registeredDate || new Date().toISOString().slice(0, 10),
        deputyOfficerName: ioDeputyName.trim(),
        deputyOfficerEmail: ioDeputyEmail.trim()
      } : undefined,
      dataProtectionOfficer: hasDpo && dpoName.trim() ? {
        name: dpoName.trim(),
        email: dpoEmail.trim(),
        phone: dpoPhone.trim(),
        dpoType,
        leadSupervisoryAuthority: dpoAuthority,
        registrationNumber: dpoRegNumber.trim(),
        registeredDate: managingOfficersCustomer.statutoryOfficers?.dataProtectionOfficer?.registeredDate || new Date().toISOString().slice(0, 10)
      } : undefined
    };

    await onUpdateCustomer(managingOfficersCustomer.id, {
      statutoryOfficers: updatedOfficers
    });

    setManagingOfficersCustomer(null);
  };

  const openStatutoryOfficersModal = (customer: Customer) => {
    setManagingOfficersCustomer(customer);
    const io = customer.statutoryOfficers?.informationOfficer;
    const dpo = customer.statutoryOfficers?.dataProtectionOfficer;

    if (io) {
      setHasInfoOfficer(true);
      setIoName(io.name);
      setIoEmail(io.email);
      setIoPhone(io.phone);
      setIoDesignation(io.designation);
      setIoRegNumber(io.registrationNumber || '');
      setIoDeputyName(io.deputyOfficerName || '');
      setIoDeputyEmail(io.deputyOfficerEmail || '');
    } else {
      setHasInfoOfficer(false);
      setIoName('');
      setIoEmail('');
      setIoPhone('');
      setIoDesignation('Information Officer');
      setIoRegNumber('');
      setIoDeputyName('');
      setIoDeputyEmail('');
    }

    if (dpo) {
      setHasDpo(true);
      setDpoName(dpo.name);
      setDpoEmail(dpo.email);
      setDpoPhone(dpo.phone);
      setDpoType(dpo.dpoType);
      setDpoAuthority(dpo.leadSupervisoryAuthority || 'Information Regulator (South Africa)');
      setDpoRegNumber(dpo.registrationNumber || '');
    } else {
      setHasDpo(false);
      setDpoName('');
      setDpoEmail('');
      setDpoPhone('');
      setDpoType('internal');
      setDpoAuthority('Information Regulator (South Africa)');
      setDpoRegNumber('');
    }
  };

  // User Management
  const openUsersModal = (customer: Customer) => {
    setManagingUsersCustomer(customer);
    setNewUserModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingUsersCustomer || !userName.trim() || !userEmail.trim()) return;

    if (editingUser) {
      await onUpdateUser(managingUsersCustomer.id, editingUser.id, {
        name: userName.trim(),
        email: userEmail.trim(),
        role: userRole,
        designation: userDesignation.trim() || 'Team Member',
        mfaEnabled: userMfa,
        status: userStatus
      });
    } else {
      await onAddUser(managingUsersCustomer.id, {
        name: userName.trim(),
        email: userEmail.trim(),
        role: userRole,
        designation: userDesignation.trim() || 'Team Member',
        mfaEnabled: userMfa,
        status: userStatus
      });
    }

    setNewUserModalOpen(false);
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserDesignation('');
    setUserRole('developer');
  };

  const handleEditUserClick = (user: CustomerUser) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserDesignation(user.designation || '');
    setUserMfa(user.mfaEnabled);
    setUserStatus(user.status);
    setNewUserModalOpen(true);
  };

  // Generate Key for Customer
  const openGenerateKeyModal = (customer: Customer) => {
    setGeneratingKeyForCustomer(customer);
    setKeyName(`${customer.name} Production API Key`);
    setKeyAppId(customer.connectedAppIds[0] || 'all');
    setKeyRpm(customer.rateLimitRpm || 240);
    setKeyExpiresDays(365);
    setKeyIpWhitelist('');
    setKeyScopes(['read:inference', 'read:models']);
    setCreatedKeyDetails(null);
  };

  const handleGenerateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatingKeyForCustomer) return;

    const ips = keyIpWhitelist
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const generated = await onGenerateCustomerApiKey(generatingKeyForCustomer.id, {
      name: keyName.trim() || `${generatingKeyForCustomer.name} API Key`,
      appId: keyAppId,
      rateLimitRpm: Number(keyRpm) || 240,
      expiresInDays: Number(keyExpiresDays) || 365,
      ipWhitelist: ips,
      scopes: keyScopes
    });

    if (generated) {
      setCreatedKeyDetails(generated);
    }
  };

  // Test Customer Key
  const handleRunKeyValidation = async () => {
    if (!testKeyInput.trim()) return;
    setTestKeyLoading(true);
    setTestKeyResult(null);

    try {
      const res = await fetch('/api/v1/customers/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: testKeyInput.trim() })
      });
      const data = await res.json();
      setTestKeyResult(data);
    } catch (err: any) {
      setTestKeyResult({
        valid: false,
        status: 'NETWORK_ERROR',
        error: 'Failed to communicate with ALTIL Gateway authentication service'
      });
    } finally {
      setTestKeyLoading(false);
    }
  };

  return (
    <div id="customers-view-container" className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Customer & Tenant Management
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  AI Aggregator Tier
                </span>
              </h1>
              <p className="text-xs text-[#888888] mt-0.5">
                Multi-tenant organizational onboarding, tenant-scoped API keys, and statutory POPIA / GDPR officer governance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-[#111111] p-0.5 rounded border border-[#222222] text-xs font-medium">
            <button
              id="subtab-directory-btn"
              onClick={() => setActiveSubTab('directory')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'directory'
                  ? 'bg-[#222222] text-white'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              Directory & Tenants ({customers.length})
            </button>
            <button
              id="subtab-statutory-btn"
              onClick={() => setActiveSubTab('statutory_matrix')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'statutory_matrix'
                  ? 'bg-[#222222] text-white'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              Statutory Officers Matrix
            </button>
            <button
              id="subtab-keytester-btn"
              onClick={() => setActiveSubTab('key_tester')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'key_tester'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              API Key Validator
            </button>
          </div>

          <button
            id="btn-register-customer"
            onClick={() => {
              resetNewCustomerForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Activate Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#111111] border border-[#222222] rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888888]">
            <span>Active Customers</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{totalCustomers}</span>
            <span className="text-[11px] text-[#666666]">
              {companyCount} Corp / {individualCount} Solo
            </span>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888888]">
            <span>Statutory Officers</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{totalOfficersNominated}</span>
            <span className="text-[11px] text-emerald-500/80">POPIA & GDPR Registered</span>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888888]">
            <span>Tenant Users (RBAC)</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-400 font-mono">{totalUsersAcrossTenants}</span>
            <span className="text-[11px] text-[#666666]">MFA Enforced</span>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888888]">
            <span>Active API Keys</span>
            <KeyRound className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {apiKeys.filter(k => k.status === 'active').length}
            </span>
            <span className="text-[11px] text-amber-500/80">Zero-Trust Scoped</span>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888888]">
            <span>Monthly AI Quota Cap</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-cyan-400 font-mono">
              ${totalMonthlyBudget.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#666666]">Aggregated Cap</span>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: DIRECTORY & TENANTS */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#111111] border border-[#222222] rounded p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-customer-input"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search customers by brand, legal name, registration number, or officer..."
                className="w-full bg-[#161616] border border-[#2a2a2a] focus:border-blue-500 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#555555] outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                id="filter-customer-type"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-[#161616] border border-[#2a2a2a] text-xs text-[#cccccc] rounded px-2.5 py-1.5 outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="company">Corporate / Company</option>
                <option value="individual">Individual / Solo Dev</option>
              </select>

              <select
                id="filter-customer-tier"
                value={filterTier}
                onChange={e => setFilterTier(e.target.value)}
                className="bg-[#161616] border border-[#2a2a2a] text-xs text-[#cccccc] rounded px-2.5 py-1.5 outline-none focus:border-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="enterprise">Enterprise</option>
                <option value="scale">Scale</option>
                <option value="growth">Growth</option>
                <option value="starter">Starter</option>
              </select>

              <select
                id="filter-customer-status"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-[#161616] border border-[#2a2a2a] text-xs text-[#cccccc] rounded px-2.5 py-1.5 outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending_review">Pending Review</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredCustomers.map(customer => {
              const customerApps = applications.filter(a =>
                customer.connectedAppIds.includes(a.id) || a.customerId === customer.id
              );
              const customerKeys = apiKeys.filter(k =>
                k.customerId === customer.id || customerApps.some(a => a.id === k.appId)
              );
              const infoOfficer = customer.statutoryOfficers?.informationOfficer;
              const dpo = customer.statutoryOfficers?.dataProtectionOfficer;

              return (
                <div
                  key={customer.id}
                  id={`customer-card-${customer.id}`}
                  className={`bg-[#111111] border rounded transition-all hover:border-[#333333] ${
                    customer.status === 'active'
                      ? 'border-[#222222]'
                      : customer.status === 'suspended'
                      ? 'border-red-900/50 bg-red-950/5'
                      : 'border-amber-900/50 bg-amber-950/5'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-[#1c1c1c] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`p-2.5 rounded shrink-0 border ${
                          customer.type === 'company'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {customer.type === 'company' ? (
                          <Building2 className="w-5 h-5" />
                        ) : (
                          <Briefcase className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h2 className="text-base font-bold text-white tracking-tight">
                            {customer.name}
                          </h2>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                              customer.type === 'company'
                                ? 'bg-blue-900/30 text-blue-300 border-blue-700/50'
                                : 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50'
                            }`}
                          >
                            {customer.type}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                              customer.tier === 'enterprise'
                                ? 'bg-purple-900/30 text-purple-300 border-purple-700/50'
                                : customer.tier === 'scale'
                                ? 'bg-indigo-900/30 text-indigo-300 border-indigo-700/50'
                                : 'bg-cyan-900/30 text-cyan-300 border-cyan-700/50'
                            }`}
                          >
                            Tier: {customer.tier}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                              customer.status === 'active'
                                ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50'
                                : customer.status === 'suspended'
                                ? 'bg-red-900/30 text-red-300 border-red-700/50'
                                : 'bg-amber-900/30 text-amber-300 border-amber-700/50'
                            }`}
                          >
                            {customer.status}
                          </span>
                        </div>

                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-[#777777] mt-1">
                          <span className="text-[#aaaaaa] font-medium">{customer.legalName}</span>
                          {customer.registrationNumber && (
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <Hash className="w-3 h-3 text-[#555555]" />
                              Reg: {customer.registrationNumber}
                            </span>
                          )}
                          {customer.taxVatNumber && (
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              VAT: {customer.taxVatNumber}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Globe2 className="w-3 h-3 text-[#555555]" />
                            {customer.country} ({customer.industry})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        id={`btn-manage-users-${customer.id}`}
                        onClick={() => openUsersModal(customer)}
                        className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-xs font-medium text-[#cccccc] hover:text-white rounded transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span>Users ({customer.users?.length || 0})</span>
                      </button>

                      <button
                        id={`btn-statutory-officers-${customer.id}`}
                        onClick={() => openStatutoryOfficersModal(customer)}
                        className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-xs font-medium text-[#cccccc] hover:text-white rounded transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Statutory Officers</span>
                      </button>

                      <button
                        id={`btn-billing-${customer.id}`}
                        onClick={() => openBillingModal(customer)}
                        className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-xs font-medium text-[#cccccc] hover:text-white rounded transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Billing & Invoices</span>
                      </button>

                      <button
                        id={`btn-generate-key-${customer.id}`}
                        onClick={() => openGenerateKeyModal(customer)}
                        className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-medium text-blue-300 hover:text-white rounded transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Generate Key</span>
                      </button>

                      <select
                        value={customer.status}
                        onChange={e => {
                          const newStatus = e.target.value as CustomerStatus;
                          onUpdateCustomer(customer.id, { status: newStatus });
                        }}
                        className="bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-white rounded px-2 py-1.5 outline-none font-medium"
                        title="Change Customer Lifecycle Status"
                      >
                        <option value="active">Status: Active</option>
                        <option value="trial">Status: Trial</option>
                        <option value="restricted">Status: Restricted</option>
                        <option value="suspended">Status: Suspended</option>
                        <option value="archived">Status: Archived</option>
                      </select>

                      <button
                        id={`btn-edit-customer-${customer.id}`}
                        onClick={() => {
                          setEditingCustomer(customer);
                          setNewCustName(customer.name);
                          setNewCustLegalName(customer.legalName);
                          setNewCustRegNumber(customer.registrationNumber);
                          setNewCustVatNumber(customer.taxVatNumber || '');
                          setNewCustIndustry(customer.industry);
                          setNewCustCountry(customer.country);
                          setNewCustTier(customer.tier);
                          setNewCustBudget(customer.monthlyBudgetUsd);
                          setNewCustRpm(customer.rateLimitRpm);
                          setNewCustNotes(customer.notes || '');
                          setNewContactName(customer.primaryContact.name);
                          setNewContactEmail(customer.primaryContact.email);
                          setNewContactPhone(customer.primaryContact.phone || '');
                          setNewContactRole(customer.primaryContact.role || '');
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-[#888888] hover:text-white rounded transition-colors"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`btn-delete-customer-${customer.id}`}
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to deactivate and remove customer [${customer.name}]?`
                            )
                          ) {
                            onDeleteCustomer(customer.id);
                          }
                        }}
                        className="p-1.5 bg-[#1a1a1a] hover:bg-red-950/40 border border-[#2a2a2a] text-[#888888] hover:text-red-400 rounded transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body with 3 Sub-Panels: Statutory Officers, Connected Apps, and API Keys */}
                  <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                    {/* Panel 1: Statutory Officers Registration */}
                    <div className="bg-[#151515] border border-[#222222] rounded p-3 flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Statutory Governance
                          </span>
                          <span className="text-[10px] text-[#888888] font-mono">POPIA / GDPR</span>
                        </div>

                        <div className="mt-2.5 space-y-2.5">
                          {/* Information Officer */}
                          <div className="bg-[#1a1a1a] p-2 rounded border border-[#262626]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#aaaaaa]">POPIA Information Officer</span>
                              {infoOfficer ? (
                                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded">
                                  Nominated
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800/60 rounded">
                                  Pending
                                </span>
                              )}
                            </div>
                            {infoOfficer ? (
                              <div className="mt-1 space-y-0.5 text-[11px] text-[#888888]">
                                <div className="text-white font-medium">{infoOfficer.name} ({infoOfficer.designation})</div>
                                <div className="flex items-center gap-1 text-[10px] font-mono">
                                  <Mail className="w-3 h-3 text-[#555555]" />
                                  {infoOfficer.email}
                                </div>
                                {infoOfficer.registrationNumber && (
                                  <div className="text-[10px] font-mono text-emerald-400/80">
                                    IR Reg: {infoOfficer.registrationNumber}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-1 text-[11px] text-[#666666] italic">
                                Statutory officer not yet nominated by company board.
                              </div>
                            )}
                          </div>

                          {/* Data Protection Officer */}
                          <div className="bg-[#1a1a1a] p-2 rounded border border-[#262626]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#aaaaaa]">GDPR Data Protection Officer</span>
                              {dpo ? (
                                <span className="text-[10px] px-1.5 py-0.2 bg-blue-950 text-blue-400 border border-blue-800/60 rounded">
                                  {dpo.dpoType.toUpperCase()}
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 bg-[#222222] text-[#666666] rounded">
                                  Optional
                                </span>
                              )}
                            </div>
                            {dpo ? (
                              <div className="mt-1 space-y-0.5 text-[11px] text-[#888888]">
                                <div className="text-white font-medium">{dpo.name}</div>
                                <div className="flex items-center gap-1 text-[10px] font-mono">
                                  <Mail className="w-3 h-3 text-[#555555]" />
                                  {dpo.email}
                                </div>
                                {dpo.leadSupervisoryAuthority && (
                                  <div className="text-[10px] text-[#777777]">
                                    Authority: {dpo.leadSupervisoryAuthority}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-1 text-[11px] text-[#666666] italic">
                                DPO not required / not nominated.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        id={`btn-edit-statutory-quick-${customer.id}`}
                        onClick={() => openStatutoryOfficersModal(customer)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 mt-1"
                      >
                        Update Statutory Registrations
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Panel 2: Connected Applications & Quotas */}
                    <div className="bg-[#151515] border border-[#222222] rounded p-3 flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-cyan-400" />
                            Connected Applications ({customerApps.length})
                          </span>
                          <span className="text-[10px] text-[#888888] font-mono">
                            Quota: {customer.rateLimitRpm} RPM
                          </span>
                        </div>

                        <div className="mt-2.5 space-y-2 max-h-40 overflow-y-auto pr-1">
                          {customerApps.length > 0 ? (
                            customerApps.map(app => (
                              <div
                                key={app.id}
                                className="bg-[#1a1a1a] p-2 rounded border border-[#262626] flex items-center justify-between"
                              >
                                <div>
                                  <div className="text-white font-medium">{app.name}</div>
                                  <div className="text-[10px] text-[#666666] font-mono">
                                    ID: {app.appIdentifier} | Env: {app.environment}
                                  </div>
                                </div>
                                <span
                                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                                    app.status === 'active'
                                      ? 'bg-emerald-950 text-emerald-400'
                                      : 'bg-red-950 text-red-400'
                                  }`}
                                >
                                  {app.status}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 bg-[#1a1a1a] rounded text-center text-[#666666] italic">
                              No applications connected yet.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] text-[#888888]">
                        <span>Monthly Spend Cap:</span>
                        <span className="font-bold text-white font-mono">
                          ${customer.currentSpendUsd} / ${customer.monthlyBudgetUsd} USD
                        </span>
                      </div>
                    </div>

                    {/* Panel 3: Active API Keys & Auth Gate */}
                    <div className="bg-[#151515] border border-[#222222] rounded p-3 flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <KeyRound className="w-4 h-4 text-amber-400" />
                            Tenant API Keys ({customerKeys.length})
                          </span>
                          <span className="text-[10px] text-amber-400/80 font-mono">Zero-Trust</span>
                        </div>

                        <div className="mt-2.5 space-y-2 max-h-40 overflow-y-auto pr-1">
                          {customerKeys.length > 0 ? (
                            customerKeys.map(k => (
                              <div
                                key={k.id}
                                className="bg-[#1a1a1a] p-2 rounded border border-[#262626] flex items-center justify-between"
                              >
                                <div className="space-y-0.5">
                                  <div className="text-white font-medium flex items-center gap-1.5">
                                    <span>{k.name}</span>
                                    <span
                                      className={`px-1 py-0.2 text-[8px] font-bold rounded uppercase ${
                                        k.status === 'active'
                                          ? 'bg-emerald-950 text-emerald-400'
                                          : 'bg-red-950 text-red-400'
                                      }`}
                                    >
                                      {k.status}
                                    </span>
                                  </div>
                                  <div className="font-mono text-[10px] text-[#888888]">
                                    {k.prefix}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => copyToClipboard(k.key || k.prefix, k.id)}
                                    className="p-1 text-[#888888] hover:text-white rounded"
                                    title="Copy key / prefix"
                                  >
                                    {copiedKeyId === k.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  {k.status === 'active' && (
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Revoke API key [${k.name}]? All client requests using this key will be instantly blocked.`
                                          )
                                        ) {
                                          onRevokeApiKey(k.id);
                                        }
                                      }}
                                      className="p-1 text-[#888888] hover:text-red-400 rounded"
                                      title="Revoke Key"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 bg-[#1a1a1a] rounded text-center text-[#666666] italic">
                              No keys issued yet. Click "Generate Key".
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[11px]">
                        <span className="text-[#777777]">Primary Contact:</span>
                        <span className="text-[#cccccc] font-medium">
                          {customer.primaryContact.name} ({customer.primaryContact.email})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="bg-[#111111] border border-[#222222] rounded p-12 text-center space-y-3">
                <Building2 className="w-10 h-10 text-[#444444] mx-auto" />
                <h3 className="text-base font-semibold text-white">No customers matched your filter</h3>
                <p className="text-xs text-[#777777] max-w-md mx-auto">
                  Try adjusting your search criteria or click "Activate Customer" to onboard an enterprise organization or individual consumer.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterTier('all');
                    setFilterStatus('all');
                  }}
                  className="px-3 py-1.5 bg-[#222222] hover:bg-[#333333] text-xs font-medium text-white rounded transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: STATUTORY OFFICERS MATRIX */}
      {activeSubTab === 'statutory_matrix' && (
        <div className="space-y-4">
          <div className="bg-[#111111] border border-[#222222] rounded p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#222222]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Statutory Regulatory Nominations & Compliance Accountability
                </h3>
                <p className="text-xs text-[#888888] mt-0.5">
                  South African Protection of Personal Information Act (POPIA §55/56) Information Officers and EU GDPR (Art 37) Data Protection Officers registered per tenant.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 rounded font-mono">
                  POPIA Active: {customers.filter(c => c.statutoryOfficers?.informationOfficer).length}
                </span>
                <span className="px-2 py-1 bg-blue-950/60 text-blue-400 border border-blue-800/50 rounded font-mono">
                  GDPR Active: {customers.filter(c => c.statutoryOfficers?.dataProtectionOfficer).length}
                </span>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#222222] text-[#888888] font-semibold bg-[#161616]">
                    <th className="p-3">Customer / Organization</th>
                    <th className="p-3">POPIA Information Officer (IO)</th>
                    <th className="p-3">IR Registration No.</th>
                    <th className="p-3">Deputy Information Officer</th>
                    <th className="p-3">GDPR DPO Officer</th>
                    <th className="p-3">Lead Authority</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f1f]">
                  {customers.map(c => {
                    const io = c.statutoryOfficers?.informationOfficer;
                    const dpo = c.statutoryOfficers?.dataProtectionOfficer;
                    return (
                      <tr key={c.id} className="hover:bg-[#141414] transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white">{c.name}</div>
                          <div className="text-[11px] text-[#666666] font-mono">{c.registrationNumber || c.country}</div>
                        </td>

                        <td className="p-3">
                          {io ? (
                            <div>
                              <div className="text-emerald-400 font-medium">{io.name}</div>
                              <div className="text-[11px] text-[#777777]">{io.designation}</div>
                              <div className="text-[10px] text-[#555555] font-mono">{io.email}</div>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800/40 rounded text-[10px]">
                              Not Registered
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono text-[11px]">
                          {io?.registrationNumber ? (
                            <span className="text-white font-medium">{io.registrationNumber}</span>
                          ) : (
                            <span className="text-[#555555]">—</span>
                          )}
                        </td>

                        <td className="p-3">
                          {io?.deputyOfficerName ? (
                            <div>
                              <div className="text-[#cccccc]">{io.deputyOfficerName}</div>
                              <div className="text-[10px] text-[#666666] font-mono">{io.deputyOfficerEmail}</div>
                            </div>
                          ) : (
                            <span className="text-[#555555]">None</span>
                          )}
                        </td>

                        <td className="p-3">
                          {dpo ? (
                            <div>
                              <div className="text-blue-400 font-medium">{dpo.name}</div>
                              <div className="text-[10px] text-[#777777] uppercase font-mono">{dpo.dpoType} DPO</div>
                              <div className="text-[10px] text-[#555555] font-mono">{dpo.email}</div>
                            </div>
                          ) : (
                            <span className="text-[#555555] text-[11px]">N/A (Optional)</span>
                          )}
                        </td>

                        <td className="p-3 text-[11px] text-[#888888]">
                          {dpo?.leadSupervisoryAuthority || (io ? 'Information Regulator (ZA)' : '—')}
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => openStatutoryOfficersModal(c)}
                            className="px-2 py-1 bg-[#222222] hover:bg-[#333333] text-xs text-white rounded transition-colors"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: API KEY VALIDATOR & TESTER */}
      {activeSubTab === 'key_tester' && (
        <div className="space-y-4">
          <div className="bg-[#111111] border border-[#222222] rounded p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                Live Customer API Key Validator & Gateway Inspection
              </h3>
              <p className="text-xs text-[#888888] mt-0.5">
                Simulate an external customer authenticating against the ALTIL Gateway with their provisioned API key. Tests tenant identity resolution, rate limiting, and regulatory verification.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#aaaaaa] mb-1">
                  ALTIL High-Entropy Customer Key:
                </label>
                <input
                  id="test-key-input"
                  type="text"
                  value={testKeyInput}
                  onChange={e => setTestKeyInput(e.target.value)}
                  placeholder="e.g. ALTIL-LIVE-8F92-B4D1-0982-A..."
                  className="w-full bg-[#161616] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-white placeholder-[#555555] outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  id="btn-validate-key"
                  disabled={testKeyLoading || !testKeyInput.trim()}
                  onClick={handleRunKeyValidation}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                >
                  {testKeyLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>Validate Key</span>
                </button>
              </div>
            </div>

            {/* Quick Sample Key Fillers */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-[#777777]">
              <span>Quick Test with Existing Keys:</span>
              {apiKeys.slice(0, 4).map(k => (
                <button
                  key={k.id}
                  onClick={() => {
                    setTestKeyInput(k.key || k.prefix);
                  }}
                  className="px-2 py-0.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-[#cccccc] rounded font-mono text-[11px]"
                >
                  {k.name} ({k.prefix.slice(0, 10)}...)
                </button>
              ))}
            </div>

            {/* Test Result Display */}
            {testKeyResult && (
              <div
                id="test-key-result"
                className={`p-4 rounded border ${
                  testKeyResult.valid
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-red-950/20 border-red-500/30'
                } space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {testKeyResult.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-bold text-white text-sm">
                      {testKeyResult.valid
                        ? 'Key Validated Successfully'
                        : `Key Authentication Failed (${testKeyResult.status || 'REJECTED'})`}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${
                      testKeyResult.valid
                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                        : 'bg-red-900/40 text-red-300 border border-red-700/50'
                    }`}
                  >
                    {testKeyResult.status}
                  </span>
                </div>

                {testKeyResult.valid ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#141414] p-3 rounded border border-[#222222] space-y-1.5">
                      <div className="font-semibold text-[#aaaaaa] border-b border-[#222222] pb-1">
                        Resolved Customer Identity
                      </div>
                      <div className="text-white font-bold">{testKeyResult.customer?.name}</div>
                      <div className="text-[#888888]">
                        Tier: {testKeyResult.customer?.tier} | Country: {testKeyResult.customer?.country}
                      </div>
                      <div className="text-emerald-400/90 text-[11px]">
                        Information Officer: {testKeyResult.customer?.informationOfficer}
                      </div>
                    </div>

                    <div className="bg-[#141414] p-3 rounded border border-[#222222] space-y-1.5">
                      <div className="font-semibold text-[#aaaaaa] border-b border-[#222222] pb-1">
                        Target Application & Scope
                      </div>
                      <div className="text-white font-bold">{testKeyResult.application?.name}</div>
                      <div className="text-[#888888] font-mono">
                        Rate Limit: {testKeyResult.rateLimitRpm} RPM | Scopes: {testKeyResult.scopes?.join(', ')}
                      </div>
                      <div className="text-blue-400 text-[11px]">
                        Security: Zero-Trust Strict Isolation Active
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-red-300 bg-red-950/40 p-3 rounded border border-red-800/40">
                    {testKeyResult.error || 'Authentication denied by ALTIL Security Gateway.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT CUSTOMER WIZARD                                       */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Activate New Customer / Organization'}
                  </h2>
                  <p className="text-xs text-[#888888]">
                    Register legal entity, nominate statutory officers, and configure API consumption parameters.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-[#777777] hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewCustomer} className="space-y-5">
              {/* Customer Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] mb-2 uppercase tracking-wider">
                  1. Customer Entity Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewCustType('company')}
                    className={`p-3 rounded border text-left flex items-start space-x-3 transition-colors ${
                      newCustType === 'company'
                        ? 'bg-blue-600/10 border-blue-500 text-white'
                        : 'bg-[#181818] border-[#2a2a2a] text-[#888888] hover:border-[#333333]'
                    }`}
                  >
                    <Building2 className={`w-5 h-5 shrink-0 ${newCustType === 'company' ? 'text-blue-400' : ''}`} />
                    <div>
                      <div className="text-xs font-bold text-white">Company / Enterprise Tenant</div>
                      <div className="text-[11px] text-[#777777] mt-0.5">
                        Corporate legal entity with multi-user RBAC, DPO/IO statutory officers, and department quotas.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCustType('individual')}
                    className={`p-3 rounded border text-left flex items-start space-x-3 transition-colors ${
                      newCustType === 'individual'
                        ? 'bg-emerald-600/10 border-emerald-500 text-white'
                        : 'bg-[#181818] border-[#2a2a2a] text-[#888888] hover:border-[#333333]'
                    }`}
                  >
                    <Briefcase className={`w-5 h-5 shrink-0 ${newCustType === 'individual' ? 'text-emerald-400' : ''}`} />
                    <div>
                      <div className="text-xs font-bold text-white">Individual / Solo Developer</div>
                      <div className="text-[11px] text-[#777777] mt-0.5">
                        Independent contractor or solo operator requiring direct API keys and compliance protection.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Organization & Legal Details */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider">
                  2. Organization & Entity Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Customer / Trading Name *</label>
                    <input
                      type="text"
                      required
                      value={newCustName}
                      onChange={e => setNewCustName(e.target.value)}
                      placeholder="e.g. Acme Financial Group"
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Full Legal Entity Name</label>
                    <input
                      type="text"
                      value={newCustLegalName}
                      onChange={e => setNewCustLegalName(e.target.value)}
                      placeholder="e.g. Acme Financial Services (Pty) Ltd"
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Company Registration Number</label>
                    <input
                      type="text"
                      value={newCustRegNumber}
                      onChange={e => setNewCustRegNumber(e.target.value)}
                      placeholder="e.g. 2018/192837/07 or 12345678"
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Tax / VAT Number</label>
                    <input
                      type="text"
                      value={newCustVatNumber}
                      onChange={e => setNewCustVatNumber(e.target.value)}
                      placeholder="e.g. 4820192837"
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Country / Jurisdiction</label>
                    <select
                      value={newCustCountry}
                      onChange={e => setNewCustCountry(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="South Africa (ZA)">South Africa (ZA) - POPIA</option>
                      <option value="United Kingdom (UK)">United Kingdom (UK) - UK GDPR</option>
                      <option value="European Union (EU)">European Union (EU) - EU GDPR</option>
                      <option value="United States (US)">United States (US)</option>
                      <option value="Global (Multi-Jurisdiction)">Global (Multi-Jurisdiction)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Industry Sector</label>
                    <select
                      value={newCustIndustry}
                      onChange={e => setNewCustIndustry(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="Financial Services">Financial Services & Banking</option>
                      <option value="Education & EdTech">Education & EdTech</option>
                      <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                      <option value="Legal & Advisory">Legal & Advisory</option>
                      <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                      <option value="Software & SaaS">Software & SaaS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Service Tier & AI Quotas */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider">
                  3. Service Tier & API Rate Limits
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Customer Tier</label>
                    <select
                      value={newCustTier}
                      onChange={e => setNewCustTier(e.target.value as CustomerTier)}
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="enterprise">Enterprise (SLA 99.99%)</option>
                      <option value="scale">Scale (High Throughput)</option>
                      <option value="growth">Growth (Standard)</option>
                      <option value="starter">Starter (Basic)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Monthly AI Budget ($ USD)</label>
                    <input
                      type="number"
                      value={newCustBudget}
                      onChange={e => setNewCustBudget(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Rate Limit (Requests / Min)</label>
                    <input
                      type="number"
                      value={newCustRpm}
                      onChange={e => setNewCustRpm(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Contact */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider">
                  4. Primary Executive Contact
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Contact Full Name</label>
                    <input
                      type="text"
                      value={newContactName}
                      onChange={e => setNewContactName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Contact Email Address</label>
                    <input
                      type="email"
                      value={newContactEmail}
                      onChange={e => setNewContactEmail(e.target.value)}
                      placeholder="e.g. jdoe@company.com"
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={newContactPhone}
                      onChange={e => setNewContactPhone(e.target.value)}
                      placeholder="e.g. +27 11 234 5678"
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#888888] mb-1">Designation / Executive Role</label>
                    <input
                      type="text"
                      value={newContactRole}
                      onChange={e => setNewContactRole(e.target.value)}
                      placeholder="e.g. Chief Technology Officer"
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Statutory Officers (POPIA / GDPR) */}
              <div className="space-y-3 bg-[#181818] border border-[#262626] rounded p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    5. Statutory Regulatory Officers (POPIA / GDPR)
                  </label>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Mandatory for Data Processing Compliance
                  </span>
                </div>

                {/* POPIA IO */}
                <div className="space-y-2 pt-2 border-t border-[#222222]">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="checkbox-has-io"
                      checked={hasInfoOfficer}
                      onChange={e => setHasInfoOfficer(e.target.checked)}
                      className="rounded bg-[#222222] border-[#333333] text-blue-600 focus:ring-0"
                    />
                    <label htmlFor="checkbox-has-io" className="text-xs font-bold text-white">
                      Nominate POPIA Statutory Information Officer (Section 55/56)
                    </label>
                  </div>

                  {hasInfoOfficer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                      <div>
                        <label className="block text-[11px] text-[#888888] mb-0.5">Officer Full Name</label>
                        <input
                          type="text"
                          value={ioName}
                          onChange={e => setIoName(e.target.value)}
                          placeholder="e.g. Adv. Sipho Ndlovu"
                          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#888888] mb-0.5">Officer Designation</label>
                        <input
                          type="text"
                          value={ioDesignation}
                          onChange={e => setIoDesignation(e.target.value)}
                          placeholder="e.g. Head of Compliance / Information Officer"
                          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#888888] mb-0.5">Information Regulator Reg No.</label>
                        <input
                          type="text"
                          value={ioRegNumber}
                          onChange={e => setIoRegNumber(e.target.value)}
                          placeholder="e.g. IR-ZA-2025-IO-99128"
                          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#888888] mb-0.5">Deputy Officer Name (Optional)</label>
                        <input
                          type="text"
                          value={ioDeputyName}
                          onChange={e => setIoDeputyName(e.target.value)}
                          placeholder="e.g. Mark Stevens"
                          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* GDPR DPO */}
                <div className="space-y-2 pt-2 border-t border-[#222222]">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="checkbox-has-dpo"
                      checked={hasDpo}
                      onChange={e => setHasDpo(e.target.checked)}
                      className="rounded bg-[#222222] border-[#333333] text-blue-600 focus:ring-0"
                    />
                    <label htmlFor="checkbox-has-dpo" className="text-xs font-bold text-white">
                      Nominate GDPR Data Protection Officer (Art 37)
                    </label>
                  </div>

                  {hasDpo && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                      <div>
                        <label className="block text-[11px] text-[#888888] mb-0.5">DPO Full Name / Organization</label>
                        <input
                          type="text"
                          value={dpoName}
                          onChange={e => setDpoName(e.target.value)}
                          placeholder="e.g. Dr. Elena Vance"
                          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#888888] mb-0.5">DPO Type</label>
                        <select
                          value={dpoType}
                          onChange={e => setDpoType(e.target.value as 'internal' | 'external')}
                          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                        >
                          <option value="internal">Internal Employee DPO</option>
                          <option value="external">External DPO as a Service (DPOaaS)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#888888] mb-0.5">Lead Supervisory Authority</label>
                        <input
                          type="text"
                          value={dpoAuthority}
                          onChange={e => setDpoAuthority(e.target.value)}
                          placeholder="e.g. Irish Data Protection Commission (DPC)"
                          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#888888] mb-0.5">DPO Official Registration No.</label>
                        <input
                          type="text"
                          value={dpoRegNumber}
                          onChange={e => setDpoRegNumber(e.target.value)}
                          placeholder="e.g. EU-DPO-90218"
                          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Initial Connected App Provisioning */}
              {!editingCustomer && (
                <div className="space-y-3 bg-[#181818] border border-[#262626] rounded p-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="checkbox-auto-app"
                      checked={autoCreateApp}
                      onChange={e => setAutoCreateApp(e.target.checked)}
                      className="rounded bg-[#222222] border-[#333333] text-blue-600 focus:ring-0"
                    />
                    <label htmlFor="checkbox-auto-app" className="text-xs font-bold text-white">
                      Auto-provision initial Application & Customer Production API Key
                    </label>
                  </div>

                  {autoCreateApp && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                      <div>
                        <label className="block text-[11px] text-[#888888] mb-0.5">Application Name</label>
                        <input
                          type="text"
                          value={initialAppName}
                          onChange={e => setInitialAppName(e.target.value)}
                          placeholder={newCustName ? `${newCustName} Production Core` : 'Production Core'}
                          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#888888] mb-0.5">Application Identifier (slug)</label>
                        <input
                          type="text"
                          value={initialAppIdentifier}
                          onChange={e => setInitialAppIdentifier(e.target.value)}
                          placeholder={newCustName ? newCustName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'app-client'}
                          className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-xs text-white outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2a2a2a] text-xs font-medium text-[#cccccc] rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
                >
                  {editingCustomer ? 'Update Customer Record' : 'Activate & Onboard Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: USER MANAGEMENT (CRUD FOR CUSTOMER TEAM MEMBERS)                  */}
      {/* ========================================================================= */}
      {managingUsersCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Team Members & Access Control: {managingUsersCustomer.name}
                  </h2>
                  <p className="text-xs text-[#888888]">
                    Manage tenant user accounts, roles (Owner, Admin, Developer, Compliance Officer), and MFA security status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManagingUsersCustomer(null)}
                className="text-[#777777] hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Users List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Authorized Users ({managingUsersCustomer.users?.length || 0})
                </span>
                <button
                  id="btn-add-tenant-user"
                  onClick={() => {
                    setEditingUser(null);
                    setUserName('');
                    setUserEmail('');
                    setUserDesignation('');
                    setUserRole('developer');
                    setUserMfa(true);
                    setUserStatus('active');
                    setNewUserModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>

              <div className="divide-y divide-[#222222] border border-[#222222] rounded bg-[#161616]">
                {managingUsersCustomer.users && managingUsersCustomer.users.length > 0 ? (
                  managingUsersCustomer.users.map(u => (
                    <div key={u.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{u.name}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-bold uppercase rounded border ${
                              u.role === 'owner'
                                ? 'bg-purple-950 text-purple-300 border-purple-800'
                                : u.role === 'admin'
                                ? 'bg-blue-950 text-blue-300 border-blue-800'
                                : u.role === 'compliance_officer'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-[#222222] text-[#aaaaaa] border-[#333333]'
                            }`}
                          >
                            {u.role.replace('_', ' ')}
                          </span>
                          {u.mfaEnabled && (
                            <span className="px-1 py-0.2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded text-[8px] font-mono">
                              MFA Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#777777] font-mono flex items-center gap-2">
                          <span>{u.email}</span>
                          {u.designation && <span>• {u.designation}</span>}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditUserClick(u)}
                          className="p-1.5 text-[#888888] hover:text-white rounded"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.role !== 'owner' && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove user ${u.name} from customer organization?`)) {
                                onDeleteUser(managingUsersCustomer.id, u.id);
                              }
                            }}
                            className="p-1.5 text-[#888888] hover:text-red-400 rounded"
                            title="Remove User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-[#666666] italic">
                    No users registered in this tenant organization yet.
                  </div>
                )}
              </div>
            </div>

            {/* Nested Add/Edit User Sub-Form */}
            {newUserModalOpen && (
              <form onSubmit={handleSaveUser} className="p-4 bg-[#181818] border border-[#2a2a2a] rounded space-y-3">
                <div className="text-xs font-bold text-white pb-2 border-b border-[#222222]">
                  {editingUser ? 'Edit Member Details' : 'Add New Member'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#888888] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="e.g. Sipho Sithole"
                      className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-purple-500 rounded px-3 py-1.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#888888] mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={e => setUserEmail(e.target.value)}
                      placeholder="e.g. ssithole@customer.com"
                      className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-purple-500 rounded px-3 py-1.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#888888] mb-1">Role</label>
                    <select
                      value={userRole}
                      onChange={e => setUserRole(e.target.value as UserRole)}
                      className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-purple-500 rounded px-3 py-1.5 text-white outline-none"
                    >
                      <option value="owner">Owner (Full Tenant Control)</option>
                      <option value="admin">Admin (Keys & Apps Manager)</option>
                      <option value="compliance_officer">Compliance Officer (DSAR & Audit Logs)</option>
                      <option value="developer">Developer (Inference API Only)</option>
                      <option value="auditor">Auditor (Read-Only Logs)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#888888] mb-1">Job Designation</label>
                    <input
                      type="text"
                      value={userDesignation}
                      onChange={e => setUserDesignation(e.target.value)}
                      placeholder="e.g. Senior Lead Architect"
                      className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-purple-500 rounded px-3 py-1.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="checkbox-user-mfa"
                    checked={userMfa}
                    onChange={e => setUserMfa(e.target.checked)}
                    className="rounded bg-[#222222] border-[#333333] text-purple-600 focus:ring-0"
                  />
                  <label htmlFor="checkbox-user-mfa" className="text-xs text-[#cccccc]">
                    Enforce Multi-Factor Authentication (MFA / TOTP)
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewUserModalOpen(false)}
                    className="px-3 py-1.5 bg-[#222222] hover:bg-[#2a2a2a] text-xs text-[#888888] rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold shadow-lg transition-all"
                  >
                    {editingUser ? 'Save User' : 'Add User'}
                  </button>
                </div>
              </form>
            )}

            <div className="flex justify-end pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setManagingUsersCustomer(null)}
                className="px-4 py-2 bg-[#222222] hover:bg-[#2a2a2a] text-xs font-medium text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: STATUTORY OFFICERS REGISTRATION (POPIA IO & GDPR DPO)            */}
      {/* ========================================================================= */}
      {managingOfficersCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Statutory Regulatory Nominations: {managingOfficersCustomer.name}
                  </h2>
                  <p className="text-xs text-[#888888]">
                    Designate formal statutory Information Officers (POPIA) and Data Protection Officers (GDPR).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManagingOfficersCustomer(null)}
                className="text-[#777777] hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatutoryOfficers} className="space-y-4">
              {/* POPIA Section */}
              <div className="p-4 bg-[#181818] border border-[#262626] rounded space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    POPIA Statutory Information Officer Registration
                  </span>
                  <input
                    type="checkbox"
                    id="io-enable-check"
                    checked={hasInfoOfficer}
                    onChange={e => setHasInfoOfficer(e.target.checked)}
                    className="rounded bg-[#222222] border-[#333333] text-emerald-600 focus:ring-0"
                  />
                </div>

                {hasInfoOfficer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#222222]">
                    <div>
                      <label className="block text-[#888888] mb-1">Information Officer Name *</label>
                      <input
                        type="text"
                        required={hasInfoOfficer}
                        value={ioName}
                        onChange={e => setIoName(e.target.value)}
                        placeholder="e.g. Adv. Sipho Ndlovu"
                        className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-emerald-500 rounded px-3 py-1.5 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#888888] mb-1">Official Email *</label>
                      <input
                        type="email"
                        required={hasInfoOfficer}
                        value={ioEmail}
                        onChange={e => setIoEmail(e.target.value)}
                        placeholder="e.g. information.officer@customer.com"
                        className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-emerald-500 rounded px-3 py-1.5 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#888888] mb-1">Direct Phone</label>
                      <input
                        type="text"
                        value={ioPhone}
                        onChange={e => setIoPhone(e.target.value)}
                        placeholder="e.g. +27 11 234 5678"
                        className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-emerald-500 rounded px-3 py-1.5 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#888888] mb-1">Official Designation</label>
                      <input
                        type="text"
                        value={ioDesignation}
                        onChange={e => setIoDesignation(e.target.value)}
                        placeholder="e.g. Chief Risk & Information Officer"
                        className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-emerald-500 rounded px-3 py-1.5 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#888888] mb-1">Information Regulator Registration No.</label>
                      <input
                        type="text"
                        value={ioRegNumber}
                        onChange={e => setIoRegNumber(e.target.value)}
                        placeholder="e.g. IR-ZA-2025-IO-99128"
                        className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-emerald-500 rounded px-3 py-1.5 text-white outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[#888888] mb-1">Deputy Information Officer</label>
                      <input
                        type="text"
                        value={ioDeputyName}
                        onChange={e => setIoDeputyName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-emerald-500 rounded px-3 py-1.5 text-white outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* GDPR DPO Section */}
              <div className="p-4 bg-[#181818] border border-[#262626] rounded space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    GDPR Data Protection Officer (DPO) Registration
                  </span>
                  <input
                    type="checkbox"
                    id="dpo-enable-check"
                    checked={hasDpo}
                    onChange={e => setHasDpo(e.target.checked)}
                    className="rounded bg-[#222222] border-[#333333] text-blue-600 focus:ring-0"
                  />
                </div>

                {hasDpo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#222222]">
                    <div>
                      <label className="block text-[#888888] mb-1">DPO Name / Consultancy *</label>
                      <input
                        type="text"
                        required={hasDpo}
                        value={dpoName}
                        onChange={e => setDpoName(e.target.value)}
                        placeholder="e.g. Dr. Elena Vance"
                        className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#888888] mb-1">Official DPO Email *</label>
                      <input
                        type="email"
                        required={hasDpo}
                        value={dpoEmail}
                        onChange={e => setDpoEmail(e.target.value)}
                        placeholder="e.g. dpo@customer.com"
                        className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#888888] mb-1">DPO Structure</label>
                      <select
                        value={dpoType}
                        onChange={e => setDpoType(e.target.value as 'internal' | 'external')}
                        className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-white outline-none"
                      >
                        <option value="internal">Internal Employee</option>
                        <option value="external">External DPO as a Service (DPOaaS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#888888] mb-1">Lead Supervisory Authority</label>
                      <input
                        type="text"
                        value={dpoAuthority}
                        onChange={e => setDpoAuthority(e.target.value)}
                        placeholder="e.g. Irish Data Protection Commission (DPC)"
                        className="w-full bg-[#141414] border border-[#2a2a2a] focus:border-blue-500 rounded px-3 py-1.5 text-white outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setManagingOfficersCustomer(null)}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2a2a2a] text-xs font-medium text-[#cccccc] rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
                >
                  Save Statutory Registrations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: GENERATE HIGH-ENTROPY API KEY FOR CUSTOMER                       */}
      {/* ========================================================================= */}
      {generatingKeyForCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Generate Customer API Key: {generatingKeyForCustomer.name}
                  </h2>
                  <p className="text-xs text-[#888888]">
                    Cryptographically secure, zero-trust token tied strictly to this tenant and their connected applications.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGeneratingKeyForCustomer(null)}
                className="text-[#777777] hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!createdKeyDetails ? (
              <form onSubmit={handleGenerateKeySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-[#888888] mb-1">Key Description / Name *</label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={e => setKeyName(e.target.value)}
                    placeholder="e.g. Production Backend Ingress Key"
                    className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-amber-500 rounded px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#888888] mb-1">Bind to Application</label>
                    <select
                      value={keyAppId}
                      onChange={e => setKeyAppId(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-amber-500 rounded px-3 py-1.5 text-white outline-none"
                    >
                      <option value="all">All Customer Connected Applications</option>
                      {applications
                        .filter(a => generatingKeyForCustomer.connectedAppIds.includes(a.id) || a.customerId === generatingKeyForCustomer.id)
                        .map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.environment})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#888888] mb-1">Rate Limit (RPM)</label>
                    <input
                      type="number"
                      value={keyRpm}
                      onChange={e => setKeyRpm(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-amber-500 rounded px-3 py-1.5 text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[#888888] mb-1">Expiration Period</label>
                    <select
                      value={keyExpiresDays}
                      onChange={e => setKeyExpiresDays(Number(e.target.value))}
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-amber-500 rounded px-3 py-1.5 text-white outline-none"
                    >
                      <option value={30}>30 Days</option>
                      <option value={90}>90 Days</option>
                      <option value={180}>180 Days</option>
                      <option value={365}>1 Year (Recommended)</option>
                      <option value={0}>Never Expires</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#888888] mb-1">Security Scopes</label>
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="px-2 py-0.5 bg-[#222222] text-[#cccccc] rounded text-[11px] font-mono">
                        read:inference
                      </span>
                      <span className="px-2 py-0.5 bg-[#222222] text-[#cccccc] rounded text-[11px] font-mono">
                        read:models
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#888888] mb-1">
                    IP Whitelist CIDR (Optional, one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={keyIpWhitelist}
                    onChange={e => setKeyIpWhitelist(e.target.value)}
                    placeholder="e.g. 196.25.1.0/24&#10;10.0.4.18"
                    className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-amber-500 rounded px-3 py-1.5 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#222222]">
                  <button
                    type="button"
                    onClick={() => setGeneratingKeyForCustomer(null)}
                    className="px-4 py-2 bg-[#222222] hover:bg-[#2a2a2a] text-xs font-medium text-[#cccccc] rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all flex items-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Generate & Issue Key</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Success Screen displaying the raw key */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>API Key Successfully Created</span>
                  </div>
                  <p className="text-xs text-[#cccccc]">
                    Please copy this key now. For your security, this raw secret token will not be displayed again.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#aaaaaa]">Customer Secret Key:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={createdKeyDetails.key || createdKeyDetails.prefix}
                      className="w-full bg-[#181818] border border-emerald-500/50 rounded px-3 py-2 text-xs font-mono text-emerald-400 select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          createdKeyDetails.key || createdKeyDetails.prefix,
                          'created-key'
                        )
                      }
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKeyId === 'created-key' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#181818] p-3 rounded border border-[#262626] space-y-1.5 text-xs text-[#888888]">
                  <div className="font-semibold text-white">How to consume the API:</div>
                  <div className="font-mono text-[11px] bg-[#121212] p-2 rounded text-[#cccccc] overflow-x-auto">
                    curl -X POST https://gateway.altil.internal/api/v1/orchestrate \<br />
                    &nbsp;&nbsp;-H "Authorization: Bearer {createdKeyDetails.prefix.slice(0, 14)}..." \<br />
                    &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                    &nbsp;&nbsp;-d '&#123;"prompt": "Hello", "capability": "general_ai"&#125;'
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#222222]">
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratingKeyForCustomer(null);
                      setCreatedKeyDetails(null);
                    }}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BILLING & INVOICE PREVIEW MODAL */}
      {billingModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111111] border border-[#222222] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-[#e5e5e5]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] sticky top-0 bg-[#111111] z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Billing, Credits & Invoices: {billingModalCustomer.name}
                  </h2>
                  <p className="text-xs text-[#888888]">
                    Structured billing cycles, credit balance ledger, and real-time invoice previews.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBillingModalCustomer(null)}
                className="text-[#888888] hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Tabs */}
              <div className="flex bg-[#161616] p-1 rounded border border-[#222222] text-xs font-medium">
                <button
                  onClick={() => setBillingTab('invoice')}
                  className={`flex-1 py-2 rounded transition-colors flex items-center justify-center gap-1.5 ${
                    billingTab === 'invoice' ? 'bg-cyan-600 text-white font-semibold' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Invoice Preview</span>
                </button>
                <button
                  onClick={() => setBillingTab('credits')}
                  className={`flex-1 py-2 rounded transition-colors flex items-center justify-center gap-1.5 ${
                    billingTab === 'credits' ? 'bg-cyan-600 text-white font-semibold' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Credit Balance Ledger</span>
                </button>
                <button
                  onClick={() => setBillingTab('config')}
                  className={`flex-1 py-2 rounded transition-colors flex items-center justify-center gap-1.5 ${
                    billingTab === 'config' ? 'bg-cyan-600 text-white font-semibold' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Billing Cycle Config</span>
                </button>
              </div>

              {/* Tab 1: Invoice Preview */}
              {billingTab === 'invoice' && (
                <div className="space-y-4">
                  {loadingInvoice ? (
                    <div className="py-12 text-center text-xs text-[#888888] animate-pulse">
                      Generating structured invoice preview...
                    </div>
                  ) : invoicePreviewData ? (
                    <div className="bg-[#181818] border border-[#2a2a2a] rounded p-6 space-y-6 text-xs">
                      {/* Invoice Header */}
                      <div className="flex items-start justify-between border-b border-[#262626] pb-4">
                        <div>
                          <div className="font-bold text-sm text-white font-mono">INTROSOFT ALTIL CLOUD INVOICE</div>
                          <div className="text-[#888888] mt-0.5">Invoice #{invoicePreviewData.invoiceNumber}</div>
                          <div className="text-[#888888]">Cycle: {invoicePreviewData.billingCycle}</div>
                        </div>
                        <div className="text-right">
                          <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded uppercase font-mono font-bold inline-block">
                            {invoicePreviewData.status}
                          </div>
                          <div className="text-[#888888] mt-1">Issued: {invoicePreviewData.issueDate}</div>
                          <div className="text-[#888888]">Due Date: {invoicePreviewData.dueDate}</div>
                        </div>
                      </div>

                      {/* Customer Bill-To */}
                      <div className="grid grid-cols-2 gap-4 bg-[#121212] p-3 rounded border border-[#222222]">
                        <div>
                          <div className="text-[#888888] uppercase font-mono text-[10px]">Billed To:</div>
                          <div className="font-bold text-white mt-1">{invoicePreviewData.customerName}</div>
                          <div className="text-[#888888]">{invoicePreviewData.customerAddress}</div>
                          <div className="text-[#888888] font-mono mt-0.5">Tax / VAT: {invoicePreviewData.taxVatNumber}</div>
                        </div>
                        <div>
                          <div className="text-[#888888] uppercase font-mono text-[10px]">Payment Terms:</div>
                          <div className="font-bold text-white mt-1">Net 30 Days (Wire / EFT / Auto-Charge)</div>
                          <div className="text-[#888888] mt-0.5">Currency: USD ($)</div>
                        </div>
                      </div>

                      {/* Line Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-[#262626] text-[#888888] font-mono uppercase text-[10px]">
                              <th className="pb-2">Description</th>
                              <th className="pb-2 text-right">Qty</th>
                              <th className="pb-2 text-right">Unit Price</th>
                              <th className="pb-2 text-right">Total (USD)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#222222] font-mono">
                            {invoicePreviewData.lineItems.map(item => (
                              <tr key={item.id}>
                                <td className="py-2.5 text-[#cccccc] font-sans">{item.description}</td>
                                <td className="py-2.5 text-right">{item.quantity.toLocaleString()}</td>
                                <td className="py-2.5 text-right">${item.unitPriceUsd.toFixed(2)}</td>
                                <td className="py-2.5 text-right font-bold text-white">${item.totalUsd.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals Summary */}
                      <div className="flex justify-end pt-2 border-t border-[#262626]">
                        <div className="w-64 space-y-2 font-mono">
                          <div className="flex justify-between text-[#888888]">
                            <span>Subtotal:</span>
                            <span>${invoicePreviewData.subtotalUsd.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[#888888]">
                            <span>Statutory Tax (VAT/GST):</span>
                            <span>${invoicePreviewData.taxUsd.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-cyan-400">
                            <span>Credits Applied:</span>
                            <span>-${invoicePreviewData.creditsAppliedUsd.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-[#333333]">
                            <span>Total Due:</span>
                            <span className="text-emerald-400">${invoicePreviewData.totalDueUsd.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[#262626]">
                        <span className="text-[#888888]">Auto-generated securely by Introsoft ALTIL Billing Engine</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => alert(`Simulated downloading PDF invoice ${invoicePreviewData.invoiceNumber}`)}
                            className="px-3.5 py-1.5 bg-[#222222] hover:bg-[#2a2a2a] text-white rounded font-medium transition-colors"
                          >
                            Download PDF
                          </button>
                          <button
                            onClick={() => alert(`Simulated emailing invoice to ${billingModalCustomer.primaryContact.email}`)}
                            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition-colors"
                          >
                            Email Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-[#888888] py-8">Unable to load invoice preview.</div>
                  )}
                </div>
              )}

              {/* Tab 2: Credit Balance Ledger */}
              {billingTab === 'credits' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#181818] border border-[#2a2a2a] rounded p-4 space-y-1">
                      <div className="text-xs text-[#888888]">Current Credit Balance</div>
                      <div className="text-2xl font-bold text-cyan-400 font-mono">
                        ${billingModalCustomer.billingConfig?.creditBalanceUsd?.toLocaleString() || '1,500.00'} USD
                      </div>
                      <div className="text-[11px] text-[#666666]">Available for offset against usage invoices</div>
                    </div>
                    <div className="bg-[#181818] border border-[#2a2a2a] rounded p-4 space-y-1">
                      <div className="text-xs text-[#888888]">Credit Limit / Overdraft Facility</div>
                      <div className="text-2xl font-bold text-white font-mono">
                        ${billingModalCustomer.billingConfig?.creditLimitUsd?.toLocaleString() || '5,000.00'} USD
                      </div>
                      <div className="text-[11px] text-emerald-500/80">Overage Allowed: {billingModalCustomer.billingConfig?.overageAllowed ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  </div>

                  <div className="bg-[#161616] p-4 rounded border border-[#222222] space-y-3">
                    <div className="text-xs font-semibold text-white">Adjust Tenant Credits</div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        defaultValue={500}
                        id="credit-topup-amount"
                        className="bg-[#1e1e1e] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white outline-none font-mono w-40"
                      />
                      <button
                        onClick={async () => {
                          const inputVal = (document.getElementById('credit-topup-amount') as HTMLInputElement)?.value;
                          const amt = Number(inputVal) || 0;
                          const currentBal = billingModalCustomer.billingConfig?.creditBalanceUsd || 0;
                          const newBal = currentBal + amt;
                          const updatedConfig = {
                            ...(billingModalCustomer.billingConfig || {}),
                            creditBalanceUsd: newBal
                          };
                          await onUpdateCustomer(billingModalCustomer.id, { billingConfig: updatedConfig });
                          setBillingModalCustomer({
                            ...billingModalCustomer,
                            billingConfig: updatedConfig as any
                          });
                          alert(`Successfully added $${amt} credits to ${billingModalCustomer.name}. New balance: $${newBal}`);
                        }}
                        className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition-colors"
                      >
                        Add Credits (Top-Up)
                      </button>
                      <button
                        onClick={async () => {
                          const inputVal = (document.getElementById('credit-topup-amount') as HTMLInputElement)?.value;
                          const amt = Number(inputVal) || 0;
                          const currentBal = billingModalCustomer.billingConfig?.creditBalanceUsd || 0;
                          const newBal = Math.max(0, currentBal - amt);
                          const updatedConfig = {
                            ...(billingModalCustomer.billingConfig || {}),
                            creditBalanceUsd: newBal
                          };
                          await onUpdateCustomer(billingModalCustomer.id, { billingConfig: updatedConfig });
                          setBillingModalCustomer({
                            ...billingModalCustomer,
                            billingConfig: updatedConfig as any
                          });
                          alert(`Successfully deducted $${amt} credits. New balance: $${newBal}`);
                        }}
                        className="px-4 py-1.5 bg-[#222222] hover:bg-[#2a2a2a] text-[#cccccc] hover:text-white rounded text-xs font-semibold transition-colors"
                      >
                        Deduct Credits
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Billing Cycle Config */}
              {billingTab === 'config' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#888888] mb-1">Billing Cycle</label>
                      <select
                        defaultValue={billingModalCustomer.billingConfig?.billingCycle || 'monthly'}
                        id="billing-cycle-select"
                        className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded px-3 py-2 outline-none font-medium"
                      >
                        <option value="monthly">Monthly Recurring</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual (15% Discount)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#888888] mb-1">Payment Method</label>
                      <select
                        defaultValue={billingModalCustomer.billingConfig?.paymentMethod || 'invoice'}
                        id="payment-method-select"
                        className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded px-3 py-2 outline-none font-medium"
                      >
                        <option value="invoice">Bank Wire / EFT Invoice</option>
                        <option value="credit_card">Stored Credit Card (Stripe)</option>
                        <option value="prepaid">Prepaid Credit Balance</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#888888] mb-1">Next Billing Date</label>
                      <input
                        type="date"
                        defaultValue={billingModalCustomer.billingConfig?.nextBillingDate || '2026-09-30'}
                        id="next-billing-date"
                        className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded px-3 py-2 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[#888888] mb-1">Billing Email Contact</label>
                      <input
                        type="email"
                        defaultValue={billingModalCustomer.billingConfig?.billingEmail || billingModalCustomer.primaryContact.email}
                        id="billing-email-input"
                        className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded px-3 py-2 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-[#222222]">
                    <button
                      onClick={async () => {
                        const cycle = (document.getElementById('billing-cycle-select') as HTMLSelectElement)?.value as any;
                        const method = (document.getElementById('payment-method-select') as HTMLSelectElement)?.value as any;
                        const nextDate = (document.getElementById('next-billing-date') as HTMLInputElement)?.value;
                        const bEmail = (document.getElementById('billing-email-input') as HTMLInputElement)?.value;

                        const updatedConfig = {
                          ...(billingModalCustomer.billingConfig || {}),
                          billingCycle: cycle,
                          paymentMethod: method,
                          nextBillingDate: nextDate,
                          billingEmail: bEmail
                        };
                        await onUpdateCustomer(billingModalCustomer.id, { billingConfig: updatedConfig });
                        setBillingModalCustomer({
                          ...billingModalCustomer,
                          billingConfig: updatedConfig as any
                        });
                        alert('Billing configuration updated successfully.');
                      }}
                      className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition-colors"
                    >
                      Save Billing Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
