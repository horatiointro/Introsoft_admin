import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  KeyRound,
  AppWindow,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Globe2,
  Lock,
  Layers,
  FileCheck,
  Briefcase,
  ChevronRight,
  Plus,
  X,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';
import { ProvenanceBadge } from './ProvenanceBadge';

export interface CustomerOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
  currentUser?: { name: string; email: string; role: string; tenant: string };
}

export type WizardStep =
  | 'relationship'
  | 'identity'
  | 'parent_org'
  | 'primary_admin'
  | 'governance'
  | 'products'
  | 'commercial_terms'
  | 'billing'
  | 'application'
  | 'api_access'
  | 'review'
  | 'activating';

export const CustomerOnboardingWizard: React.FC<CustomerOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser = { name: 'Horatio Huxham', email: 'horatio.huxham@gmail.com', role: 'Global Super Admin', tenant: 'Total Company Scope' }
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('relationship');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Available Upline Parent Organizations
  const [parentOrgs, setParentOrgs] = useState<Array<{ id: string; name: string; organization_type: string }>>([
    { id: 'org-introsoft-root', name: 'Introsoft International (Root)', organization_type: 'INTROSOFT' }
  ]);

  // Available Catalogue Products
  const [catalogueProducts, setCatalogueProducts] = useState<Array<{ id: string; name: string; sku: string; price: number; currency: string; description: string; category: string }>>([
    { id: 'prod-ai-seat', name: 'Secure AI Access · Single User', sku: 'AI-SEAT-1', price: 85, currency: 'ZAR', description: 'Governed AI access with tenant API key controls and default guardrails.', category: 'access' },
    { id: 'prod-privacy', name: 'POPIA + GDPR Compliance Workspace', sku: 'PRIVACY-CORE', price: 247, currency: 'ZAR', description: 'Privacy operations workspace, DSAR tracking, and statutory records.', category: 'compliance' },
    { id: 'prod-team-5', name: 'Secure Team · 5 Users Pack', sku: 'TEAM-5', price: 599, currency: 'ZAR', description: 'Five governed AI seats with shared administration and core guardrails.', category: 'bundle' },
    { id: 'prod-team-10', name: 'Secure Team · 10 Users Pack', sku: 'TEAM-10', price: 974, currency: 'ZAR', description: 'Ten governed AI seats with shared administration and core guardrails.', category: 'bundle' },
    { id: 'prod-api-key', name: 'Managed API Gateway Key', sku: 'API-KEY-MONTH', price: 25, currency: 'ZAR', description: 'Monthly key governance, rotation, scoped access, and lifecycle controls.', category: 'platform' },
    { id: 'prod-inference-margin', name: 'Provider Inference · Cost Plus', sku: 'INFERENCE-COST-PLUS', price: 0, currency: 'USD', description: 'Metered provider inference with 20% platform margin.', category: 'usage' }
  ]);

  // Form State
  const [relationshipType, setRelationshipType] = useState<'SUBSIDIARY' | 'PARTNER' | 'DIRECT_CUSTOMER'>('DIRECT_CUSTOMER');
  const [organizationName, setOrganizationName] = useState('');
  const [customerType, setCustomerType] = useState<'company' | 'individual'>('company');
  const [legalName, setLegalName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxVatNumber, setTaxVatNumber] = useState('');
  const [country, setCountry] = useState('South Africa (ZA)');
  const [industry, setIndustry] = useState('Financial Services');

  const [parentOrganizationId, setParentOrganizationId] = useState('org-introsoft-root');

  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminDesignation, setAdminDesignation] = useState('Chief Technology Officer');

  // Statutory Governance (POPIA / GDPR)
  const [enableInfoOfficer, setEnableInfoOfficer] = useState(true);
  const [ioName, setIoName] = useState('');
  const [ioEmail, setIoEmail] = useState('');
  const [ioPhone, setIoPhone] = useState('');
  const [ioRegNumber, setIoRegNumber] = useState('');

  const [enableDpo, setEnableDpo] = useState(false);
  const [dpoName, setDpoName] = useState('');
  const [dpoEmail, setDpoEmail] = useState('');
  const [dpoAuthority, setDpoAuthority] = useState('Information Regulator (South Africa)');
  const [dpoRegNumber, setDpoRegNumber] = useState('');

  // Selected Products & Licensing
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['prod-ai-seat', 'prod-privacy']);
  const [tier, setTier] = useState<'starter' | 'growth' | 'scale' | 'enterprise'>('growth');
  const [currency, setCurrency] = useState('USD');
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState(2500);
  const [rateLimitRpm, setRateLimitRpm] = useState(240);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [invoiceDay, setInvoiceDay] = useState(24);
  const [licenseExpiryOption, setLicenseExpiryOption] = useState<'30d' | '60d' | '90d' | '12m' | 'never'>('12m');

  // Application & Key
  const [appName, setAppName] = useState('');
  const [capabilityType, setCapabilityType] = useState('General_AI');
  const [keyName, setKeyName] = useState('Primary Production Key');
  const [keyScopes, setKeyScopes] = useState<string[]>(['inference:chat', 'inference:stream', 'models:read', 'policies:enforce']);

  // Activation Result
  const [activationResult, setActivationResult] = useState<any | null>(null);

  // Fetch Parent Organizations on load
  useEffect(() => {
    if (!isOpen) return;
    async function loadParents() {
      try {
        const res = await apiFetch('/api/v1/commercial/hierarchy/parents');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.parents) && data.parents.length > 0) {
            setParentOrgs(data.parents);
            setParentOrganizationId(data.parents[0].id);
          }
        }
      } catch (e) {
        console.warn('Using default root organization parent.');
      }
    }
    loadParents();
  }, [isOpen]);

  // Auto-fill app name when org name changes
  useEffect(() => {
    if (organizationName && !appName) {
      setAppName(`${organizationName} AI Core Ingress`);
    }
  }, [organizationName, appName]);

  if (!isOpen) return null;

  const STEPS: { id: WizardStep; title: string; label: string; icon: any }[] = [
    { id: 'relationship', title: 'Relationship Type', label: '1. Role', icon: Building2 },
    { id: 'identity', title: 'Organization Identity', label: '2. Identity', icon: Globe2 },
    { id: 'parent_org', title: 'Parent Authority', label: '3. Hierarchy', icon: Layers },
    { id: 'primary_admin', title: 'Primary Administrator', label: '4. Admin', icon: Users },
    { id: 'governance', title: 'Statutory Governance', label: '5. Officers', icon: ShieldCheck },
    { id: 'products', title: 'Product Catalogue', label: '6. Products', icon: CreditCard },
    { id: 'commercial_terms', title: 'Pricing & Tiers', label: '7. Pricing', icon: CreditCard },
    { id: 'billing', title: 'Billing Arrangement', label: '8. Billing', icon: Briefcase },
    { id: 'application', title: 'AI Application', label: '9. App', icon: AppWindow },
    { id: 'api_access', title: 'API Credentials', label: '10. Key', icon: KeyRound },
    { id: 'review', title: 'Review & Verify', label: '11. Review', icon: FileCheck },
    { id: 'activating', title: 'Activation', label: '12. Activate', icon: Sparkles }
  ];

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const toggleProduct = (prodId: string) => {
    setSelectedProducts(prev =>
      prev.includes(prodId) ? prev.filter(p => p !== prodId) : [...prev, prodId]
    );
  };

  const toggleScope = (scope: string) => {
    setKeyScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  const handleNext = () => {
    setErrorMsg('');
    if (currentStep === 'relationship') {
      setCurrentStep('identity');
    } else if (currentStep === 'identity') {
      if (!organizationName.trim()) {
        setErrorMsg('Please enter an Organization / Customer Name.');
        return;
      }
      setCurrentStep('parent_org');
    } else if (currentStep === 'parent_org') {
      setCurrentStep('primary_admin');
    } else if (currentStep === 'primary_admin') {
      if (!adminFirstName.trim() || !adminLastName.trim()) {
        setErrorMsg('Please provide the administrator full name.');
        return;
      }
      if (!adminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        setErrorMsg('Please provide a valid administrator email address.');
        return;
      }
      setCurrentStep('governance');
    } else if (currentStep === 'governance') {
      setCurrentStep('products');
    } else if (currentStep === 'products') {
      setCurrentStep('commercial_terms');
    } else if (currentStep === 'commercial_terms') {
      setCurrentStep('billing');
    } else if (currentStep === 'billing') {
      setCurrentStep('application');
    } else if (currentStep === 'application') {
      if (!appName.trim()) {
        setErrorMsg('Please provide an AI application name.');
        return;
      }
      setCurrentStep('api_access');
    } else if (currentStep === 'api_access') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (currentStepIndex > 0 && currentStep !== 'activating') {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleExecuteOnboarding = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        relationshipType,
        parentOrganizationId,
        organizationName,
        customerType,
        displayName: organizationName,
        legalName: legalName || organizationName,
        registrationNumber,
        taxVatNumber,
        country,
        industry,
        adminFirstName,
        adminLastName,
        adminEmail,
        adminPhone,
        adminDesignation,
        informationOfficer: enableInfoOfficer && ioName.trim() ? {
          name: ioName.trim(),
          email: ioEmail.trim() || adminEmail,
          phone: ioPhone.trim() || adminPhone,
          designation: 'Information Officer',
          registrationNumber: ioRegNumber.trim()
        } : undefined,
        dataProtectionOfficer: enableDpo && dpoName.trim() ? {
          name: dpoName.trim(),
          email: dpoEmail.trim() || adminEmail,
          dpoType: 'internal',
          leadSupervisoryAuthority: dpoAuthority,
          registrationNumber: dpoRegNumber.trim()
        } : undefined,
        tier,
        currency,
        monthlyBudgetUsd,
        rateLimitRpm,
        billingCycle,
        invoiceDay,
        selectedProductIds: selectedProducts,
        initialApplicationName: appName,
        capabilityType,
        apiKeyName: keyName,
        apiKeyScopes: keyScopes,
        licenseExpiryOption
      };

      const res = await apiFetch('/api/v1/commercial/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-wizard-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || result.message || 'Onboarding transaction could not be completed.');
      }

      setActivationResult(result);
      setCurrentStep('activating');
      if (onSuccess) onSuccess(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during onboarding execution.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="relative w-full max-w-5xl bg-[#0c0f17] border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-[#121826] via-[#101520] to-[#0c0f17] px-6 py-4 border-b border-white/[.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">ALTIL Commercial Onboarding Wizard</h2>
                <ProvenanceBadge type="LIVE" source="Atomic Control Plane" size="xs" />
              </div>
              <p className="text-xs text-slate-400">12-Step recursive hierarchical organization, customer, administrator &amp; gateway key orchestration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/[.04] hover:bg-white/[.08] text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-black/40 px-6 py-2.5 border-b border-white/[.05] overflow-x-auto">
          <div className="flex items-center space-x-1 min-w-max">
            {STEPS.map((s, index) => {
              const StepIcon = s.icon;
              const isPast = index < currentStepIndex;
              const isCurrent = s.id === currentStep;
              return (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                        : isPast
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-slate-500'
                    }`}
                  >
                    <StepIcon size={12} className={isCurrent ? 'text-cyan-300' : isPast ? 'text-emerald-400' : 'text-slate-600'} />
                    <span>{s.label}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight size={12} className="text-slate-700 mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3 text-red-300 text-xs animate-in fade-in">
              <AlertTriangle size={18} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: RELATIONSHIP TYPE */}
          {currentStep === 'relationship' && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 1: Select Commercial Relationship Type</h3>
                <p className="text-xs text-slate-400 mt-0.5">Determine the organizational standing, commercial rights, and upline/downline authority.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option 1: Direct Customer */}
                <div
                  onClick={() => setRelationshipType('DIRECT_CUSTOMER')}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    relationshipType === 'DIRECT_CUSTOMER'
                      ? 'bg-cyan-500/10 border-cyan-400/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                      : 'bg-black/30 border-white/[.08] hover:border-white/[.20]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-300"><Building2 size={20} /></span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Direct</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Direct Customer</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    End-user corporate client or individual account with discrete project applications and API gateway credentials.
                  </p>
                </div>

                {/* Option 2: Partner / Reseller */}
                <div
                  onClick={() => setRelationshipType('PARTNER')}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    relationshipType === 'PARTNER'
                      ? 'bg-purple-500/10 border-purple-400/60 shadow-lg shadow-purple-500/10 ring-1 ring-purple-400'
                      : 'bg-black/30 border-white/[.08] hover:border-white/[.20]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-lg bg-purple-500/20 text-purple-300"><Users size={20} /></span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">Reseller</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Channel Partner / Reseller</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Authorized distributor capable of creating downstream customers, ordering on their behalf, and managing resale margins.
                  </p>
                </div>

                {/* Option 3: Subsidiary */}
                <div
                  onClick={() => setRelationshipType('SUBSIDIARY')}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    relationshipType === 'SUBSIDIARY'
                      ? 'bg-emerald-500/10 border-emerald-400/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400'
                      : 'bg-black/30 border-white/[.08] hover:border-white/[.20]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300"><Layers size={20} /></span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Branch</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Regional Subsidiary</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Internal corporate entity or subsidiary operating under shared group governance with autonomous sub-tenant administration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: IDENTITY */}
          {currentStep === 'identity' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 2: Identity &amp; Legal Entity Information</h3>
                <p className="text-slate-400 mt-0.5">Establish the legal registration, entity type, and trade designations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Organization / Trading Name *</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={e => setOrganizationName(e.target.value)}
                    placeholder="e.g. Acme Health Corp"
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Classification</label>
                  <select
                    value={customerType}
                    onChange={e => setCustomerType(e.target.value as any)}
                    className="w-full bg-[#141824] border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="company">Corporate / Company</option>
                    <option value="individual">Individual Practitioner / Solo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registered Legal Entity Name</label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={e => setLegalName(e.target.value)}
                    placeholder="e.g. Acme Health Technologies (Pty) Ltd"
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Registration Number</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={e => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. 2023/123456/07"
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">VAT / Tax Identification</label>
                  <input
                    type="text"
                    value={taxVatNumber}
                    onChange={e => setTaxVatNumber(e.target.value)}
                    placeholder="e.g. 4010293847"
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jurisdiction &amp; Country</label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full bg-[#141824] border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="South Africa (ZA)">South Africa (ZA) · POPIA Enforced</option>
                    <option value="European Union (EU)">European Union (EU) · GDPR Enforced</option>
                    <option value="United Kingdom (UK)">United Kingdom (UK) · UK-GDPR</option>
                    <option value="United States (US)">United States (US) · HIPAA / SOC2</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PARENT AUTHORITY */}
          {currentStep === 'parent_org' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 3: Upline Parent Authority</h3>
                <p className="text-slate-400 mt-0.5">Assign the supervising parent node in the recursive hierarchical tree.</p>
              </div>

              <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-3">
                <label className="block text-slate-200 font-semibold">Select Parent Organisation:</label>
                <select
                  value={parentOrganizationId}
                  onChange={e => setParentOrganizationId(e.target.value)}
                  className="w-full bg-[#141824] border border-cyan-500/40 rounded-lg px-3.5 py-2.5 text-white outline-none text-xs font-mono"
                >
                  {parentOrgs.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.organization_type}) [{org.id}]
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <span>The parent node gains administrative oversight and billing management rights over this new entity.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRIMARY ADMIN */}
          {currentStep === 'primary_admin' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 4: Primary Administrator Provisioning</h3>
                <p className="text-slate-400 mt-0.5">Define the primary tenant administrator who will receive the one-time activation credential.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    value={adminFirstName}
                    onChange={e => setAdminFirstName(e.target.value)}
                    placeholder="e.g. John"
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={adminLastName}
                    onChange={e => setAdminLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Work Email *</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="e.g. j.doe@acmehealth.com"
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Direct Phone</label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={e => setAdminPhone(e.target.value)}
                    placeholder="e.g. +27 11 555 0199"
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Designation / Role Title</label>
                  <input
                    type="text"
                    value={adminDesignation}
                    onChange={e => setAdminDesignation(e.target.value)}
                    placeholder="e.g. Chief Technology Officer &amp; Governance Lead"
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: STATUTORY GOVERNANCE */}
          {currentStep === 'governance' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 5: Statutory Governance Officers</h3>
                <p className="text-slate-400 mt-0.5">POPIA Section 55 Information Officer and GDPR Data Protection Officer nomination.</p>
              </div>

              <div className="p-4 bg-black/30 border border-white/[.08] rounded-xl space-y-3">
                <label className="flex items-center space-x-2 font-semibold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableInfoOfficer}
                    onChange={e => setEnableInfoOfficer(e.target.checked)}
                    className="rounded text-cyan-500 bg-black/40 border-white/20"
                  />
                  <span>Nominate POPIA Information Officer (South Africa)</span>
                </label>

                {enableInfoOfficer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <input
                      type="text"
                      value={ioName}
                      onChange={e => setIoName(e.target.value)}
                      placeholder="Officer Full Name"
                      className="bg-black/40 border border-white/[.12] rounded-lg px-3 py-2 text-white outline-none"
                    />
                    <input
                      type="text"
                      value={ioRegNumber}
                      onChange={e => setIoRegNumber(e.target.value)}
                      placeholder="Information Regulator Reg No (e.g. ZA-IR-IO-2024-001)"
                      className="bg-black/40 border border-white/[.12] rounded-lg px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-black/30 border border-white/[.08] rounded-xl space-y-3">
                <label className="flex items-center space-x-2 font-semibold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableDpo}
                    onChange={e => setEnableDpo(e.target.checked)}
                    className="rounded text-cyan-500 bg-black/40 border-white/20"
                  />
                  <span>Nominate GDPR Data Protection Officer (EU / UK)</span>
                </label>

                {enableDpo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <input
                      type="text"
                      value={dpoName}
                      onChange={e => setDpoName(e.target.value)}
                      placeholder="DPO Full Name"
                      className="bg-black/40 border border-white/[.12] rounded-lg px-3 py-2 text-white outline-none"
                    />
                    <input
                      type="text"
                      value={dpoRegNumber}
                      onChange={e => setDpoRegNumber(e.target.value)}
                      placeholder="Supervisory Authority Registration No"
                      className="bg-black/40 border border-white/[.12] rounded-lg px-3 py-2 text-white outline-none font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: PRODUCT CATALOGUE */}
          {currentStep === 'products' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 6: Product Catalogue Selection</h3>
                <p className="text-slate-400 mt-0.5">Select published commercial products to include in the initial customer order.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catalogueProducts.map(prod => {
                  const selected = selectedProducts.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => toggleProduct(prod.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                        selected
                          ? 'bg-cyan-500/10 border-cyan-400/60 shadow-md'
                          : 'bg-black/30 border-white/[.08] hover:border-white/[.20]'
                      }`}
                    >
                      <div className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${selected ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-white/20'}`}>
                        {selected && <Check size={14} className="font-bold" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs truncate">{prod.name}</span>
                          <span className="font-mono text-cyan-300 font-bold ml-2">
                            {prod.price > 0 ? `${prod.currency} ${prod.price}` : 'Cost-Plus'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 block">{prod.sku}</span>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{prod.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: COMMERCIAL TERMS */}
          {currentStep === 'commercial_terms' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 7: Service Tier &amp; Rate Limits</h3>
                <p className="text-slate-400 mt-0.5">Set monthly token expenditure limits, request quotas, and SLA commitments.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {(['starter', 'growth', 'scale', 'enterprise'] as const).map(t => (
                  <div
                    key={t}
                    onClick={() => {
                      setTier(t);
                      if (t === 'starter') { setMonthlyBudgetUsd(500); setRateLimitRpm(60); }
                      if (t === 'growth') { setMonthlyBudgetUsd(2500); setRateLimitRpm(240); }
                      if (t === 'scale') { setMonthlyBudgetUsd(10000); setRateLimitRpm(1000); }
                      if (t === 'enterprise') { setMonthlyBudgetUsd(25000); setRateLimitRpm(5000); }
                    }}
                    className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                      tier === t
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                        : 'bg-black/30 border-white/[.08] hover:border-white/[.20]'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase text-white block">{t}</span>
                    <span className="text-sm font-mono font-bold text-cyan-300 mt-1 block">
                      ${t === 'starter' ? '500' : t === 'growth' ? '2,500' : t === 'scale' ? '10,000' : '25,000'}/mo
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {t === 'starter' ? '60 RPM' : t === 'growth' ? '240 RPM' : t === 'scale' ? '1,000 RPM' : '5,000 RPM'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monthly AI Spend Guardrail (USD)</label>
                  <input
                    type="number"
                    value={monthlyBudgetUsd}
                    onChange={e => setMonthlyBudgetUsd(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Requests Per Minute (RPM)</label>
                  <input
                    type="number"
                    value={rateLimitRpm}
                    onChange={e => setRateLimitRpm(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: BILLING */}
          {currentStep === 'billing' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 8: Billing Cycle &amp; Invoicing</h3>
                <p className="text-slate-400 mt-0.5">Establish the automated billing cadence and statement delivery schedule.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Billing Cycle</label>
                  <select
                    value={billingCycle}
                    onChange={e => setBillingCycle(e.target.value as any)}
                    className="w-full bg-[#141824] border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none"
                  >
                    <option value="monthly">Monthly Recurring</option>
                    <option value="annual">Annual Commitment (15% Savings)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monthly Invoicing Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={invoiceDay}
                    onChange={e => setInvoiceDay(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">License Renewal / Expiry</label>
                  <select
                    value={licenseExpiryOption}
                    onChange={e => setLicenseExpiryOption(e.target.value as any)}
                    className="w-full bg-[#141824] border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none font-mono text-xs"
                  >
                    <option value="30d">30 Days</option>
                    <option value="60d">60 Days</option>
                    <option value="90d">90 Days</option>
                    <option value="12m">12 Months</option>
                    <option value="never">Never / Permanent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-[#141824] border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none font-mono"
                  >
                    <option value="USD">USD ($) · ALTIL Base</option>
                    <option value="ZAR">ZAR (R) · South African Rand</option>
                    <option value="EUR">EUR (€) · Euro</option>
                    <option value="GBP">GBP (£) · British Pound</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: APPLICATION */}
          {currentStep === 'application' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 9: Initial AI Application</h3>
                <p className="text-slate-400 mt-0.5">Provision the primary software application or ingress pipeline for this customer.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Application Name *</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={e => setAppName(e.target.value)}
                    placeholder="e.g. Clinical Diagnostics Assistant"
                    className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capability Type</label>
                  <select
                    value={capabilityType}
                    onChange={e => setCapabilityType(e.target.value)}
                    className="w-full bg-[#141824] border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none"
                  >
                    <option value="General_AI">General AI Ingress</option>
                    <option value="Healthcare_Clinical">Healthcare / Clinical Diagnostics</option>
                    <option value="Financial_Fraud">Financial Fraud &amp; Risk Scoring</option>
                    <option value="Customer_Service">Customer Experience &amp; RAG Bot</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: API ACCESS */}
          {currentStep === 'api_access' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 10: Gateway API Credentials</h3>
                <p className="text-slate-400 mt-0.5">Configure initial API key permissions and gateway rate limiting.</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Key Identifier Name</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  placeholder="Primary Production Key"
                  className="w-full bg-black/40 border border-white/[.12] rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">Permitted Scopes:</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'inference:chat', label: 'Chat Inference' },
                    { id: 'inference:stream', label: 'Streaming' },
                    { id: 'models:read', label: 'Model Catalog' },
                    { id: 'policies:enforce', label: 'Policy Enforce' }
                  ].map(sc => {
                    const active = keyScopes.includes(sc.id);
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => toggleScope(sc.id)}
                        className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-colors ${
                          active
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                            : 'bg-black/30 border-white/[.08] text-slate-400'
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 11: REVIEW & VERIFY */}
          {currentStep === 'review' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Step 11: End-to-End Orchestration Review</h3>
                <p className="text-slate-400 mt-0.5">Verify all commercial and technical components before executing the atomic transaction.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 border border-white/[.08] rounded-xl space-y-2">
                  <span className="font-bold text-cyan-300 uppercase font-mono text-[10px]">Commercial Entity</span>
                  <div className="flex justify-between py-1 border-b border-white/[.05]"><span className="text-slate-400">Name:</span><span className="font-semibold text-white">{organizationName}</span></div>
                  <div className="flex justify-between py-1 border-b border-white/[.05]"><span className="text-slate-400">Relationship:</span><span className="font-semibold text-white">{relationshipType}</span></div>
                  <div className="flex justify-between py-1 border-b border-white/[.05]"><span className="text-slate-400">Jurisdiction:</span><span className="font-semibold text-white">{country}</span></div>
                  <div className="flex justify-between py-1"><span className="text-slate-400">Tier / Budget:</span><span className="font-semibold text-cyan-300">{tier.toUpperCase()} · ${monthlyBudgetUsd}/mo</span></div>
                </div>

                <div className="p-4 bg-black/40 border border-white/[.08] rounded-xl space-y-2">
                  <span className="font-bold text-cyan-300 uppercase font-mono text-[10px]">Primary Administrator</span>
                  <div className="flex justify-between py-1 border-b border-white/[.05]"><span className="text-slate-400">Name:</span><span className="font-semibold text-white">{adminFirstName} {adminLastName}</span></div>
                  <div className="flex justify-between py-1 border-b border-white/[.05]"><span className="text-slate-400">Email:</span><span className="font-semibold text-white font-mono">{adminEmail}</span></div>
                  <div className="flex justify-between py-1 border-b border-white/[.05]"><span className="text-slate-400">Designation:</span><span className="font-semibold text-white">{adminDesignation}</span></div>
                  <div className="flex justify-between py-1"><span className="text-slate-400">Activation Link:</span><span className="font-semibold text-emerald-400">Single-Use Token (7-day expiry)</span></div>
                </div>
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center space-x-3 text-emerald-300">
                <ShieldCheck size={22} className="text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-white">Atomic Transaction Safeguard Active</div>
                  <div className="text-[11px] text-slate-400">
                    If any component provisioning step fails, all relational entities will rollback automatically with zero orphan records.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: ACTIVATION SUCCESS */}
          {currentStep === 'activating' && activationResult && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200 text-xs">
              <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-black/60 border border-emerald-500/50 rounded-2xl flex items-center space-x-4 shadow-xl">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Customer Successfully Onboarded &amp; Activated</h3>
                  <p className="text-slate-300 mt-0.5">
                    Organization <b className="text-emerald-300 font-mono">{activationResult.organization.name}</b> [{activationResult.tenant.code}] is live in the ALTIL control plane.
                  </p>
                </div>
              </div>

              {/* Admin Activation URL Box */}
              <div className="p-4 bg-black/50 border border-white/[.10] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                    <Users size={14} />
                    Primary Administrator Activation URL:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activationResult.primaryAdmin.activationUrl);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline font-mono"
                  >
                    {copiedToken ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedToken ? 'Copied!' : 'Copy Activation Link'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-black/60 border border-white/[.08] rounded-lg font-mono text-[11px] text-emerald-300 truncate select-all">
                  {activationResult.primaryAdmin.activationUrl}
                </div>
              </div>

              {/* API Key Secret Box */}
              <div className="p-4 bg-black/50 border border-white/[.10] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold flex items-center gap-1.5 text-amber-300">
                    <KeyRound size={14} />
                    Production API Gateway Key (Shown Once):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activationResult.apiKey.rawSecretKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline font-mono"
                  >
                    {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey ? 'Copied!' : 'Copy API Secret'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-black/60 border border-amber-500/30 rounded-lg font-mono text-[11px] text-amber-200 truncate select-all">
                  {activationResult.apiKey.rawSecretKey}
                </div>
              </div>

              {/* Summary Artifacts Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-black/30 border border-white/[.08] rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Tenant ID</span>
                  <span className="font-mono text-white text-xs truncate block">{activationResult.tenant.id}</span>
                </div>
                <div className="p-3 bg-black/30 border border-white/[.08] rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Organization ID</span>
                  <span className="font-mono text-white text-xs truncate block">{activationResult.organization.id}</span>
                </div>
                <div className="p-3 bg-black/30 border border-white/[.08] rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Application Code</span>
                  <span className="font-mono text-cyan-300 text-xs truncate block">{activationResult.application.code}</span>
                </div>
                <div className="p-3 bg-black/30 border border-white/[.08] rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Order Reference</span>
                  <span className="font-mono text-emerald-300 text-xs truncate block">{activationResult.order?.orderNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-[#0c0f17] px-6 py-4 border-t border-white/[.08] flex items-center justify-between">
          {currentStep !== 'activating' ? (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="px-4 py-2 bg-white/[.04] hover:bg-white/[.08] text-xs font-semibold text-slate-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-transparent hover:bg-white/[.04] text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>

                {currentStep === 'review' ? (
                  <button
                    type="button"
                    onClick={handleExecuteOnboarding}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs rounded-lg shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-black" />
                        <span>Provisioning Customer...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Execute Commercial Onboarding</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
                  >
                    <span>Next Step</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Check size={14} />
                <span>Done &amp; Return to Directory</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
