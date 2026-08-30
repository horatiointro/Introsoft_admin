import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  Building2,
  AppWindow,
  Plus,
  RefreshCw,
  Terminal,
  FileText,
  Lock,
  Unlock,
  Play,
  Check,
  Search,
  ChevronRight,
  ShieldCheck,
  Send,
  Layers,
  ArrowUpRight,
  TrendingUp,
  HelpCircle,
  Copy
} from 'lucide-react';
import {
  LicensingPlanTemplate,
  TenantAppLicense,
  PaymentWebhookLog,
  PricingModelType,
  EnforcementAction,
  LicenseStatus,
  Customer,
  Application
} from '../types';

interface LicensingMonetizationViewProps {
  customers: Customer[];
  applications: Application[];
  licensingPlans: LicensingPlanTemplate[];
  tenantLicenses: TenantAppLicense[];
  paymentLogs: PaymentWebhookLog[];
  onAddPlanTemplate: (plan: LicensingPlanTemplate) => void;
  onUpdatePlanTemplate: (plan: LicensingPlanTemplate) => void;
  onAssignTenantLicense: (license: TenantAppLicense) => void;
  onUpdateTenantLicense: (license: TenantAppLicense) => void;
  onProcessPaymentWebhook: (event: PaymentWebhookLog) => void;
}

export const LicensingMonetizationView: React.FC<LicensingMonetizationViewProps> = ({
  customers,
  applications,
  licensingPlans,
  tenantLicenses,
  paymentLogs,
  onAddPlanTemplate,
  onUpdatePlanTemplate,
  onAssignTenantLicense,
  onUpdateTenantLicense,
  onProcessPaymentWebhook
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'simulator' | 'tenant_portal'>('plans');

  // Plan Blueprint Modal state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<LicensingPlanTemplate> | null>(null);

  // License Assignment Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newLicenseTenantId, setNewLicenseTenantId] = useState<string>(customers[0]?.id || '');
  const [newLicenseAppId, setNewLicenseAppId] = useState<string>(applications[0]?.id || '');
  const [newLicensePlanId, setNewLicensePlanId] = useState<string>(licensingPlans[0]?.id || '');

  // Simulator state
  const [simSelectedLicenseId, setSimSelectedLicenseId] = useState<string>(tenantLicenses[0]?.id || '');
  const [simEventType, setSimEventType] = useState<'invoice.paid' | 'invoice.payment_failed' | 'license.grace_period_entered' | 'license.auto_suspended'>('invoice.paid');
  const [simAmount, setSimAmount] = useState<number>(450.00);
  const [simGateway, setSimGateway] = useState<'Stripe' | 'PayFast' | 'SAP_Billing' | 'Direct_EFT'>('Stripe');
  const [lastSimResult, setLastSimResult] = useState<string | null>(null);

  // Tenant Portal Filter
  const [portalTenantId, setPortalTenantId] = useState<string>(customers[0]?.id || '');

  // Helper formatting functions
  const formatPricingTypeLabel = (type: PricingModelType) => {
    switch (type) {
      case 'per_transaction': return 'Per Transaction (Metered)';
      case 'per_day': return 'Daily License Rate';
      case 'per_month': return 'Monthly Recurring';
      case 'per_year': return 'Annual Enterprise Contract';
      case 'tiered_volume': return 'Tiered Volume Discount';
      case 'hybrid_base_metered': return 'Hybrid (Base + Metered Overage)';
      case 'custom_contract': return 'Bespoke Negotiated SLA';
      default: return type;
    }
  };

  const formatEnforcementLabel = (action: EnforcementAction) => {
    switch (action) {
      case 'hard_block_402': return 'HTTP 402 Hard Traffic Block';
      case 'soft_warning': return 'Soft Warning Header & Banner';
      case 'rate_limit_throttle': return 'Strict Quota Throttling (5 RPM)';
      case 'read_only': return 'Read-Only Mode (Mutations Blocked)';
      default: return action;
    }
  };

  const getStatusBadge = (status: LicenseStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /> ACTIVE (PAID)</span>;
      case 'grace_period':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30"><Clock className="w-3 h-3" /> GRACE PERIOD</span>;
      case 'past_due_restricted':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30"><AlertTriangle className="w-3 h-3" /> PAST DUE (RESTRICTED)</span>;
      case 'auto_suspended':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30"><Lock className="w-3 h-3" /> AUTO-SUSPENDED (UNPAID)</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30"><XCircle className="w-3 h-3" /> CANCELLED</span>;
    }
  };

  // KPI Calculations
  const totalActiveRevenueUsd = tenantLicenses.reduce((sum, l) => sum + (l.licenseStatus === 'active' ? l.currentAccruedBillUsd : 0), 0);
  const totalSuspendedCount = tenantLicenses.filter(l => l.licenseStatus === 'auto_suspended').length;
  const totalGraceCount = tenantLicenses.filter(l => l.licenseStatus === 'grace_period').length;
  const activeLicensesCount = tenantLicenses.filter(l => l.licenseStatus === 'active').length;

  // Handle Plan Save
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan?.name) return;

    const appObj = applications.find(a => a.id === editingPlan.applicationId);

    const planToSave: LicensingPlanTemplate = {
      id: editingPlan.id || `plan-${Date.now()}`,
      name: editingPlan.name,
      applicationId: editingPlan.applicationId || 'app-fraud',
      applicationName: appObj?.name || 'Financial Fraud Engine',
      pricingType: editingPlan.pricingType || 'per_month',
      currency: editingPlan.currency || 'USD',
      basePrice: Number(editingPlan.basePrice || 0),
      billingCycle: editingPlan.billingCycle || 'monthly',
      includedTransactions: Number(editingPlan.includedTransactions || 0),
      overagePricePerTransaction: Number(editingPlan.overagePricePerTransaction || 0),
      gracePeriodDays: Number(editingPlan.gracePeriodDays || 7),
      autoEnforcementAction: editingPlan.autoEnforcementAction || 'hard_block_402',
      autoEnforceOnUnpaid: editingPlan.autoEnforceOnUnpaid ?? true,
      features: editingPlan.features || ['Standard SLA', 'POPIA Redaction'],
      isPublished: true,
      createdDate: new Date().toISOString().split('T')[0]
    };

    if (editingPlan.id) {
      onUpdatePlanTemplate(planToSave);
    } else {
      onAddPlanTemplate(planToSave);
    }
    setIsPlanModalOpen(false);
    setEditingPlan(null);
  };

  // Handle License Assign
  const handleAssignLicenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === newLicenseTenantId);
    const app = applications.find(a => a.id === newLicenseAppId);
    const plan = licensingPlans.find(p => p.id === newLicensePlanId);

    if (!cust || !app || !plan) return;

    const newLic: TenantAppLicense = {
      id: `lic-${cust.id.replace('cust-', '')}-${app.id.replace('app-', '')}`,
      tenantId: cust.id,
      tenantName: cust.name,
      applicationId: app.id,
      applicationName: app.name,
      planId: plan.id,
      planName: plan.name,
      pricingType: plan.pricingType,
      currency: plan.currency,
      basePrice: plan.basePrice,
      contractStartDate: new Date().toISOString().split('T')[0],
      contractEndDate: '2027-12-31',
      nextBillingDate: '2026-09-30',
      lastPaymentDate: new Date().toISOString().split('T')[0],
      lastPaymentAmount: plan.basePrice,
      paymentStatus: 'paid',
      licenseStatus: 'active',
      currentTransactionCount: 0,
      maxTransactionQuota: plan.includedTransactions || 100000,
      overageTransactionsCount: 0,
      currentAccruedBillUsd: plan.basePrice,
      autoEnforceOnUnpaid: plan.autoEnforceOnUnpaid,
      graceDaysRemaining: plan.gracePeriodDays,
      activeEnforcement: null,
      billingContactEmail: cust.contactEmail || 'finance@tenant.com'
    };

    onAssignTenantLicense(newLic);
    setIsAssignModalOpen(false);
  };

  // Handle Payment Webhook Simulation
  const handleRunSimulator = () => {
    const lic = tenantLicenses.find(l => l.id === simSelectedLicenseId);
    if (!lic) return;

    let newStatus: LicenseStatus = lic.licenseStatus;
    let newPayStatus: 'paid' | 'pending' | 'failed' | 'overdue' = lic.paymentStatus;
    let enforcement: EnforcementAction | 'none' = 'none';
    let summaryMsg = '';

    const planObj = licensingPlans.find(p => p.id === lic.planId);
    const configuredEnforcement = planObj?.autoEnforcementAction || 'hard_block_402';

    if (simEventType === 'invoice.paid') {
      newStatus = 'active';
      newPayStatus = 'paid';
      enforcement = 'none';
      summaryMsg = `Payment of $${simAmount} received via ${simGateway}. Account reinstating to ACTIVE status. Gateway block removed.`;
    } else if (simEventType === 'invoice.payment_failed') {
      newStatus = 'grace_period';
      newPayStatus = 'failed';
      enforcement = configuredEnforcement === 'soft_warning' ? 'soft_warning' : 'none';
      summaryMsg = `Payment failed via ${simGateway}. Tenant placed in GRACE PERIOD (${lic.graceDaysRemaining} days left).`;
    } else if (simEventType === 'license.auto_suspended') {
      newStatus = 'auto_suspended';
      newPayStatus = 'overdue';
      enforcement = configuredEnforcement;
      summaryMsg = `Grace period expired. Unpaid status enforced! Gateway set to ${formatEnforcementLabel(configuredEnforcement)}. Traffic blocked.`;
    }

    // Update state
    const updatedLic: TenantAppLicense = {
      ...lic,
      licenseStatus: newStatus,
      paymentStatus: newPayStatus,
      activeEnforcement: enforcement === 'none' ? null : (enforcement as EnforcementAction),
      lastPaymentDate: simEventType === 'invoice.paid' ? new Date().toISOString().split('T')[0] : lic.lastPaymentDate,
      lastPaymentAmount: simEventType === 'invoice.paid' ? simAmount : lic.lastPaymentAmount
    };

    onUpdateTenantLicense(updatedLic);

    const logItem: PaymentWebhookLog = {
      id: `paylog-sim-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      tenantId: lic.tenantId,
      tenantName: lic.tenantName,
      applicationId: lic.applicationId,
      invoiceId: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      eventType: simEventType,
      amount: simAmount,
      currency: lic.currency,
      gatewayProvider: simGateway,
      enforcementTriggered: enforcement,
      status: 'processed',
      rawPayloadSummary: summaryMsg
    };

    onProcessPaymentWebhook(logItem);

    setLastSimResult(
      `[SIMULATION SUCCESS]\nTimestamp: ${logItem.timestamp}\nTenant: ${lic.tenantName}\nApplication: ${lic.applicationName}\nEvent: ${simEventType}\nStatus Updated: ${newStatus.toUpperCase()}\nPayment Status: ${newPayStatus.toUpperCase()}\nActive Enforcement: ${enforcement === 'none' ? 'NONE' : formatEnforcementLabel(enforcement as EnforcementAction)}\nSummary: ${summaryMsg}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>COMMERCIAL & MONETIZATION ENGINE</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Enterprise Multi-Tenant Licensing & Automated Payment Enforcement</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Configure flexible per-app licensing models (transaction, daily, monthly, annual, custom SLA) and set automated gateway enforcement on unpaid accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingPlan({
                name: '',
                pricingType: 'per_month',
                currency: 'USD',
                basePrice: 499,
                billingCycle: 'monthly',
                includedTransactions: 100000,
                overagePricePerTransaction: 0.002,
                gracePeriodDays: 7,
                autoEnforcementAction: 'hard_block_402',
                autoEnforceOnUnpaid: true,
                features: ['Standard SLA', 'POPIA Redaction', 'Email Support']
              });
              setIsPlanModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            Create Licensing Plan Blueprint
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-950/40"
          >
            <Building2 className="w-4 h-4" />
            Assign License to Tenant
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#8890a6]">
            <span className="text-[10px] font-mono uppercase font-bold">Total Active Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">${totalActiveRevenueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <span className="text-[10px] text-[#8890a6] mt-0.5 block">{activeLicensesCount} Active Tenant Licenses</span>
        </div>

        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#8890a6]">
            <span className="text-[10px] font-mono uppercase font-bold">Auto-Suspended (Unpaid)</span>
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono mt-1">{totalSuspendedCount}</div>
          <span className="text-[10px] text-red-400/80 mt-0.5 block">HTTP 402 / Gateway Block Active</span>
        </div>

        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#8890a6]">
            <span className="text-[10px] font-mono uppercase font-bold">In Grace Period</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{totalGraceCount}</div>
          <span className="text-[10px] text-amber-400/80 mt-0.5 block">Pending Payment Settlement</span>
        </div>

        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#8890a6]">
            <span className="text-[10px] font-mono uppercase font-bold">Licensing Blueprints</span>
            <Sliders className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-1">{licensingPlans.length}</div>
          <span className="text-[10px] text-[#8890a6] mt-0.5 block">Available Pricing Templates</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222636] pb-3 text-xs font-mono">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'plans' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-[#8890a6] hover:text-white hover:bg-[#181c28]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          1. Commercial Plan Studio (Admin)
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'subscriptions' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-[#8890a6] hover:text-white hover:bg-[#181c28]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          2. Tenant License Assignments ({tenantLicenses.length})
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'simulator' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-[#8890a6] hover:text-white hover:bg-[#181c28]'
          }`}
        >
          <Zap className="w-4 h-4" />
          3. Payment Webhook & Enforcement Simulator
        </button>
        <button
          onClick={() => setActiveTab('tenant_portal')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'tenant_portal' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-[#8890a6] hover:text-white hover:bg-[#181c28]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          4. Tenant Self-Service Portal Preview
        </button>
      </div>

      {/* TAB 1: COMMERCIAL PLAN BLUEPRINT STUDIO */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Application Licensing Blueprints & Pricing Rules
            </h2>
            <span className="text-xs text-[#8890a6]">
              Defined commercial contracts reusable across all tenants & applications
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {licensingPlans.map(plan => (
              <div
                key={plan.id}
                className="bg-[#12141c] border border-[#222636] hover:border-emerald-500/50 p-5 rounded-xl space-y-4 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-semibold">
                      {plan.applicationName}
                    </span>
                    <span className="text-[10px] font-mono text-[#8890a6] uppercase">{plan.billingCycle}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                    {plan.currency === 'USD' ? '$' : plan.currency === 'ZAR' ? 'R' : '€'}
                    {plan.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-xs text-[#8890a6] font-normal"> / {plan.billingCycle}</span>
                  </div>

                  <div className="mt-3 text-xs space-y-1 text-[#aaaaaa]">
                    <div className="flex justify-between border-b border-[#222636] py-1">
                      <span className="text-[#77809a]">Pricing Model:</span>
                      <span className="font-mono text-white">{formatPricingTypeLabel(plan.pricingType)}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222636] py-1">
                      <span className="text-[#77809a]">Included Quotas:</span>
                      <span className="font-mono text-white">{plan.includedTransactions.toLocaleString()} Transactions</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222636] py-1">
                      <span className="text-[#77809a]">Overage Fee:</span>
                      <span className="font-mono text-white">${plan.overagePricePerTransaction} / tx</span>
                    </div>
                    <div className="flex justify-between border-b border-[#222636] py-1">
                      <span className="text-[#77809a]">Grace Period:</span>
                      <span className="font-mono text-amber-400">{plan.gracePeriodDays} Days</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#77809a]">Unpaid Action:</span>
                      <span className="font-mono text-red-400 font-semibold">{formatEnforcementLabel(plan.autoEnforcementAction)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1a1f2c]">
                    <span className="text-[10px] text-[#77809a] uppercase font-bold block mb-1">Entitlement Features:</span>
                    <ul className="space-y-1">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="text-xs text-[#cccccc] flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#222636] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#666666]">ID: {plan.id}</span>
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setIsPlanModalOpen(true);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline flex items-center gap-1"
                  >
                    Edit Rules <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TENANT LICENSE ASSIGNMENTS & STATUS */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Active Tenant Application Licensing Matrix & Real-Time Enforcement
            </h2>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Assign New License
            </button>
          </div>

          <div className="bg-[#12141c] border border-[#222636] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181c28] border-b border-[#222636] text-[#8890a6] uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Tenant & App</th>
                    <th className="px-4 py-3">Licensing Plan</th>
                    <th className="px-4 py-3">Payment & License Status</th>
                    <th className="px-4 py-3">Current Usage / Quota</th>
                    <th className="px-4 py-3">Current Accrued Bill</th>
                    <th className="px-4 py-3">Grace / Enforcement</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2333] text-[#cccccc]">
                  {tenantLicenses.map(lic => {
                    const usagePct = Math.min(100, Math.round((lic.currentTransactionCount / (lic.maxTransactionQuota || 1)) * 100));

                    return (
                      <tr key={lic.id} className="hover:bg-[#161a26] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white text-sm">{lic.tenantName}</div>
                          <div className="text-[11px] text-blue-400 flex items-center gap-1 mt-0.5">
                            <AppWindow className="w-3 h-3" /> {lic.applicationName}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-medium text-white">{lic.planName}</div>
                          <div className="text-[10px] text-[#8890a6] font-mono mt-0.5">
                            {formatPricingTypeLabel(lic.pricingType)}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div>{getStatusBadge(lic.licenseStatus)}</div>
                          <div className="text-[10px] font-mono text-[#8890a6] mt-1">
                            Last Paid: {lic.lastPaymentDate} (${lic.lastPaymentAmount || lic.basePrice})
                          </div>
                        </td>

                        <td className="px-4 py-3.5 min-w-[180px]">
                          <div className="flex justify-between text-[11px] font-mono mb-1">
                            <span>{lic.currentTransactionCount.toLocaleString()} tx</span>
                            <span className="text-[#8890a6]">{usagePct}%</span>
                          </div>
                          <div className="w-full bg-[#1a2030] h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                usagePct > 90 ? 'bg-red-500' : usagePct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                          {lic.overageTransactionsCount > 0 && (
                            <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                              +{lic.overageTransactionsCount.toLocaleString()} Overage tx
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-sm font-bold text-emerald-400">
                          {lic.currency === 'USD' ? '$' : lic.currency === 'ZAR' ? 'R' : '€'}
                          {lic.currentAccruedBillUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-xs">
                          {lic.licenseStatus === 'auto_suspended' ? (
                            <span className="text-red-400 font-bold flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" />
                              {formatEnforcementLabel(lic.activeEnforcement || 'hard_block_402')}
                            </span>
                          ) : lic.licenseStatus === 'grace_period' ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {lic.graceDaysRemaining} Days Grace Remaining
                            </span>
                          ) : (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Enforcement Clear
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-2">
                          {lic.licenseStatus === 'auto_suspended' ? (
                            <button
                              onClick={() => {
                                onUpdateTenantLicense({
                                  ...lic,
                                  licenseStatus: 'active',
                                  paymentStatus: 'paid',
                                  activeEnforcement: null,
                                  lastPaymentDate: new Date().toISOString().split('T')[0]
                                });
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] rounded"
                            >
                              Re-Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onUpdateTenantLicense({
                                  ...lic,
                                  licenseStatus: 'auto_suspended',
                                  paymentStatus: 'overdue',
                                  activeEnforcement: 'hard_block_402',
                                  graceDaysRemaining: 0
                                });
                              }}
                              className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white font-mono text-[10px] rounded border border-red-500/40"
                            >
                              Suspend
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
        </div>
      )}

      {/* TAB 3: PAYMENT WEBHOOK & ENFORCEMENT SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulator Panel */}
          <div className="lg:col-span-7 bg-[#12141c] border border-[#222636] p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#222636] pb-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Interactive Payment Webhook & Auto-Enforcement Simulator
                </h2>
                <p className="text-xs text-[#8890a6]">
                  Simulate external payment gateway notifications (Stripe/PayFast/SAP) to verify automated policy triggers.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#8890a6] uppercase font-bold mb-1">Select Target Tenant License:</label>
                <select
                  value={simSelectedLicenseId}
                  onChange={e => setSimSelectedLicenseId(e.target.value)}
                  className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  {tenantLicenses.map(lic => (
                    <option key={lic.id} value={lic.id}>
                      {lic.tenantName} - {lic.applicationName} (Current: {lic.licenseStatus.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#8890a6] uppercase font-bold mb-1">Payment Webhook Event Type:</label>
                  <select
                    value={simEventType}
                    onChange={e => setSimEventType(e.target.value as any)}
                    className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="invoice.paid">invoice.paid (Re-activate & Clear Block)</option>
                    <option value="invoice.payment_failed">invoice.payment_failed (Enter Grace Period)</option>
                    <option value="license.auto_suspended">license.auto_suspended (Grace Expired - HTTP 402 Block)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8890a6] uppercase font-bold mb-1">Gateway Provider:</label>
                  <select
                    value={simGateway}
                    onChange={e => setSimGateway(e.target.value as any)}
                    className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Stripe">Stripe Webhooks</option>
                    <option value="PayFast">PayFast Enterprise</option>
                    <option value="SAP_Billing">SAP S/4HANA Billing Recon</option>
                    <option value="Direct_EFT">Direct EFT Bank Statement Recon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8890a6] uppercase font-bold mb-1">Payment Settlement Amount ($ USD):</label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={e => setSimAmount(Number(e.target.value))}
                  className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleRunSimulator}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 font-mono uppercase tracking-wider"
              >
                <Play className="w-4 h-4" /> Trigger Payment Webhook Event
              </button>

              {lastSimResult && (
                <div className="bg-[#0a0c10] border border-[#222636] p-3.5 rounded-lg space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">Simulation Output Console:</span>
                  <pre className="text-[11px] font-mono text-[#cccccc] whitespace-pre-wrap leading-relaxed">
                    {lastSimResult}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Webhook Logs & Integration Spec */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#12141c] border border-[#222636] p-5 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" /> Webhook API Spec Endpoint
              </h3>
              <p className="text-xs text-[#8890a6]">
                External billing engines (Stripe, SAP, PayFast) can post HTTP webhook events to auto-reconcile tenant licensing:
              </p>
              <div className="bg-[#0a0c10] p-3 rounded-lg border border-[#222636] text-[11px] font-mono text-emerald-400">
                POST https://api.gateway.enterprise/v1/licensing/payment-webhook
              </div>
              <div className="text-[10px] text-[#8890a6] space-y-1">
                <div>Header: <span className="font-mono text-white">Authorization: Bearer &lt;GATEWAY_SECRET&gt;</span></div>
                <div>Payload: <span className="font-mono text-white">&#123; tenantId, eventType, invoiceId, amount &#125;</span></div>
              </div>
            </div>

            <div className="bg-[#12141c] border border-[#222636] p-5 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase font-mono">Recent Payment Webhook Executions</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {paymentLogs.map(log => (
                  <div key={log.id} className="bg-[#181c28] p-3 rounded-lg border border-[#283046] text-xs space-y-1">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-blue-400 font-bold">{log.eventType}</span>
                      <span className="text-[#77809a]">{log.timestamp}</span>
                    </div>
                    <div className="font-bold text-white">{log.tenantName}</div>
                    <div className="text-[11px] text-[#aaaaaa]">{log.rawPayloadSummary}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TENANT SELF-SERVICE PORTAL PREVIEW */}
      {activeTab === 'tenant_portal' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-4 rounded-xl">
            <div>
              <span className="text-[10px] font-mono text-[#8890a6] uppercase font-bold block">Simulate Tenant Account View:</span>
              <h3 className="text-base font-bold text-white">Tenant Licensing & Billing Self-Service Portal</h3>
            </div>
            <select
              value={portalTenantId}
              onChange={e => setPortalTenantId(e.target.value)}
              className="bg-[#181c28] border border-[#283046] rounded-lg px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type.toUpperCase()})</option>
              ))}
            </select>
          </div>

          {(() => {
            const tenantObj = customers.find(c => c.id === portalTenantId);
            const tenantLics = tenantLicenses.filter(l => l.tenantId === portalTenantId);

            if (!tenantObj) return null;

            return (
              <div className="space-y-6">
                {/* Active Subscriptions Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tenantLics.map(lic => (
                    <div key={lic.id} className="bg-[#12141c] border border-[#222636] p-5 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">APPLICATION LICENSE</span>
                          <h4 className="text-lg font-bold text-white">{lic.applicationName}</h4>
                        </div>
                        {getStatusBadge(lic.licenseStatus)}
                      </div>

                      {lic.licenseStatus === 'auto_suspended' && (
                        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-xs text-red-300 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-red-400">
                            <Lock className="w-4 h-4" /> Gateway Access Suspended (HTTP 402)
                          </div>
                          <div>Your application license is currently suspended due to an unpaid balance. Please settle invoice to restore immediate API access.</div>
                        </div>
                      )}

                      {lic.licenseStatus === 'grace_period' && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-xs text-amber-300 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-400">
                            <Clock className="w-4 h-4" /> Account in Grace Period ({lic.graceDaysRemaining} days remaining)
                          </div>
                          <div>Payment failed on last billing attempt. Settle payment before grace period expires to avoid automatic service suspension.</div>
                        </div>
                      )}

                      <div className="text-xs space-y-2 text-[#cccccc]">
                        <div className="flex justify-between">
                          <span className="text-[#77809a]">Plan Type:</span>
                          <span className="font-mono text-white font-bold">{lic.planName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#77809a]">Current Accrued Balance:</span>
                          <span className="font-mono text-emerald-400 font-bold">${lic.currentAccruedBillUsd.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#77809a]">Next Billing Date:</span>
                          <span className="font-mono text-white">{lic.nextBillingDate}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#222636] flex items-center justify-between">
                        <span className="text-xs text-[#8890a6]">Billing Email: {lic.billingContactEmail}</span>
                        <button
                          onClick={() => {
                            onUpdateTenantLicense({
                              ...lic,
                              licenseStatus: 'active',
                              paymentStatus: 'paid',
                              activeEnforcement: null,
                              lastPaymentDate: new Date().toISOString().split('T')[0]
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition-colors"
                        >
                          Settle Invoice Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* PLAN BLUEPRINT MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#222636] rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222636] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                {editingPlan?.id ? 'Edit Licensing Blueprint' : 'Create Commercial Plan Blueprint'}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-[#8890a6] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8890a6] uppercase font-mono font-bold mb-1">Plan Name:</label>
                <input
                  type="text"
                  required
                  value={editingPlan?.name || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="e.g. Clinical AI Suite - Enterprise Annual SLA"
                  className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#8890a6] uppercase font-mono font-bold mb-1">Target Application:</label>
                  <select
                    value={editingPlan?.applicationId || applications[0]?.id}
                    onChange={e => setEditingPlan({ ...editingPlan, applicationId: e.target.value })}
                    className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8890a6] uppercase font-mono font-bold mb-1">Pricing Model Type:</label>
                  <select
                    value={editingPlan?.pricingType || 'per_month'}
                    onChange={e => setEditingPlan({ ...editingPlan, pricingType: e.target.value as any })}
                    className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="per_transaction">Per Transaction (Metered)</option>
                    <option value="per_day">Per Day License</option>
                    <option value="per_month">Per Month Subscription</option>
                    <option value="per_year">Per Year Annual Contract</option>
                    <option value="hybrid_base_metered">Hybrid (Base + Metered Overage)</option>
                    <option value="custom_contract">Bespoke Contract SLA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#8890a6] uppercase font-mono font-bold mb-1">Base Price:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan?.basePrice ?? 499}
                    onChange={e => setEditingPlan({ ...editingPlan, basePrice: Number(e.target.value) })}
                    className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[#8890a6] uppercase font-mono font-bold mb-1">Currency:</label>
                  <select
                    value={editingPlan?.currency || 'USD'}
                    onChange={e => setEditingPlan({ ...editingPlan, currency: e.target.value as any })}
                    className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8890a6] uppercase font-mono font-bold mb-1">Grace Period (Days):</label>
                  <input
                    type="number"
                    value={editingPlan?.gracePeriodDays ?? 7}
                    onChange={e => setEditingPlan({ ...editingPlan, gracePeriodDays: Number(e.target.value) })}
                    className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8890a6] uppercase font-mono font-bold mb-1">Automated Action on Unpaid Status:</label>
                <select
                  value={editingPlan?.autoEnforcementAction || 'hard_block_402'}
                  onChange={e => setEditingPlan({ ...editingPlan, autoEnforcementAction: e.target.value as any })}
                  className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="hard_block_402">HTTP 402 Hard Traffic Block (Immediately Block API Gateway)</option>
                  <option value="soft_warning">Soft Warning (Header & UI Notification)</option>
                  <option value="rate_limit_throttle">Rate Limit Throttling (Restrict to 5 RPM)</option>
                  <option value="read_only">Read-Only Mode (Block Mutations)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#222636] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-[#181c28] hover:bg-[#222636] text-[#cccccc] font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-950/40"
                >
                  Save Licensing Blueprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN LICENSE MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#222636] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222636] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Assign Application License to Tenant
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-[#8890a6] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAssignLicenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8890a6] uppercase font-mono font-bold mb-1">Select Tenant:</label>
                <select
                  value={newLicenseTenantId}
                  onChange={e => setNewLicenseTenantId(e.target.value)}
                  className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8890a6] uppercase font-mono font-bold mb-1">Select Application:</label>
                <select
                  value={newLicenseAppId}
                  onChange={e => setNewLicenseAppId(e.target.value)}
                  className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                >
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>{app.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8890a6] uppercase font-mono font-bold mb-1">Select Commercial Plan Blueprint:</label>
                <select
                  value={newLicensePlanId}
                  onChange={e => setNewLicensePlanId(e.target.value)}
                  className="w-full bg-[#181c28] border border-[#283046] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                >
                  {licensingPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} (${plan.basePrice} / {plan.billingCycle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#222636] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-[#181c28] hover:bg-[#222636] text-[#cccccc] font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-950/40"
                >
                  Bind & Issue License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
