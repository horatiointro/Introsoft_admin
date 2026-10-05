import { CustomerJourney, canOpenJourneyTool, customerJourneySteps } from './components/CustomerJourney';
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
import { PoliciesView, type PolicyImportTemplate } from './components/PoliciesView';
import { PopiaGdprComplianceView } from './components/PopiaGdprComplianceView';
import { TrustFabricView } from './components/TrustFabricView';
import { UsageLogsView } from './components/UsageLogsView';
import { PlaygroundView } from './components/PlaygroundView';
import { ApiDocumentationView } from './components/ApiDocumentationView';
import { DeveloperCentreView } from './components/DeveloperCentreView';
import { OrgHierarchyView } from './components/OrgHierarchyView';
import { CommercialAccountPortalView } from './components/CommercialAccountPortalView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { HelpGuideView } from './components/HelpGuideView';
import { HelpContext, InfoButton } from './components/InfoButton';
import { getHelpTopic } from './data/helpTopics';
import { ScreenAssistant } from './components/ScreenAssistant';

// Enterprise Governance & Command Views
import { CommandCentreView } from './components/CommandCentreView';
import { SlaKpiMonitoringView } from './components/SlaKpiMonitoringView';
import { IncidentsView } from './components/IncidentsView';
import { SecOpsView } from './components/SecOpsView';
import { FinOpsView } from './components/FinOpsView';
import { AutomationView } from './components/AutomationView';
import { IamAdminView } from './components/IamAdminView';
import { ExecutiveReportsView } from './components/ExecutiveReportsView';
import { AltilStackWiringView } from './components/AltilStackWiringView';
import { Tenant360View } from './components/Tenant360View';
import { ServiceManagementView } from './components/ServiceManagementView';
import { EnterpriseOperationsView } from './components/EnterpriseOperationsView';
import { AiGovernanceModelLabView } from './components/AiGovernanceModelLabView';
import { EnterpriseGovernanceRiskView } from './components/EnterpriseGovernanceRiskView';
import { LicensingMonetizationView } from './components/LicensingMonetizationView';
import { BillingAdminView } from './components/BillingAdminView';
import { FinanceCommerceView } from './components/FinanceCommerceView';
import { SelfRegistrationPage } from './components/SelfRegistrationPage';
import { AccountActivationPage } from './components/AccountActivationPage';
import { SaasGrowthView } from './components/SaasGrowthView';
import { CommunicationsHubView } from './components/CommunicationsHubView';
import { TenantPortalView } from './components/TenantPortalView';
import { AccountingControlView } from './components/AccountingControlView';
import { StageFFinanceView } from './components/StageFCommercialViews';
import { LegalPolicyPage } from './components/LegalPolicyPage';
import { DataProtectionDcrView } from './components/DataProtectionDcrView';
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
import { apiFetch } from './utils/apiFetch';
import { normalizeOrchestrationResponse } from './utils/orchestrationResponse';

const API_BASE = `${import.meta.env.BASE_URL}api/v1`;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSplashActive, setIsSplashActive] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string; tenant: string }>({
    name: 'Horatio Huxham',
    email: 'horatio.huxham@gmail.com',
    role: 'Global Super Admin',
    tenant: 'Total Company Scope'
  });
  const [authorizationScope, setAuthorizationScope] = useState<{
    organizationId: string | null;
    visibleOrganizationIds: string[];
    permissions: string[];
    global: boolean;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<NavTabId>('command_centre');
  const [onboardingOrderCustomerId, setOnboardingOrderCustomerId] = useState<string | undefined>();
  const [journeyStep, setJourneyStep] = useState(0);
  const [journeyTool, setJourneyTool] = useState<NavTabId>('commercial_account_portal');
  const viewTab = activeTab === 'customer_journey' ? journeyTool : activeTab;
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

  useEffect(() => {
    if (activeTab !== 'customer_journey' || canOpenJourneyTool(journeyTool, authorizationScope?.global || false, authorizationScope?.permissions || [])) return;
    const first = customerJourneySteps.flatMap((step, index) => step.tools.map(tool => ({ ...tool, index })))
      .find(tool => canOpenJourneyTool(tool.tab, authorizationScope?.global || false, authorizationScope?.permissions || []));
    if (first) { setJourneyTool(first.tab); setJourneyStep(first.index); }
  }, [activeTab, journeyTool, authorizationScope]);

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

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadCommercialData = async () => {
      try {
        const [plansResponse, licensesResponse] = await Promise.all([apiFetch(`${API_BASE}/licensing/plans`), apiFetch(`${API_BASE}/licensing/tenant-licenses`)]);
        if (plansResponse.ok) setLicensingPlans(await plansResponse.json());
        if (licensesResponse.ok) setTenantLicenses(await licensesResponse.json());
      } catch { /* Keep the seeded read-only preview available while the commercial API is offline. */ }
    };
    void loadCommercialData();
  }, [isAuthenticated]);

  // Inspection modal state
  const [selectedLogToInspect, setSelectedLogToInspect] = useState<AuditLog | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const saveCommercialRecord = async (path: string, record: LicensingPlanTemplate | TenantAppLicense) => {
    const response = await apiFetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'ALTIL could not save this commercial change.');
    return result;
  };

  const handleSavePlan = async (plan: LicensingPlanTemplate, create = false) => {
    try {
      await saveCommercialRecord('/licensing/plans', plan);
      setLicensingPlans(current => create ? [plan, ...current.filter(item => item.id !== plan.id)] : current.map(item => item.id === plan.id ? plan : item));
      showToast('Commercial plan saved.');
    } catch (error: any) { showToast(error?.message || 'Could not save commercial plan.', 'error'); }
  };

  const handleSaveTenantLicense = async (license: TenantAppLicense, create = false) => {
    try {
      await saveCommercialRecord('/licensing/tenant-licenses/update', license);
      setTenantLicenses(current => create ? [license, ...current.filter(item => item.id !== license.id)] : current.map(item => item.id === license.id ? license : item));
      showToast('Tenant subscription saved.');
    } catch (error: any) { showToast(error?.message || 'Could not save tenant subscription.', 'error'); }
  };

  const handleViewProviderTelemetry = (providerId: string) => {
    setSelectedTelemetryProviderId(providerId);
    setActiveTab('telemetry');
  };

  // Initial fetch from backend if available
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchInitialData = async () => {
      try {
        const [resProv, resMod, resCust, resApp, resKeys, resRoutes, resPol, resLogs, resComp, resDsar, resMe] = await Promise.allSettled([
          apiFetch(`${API_BASE}/providers`).then(r => r.json()),
          apiFetch(`${API_BASE}/models`).then(r => r.json()),
          apiFetch(`${API_BASE}/customers`).then(r => r.json()),
          apiFetch(`${API_BASE}/applications`).then(r => r.json()),
          apiFetch(`${API_BASE}/api-keys`).then(r => r.json()),
          apiFetch(`${API_BASE}/routes`).then(r => r.json()),
          apiFetch(`${API_BASE}/policies`).then(r => r.json()),
          apiFetch(`${API_BASE}/logs`).then(r => r.json()),
          apiFetch(`${API_BASE}/compliance/config`).then(r => r.json()),
          apiFetch(`${API_BASE}/compliance/dsar`).then(r => r.json()),
          apiFetch(`${API_BASE}/auth/me`).then(r => r.json())
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
        if (resMe.status === 'fulfilled' && resMe.value?.user?.authorization) {
          const authorization = resMe.value.user.authorization;
          setAuthorizationScope({
            organizationId: authorization.organizationId || null,
            visibleOrganizationIds: Array.isArray(authorization.visibleOrganizationIds) ? authorization.visibleOrganizationIds : [],
            permissions: Array.isArray(authorization.permissions) ? authorization.permissions : [],
            global: Array.isArray(authorization.scopes) && authorization.scopes.some((scope: any) => scope.visibility === 'GLOBAL')
          });
        } else {
          setAuthorizationScope(null);
        }
      } catch (err) {
        console.warn('Backend API connection defaulted to local state sync:', err);
      }
    };
    fetchInitialData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'logs' || import.meta.env.BASE_URL !== '/admin-test/') return;
    let active = true;
    const refreshAuditLogs = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/logs`);
        if (!response.ok) return;
        const logs = await response.json();
        if (active && Array.isArray(logs)) setAuditLogs(logs);
      } catch {
        // Keep the last successfully loaded audit view when the endpoint is unavailable.
      }
    };
    void refreshAuditLogs();
    const timer = window.setInterval(() => void refreshAuditLogs(), 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [activeTab, isAuthenticated]);

  // --- Customer / Tenant Handlers ---
  const handleAddCustomer = async (customerData: any) => {
    try {
      const res = await apiFetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.customer) throw new Error(data.error || 'Customer setup was not saved.');
      setCustomers(prev => [data.customer, ...prev]);
      if (data.application) setApplications(prev => [data.application, ...prev]);
      if (data.apiKey) setApiKeys(prev => [data.apiKey, ...prev]);
      showToast(`Customer "${data.customer.name}" onboarded with statutory governance.`);
      return data.customer as Customer;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Customer setup was not saved.');
      throw error;
    }
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const res = await apiFetch(`${API_BASE}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Customer changes were not saved.');
      setCustomers(prev => prev.map(c => c.id === id ? data : c));
      showToast('Customer record updated.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Customer changes were not saved.');
      throw error;
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const res = await apiFetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.customer) throw new Error(data.error || 'Customer could not be archived.');
      setCustomers(prev => prev.map(c => c.id === id ? data.customer : c));
      showToast('Customer archived. Its history has been retained.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Customer could not be archived.');
      throw error;
    }
  };

  const handleAddCustomerUser = async (customerId: string, userData: Partial<CustomerUser>) => {
    try {
      const res = await apiFetch(`${API_BASE}/customers/${customerId}/users`, {
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
      await apiFetch(`${API_BASE}/customers/${customerId}/users/${userId}`, {
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
      await apiFetch(`${API_BASE}/customers/${customerId}/users/${userId}`, { method: 'DELETE' });
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
      const res = await apiFetch(`${API_BASE}/customers/${customerId}/keys`, {
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
    const secureKeyId = globalThis.crypto?.randomUUID?.() || (() => {
      const bytes = new Uint8Array(16);
      globalThis.crypto?.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    })();
    if (!secureKeyId) throw new Error('Secure browser randomness is unavailable for local API-key generation.');
    const rawKey = `ALTIL-LIVE-${secureKeyId.replace(/-/g, '').toUpperCase()}`;
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
  const handleAddIamUser = (newUser: IamUser) => {
    setIamUsers(prev => [newUser, ...prev]);
    showToast(`Invitation created for "${newUser.name}". The account remains inactive until activation.`);
  };

  const handleUpdateIamUser = async (id: string, updates: Partial<IamUser>) => {
    try {
      const existingUser = iamUsers.find(u => u.id === id);
      if (existingUser) {
        const merged = { ...existingUser, ...updates };
        await apiFetch(`${API_BASE}/iam/users`, {
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
      await apiFetch(`${API_BASE}/providers`, {
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
      await apiFetch(`${API_BASE}/providers/${id}`, {
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
      await apiFetch(`${API_BASE}/providers/${id}`, { method: 'DELETE' });
    } catch (_) {}

    setProviders(prev => prev.filter(p => p.id !== id));
    showToast('Provider removed from catalog.');
  };

  const handleTestProvider = async (providerId: string): Promise<ProviderTestResult> => {
    try {
      const res = await apiFetch(`${API_BASE}/providers/${providerId}/test`, {
        method: 'POST'
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.errorMessage || result.error || `Live provider check failed (HTTP ${res.status}).`);
      return result as ProviderTestResult;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Live provider check could not reach ALTIL.');
    }
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
      await apiFetch(`${API_BASE}/models`, {
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
      await apiFetch(`${API_BASE}/models/${id}`, {
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
      await apiFetch(`${API_BASE}/models/${id}`, { method: 'DELETE' });
    } catch (_) {}

    setModels(prev => prev.filter(m => m.id !== id));
    showToast('Model removed from catalog.');
  };

  // --- Application Handlers ---
  const handleAddApplication = async (appData: Partial<Application>) => {
    try {
      const response = await apiFetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...appData, customerId: scopeFilter.tenantId === 'all' ? customers[0]?.id : scopeFilter.tenantId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not register the application and its key.');
      const newApp = result.application as Application;
      const newKey = result.apiKey as ApiKey;
      setApplications(prev => [newApp, ...prev.filter(app => app.id !== newApp.id)]);
      if (newKey) setApiKeys(prev => [newKey, ...prev.filter(key => key.id !== newKey.id)]);
      showToast(`Application "${newApp.name}" registered with an ALTIL-issued key.`);
    } catch (error: any) { showToast(error?.message || 'Could not register application.', 'error'); }
  };

  const handleUpdateApplication = async (id: string, updates: Partial<Application>) => {
    try {
      const response = await apiFetch(`${API_BASE}/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Application settings could not be saved.');
      setApplications(prev => prev.map(a => (a.id === id ? { ...a, ...result } : a)));
      showToast('Application settings updated.');
    } catch (error: any) { showToast(error?.message || 'Application settings could not be saved.', 'error'); }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      const response = await apiFetch(`${API_BASE}/applications/${id}`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Application could not be deleted.');
      setApplications(prev => prev.filter(a => a.id !== id));
      showToast('Application deleted.');
    } catch (error: any) { showToast(error?.message || 'Application could not be deleted.', 'error'); }
  };

  const handleToggleAppStatus = async (id: string, status: ApplicationStatus) => {
    try {
      const response = await apiFetch(`${API_BASE}/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Application status could not be changed.');
      setApplications(prev => prev.map(a => (a.id === id ? { ...a, ...result } : a)));
      showToast(`Application access ${status === 'active' ? 'restored' : 'revoked'}.`);
    } catch (error: any) { showToast(error?.message || 'Application status could not be changed.', 'error'); }
  };

  // --- API Key Handlers ---
  const handleAddApiKey = async (keyData: Partial<ApiKey>): Promise<ApiKey> => {
    const app = applications.find(item => item.id === keyData.appId);
    const payload = { ...keyData, customerId: app?.customerId, appId: app?.id };
    const response = await apiFetch(`${API_BASE}/api-keys`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'ALTIL could not issue this API key.');
    const newKey = result as ApiKey;
    setApiKeys(prev => [newKey, ...prev.filter(key => key.id !== newKey.id)]);
    showToast('ALTIL issued a new key. Copy it now; the full secret is shown once.');
    return newKey;
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      const response = await apiFetch(`${API_BASE}/api-keys/${id}/revoke`, { method: 'PUT' });
      if (!response.ok) throw new Error('ALTIL could not confirm this key revocation.');
    } catch (error: any) { showToast(error?.message || 'Could not revoke key.', 'error'); return; }

    setApiKeys(prev =>
      prev.map(k => (k.id === id ? { ...k, status: 'revoked' } : k))
    );
    showToast('API Key revoked.');
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const response = await apiFetch(`${API_BASE}/api-keys/${id}`, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'API key could not be removed.');
      setApiKeys(prev => prev.filter(k => k.id !== id));
      showToast('API Key removed.');
    } catch (error: any) { showToast(error?.message || 'API key could not be removed.', 'error'); }
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
      await apiFetch(`${API_BASE}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoute)
      });
    } catch (error: any) {
      showToast(error?.message || 'Routing rule could not be persisted.', 'error');
      throw error;
    }

    setRoutingRules(prev => [newRoute, ...prev]);
    showToast(`Routing rule "${newRoute.name}" created.`);
  };

  const handleUpdateRoute = async (id: string, updates: Partial<RoutingRule>) => {
    try {
      await apiFetch(`${API_BASE}/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (error: any) {
      showToast(error?.message || 'Routing rule could not be persisted.', 'error');
      throw error;
    }

    setRoutingRules(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
    showToast('Routing rule updated.');
  };

  const handleDeleteRoute = async (id: string) => {
    try {
      await apiFetch(`${API_BASE}/routes/${id}`, { method: 'DELETE' });
    } catch (error: any) {
      showToast(error?.message || 'Routing rule could not be deleted.', 'error');
      throw error;
    }

    setRoutingRules(prev => prev.filter(r => r.id !== id));
    showToast('Routing rule deleted.');
  };

  // --- Policy Handlers ---
  const handleAddPolicy = async (policyData: Partial<AIPolicy>): Promise<AIPolicy | undefined> => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newPol: AIPolicy = {
      id: `pol-${Date.now()}`,
      name: policyData.name || 'New Policy',
      description: policyData.description || '',
      appliesToAppIds: policyData.appliesToAppIds || ['all'],
      tenantId: policyData.tenantId,
      status: policyData.status || 'active',
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

    let savedPolicy = newPol;
    let policyPersisted = false;
    try {
      const response = await apiFetch(`${API_BASE}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPol)
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.id) {
        savedPolicy = result as AIPolicy;
        policyPersisted = true;
      }
    } catch (_) {}

    setPolicies(prev => [savedPolicy, ...prev]);
    showToast(`AI Policy "${newPol.name}" created.`);
    return policyPersisted ? savedPolicy : undefined;
  };

  const handleRecordPolicyEvidence = async (policy: AIPolicy, template: PolicyImportTemplate): Promise<{ status: string; evidenceId?: string }> => {
    const sourcePayload = JSON.stringify({
      source: 'ALTIL_LOCAL_TEST_POLICY_LIBRARY_V1',
      templateId: template.id,
      category: template.category,
      name: template.name,
      summary: template.summary,
      rules: template.rules,
    });
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sourcePayload));
    const contentHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const response = await apiFetch(`${API_BASE}/policies/${encodeURIComponent(policy.id)}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evidenceKind: 'MACHINE_EXTRACTION',
        sourceReference: `local-test-policy-library://${template.id}`,
        contentHash,
        contentType: 'application/vnd.altil.policy-template+json',
        extractionVersion: 'local-test-policy-library-v1',
        extractedRules: template.rules,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Policy evidence could not be recorded (${response.status}).`);
    return result as { status: string; evidenceId?: string };
  };

  const handleUpdatePolicy = async (id: string, updates: Partial<AIPolicy>) => {
    try {
      await apiFetch(`${API_BASE}/policies/${id}`, {
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
      await apiFetch(`${API_BASE}/policies/${id}`, { method: 'DELETE' });
    } catch (_) {}

    setPolicies(prev => prev.filter(p => p.id !== id));
    showToast('AI Policy deleted.');
  };

  // --- Compliance & Data Subject Request Handlers ---
  const handleSaveGlobalComplianceConfig = async (newConfig: GlobalComplianceConfig) => {
    try {
      await apiFetch(`${API_BASE}/compliance/config`, {
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
      const response = await apiFetch(`${API_BASE}/compliance/dsar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDsr)
      });
      if (!response.ok) throw new Error('DSAR persistence failed.');
    } catch (_) {
      showToast('The DSAR could not be saved. No request was recorded.', 'error');
      return;
    }

    setDataSubjectRequests(prev => [newDsr, ...prev]);
    showToast(`Data Subject Request [${newDsr.id}] registered.`);
  };

  const handleUpdateDataSubjectRequest = async (id: string, updates: Partial<DataSubjectRequest>) => {
    try {
      const response = await apiFetch(`${API_BASE}/compliance/dsar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('DSAR persistence failed.');
    } catch (_) {
      showToast('The DSAR update could not be saved.', 'error');
      return;
    }

    setDataSubjectRequests(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
    showToast(`Request ${id} status updated.`);
  };

  // --- Orchestration Execution in Playground ---
  const handleOrchestrate = async (payload: OrchestrationRequest): Promise<OrchestrationResponse> => {
    const attemptedAt = new Date().toISOString();
    try {
      const res = await apiFetch(`${API_BASE}/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      const normalized = normalizeOrchestrationResponse({ payload: data, httpOk: res.ok, attemptedAt });
      return normalized.response;
    } catch (error) {
      return normalizeOrchestrationResponse({
        payload: { error: error instanceof Error ? error.message : 'The orchestration request failed.' },
        httpOk: false,
        attemptedAt,
      }).response;
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
    if (user.role === 'CUSTOMER_ACCOUNT_USER') setActiveTab('commercial_account_portal');
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
        await apiFetch(`${API_BASE}/auth/logout`, {
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

  // Restore profile metadata from localStorage if present without auto-bypassing login
  useEffect(() => {
    const savedProfile = localStorage.getItem('altil_user_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setCurrentUser({
          name: parsed.name || `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'Enterprise Admin',
          email: parsed.email || 'horatio.huxham@gmail.com',
          role: parsed.role || 'Global Super Admin',
          tenant: parsed.tenant || 'Total Company Scope'
        });
      } catch (_) {}
    }
  }, []);

  if (window.location.pathname.replace(/\/$/, '').endsWith('/register')) return <SelfRegistrationPage />;
  if (window.location.pathname.replace(/\/$/, '').endsWith('/activate-account')) return <AccountActivationPage />;
  if (window.location.pathname.replace(/\/$/, '').startsWith('/legal/')) return <LegalPolicyPage />;

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
    <HelpContext.Provider value={{ activeTab, onOpenGuide: () => setActiveTab('help_guide') }}>
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
        onNavigate={setActiveTab}
        activeTab={activeTab}
        customerMode={currentUser.role === 'CUSTOMER_ACCOUNT_USER'}
      />

      {/* Universal Enterprise Live Event Ticker */}
      {currentUser.role !== 'CUSTOMER_ACCOUNT_USER' && <UniversalActivityTicker />}

      <div className="flex min-h-8 items-center gap-2 border-b border-white/5 bg-[#10131b] px-4 text-[10px] text-slate-400" aria-label="Authorization scope">
        <span className="font-semibold uppercase tracking-wider text-slate-500">Administration scope</span>
        {currentUser.role === 'CUSTOMER_ACCOUNT_USER' ? <span className="text-cyan-200">Customer mode · own commercial account</span> : authorizationScope?.global ? <span className="text-cyan-200">Introsoft Platform · Global</span> : authorizationScope?.organizationId ? <span>{authorizationScope.organizationId} · {authorizationScope.visibleOrganizationIds.length > 1 ? `This organisation + ${authorizationScope.visibleOrganizationIds.length - 1} authorised descendants` : 'This organisation'}</span> : <span className="text-amber-200">Scope unavailable · access is restricted</span>}
      </div>

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          permissions={authorizationScope?.permissions || []}
          globalScope={authorizationScope?.global || false}
          userName={currentUser.name}
          userRole={currentUser.role}
          customerMode={currentUser.role === 'CUSTOMER_ACCOUNT_USER'}
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
          {activeTab !== 'customer_journey' && <ScopeHeaderBar
            scopeFilter={scopeFilter}
            onScopeChange={setScopeFilter}
            customers={customers}
            applications={applications}
            activeIncidentsCount={incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved').length}
            onNavigateToTenants={() => { setJourneyStep(1); setJourneyTool('customer_add'); setActiveTab('customer_journey'); }}
          />}
          {activeTab === 'customer_journey' && <CustomerJourney
            customers={customers} selectedId={scopeFilter.tenantId} step={journeyStep} tool={journeyTool}
            global={authorizationScope?.global || false} permissions={authorizationScope?.permissions || []}
            onSelect={id => { setScopeFilter({ tenantId: id, appId: 'all', scopeName: customers.find(customer => customer.id === id)?.name || 'Authorised workspaces' }); setOnboardingOrderCustomerId(id === 'all' ? undefined : id); }}
            onOpen={(step, tool) => {
              if (!canOpenJourneyTool(tool, authorizationScope?.global || false, authorizationScope?.permissions || [])) return;
              setJourneyStep(step); setJourneyTool(tool);
            }}
          />}
          {viewTab !== 'help_guide' && (
            <div className="flex justify-end -mt-4">
              <InfoButton title={getHelpTopic(viewTab)?.title || 'Current screen'} description={getHelpTopic(viewTab)?.description || `You are viewing ${viewTab.replace(/_/g, ' ')}. Use this screen's headings for section-specific help, or open the full guide for all screen and feature descriptions.`} />
            </div>
          )}

          {viewTab === 'help_guide' && <HelpGuideView onNavigate={setActiveTab} />}
          {viewTab === 'api_docs' && <ApiDocumentationView />}
          {viewTab === 'developer_home' && <DeveloperCentreView
            onNavigate={setActiveTab}
            organizationLabel={authorizationScope?.organizationId || currentUser.tenant}
            globalScope={authorizationScope?.global || false}
            permissions={authorizationScope?.permissions || []}
          />}

          {(viewTab === 'command_centre' || viewTab === 'dashboard') && (
            <CommandCentreView
              customers={customers}
              providers={providers}
              applications={applications}
              auditLogs={auditLogs}
              incidents={incidents}
              incidentsProvenance="DEMO"
              onNavigate={setActiveTab}
            />
          )}

          {viewTab === 'stack_wiring' && (
            <AltilStackWiringView
              customers={customers}
              providers={providers}
              models={models}
              applications={applications}
              apiKeys={apiKeys}
              policies={policies}
              auditLogs={auditLogs}
              onNavigateToTab={setActiveTab}
            />
          )}

          {viewTab === 'tenant_360' && (
            <Tenant360View
              key={scopeFilter.tenantId}
              selectedTenantId={scopeFilter.tenantId === 'all' ? undefined : scopeFilter.tenantId}
              customers={activeTab === 'customer_journey' && scopeFilter.tenantId !== 'all' ? customers.filter(customer => customer.id === scopeFilter.tenantId) : customers}
              onNavigateToTenants={() => setActiveTab('tenants')}
            />
          )}

          {viewTab === 'service_management' && (
            <ServiceManagementView
              onNavigate={setActiveTab}
            />
          )}

          {viewTab === 'operations_cmdb' && (
            <EnterpriseOperationsView />
          )}

          {viewTab === 'ai_governance_lab' && (
            <AiGovernanceModelLabView />
          )}

          {viewTab === 'enterprise_risk' && (
            <EnterpriseGovernanceRiskView />
          )}

          {(viewTab === 'tenants' || viewTab === 'customers' || viewTab === 'customer_add' || viewTab === 'customer_manage' || viewTab === 'customer_logs') && (
            <CustomersView
              customers={activeTab === 'customer_journey' && scopeFilter.tenantId !== 'all' ? customers.filter(customer => customer.id === scopeFilter.tenantId) : customers}
              applications={applications}
              apiKeys={apiKeys}
              policies={policies}
              auditLogs={auditLogs}
              initialView={viewTab === 'customer_add' ? 'add' : viewTab === 'customer_logs' ? 'logs' : 'manage'}
              onAddCustomer={handleAddCustomer}
              continueAfterCreate={activeTab === 'customer_journey'}
              onContinueToOrders={customer => {
                setOnboardingOrderCustomerId(customer.id);
                setScopeFilter({ tenantId: customer.id, appId: 'all', scopeName: customer.name });
                setJourneyStep(2); setJourneyTool('billing_orders'); setActiveTab('customer_journey');
              }}
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

          {viewTab === 'org_hierarchy' && (
            <OrgHierarchyView
              customers={customers}
              applications={applications}
              apiKeys={apiKeys}
            />
          )}

          {viewTab === 'sla_kpi_monitoring' && (
            <SlaKpiMonitoringView
              customers={customers}
              slaProfiles={slaProfiles}
              kpis={kpis}
            />
          )}

          {viewTab === 'incidents' && (
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

          {(viewTab === 'ai_ops' || viewTab === 'providers' || viewTab === 'telemetry' || viewTab === 'models' || viewTab === 'routing') && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[#222222] pb-3 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('providers')}
                  className={`px-3 py-1.5 rounded transition-colors ${viewTab === 'providers' || viewTab === 'ai_ops' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Providers List
                </button>
                <button
                  onClick={() => setActiveTab('telemetry')}
                  className={`px-3 py-1.5 rounded transition-colors ${viewTab === 'telemetry' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Telemetry
                </button>
                <button
                  onClick={() => setActiveTab('models')}
                  className={`px-3 py-1.5 rounded transition-colors ${viewTab === 'models' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Model Catalog
                </button>
                <button
                  onClick={() => setActiveTab('routing')}
                  className={`px-3 py-1.5 rounded transition-colors ${viewTab === 'routing' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Routing Rules
                </button>
              </div>

              {(viewTab === 'providers' || viewTab === 'ai_ops') && (
                <ProvidersView
                  providers={providers}
                  onAddProvider={handleAddProvider}
                  onUpdateProvider={handleUpdateProvider}
                  onDeleteProvider={handleDeleteProvider}
                  onTestProvider={handleTestProvider}
                  onViewTelemetry={handleViewProviderTelemetry}
                />
              )}

              {viewTab === 'telemetry' && (
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

              {viewTab === 'models' && (
                <ModelsView
                  models={models}
                  providers={providers}
                  onAddModel={handleAddModel}
                  onUpdateModel={handleUpdateModel}
                  onDeleteModel={handleDeleteModel}
                  onRefreshModels={async () => {
                    const response = await apiFetch(`${API_BASE}/models`);
                    if (response.ok) setModels(await response.json());
                  }}
                />
              )}

              {viewTab === 'routing' && (
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

          {(viewTab === 'api_mgmt' || viewTab === 'applications' || viewTab === 'keys') && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[#222222] pb-3 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`px-3 py-1.5 rounded transition-colors ${viewTab === 'applications' || viewTab === 'api_mgmt' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Applications
                </button>
                <button
                  onClick={() => setActiveTab('keys')}
                  className={`px-3 py-1.5 rounded transition-colors ${viewTab === 'keys' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  API Gateway Keys
                </button>
              </div>

              {(viewTab === 'applications' || viewTab === 'api_mgmt') && (
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

              {viewTab === 'keys' && (
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

          {viewTab === 'sec_ops' && (
            <SecOpsView
              customers={customers}
              providers={providers}
              auditLogs={auditLogs}
            />
          )}

          {(viewTab === 'governance' || viewTab === 'policies') && (
            <PoliciesView
              policies={policies}
              applications={applications}
              providers={providers}
              customers={customers}
              initialTenantId={scopeFilter.tenantId}
              onAddPolicy={handleAddPolicy}
              onRecordPolicyEvidence={handleRecordPolicyEvidence}
              onUpdatePolicy={handleUpdatePolicy}
              onDeletePolicy={handleDeletePolicy}
            />
          )}

          {viewTab === 'compliance' && (
            <PopiaGdprComplianceView
              globalConfig={globalComplianceConfig}
              onSaveGlobalConfig={handleSaveGlobalComplianceConfig}
              dataSubjectRequests={dataSubjectRequests}
              onAddDataSubjectRequest={handleAddDataSubjectRequest}
              onUpdateDataSubjectRequest={handleUpdateDataSubjectRequest}
              applications={applications}
              providers={providers}
              models={models}
              policies={policies}
            />
          )}

          {viewTab === 'dcr_data_protection' && (
            <DataProtectionDcrView
              customers={customers}
              applications={applications}
              scopeFilter={scopeFilter}
              onScopeChange={setScopeFilter}
              onOpenPlaygroundWithPrompt={(prompt) => {
                setActiveTab('playground');
              }}
            />
          )}

          {viewTab === 'trust_fabric' && (
            <TrustFabricView />
          )}

          {viewTab === 'finops' && (
            <FinOpsView
              customers={customers}
              applications={applications}
              scopeFilter={scopeFilter}
              onScopeChange={setScopeFilter}
            />
          )}

          {viewTab === 'tenant_licensing' && (
            <LicensingMonetizationView
              customers={customers}
              applications={applications}
              licensingPlans={licensingPlans}
              tenantLicenses={tenantLicenses}
              paymentLogs={paymentLogs}
              onAddPlanTemplate={(plan) => { void handleSavePlan(plan, true); }}
              onUpdatePlanTemplate={(plan) => { void handleSavePlan(plan); }}
              onAssignTenantLicense={(license) => { void handleSaveTenantLicense(license, true); }}
              onUpdateTenantLicense={(license) => { void handleSaveTenantLicense(license); }}
              onProcessPaymentWebhook={(event) => {
                void (async () => {
                  try {
                    const response = await apiFetch(`${API_BASE}/licensing/payment-webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId: event.tenantId, eventType: event.eventType, invoiceId: event.invoiceId, amount: event.amount, gatewayProvider: event.gatewayProvider }) });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error || result.message || 'Payment event could not be recorded.');
                    setPaymentLogs(current => [result.webhookLog || event, ...current]);
                    if (result.tenantLicense) setTenantLicenses(current => current.map(license => license.id === result.tenantLicense.id ? result.tenantLicense : license));
                  } catch (error: any) { showToast(error?.message || 'Payment event could not be recorded.', 'error'); }
                })();
              }}
            />
          )}

          {viewTab === 'commercial_account_portal' && <CommercialAccountPortalView onNavigate={(tab) => setActiveTab(tab as any)} customerMode={currentUser.role === 'CUSTOMER_ACCOUNT_USER'} />}

          {(viewTab === 'billing_admin' || viewTab === 'billing_accounts' || viewTab === 'billing_invoices') && (
            <BillingAdminView
              scopeTenantId={activeTab === 'customer_journey' && scopeFilter.tenantId !== 'all' ? scopeFilter.tenantId : undefined}
              customers={activeTab === 'customer_journey' && scopeFilter.tenantId !== 'all' ? customers.filter(customer => customer.id === scopeFilter.tenantId) : customers}
              licenses={activeTab === 'customer_journey' && scopeFilter.tenantId !== 'all' ? tenantLicenses.filter(license => license.tenantId === scopeFilter.tenantId) : tenantLicenses}
              initialSection={viewTab === 'billing_invoices' ? 'invoices' : 'portfolio'}
            />
          )}

          {viewTab === 'billing_refunds' && (
            <AccountingControlView customers={customers} initialSection="refunds" />
          )}

          {viewTab === 'billing_settlement' && (
            <AccountingControlView customers={customers} initialSection="reconcile" />
          )}

          {viewTab === 'billing_commercial' && <StageFFinanceView />}

          {(viewTab === 'billing_orders' || viewTab === 'billing_products') && (
            <FinanceCommerceView mode={viewTab === 'billing_orders' ? 'orders' : 'products'} customers={activeTab === 'customer_journey' && scopeFilter.tenantId !== 'all' ? customers.filter(customer => customer.id === scopeFilter.tenantId) : customers} initialTenantId={activeTab === 'customer_journey' && scopeFilter.tenantId !== 'all' ? scopeFilter.tenantId : onboardingOrderCustomerId} scopeTenantId={activeTab === 'customer_journey' && scopeFilter.tenantId !== 'all' ? scopeFilter.tenantId : undefined} />
          )}

          {(viewTab === 'accounting' || viewTab === 'accounting_journals' || viewTab === 'accounting_chart') && (
            <AccountingControlView
              customers={customers}
              initialSection={viewTab === 'accounting_journals' ? 'journals' : 'overview'}
            />
          )}

          {viewTab === 'saas_admin' && (
            <SaasGrowthView customers={customers} plans={licensingPlans} onNavigate={setActiveTab} />
          )}

          {viewTab === 'communications' && (
            <CommunicationsHubView customers={customers} />
          )}

          {viewTab === 'tenant_portal' && (
            <TenantPortalView
              customerId={scopeFilter.tenantId}
              customers={customers}
              applications={applications}
              apiKeys={apiKeys}
              onNavigate={setActiveTab}
            />
          )}

          {viewTab === 'automation' && (
            <AutomationView
              workflows={workflows}
            />
          )}

          {viewTab === 'reporting' && (
            <ExecutiveReportsView
              reports={executiveReports}
              customers={customers}
              applications={applications}
              scopeFilter={scopeFilter}
              onScopeChange={setScopeFilter}
            />
          )}

          {(viewTab === 'iam_admin' || viewTab === 'admin_settings') && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[#222222] pb-3 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('iam_admin')}
                  className={`px-3 py-1.5 rounded transition-colors ${viewTab === 'iam_admin' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  IAM Users & Roles
                </button>
                <button
                  onClick={() => setActiveTab('admin_settings')}
                  className={`px-3 py-1.5 rounded transition-colors ${viewTab === 'admin_settings' ? 'bg-blue-600 text-white font-bold' : 'text-[#888888] hover:text-white'}`}
                >
                  Platform & Currency Settings
                </button>
              </div>

              {viewTab === 'iam_admin' && (
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

              {viewTab === 'admin_settings' && (
                <AdminSettingsView />
              )}
            </div>
          )}

          {(viewTab === 'usage' || viewTab === 'logs' || viewTab === 'system') && (
            <UsageLogsView
              auditLogs={auditLogs}
              usageMetrics={usageMetrics}
              applications={applications}
              providers={providers}
              models={models}
              selectedLogToInspect={selectedLogToInspect}
              onCloseInspectModal={() => setSelectedLogToInspect(null)}
              initialSection={viewTab === 'logs' ? 'logs' : 'analytics'}
            />
          )}

          {viewTab === 'playground' && (
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
      {currentUser.role !== 'CUSTOMER_ACCOUNT_USER' && <ScreenAssistant activeTab={activeTab} onNavigate={setActiveTab} />}
    </div>
    </HelpContext.Provider>
  );
}
