/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AIProvider,
  AIModel,
  Customer,
  CustomerUser,
  StatutoryOfficers,
  Application,
  ApiKey,
  RoutingRule,
  AIPolicy,
  GlobalComplianceConfig,
  DataSubjectRequest,
  AuditLog,
  UsageMetric,
  SystemHealthItem,
  ProviderTestResult,
  OrchestrationRequest,
  OrchestrationResponse,
  ApplicationStatus,
  IamUser,
  IamRole
} from './types';
import {
  initialProviders,
  initialModels,
  initialCustomers,
  initialApplications,
  initialApiKeys,
  initialRoutingRules,
  initialPolicies,
  initialGlobalComplianceConfig,
  initialDataSubjectRequests,
  initialAuditLogs,
  initialUsageMetrics,
  initialSystemHealth,
  initialSlaProfiles,
  initialKpiDefinitions,
  initialIncidents,
  initialProblems,
  initialWorkflows,
  initialIamUsers,
  initialIamRoles,
  initialComplianceControls,
  initialEvidence,
  initialExecutiveReports
} from './data/initialState';
import { Header } from './components/Header';
import { Sidebar, NavTabId } from './components/Sidebar';
import { ArchitectureModal } from './components/ArchitectureModal';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { ProvidersView } from './components/ProvidersView';
import { ProviderTelemetryView } from './components/ProviderTelemetryView';
import { ModelsView } from './components/ModelsView';
import { ApplicationsView } from './components/ApplicationsView';
import { ApiKeysView } from './components/ApiKeysView';
import { RoutingView } from './components/RoutingView';
import { PoliciesView } from './components/PoliciesView';
import { PopiaGdprComplianceView } from './components/PopiaGdprComplianceView';
import { UsageLogsView } from './components/UsageLogsView';
import { PlaygroundView } from './components/PlaygroundView';
import { OrgHierarchyView } from './components/OrgHierarchyView';
import { AdminSettingsView } from './components/AdminSettingsView';

// Enterprise Governance & Command Views
import { CommandCentreView } from './components/CommandCentreView';
import { SlaKpiMonitoringView } from './components/SlaKpiMonitoringView';
import { IncidentsView } from './components/IncidentsView';
import { SecOpsView } from './components/SecOpsView';
import { FinOpsView } from './components/FinOpsView';
import { AutomationView } from './components/AutomationView';
import { IamAdminView } from './components/IamAdminView';
import { ExecutiveReportsView } from './components/ExecutiveReportsView';
import { Tenant360View } from './components/Tenant360View';
import { ServiceManagementView } from './components/ServiceManagementView';
import { EnterpriseOperationsView } from './components/EnterpriseOperationsView';
import { AiGovernanceModelLabView } from './components/AiGovernanceModelLabView';
import { EnterpriseGovernanceRiskView } from './components/EnterpriseGovernanceRiskView';
import { LicensingMonetizationView } from './components/LicensingMonetizationView';
import { UniversalActivityTicker } from './components/UniversalActivityTicker';
import { INITIAL_LICENSING_PLANS, INITIAL_TENANT_LICENSES, INITIAL_PAYMENT_WEBHOOK_LOGS } from './data/licensingData';
import {
  LicensingPlanTemplate,
  TenantAppLicense,
  PaymentWebhookLog,
  CompanyScopeFilter,
  Incident,
  MultiChannelAlert,
  RagKnowledgeArticle,
  IncidentStatus
} from './types';
import { ScopeHeaderBar } from './components/ScopeHeaderBar';
import { Incident360DiagnosticModal } from './components/Incident360DiagnosticModal';
import { IncidentCrmView } from './components/IncidentCrmView';
import { LoginScreen } from './components/LoginScreen';
import { SplashScreen } from './components/SplashScreen';
import { INITIAL_INCIDENTS_LIST, INITIAL_ALERTS_LIST, INITIAL_RAG_KNOWLEDGE_BASE } from './data/incidentData';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSplashActive, setIsSplashActive] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string; tenant: string }>({
    name: 'Horatio Huxham',
    email: 'horatio.huxham@gmail.com',
    role: 'Global Super Admin',
    tenant: 'Total Company Scope'
  });

  const [activeTab, setActiveTab] = useState<NavTabId>('command_centre');
  const [architectureOpen, setArchitectureOpen] = useState(false);
  const [selectedTelemetryProviderId, setSelectedTelemetryProviderId] = useState<string>('p-openai');

  // Day/Night theme state
  const [theme, setTheme] = useState<'night' | 'day'>(() => {
    try {
      const saved = localStorage.getItem('altil_theme');
      return saved === 'day' ? 'day' : 'night';
    } catch {
      return 'night';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme === 'day' ? 'light' : 'dark');
      localStorage.setItem('altil_theme', theme);
    } catch (_) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'night' ? 'day' : 'night'));
    showToast(theme === 'night' ? 'Switched to Day mode' : 'Switched to Night mode');
  };

  // State entities
  const [providers, setProviders] = useState<AIProvider[]>(initialProviders);
  const [models, setModels] = useState<AIModel[]>(initialModels);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>(initialRoutingRules);
  const [policies, setPolicies] = useState<AIPolicy[]>(initialPolicies);
  const [globalComplianceConfig, setGlobalComplianceConfig] = useState<GlobalComplianceConfig>(initialGlobalComplianceConfig);
  const [dataSubjectRequests, setDataSubjectRequests] = useState<DataSubjectRequest[]>(initialDataSubjectRequests);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetric[]>(initialUsageMetrics);
  const [systemHealth, setSystemHealth] = useState<SystemHealthItem[]>(initialSystemHealth);

  // Enterprise Governance States
  const [slaProfiles, setSlaProfiles] = useState(initialSlaProfiles);
  const [kpis, setKpis] = useState(initialKpiDefinitions);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS_LIST);
  const [alertsList, setAlertsList] = useState<MultiChannelAlert[]>(INITIAL_ALERTS_LIST);
  const [ragKnowledgeBase, setRagKnowledgeBase] = useState<RagKnowledgeArticle[]>(INITIAL_RAG_KNOWLEDGE_BASE);
  const [problems, setProblems] = useState(initialProblems);
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [iamUsers, setIamUsers] = useState(initialIamUsers);
  const [iamRoles, setIamRoles] = useState(initialIamRoles);
  const [complianceControls, setComplianceControls] = useState(initialComplianceControls);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [executiveReports, setExecutiveReports] = useState(initialExecutiveReports);

  // Global Scope Filter State (Company -> Tenant -> Application Hierarchy)
  const [scopeFilter, setScopeFilter] = useState<CompanyScopeFilter>({
    tenantId: 'all',
    appId: 'all',
    scopeName: 'Total Company View'
  });

  // 360 Operational Diagnostic Modal state
  const [selectedDiagnosticIncident, setSelectedDiagnosticIncident] = useState<Incident | null>(null);

  const handleOpenDiagnosticModal = (incident: Incident) => {
    setSelectedDiagnosticIncident(incident);
  };

  const handleOpenIncidentById = (incidentId: string) => {
    const found = incidents.find(i => i.id === incidentId);
    if (found) {
      setSelectedDiagnosticIncident(found);
    } else {
      setActiveTab('incidents');
    }
  };

  const handleAddIncident = (newInc: Incident) => {
    setIncidents(prev => [newInc, ...prev]);
    showToast(`Major Incident ${newInc.id} declared and logged in CRM.`);
  };

  const handleUpdateIncidentStatus = (incidentId: string, status: IncidentStatus) => {
    setIncidents(prev =>
      prev.map(inc => (inc.id === incidentId ? { ...inc, status } : inc))
    );
    showToast(`Incident ${incidentId} status updated to ${status}.`);
  };

  const handleSendMultiChannelAlert = (alertPartial: Partial<MultiChannelAlert>) => {
    const newAlert: MultiChannelAlert = {
      id: `alt-${Date.now().toString(36)}`,
      incidentId: alertPartial.incidentId || 'INC-2026-ALERT',
      incidentTitle: alertPartial.incidentTitle || 'Emergency System Alert',
      severity: alertPartial.severity || 'P1_CRITICAL',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      tenantName: alertPartial.tenantName || 'Enterprise Tenant',
      appName: alertPartial.appName || 'Platform App',
      message: alertPartial.message || 'System operational alert dispatched.',
      channels: alertPartial.channels || ['sms', 'email', 'in_app'],
      recipientPhone: alertPartial.recipientPhone || '+27 82 555 0192',
      recipientEmail: alertPartial.recipientEmail || 'ciso@enterprise.co.za',
      smsStatus: alertPartial.smsStatus || 'sent',
      emailStatus: alertPartial.emailStatus || 'sent',
      inAppStatus: alertPartial.inAppStatus || 'delivered',
      isRead: false
    };

    setAlertsList(prev => [newAlert, ...prev]);
    showToast(`Multi-channel alert sent via ${newAlert.channels.join(', ').toUpperCase()}!`);
  };

  const handleMitigateIncident = (incidentId: string, actionName: string) => {
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status: 'mitigated',
            timeline: [
              ...inc.timeline,
              {
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                author: 'ALTIL 360 Operational Automation',
                note: `Executed 1-click mitigation action: "${actionName}". Traffic rerouted.`
              }
            ]
          };
        }
        return inc;
      })
    );
    showToast(`Incident ${incidentId} mitigated via "${actionName}".`);
  };

  // Enterprise Licensing & Commercial Monetization States
  const [licensingPlans, setLicensingPlans] = useState<LicensingPlanTemplate[]>(INITIAL_LICENSING_PLANS);
  const [tenantLicenses, setTenantLicenses] = useState<TenantAppLicense[]>(INITIAL_TENANT_LICENSES);
  const [paymentLogs, setPaymentLogs] = useState<PaymentWebhookLog[]>(INITIAL_PAYMENT_WEBHOOK_LOGS);

  // Inspection modal state
  const [selectedLogToInspect, setSelectedLogToInspect] = useState<AuditLog | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleViewProviderTelemetry = (providerId: string) => {
    setSelectedTelemetryProviderId(providerId);
    setActiveTab('telemetry');
  };

  // Initial fetch from backend if available
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [resProv, resMod, resCust, resApp, resKeys, resRoutes, resPol, resLogs, resComp, resDsar] = await Promise.allSettled([
          fetch('/api/v1/providers').then(r => r.json()),
          fetch('/api/v1/models').then(r => r.json()),
          fetch('/api/v1/customers').then(r => r.json()),
          fetch('/api/v1/applications').then(r => r.json()),
          fetch('/api/v1/api-keys').then(r => r.json()),
          fetch('/api/v1/routes').then(r => r.json()),
          fetch('/api/v1/policies').then(r => r.json()),
          fetch('/api/v1/logs').then(r => r.json()),
          fetch('/api/v1/compliance/config').then(r => r.json()),
          fetch('/api/v1/compliance/dsar').then(r => r.json())
        ]);

        if (resProv.status === 'fulfilled' && Array.isArray(resProv.value)) setProviders(resProv.value);
        if (resMod.status === 'fulfilled' && Array.isArray(resMod.value)) setModels(resMod.value);
        if (resCust.status === 'fulfilled' && Array.isArray(resCust.value)) setCustomers(resCust.value);
        if (resApp.status === 'fulfilled' && Array.isArray(resApp.value)) setApplications(resApp.value);
        if (resKeys.status === 'fulfilled' && Array.isArray(resKeys.value)) setApiKeys(resKeys.value);
        if (resRoutes.status === 'fulfilled' && Array.isArray(resRoutes.value)) setRoutingRules(resRoutes.value);
        if (resPol.status === 'fulfilled' && Array.isArray(resPol.value)) setPolicies(resPol.value);
        if (resLogs.status === 'fulfilled' && Array.isArray(resLogs.value)) setAuditLogs(resLogs.value);
        if (resComp.status === 'fulfilled' && resComp.value?.popia) setGlobalComplianceConfig(resComp.value);
        if (resDsar.status === 'fulfilled' && Array.isArray(resDsar.value)) setDataSubjectRequests(resDsar.value);
      } catch (err) {
        console.warn('Backend API connection defaulted to local state sync:', err);
      }
    };
    fetchInitialData();
  }, []);

  // --- Customer / Tenant Handlers ---
  const handleAddCustomer = async (customerData: any) => {
    try {
      const res = await fetch('/api/v1/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      const data = await res.json();
      if (data.customer) {
        setCustomers(prev => [data.customer, ...prev]);
        if (data.application) setApplications(prev => [data.application, ...prev]);
        if (data.apiKey) setApiKeys(prev => [data.apiKey, ...prev]);
        showToast(`Customer "${data.customer.name}" onboarded with statutory governance.`);
        return;
      }
    } catch (_) {}

    // Fallback local state creation
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newCust: Customer = {
      id: `cust-${(customerData.name || 'company').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36).slice(-4)}`,
      type: customerData.type || 'company',
      name: customerData.name,
      legalName: customerData.legalName || customerData.name,
      registrationNumber: customerData.registrationNumber || '',
      taxVatNumber: customerData.taxVatNumber || '',
      industry: customerData.industry || 'Financial Services',
      country: customerData.country || 'South Africa (ZA)',
      status: 'active',
      tier: customerData.tier || 'growth',
      monthlyBudgetUsd: Number(customerData.monthlyBudgetUsd) || 2500,
      currentSpendUsd: 0,
      rateLimitRpm: Number(customerData.rateLimitRpm) || 240,
      rateLimitTpm: 250000,
      primaryContact: customerData.primaryContact,
      statutoryOfficers: customerData.statutoryOfficers || {},
      users: [
        {
          id: `usr-${Date.now()}-1`,
          customerId: `cust-${Date.now()}`,
          name: customerData.primaryContact?.name || 'Primary Admin',
          email: customerData.primaryContact?.email || 'admin@customer.com',
          role: 'owner',
          designation: customerData.primaryContact?.role || 'Executive',
          mfaEnabled: true,
          status: 'active',
          lastLogin: null,
          createdAt: nowStr
        }
      ],
      connectedAppIds: [],
      assignedPolicyIds: ['pol-global-safety'],
      createdAt: nowStr,
      updatedAt: nowStr,
      notes: customerData.notes || ''
    };

    setCustomers(prev => [newCust, ...prev]);
    showToast(`Customer "${newCust.name}" activated.`);
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      await fetch(`/api/v1/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (_) {}

    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) } : c)));
    showToast('Customer record and statutory registrations updated.');
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await fetch(`/api/v1/customers/${id}`, { method: 'DELETE' });
    } catch (_) {}

    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast('Customer deactivated.');
  };

  const handleAddCustomerUser = async (customerId: string, userData: Partial<CustomerUser>) => {
    try {
      const res = await fetch(`/api/v1/customers/${customerId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const createdUser = await res.json();
      if (createdUser.id) {
        setCustomers(prev =>
          prev.map(c => (c.id === customerId ? { ...c, users: [...(c.users || []), createdUser] } : c))
        );
        showToast(`User "${createdUser.name}" added to organization.`);
        return;
      }
    } catch (_) {}

    // Fallback local
    const fallbackUser: CustomerUser = {
      id: `usr-${customerId}-${Date.now().toString(36)}`,
      customerId,
      name: userData.name || 'New Team Member',
      email: userData.email || 'user@customer.internal',
      role: userData.role || 'developer',
      designation: userData.designation || 'Engineer',
      mfaEnabled: userData.mfaEnabled ?? true,
      status: userData.status || 'active',
      lastLogin: null,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    setCustomers(prev =>
      prev.map(c => (c.id === customerId ? { ...c, users: [...(c.users || []), fallbackUser] } : c))
    );
    showToast(`User "${fallbackUser.name}" added.`);
  };

  const handleUpdateCustomerUser = async (customerId: string, userId: string, updates: Partial<CustomerUser>) => {
    try {
      await fetch(`/api/v1/customers/${customerId}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (_) {}

    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? {
              ...c,
              users: (c.users || []).map(u => (u.id === userId ? { ...u, ...updates } : u))
            }
          : c
      )
    );
    showToast('Member role & permissions updated.');
  };

  const handleDeleteCustomerUser = async (customerId: string, userId: string) => {
    try {
      await fetch(`/api/v1/customers/${customerId}/users/${userId}`, { method: 'DELETE' });
    } catch (_) {}

    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? { ...c, users: (c.users || []).filter(u => u.id !== userId) }
          : c
      )
    );
    showToast('Member removed from organization.');
  };

  const handleGenerateCustomerApiKey = async (
    customerId: string,
    keyData: { name: string; appId?: string; rateLimitRpm?: number; expiresInDays?: number; ipWhitelist?: string[]; scopes?: string[] }
  ): Promise<ApiKey | null> => {
    try {
      const res = await fetch(`/api/v1/customers/${customerId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyData)
      });
      const createdKey = await res.json();
      if (createdKey.id) {
        setApiKeys(prev => [createdKey, ...prev]);
        showToast(`API Key "${createdKey.name}" generated for customer.`);
        return createdKey;
      }
    } catch (_) {}

    // Fallback local key generation
    const cust = customers.find(c => c.id === customerId);
    const rawKey = `ALTIL-LIVE-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newKey: ApiKey = {
      id: `key-${Date.now().toString(36)}`,
      customerId,
      customerName: cust?.name || 'Customer Organization',
      appId: keyData.appId || 'all',
      appName: applications.find(a => a.id === keyData.appId)?.name || 'All Connected Applications',
      name: keyData.name || 'Customer API Key',
      key: rawKey,
      prefix: `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`,
      status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      expiresAt: keyData.expiresInDays ? new Date(Date.now() + keyData.expiresInDays * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19) : null,
      lastUsedAt: null,
      rateLimitRpm: keyData.rateLimitRpm || cust?.rateLimitRpm || 240,
      ipWhitelist: keyData.ipWhitelist || [],
      scopes: keyData.scopes || ['read:inference', 'read:models']
    };

    setApiKeys(prev => [newKey, ...prev]);
    showToast('Customer API key generated.');
    return newKey;
  };

  const handleConnectCustomerApplication = async (customerId: string, appId: string) => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId && !c.connectedAppIds.includes(appId)
          ? { ...c, connectedAppIds: [...c.connectedAppIds, appId] }
          : c
      )
    );
    setApplications(prev =>
      prev.map(a =>
        a.id === appId ? { ...a, customerId, customerName: customers.find(c => c.id === customerId)?.name } : a
      )
    );
    showToast('Application connected to customer tenant.');
  };

  // --- IAM User & Role Lifecycle Handlers ---
  const handleAddIamUser = async (newUser: IamUser) => {
    try {
      await fetch('/api/v1/iam/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.name.split(' ')[0] || 'Enterprise',
          last_name: newUser.name.split(' ').slice(1).join(' ') || 'User',
          department: newUser.department,
          title: newUser.designation,
          mfa_enabled: newUser.mfaEnabled,
          status: newUser.status.toUpperCase(),
          tenant_id: newUser.tenantId
        })
      });
    } catch (_) {}
    setIamUsers(prev => [newUser, ...prev]);
    showToast(`IAM User "${newUser.name}" provisioned successfully.`);
  };

  const handleUpdateIamUser = async (id: string, updates: Partial<IamUser>) => {
    try {
      const existingUser = iamUsers.find(u => u.id === id);
      if (existingUser) {
        const merged = { ...existingUser, ...updates };
        await fetch('/api/v1/iam/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: merged.id,
            email: merged.email,
            first_name: merged.name.split(' ')[0] || 'Enterprise',
            last_name: merged.name.split(' ').slice(1).join(' ') || 'User',
            department: merged.department,
            title: merged.designation,
            mfa_enabled: merged.mfaEnabled,
            status: merged.status.toUpperCase(),
            tenant_id: merged.tenantId
          })
        });
      }
    } catch (_) {}
    setIamUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    showToast(`User "${id}" security profile updated.`);
  };

  const handleDeleteIamUser = (id: string) => {
    setIamUsers(prev => prev.filter(u => u.id !== id));
    showToast(`User "${id}" removed from IAM directory.`);
  };

  const handleAddIamRole = (newRole: IamRole) => {
    setIamRoles(prev => [newRole, ...prev]);
    showToast(`Role "${newRole.name}" created successfully.`);
  };

  const handleUpdateIamRole = (id: string, updates: Partial<IamRole>) => {
    setIamRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    showToast(`Role "${id}" permissions updated.`);
  };

  const handleDeleteIamRole = (id: string) => {
    setIamRoles(prev => prev.filter(r => r.id !== id));
    showToast(`Role "${id}" removed.`);
  };

  // --- Provider Handlers ---
  const handleAddProvider = async (providerData: Partial<AIProvider>) => {
    const newProv: AIProvider = {
      id: `p-${Date.now()}`,
      name: providerData.name || 'New Provider',
      type: providerData.type || 'openai_compatible',
      endpoint: providerData.endpoint || 'https://api.openai.com/v1',
      apiKey: providerData.apiKey || '',
      enabled: providerData.enabled ?? true,
      status: 'online',
      modelsCount: 1,
      latencyMs: 140,
      errorRate: 0.0,
      totalRequests: 0,
      lastTested: new Date().toISOString().replace('T', ' ').slice(0, 19),
      priority: providerData.priority || 2,
      timeoutMs: providerData.timeoutMs || 10000,
      notes: providerData.notes || ''
    };

    try {
      await fetch('/api/v1/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProv)
      });
    } catch (_) {}

    setProviders(prev => [newProv, ...prev]);
    showToast(`Provider "${newProv.name}" registered successfully.`);
  };

  const handleUpdateProvider = async (id: string, updates: Partial<AIProvider>) => {
    try {
      await fetch(`/api/v1/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (_) {}

    setProviders(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Provider updated successfully.');
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      await fetch(`/api/v1/providers/${id}`, { method: 'DELETE' });
    } catch (_) {}

    setProviders(prev => prev.filter(p => p.id !== id));
    showToast('Provider removed from catalog.');
  };

  const handleTestProvider = async (providerId: string): Promise<ProviderTestResult> => {
    try {
      const res = await fetch(`/api/v1/providers/${providerId}/test`, {
        method: 'POST'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}

    // Fallback simulation if backend endpoint is unavailable
    const prov = providers.find(p => p.id === providerId);
    await new Promise(r => setTimeout(r, 600));
    return {
      providerId,
      providerName: prov?.name || 'Target Provider',
      timestamp: new Date().toISOString(),
      success: true,
      latencyMs: prov?.latencyMs || 120,
      authValid: true,
      reachable: true,
      modelsDiscoveredCount: prov?.modelsCount || 3,
      discoveredModels: ['qwen3.6:16k', 'llama-3.3-70b-versatile', 'gemini-2.5-flash'],
      sampleGenerationSuccess: true,
      sampleOutput: 'Handshake ACK: ALTIL Gateway ingress connection verified.'
    };
  };

  // --- Model Handlers ---
  const handleAddModel = async (modelData: Partial<AIModel>) => {
    const newMod: AIModel = {
      id: `m-${Date.now()}`,
      displayName: modelData.displayName || 'New Model',
      modelIdentifier: modelData.modelIdentifier || 'model-id',
      providerId: modelData.providerId || providers[0]?.id || 'p-ollama',
      status: 'online',
      contextWindow: modelData.contextWindow || 32768,
      maxOutputTokens: modelData.maxOutputTokens || 4096,
      enabled: modelData.enabled ?? true,
      capabilities: modelData.capabilities || ['general_ai'],
      costPer1kInput: modelData.costPer1kInput || 0,
      costPer1kOutput: modelData.costPer1kOutput || 0,
      averageLatencyMs: modelData.averageLatencyMs || 150,
      description: modelData.description || ''
    };

    try {
      await fetch('/api/v1/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMod)
      });
    } catch (_) {}

    setModels(prev => [newMod, ...prev]);
    showToast(`Model "${newMod.displayName}" registered.`);
  };

  const handleUpdateModel = async (id: string, updates: Partial<AIModel>) => {
    try {
      await fetch(`/api/v1/models/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (_) {}

    setModels(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
    showToast('Model configuration saved.');
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await fetch(`/api/v1/models/${id}`, { method: 'DELETE' });
    } catch (_) {}

    setModels(prev => prev.filter(m => m.id !== id));
    showToast('Model removed from catalog.');
  };

  // --- Application Handlers ---
  const handleAddApplication = async (appData: Partial<Application>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newApp: Application = {
      id: `app-${Date.now()}`,
      name: appData.name || 'New Application',
      appIdentifier: appData.appIdentifier || `app-${Date.now().toString(36)}`,
      description: appData.description || '',
      environment: appData.environment || 'production',
      status: 'active',
      createdAt: nowStr,
      updatedAt: nowStr,
      rateLimitRpm: appData.rateLimitRpm || 120,
      quotaMonthlyRequests: appData.quotaMonthlyRequests || 50000,
      quotaUsedRequests: 0,
      allowedCapabilities: appData.allowedCapabilities || ['general_ai', 'fast_chat'],
      assignedPolicyIds: appData.assignedPolicyIds || ['pol-global-safety'],
      contactEmail: appData.contactEmail || 'admin@introsoft.internal'
    };

    const newKeyStr = `ALTIL-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newKey: ApiKey = {
      id: `k-${Date.now()}`,
      appId: newApp.id,
      name: 'Default Ingress Key',
      key: newKeyStr,
      prefix: `${newKeyStr.slice(0, 10)}...${newKeyStr.slice(-4)}`,
      status: 'active',
      createdAt: nowStr,
      expiresAt: null,
      lastUsedAt: null,
      rateLimitRpm: newApp.rateLimitRpm,
      ipWhitelist: [],
      scopes: ['read:inference', 'read:models']
    };

    try {
      await fetch('/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
      });
      await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey)
      });
    } catch (_) {}

    setApplications(prev => [newApp, ...prev]);
    setApiKeys(prev => [newKey, ...prev]);
    showToast(`Application "${newApp.name}" registered with new API key.`);
  };

  const handleUpdateApplication = async (id: string, updates: Partial<Application>) => {
    try {
      await fetch(`/api/v1/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (_) {}

    setApplications(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    showToast('Application settings updated.');
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await fetch(`/api/v1/applications/${id}`, { method: 'DELETE' });
    } catch (_) {}

    setApplications(prev => prev.filter(a => a.id !== id));
    showToast('Application deleted.');
  };

  const handleToggleAppStatus = async (id: string, status: ApplicationStatus) => {
    try {
      await fetch(`/api/v1/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (_) {}

    setApplications(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));
    showToast(`Application access ${status === 'active' ? 'restored' : 'revoked'}.`);
  };

  // --- API Key Handlers ---
  const handleAddApiKey = async (keyData: Partial<ApiKey>) => {
    const newKey: ApiKey = {
      id: `k-${Date.now()}`,
      appId: keyData.appId || applications[0]?.id || 'app-introsoft',
      name: keyData.name || 'New API Key',
      key: keyData.key || `ALTIL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      prefix: keyData.prefix || 'ALTIL-xxxx...xxxx',
      status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      expiresAt: keyData.expiresAt || null,
      lastUsedAt: null,
      rateLimitRpm: keyData.rateLimitRpm || 120,
      ipWhitelist: keyData.ipWhitelist || [],
      scopes: keyData.scopes || ['read:inference', 'read:models']
    };

    try {
      await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey)
      });
    } catch (_) {}

    setApiKeys(prev => [newKey, ...prev]);
    showToast('New API key created.');
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      await fetch(`/api/v1/api-keys/${id}/revoke`, { method: 'POST' });
    } catch (_) {}

    setApiKeys(prev =>
      prev.map(k => (k.id === id ? { ...k, status: 'revoked' } : k))
    );
    showToast('API Key revoked.');
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await fetch(`/api/v1/api-keys/${id}`, { method: 'DELETE' });
    } catch (_) {}

    setApiKeys(prev => prev.filter(k => k.id !== id));
    showToast('API Key removed.');
  };

  // --- Route Handlers ---
  const handleAddRoute = async (routeData: Partial<RoutingRule>) => {
    const newRoute: RoutingRule = {
      id: `r-${Date.now()}`,
      name: routeData.name || 'New Routing Rule',
      taskOrCapability: routeData.taskOrCapability || 'general_ai',
      appId: routeData.appId || 'all',
      primaryModelId: routeData.primaryModelId || models[0]?.id || 'm-qwen-local',
      firstFallbackModelId: routeData.firstFallbackModelId,
      secondFallbackModelId: routeData.secondFallbackModelId,
      maxTokens: routeData.maxTokens || 4096,
      timeoutMs: routeData.timeoutMs || 8000,
      fallbackTriggers: routeData.fallbackTriggers || ['on_error', 'on_timeout'],
      loadBalancingStrategy: routeData.loadBalancingStrategy || 'priority_fallback',
      enabled: routeData.enabled ?? true,
      description: routeData.description || ''
    };

    try {
      await fetch('/api/v1/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoute)
      });
    } catch (_) {}

    setRoutingRules(prev => [newRoute, ...prev]);
    showToast(`Routing rule "${newRoute.name}" created.`);
  };

  const handleUpdateRoute = async (id: string, updates: Partial<RoutingRule>) => {
    try {
      await fetch(`/api/v1/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (_) {}

    setRoutingRules(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
    showToast('Routing rule updated.');
  };

  const handleDeleteRoute = async (id: string) => {
    try {
      await fetch(`/api/v1/routes/${id}`, { method: 'DELETE' });
    } catch (_) {}

    setRoutingRules(prev => prev.filter(r => r.id !== id));
    showToast('Routing rule deleted.');
  };

  // --- Policy Handlers ---
  const handleAddPolicy = async (policyData: Partial<AIPolicy>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newPol: AIPolicy = {
      id: `pol-${Date.now()}`,
      name: policyData.name || 'New Policy',
      description: policyData.description || '',
      appliesToAppIds: policyData.appliesToAppIds || ['all'],
      status: 'active',
      createdAt: nowStr,
      updatedAt: nowStr,
      rules: policyData.rules || {
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
    };

    try {
      await fetch('/api/v1/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPol)
      });
    } catch (_) {}

    setPolicies(prev => [newPol, ...prev]);
    showToast(`AI Policy "${newPol.name}" created.`);
  };

  const handleUpdatePolicy = async (id: string, updates: Partial<AIPolicy>) => {
    try {
      await fetch(`/api/v1/policies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (_) {}

    setPolicies(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    showToast('AI Policy updated.');
  };

  const handleDeletePolicy = async (id: string) => {
    try {
      await fetch(`/api/v1/policies/${id}`, { method: 'DELETE' });
    } catch (_) {}

    setPolicies(prev => prev.filter(p => p.id !== id));
    showToast('AI Policy deleted.');
  };

  // --- Compliance & Data Subject Request Handlers ---
  const handleSaveGlobalComplianceConfig = async (newConfig: GlobalComplianceConfig) => {
    try {
      await fetch('/api/v1/compliance/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
    } catch (_) {}

    setGlobalComplianceConfig(newConfig);
    showToast('POPIA & GDPR compliance rules updated and active across gateway.');
  };

  const handleAddDataSubjectRequest = async (dsrData: Partial<DataSubjectRequest>) => {
    const newDsr: DataSubjectRequest = {
      id: dsrData.id || `DSR-${dsrData.framework === 'GDPR' ? 'EU' : 'ZA'}-${Date.now().toString(36).toUpperCase()}`,
      framework: dsrData.framework || 'POPIA',
      requestType: dsrData.requestType || 'access',
      subjectIdentifier: dsrData.subjectIdentifier || 'Anonymous',
      requestorName: dsrData.requestorName || 'Unknown',
      appId: dsrData.appId,
      status: dsrData.status || 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      dueAt: dsrData.dueAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      notes: dsrData.notes || ''
    };

    try {
      await fetch('/api/v1/compliance/dsar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDsr)
      });
    } catch (_) {}

    setDataSubjectRequests(prev => [newDsr, ...prev]);
    showToast(`Data Subject Request [${newDsr.id}] registered.`);
  };

  const handleUpdateDataSubjectRequest = async (id: string, updates: Partial<DataSubjectRequest>) => {
    try {
      await fetch(`/api/v1/compliance/dsar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (_) {}

    setDataSubjectRequests(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
    showToast(`Request ${id} status updated.`);
  };

  // --- Orchestration Execution in Playground ---
  const handleOrchestrate = async (payload: OrchestrationRequest): Promise<OrchestrationResponse> => {
    try {
      const res = await fetch('/api/v1/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      const executedProvName = data.executedProvider || data.selectedProvider || 'Ollama Local Cluster';
      const executedModName = data.executedModel || data.selectedModel || 'qwen3.6:16k';
      const outputText = data.output || data.response || data.error || 'Orchestration execution completed.';
      const tokensCount = typeof data.tokensConsumed === 'number' 
        ? data.tokensConsumed 
        : (data.totalTokens ? ((data.totalTokens.input || 0) + (data.totalTokens.output || 0)) : 280);

      const normalizedResponse: OrchestrationResponse = {
        id: data.id || data.requestId || `ALTIL-${Date.now().toString(36).toUpperCase()}`,
        status: data.status || (res.ok ? 'SUCCESS' : 'ERROR'),
        capability: data.capability || payload.capability || 'general_ai',
        executedModel: executedModName,
        executedProvider: executedProvName,
        durationSeconds: typeof data.durationSeconds === 'number' ? data.durationSeconds : 0.22,
        tokensConsumed: tokensCount,
        output: outputText,
        timestamp: data.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
        fallbackTriggered: Boolean(data.fallbackTriggered),
        policyPassed: data.policyPassed ?? (data.status !== 'POLICY_BLOCKED'),
        piiScrubbed: Boolean(data.piiScrubbed)
      };

      // Dynamically insert into Audit log list so the user immediately sees it
      const newLog: AuditLog = {
        id: normalizedResponse.id,
        timestamp: normalizedResponse.timestamp,
        appId: payload.appId,
        appName: applications.find(a => a.id === payload.appId)?.name || 'Introsoft Client',
        capability: payload.capability,
        providerId: (executedProvName || 'altil').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        providerName: executedProvName,
        modelIdentifier: executedModName,
        tokensConsumed: normalizedResponse.tokensConsumed,
        durationSeconds: normalizedResponse.durationSeconds,
        status: normalizedResponse.status,
        policyChecksPassed: normalizedResponse.policyPassed ?? true,
        piiScrubbed: normalizedResponse.piiScrubbed,
        promptPreview: (payload.prompt || '').slice(0, 100) + ((payload.prompt || '').length > 100 ? '...' : ''),
        responsePreview: outputText.slice(0, 180) + (outputText.length > 180 ? '...' : '')
      };

      setAuditLogs(prev => [newLog, ...prev]);

      return normalizedResponse;
    } catch (err: any) {
      // Fallback local simulation if backend route fails
      const fallbackProv = payload.simulateProviderFailure ? 'Groq Cloud LPU' : 'Ollama Local Cluster';
      const fallbackMod = payload.simulateProviderFailure ? 'llama-3.3-70b-versatile' : 'qwen3.6:16k';
      
      const fallbackResponse: OrchestrationResponse = {
        id: `ALTIL-LOCAL-${Date.now().toString(36).toUpperCase()}`,
        status: payload.simulateProviderFailure ? 'FALLBACK_SUCCESS' : 'SUCCESS',
        capability: payload.capability || 'general_ai',
        executedModel: fallbackMod,
        executedProvider: fallbackProv,
        durationSeconds: 0.18,
        tokensConsumed: 310,
        output: `[ALTIL Local Fallback Engine]\n\nOrchestration completed for application payload.\n\nOutput Summary:\n${payload.prompt}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        fallbackTriggered: Boolean(payload.simulateProviderFailure),
        policyPassed: true,
        piiScrubbed: false
      };

      const fallbackLog: AuditLog = {
        id: fallbackResponse.id,
        timestamp: fallbackResponse.timestamp,
        appId: payload.appId,
        appName: applications.find(a => a.id === payload.appId)?.name || 'Introsoft Client',
        capability: payload.capability,
        providerId: fallbackProv.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        providerName: fallbackProv,
        modelIdentifier: fallbackMod,
        tokensConsumed: 310,
        durationSeconds: 0.18,
        status: fallbackResponse.status,
        policyChecksPassed: true,
        piiScrubbed: false,
        promptPreview: (payload.prompt || '').slice(0, 100) + '...',
        responsePreview: fallbackResponse.output.slice(0, 180) + '...'
      };

      setAuditLogs(prev => [fallbackLog, ...prev]);
      return fallbackResponse;
    }
  };

  const handleOpenPlaygroundWithApp = (appId: string) => {
    setActiveTab('playground');
  };

  const handleInspectLogFromDashboard = (log: AuditLog) => {
    setSelectedLogToInspect(log);
    setActiveTab('logs');
  };

  const handleLoginSuccess = (user: { name: string; email: string; role: string; tenant: string }) => {
    setCurrentUser(user);
    setIsSplashActive(true);
  };

  const handleSplashComplete = () => {
    setIsSplashActive(false);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('altil_auth_token');
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (_) {}
    localStorage.removeItem('altil_auth_token');
    localStorage.removeItem('altil_user_profile');
    setIsAuthenticated(false);
    setIsSplashActive(false);
  };

  // Restore authenticated session from localStorage on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('altil_auth_token');
    const savedProfile = localStorage.getItem('altil_user_profile');
    if (savedToken && savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setCurrentUser({
          name: parsed.name || `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'Enterprise Admin',
          email: parsed.email || 'horatio.huxham@gmail.com',
          role: parsed.role || 'Global Super Admin',
          tenant: parsed.tenant || 'Total Company Scope'
        });
        setIsAuthenticated(true);
      } catch (_) {}
    }
  }, []);

  if (!isAuthenticated && !isSplashActive) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (isSplashActive) {
    return (
      <SplashScreen
        userName={currentUser.name}
        userRole={currentUser.role}
        onComplete={handleSplashComplete}
        minDurationMs={1500}
      />
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] text-[#e5e5e5] flex flex-col font-sans selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* Top Navigation Header */}
      <Header
        onOpenArchitecture={() => setArchitectureOpen(true)}
        onOpenPlayground={() => setActiveTab('playground')}
        theme={theme}
        onToggleTheme={toggleTheme}
        alertsList={alertsList}
        onOpenAlertsView={() => setActiveTab('incidents')}
        onOpenIncidentById={handleOpenIncidentById}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Universal Enterprise Live Event Ticker */}
      <UniversalActivityTicker />

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          counts={{
            customers: customers.length,
            providers: providers.length,
            models: models.length,
            applications: applications.length,
            keys: apiKeys.length,
            routes: routingRules.length,
            policies: policies.length,
            complianceRequests: dataSubjectRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length,
            logs: auditLogs.length
          }}
        />

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Universal Scope Drill-Down Navigation Bar (Total Company -> Tenant -> Application) */}
          <ScopeHeaderBar
            scopeFilter={scopeFilter}
            onScopeChange={setScopeFilter}
            customers={customers}
            applications={applications}
            activeIncidentsCount={incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved').length}
            onNavigateToTenants={() => setActiveTab('tenants')}
          />

          {(activeTab === 'command_centre' || activeTab === 'dashboard') && (
            <CommandCentreView
              customers={customers}
              providers={providers}
              auditLogs={auditLogs}
              incidents={incidents}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'tenant_360' && (
            <Tenant360View
              customers={customers}
              onNavigateToTenants={() => setActiveTab('tenants')}
            />
          )}

          {activeTab === 'service_management' && (
            <ServiceManagementView
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'operations_cmdb' && (
            <EnterpriseOperationsView />
          )}

          {activeTab === 'ai_governance_lab' && (
            <AiGovernanceModelLabView />
          )}

          {activeTab === 'enterprise_risk' && (
            <EnterpriseGovernanceRiskView />
          )}

          {(activeTab === 'tenants' || activeTab === 'customers') && (
            <CustomersView
              customers={customers}
              applications={applications}
              apiKeys={apiKeys}
              policies={policies}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onAddUser={handleAddCustomerUser}
              onUpdateUser={handleUpdateCustomerUser}
              onDeleteUser={handleDeleteCustomerUser}
              onGenerateCustomerApiKey={handleGenerateCustomerApiKey}
              onRevokeApiKey={handleRevokeApiKey}
              onConnectApplication={handleConnectCustomerApplication}
              onOpenPlaygroundWithCustomerKey={(key, appId) => {
                setActiveTab('playground');
              }}
            />
          )}

          {activeTab === 'sla_kpi_monitoring' && (
            <SlaKpiMonitoringView
              customers={customers}
              slaProfiles={slaProfiles}
              kpis={kpis}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentCrmView
              incidents={incidents}
              problems={problems}
              alerts={alertsList}
              customers={customers}
              applications={applications}
              ragKnowledgeBase={ragKnowledgeBase}
              onOpenDiagnosticModal={handleOpenDiagnosticModal}
              onAddIncident={handleAddIncident}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              onSendMultiChannelAlert={handleSendMultiChannelAlert}
            />
          )}

          {(activeTab === 'ai_ops' || activeTab === 'providers' || activeTab === 'telemetry' || activeTab === 'models' || activeTab === 'routing') && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[#222222] pb-3 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('providers')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'providers' || activeTab === 'ai_ops' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Providers List
                </button>
                <button
                  onClick={() => setActiveTab('telemetry')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'telemetry' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Telemetry
                </button>
                <button
                  onClick={() => setActiveTab('models')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'models' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Model Catalog
                </button>
                <button
                  onClick={() => setActiveTab('routing')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'routing' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Routing Rules
                </button>
              </div>

              {(activeTab === 'providers' || activeTab === 'ai_ops') && (
                <ProvidersView
                  providers={providers}
                  onAddProvider={handleAddProvider}
                  onUpdateProvider={handleUpdateProvider}
                  onDeleteProvider={handleDeleteProvider}
                  onTestProvider={handleTestProvider}
                  onViewTelemetry={handleViewProviderTelemetry}
                />
              )}

              {activeTab === 'telemetry' && (
                <ProviderTelemetryView
                  providers={providers}
                  models={models}
                  selectedProviderId={selectedTelemetryProviderId || providers[0]?.id || 'p-openai'}
                  onSelectProviderId={setSelectedTelemetryProviderId}
                  onOpenPlaygroundWithProvider={(provId) => {
                    setActiveTab('playground');
                  }}
                  onEditProvider={(prov) => {
                    setActiveTab('providers');
                  }}
                  onRunTest={handleTestProvider}
                />
              )}

              {activeTab === 'models' && (
                <ModelsView
                  models={models}
                  providers={providers}
                  onAddModel={handleAddModel}
                  onUpdateModel={handleUpdateModel}
                  onDeleteModel={handleDeleteModel}
                />
              )}

              {activeTab === 'routing' && (
                <RoutingView
                  routingRules={routingRules}
                  models={models}
                  providers={providers}
                  applications={applications}
                  onAddRoute={handleAddRoute}
                  onUpdateRoute={handleUpdateRoute}
                  onDeleteRoute={handleDeleteRoute}
                />
              )}
            </div>
          )}

          {(activeTab === 'api_mgmt' || activeTab === 'applications' || activeTab === 'keys') && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[#222222] pb-3 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'applications' || activeTab === 'api_mgmt' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Applications
                </button>
                <button
                  onClick={() => setActiveTab('keys')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'keys' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  API Gateway Keys
                </button>
              </div>

              {(activeTab === 'applications' || activeTab === 'api_mgmt') && (
                <ApplicationsView
                  applications={applications}
                  apiKeys={apiKeys}
                  policies={policies}
                  onAddApplication={handleAddApplication}
                  onUpdateApplication={handleUpdateApplication}
                  onDeleteApplication={handleDeleteApplication}
                  onToggleStatus={handleToggleAppStatus}
                  onSelectAppForPlayground={handleOpenPlaygroundWithApp}
                />
              )}

              {activeTab === 'keys' && (
                <ApiKeysView
                  apiKeys={apiKeys}
                  applications={applications}
                  onAddApiKey={handleAddApiKey}
                  onRevokeApiKey={handleRevokeApiKey}
                  onDeleteApiKey={handleDeleteApiKey}
                />
              )}
            </div>
          )}

          {activeTab === 'sec_ops' && (
            <SecOpsView
              customers={customers}
              providers={providers}
              auditLogs={auditLogs}
            />
          )}

          {(activeTab === 'governance' || activeTab === 'policies') && (
            <PoliciesView
              policies={policies}
              applications={applications}
              providers={providers}
              onAddPolicy={handleAddPolicy}
              onUpdatePolicy={handleUpdatePolicy}
              onDeletePolicy={handleDeletePolicy}
            />
          )}

          {activeTab === 'compliance' && (
            <PopiaGdprComplianceView
              globalConfig={globalComplianceConfig}
              onSaveGlobalConfig={handleSaveGlobalComplianceConfig}
              dataSubjectRequests={dataSubjectRequests}
              onAddDataSubjectRequest={handleAddDataSubjectRequest}
              onUpdateDataSubjectRequest={handleUpdateDataSubjectRequest}
              applications={applications}
              providers={providers}
            />
          )}

          {activeTab === 'finops' && (
            <FinOpsView
              customers={customers}
            />
          )}

          {activeTab === 'tenant_licensing' && (
            <LicensingMonetizationView
              customers={customers}
              applications={applications}
              licensingPlans={licensingPlans}
              tenantLicenses={tenantLicenses}
              paymentLogs={paymentLogs}
              onAddPlanTemplate={(plan) => setLicensingPlans([plan, ...licensingPlans])}
              onUpdatePlanTemplate={(plan) => setLicensingPlans(licensingPlans.map(p => p.id === plan.id ? plan : p))}
              onAssignTenantLicense={(license) => setTenantLicenses([license, ...tenantLicenses])}
              onUpdateTenantLicense={(license) => setTenantLicenses(tenantLicenses.map(l => l.id === license.id ? license : l))}
              onProcessPaymentWebhook={(event) => setPaymentLogs([event, ...paymentLogs])}
            />
          )}

          {activeTab === 'automation' && (
            <AutomationView
              workflows={workflows}
            />
          )}

          {activeTab === 'reporting' && (
            <ExecutiveReportsView
              reports={executiveReports}
            />
          )}

          {(activeTab === 'iam_admin' || activeTab === 'admin_settings') && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[#222222] pb-3 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('iam_admin')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'iam_admin' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  IAM Users & Roles
                </button>
                <button
                  onClick={() => setActiveTab('admin_settings')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeTab === 'admin_settings' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Platform & Currency Settings
                </button>
              </div>

              {activeTab === 'iam_admin' && (
                <IamAdminView
                  users={iamUsers}
                  roles={iamRoles}
                  customers={customers}
                  onAddUser={handleAddIamUser}
                  onUpdateUser={handleUpdateIamUser}
                  onDeleteUser={handleDeleteIamUser}
                  onAddRole={handleAddIamRole}
                  onUpdateRole={handleUpdateIamRole}
                  onDeleteRole={handleDeleteIamRole}
                />
              )}

              {activeTab === 'admin_settings' && (
                <AdminSettingsView />
              )}
            </div>
          )}

          {(activeTab === 'usage' || activeTab === 'logs' || activeTab === 'system') && (
            <UsageLogsView
              auditLogs={auditLogs}
              usageMetrics={usageMetrics}
              applications={applications}
              providers={providers}
              models={models}
              selectedLogToInspect={selectedLogToInspect}
              onCloseInspectModal={() => setSelectedLogToInspect(null)}
            />
          )}

          {activeTab === 'playground' && (
            <PlaygroundView
              applications={applications}
              apiKeys={apiKeys}
              routingRules={routingRules}
              policies={policies}
              onOrchestrate={handleOrchestrate}
            />
          )}
        </main>
      </div>

      {/* Global Architecture Interactive Modal */}
      <ArchitectureModal
        isOpen={architectureOpen}
        onClose={() => setArchitectureOpen(false)}
      />

      {/* 360 Operational Diagnostic Inspector Modal */}
      {selectedDiagnosticIncident && (
        <Incident360DiagnosticModal
          incident={selectedDiagnosticIncident}
          onClose={() => setSelectedDiagnosticIncident(null)}
          onMitigate={handleMitigateIncident}
          onTriggerAlert={(inc, channel) => {
            handleSendMultiChannelAlert({
              incidentId: inc.id,
              incidentTitle: inc.title,
              severity: inc.severity,
              tenantName: inc.affectedTenantNames?.[0],
              message: `[ALTIL ${inc.severity}] ${inc.title}`,
              channels: [channel]
            });
          }}
        />
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div
          id="altil-toast"
          className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-3 py-2 rounded bg-[#141414] border border-[#222222] text-[#e5e5e5] text-xs font-mono shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
