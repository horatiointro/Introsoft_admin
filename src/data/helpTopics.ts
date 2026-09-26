import type { NavTabId } from '../components/Sidebar';

export interface HelpFeature {
  title: string;
  description: string;
}

export interface HelpTopic {
  id: NavTabId;
  category: string;
  title: string;
  description: string;
  features: HelpFeature[];
}

export const HELP_TOPICS: HelpTopic[] = [
  { id: 'command_centre', category: 'Executive', title: 'Executive Command Centre', description: 'A single view of tenant, provider, service health, request volume, spend, security, and compliance indicators.', features: [
    { title: 'Metric tiles', description: 'Summarize current platform signals. Select a tile to inspect its definition, derivation, impact, and related events when a detail view is available.' },
    { title: 'Platform availability', description: 'Shows the availability signal used by the command centre for the platform and its monitored dependencies.' },
    { title: 'Active Tenants', description: 'Counts tenant records considered active against the total loaded tenant records.' },
    { title: 'Provider Health', description: 'Summarizes provider health signals for the configured providers. Verify whether each signal comes from a live provider check or sample data.' },
    { title: 'Connected Apps', description: 'Shows the application connectivity count presented by the dashboard. Confirm that its value is sourced from the live application registry.' },
    { title: 'Requests / Min', description: 'Displays the request-rate signal in requests per minute.' },
    { title: 'Requests Today', description: 'Displays the daily request count and comparison signal where available.' },
    { title: 'Concurrent Reqs', description: 'Shows the concurrent request signal at the time represented by the dashboard.' },
    { title: 'Queue Depth', description: 'Shows the number of requests or messages waiting in the queue.' },
    { title: 'Model Availability', description: 'Shows the model availability count or status represented by the dashboard.' },
    { title: 'Average Latency', description: 'Shows the average response latency for the represented request sample or monitoring window.' },
    { title: 'P95 Latency', description: 'Shows the 95th percentile latency: 95% of measured requests complete at or below this value.' },
    { title: 'P99 Latency', description: 'Shows the 99th percentile latency: 99% of measured requests complete at or below this value.' },
    { title: 'Throughput', description: 'Shows the token processing rate represented by the current metric.' },
    { title: 'Fallback Rate', description: 'Shows the share of requests that used a fallback route or provider.' },
    { title: "Today's AI Spend", description: 'Shows AI spend attributed to the current day in the selected scope.' },
    { title: 'Month-to-Date Spend', description: 'Shows AI spend accumulated so far this month in the selected scope.' },
    { title: 'Forecast Monthly', description: 'Shows an estimated monthly spend based on the forecast method currently represented.' },
    { title: 'Cost / Request', description: 'Shows estimated AI cost per request for the represented usage.' },
    { title: 'Cost / 1K Tokens', description: 'Shows estimated cost for each 1,000 tokens processed.' },
    { title: 'Free Tier Savings', description: 'Shows the estimated savings attributed to free-tier usage.' },
    { title: 'Budget Used', description: 'Shows spend as a share of the budget for the selected scope.' },
    { title: 'Threats Deflected', description: 'Shows the count of threats represented as blocked or deflected in the displayed security data.' },
    { title: 'PII Incidents Scrubbed', description: 'Shows the count of personally identifiable information incidents represented as scrubbed.' },
    { title: 'Prompt Injections', description: 'Shows the prompt injection count represented in the displayed security data.' },
    { title: 'POPIA Score', description: 'Shows the POPIA compliance score presented for the current scope.' },
    { title: 'GDPR Score', description: 'Shows the GDPR compliance score presented for the current scope.' },
    { title: 'DSARs Outstanding', description: 'Shows data-subject access requests represented as outstanding or still open.' },
    { title: 'Spend and token economics', description: 'Summarizes AI usage cost and forecast signals. Values may be derived from sample data; verify the underlying source before operational use.' },
    { title: 'Provider health', description: 'Summarizes configured AI provider connectivity and health signals.' }
  ] },
  { id: 'stack_wiring', category: 'Executive', title: '5-Layer Stack Architecture', description: 'A searchable map of platform layers, components, dependencies, and connections.', features: [{ title: 'Architecture map', description: 'Explore platform layers and follow links to related modules.' }] },
  { id: 'reporting', category: 'Executive', title: 'Executive & Audit Reports', description: 'Scoped executive and audit report views for tenant and application oversight.', features: [{ title: 'Report scope', description: 'Use the global scope selector to focus reports on a company, tenant, or application.' }] },
  { id: 'tenants', category: 'Tenant Management and Governance', title: 'Tenant Portfolio Directory', description: 'Search tenant profiles, status, applications, users, contacts, and governance details.', features: [{ title: 'Tenant profile', description: 'Review a tenant and its related applications, users, contacts, and governance information.' }, { title: 'Onboarding and tenant actions', description: 'Create or update tenant records and manage linked users, applications, and gateway keys.' }] },
  { id: 'org_hierarchy', category: 'Tenant Management and Governance', title: 'Organization Hierarchy', description: 'Explore the company → tenant → application structure and choose context for follow-on work.', features: [{ title: 'Company, tenant, and application tree', description: 'Select an organization node to navigate work in the appropriate scope.' }] },
  { id: 'tenant_360', category: 'Tenant Management and Governance', title: 'Tenant 360 Diagnostics', description: 'A consolidated tenant view of operational, service-level, AI, security, and governance signals.', features: [{ title: 'Tenant diagnostics', description: 'Bring relevant tenant signals together for investigation and navigation to related workspaces.' }] },
  { id: 'tenant_licensing', category: 'Tenant Management and Governance', title: 'Licensing & Subscriptions', description: 'Review plan templates, tenant and application licenses, billing records, payment webhooks, and licensing controls.', features: [{ title: 'Plans and licenses', description: 'Review commercial plans and their tenant/application assignments.' }, { title: 'Payment webhook log', description: 'Inspect payment event records received or represented by the application.' }] },
  { id: 'sla_kpi_monitoring', category: 'Tenant Management and Governance', title: 'Tenant SLA & KPI Monitoring', description: 'Compare service-level profiles and business/AI KPI measurements in the current tenant scope.', features: [{ title: 'SLA and KPI tiles', description: 'Summarize service targets or measured indicators; open a tile to inspect its detail when available.' }] },
  { id: 'iam_admin', category: 'Tenant Management and Governance', title: 'IAM Users & Access Control', description: 'Search and manage users and roles, inspect sessions, and review authentication safeguards.', features: [{ title: 'Users and roles', description: 'Provision, edit, reset, or offboard users and review role assignments. Server-side authorization governs protected actions.' }, { title: 'Sessions and safeguards', description: 'Inspect session/token information and the MFA, password, and access controls presented by the system.' }] },
  { id: 'admin_settings', category: 'Tenant Management and Governance', title: 'Admin & System Settings', description: 'Configure platform currency and monetary standards, default onboarding/credit values, and administrative options.', features: [{ title: 'Platform defaults', description: 'Set shared defaults used by platform administration and tenant onboarding.' }] },
  { id: 'ai_ops', category: 'AI Infrastructure and Gateway', title: 'AI Gateway & Providers', description: 'Configure providers and models, inspect telemetry, and define capability-based routing.', features: [{ title: 'Providers List', description: 'Maintain provider configuration and run available connection checks.' }, { title: 'Telemetry', description: 'Review provider health and activity signals.' }, { title: 'Model Catalog', description: 'Review and maintain AI model records.' }, { title: 'Routing Rules', description: 'Configure capability-based provider and model selection.' }] },
  { id: 'api_mgmt', category: 'AI Infrastructure and Gateway', title: 'Applications & Gateway Keys', description: 'Register client applications and create, inspect, revoke, or remove their gateway keys.', features: [{ title: 'Applications', description: 'Maintain registered client applications that use the gateway.' }, { title: 'API keys', description: 'Manage credentials associated with applications. Treat key values as secrets.' }] },
  { id: 'ai_governance_lab', category: 'AI Infrastructure and Gateway', title: 'AI Model Evaluation Lab', description: 'A model lifecycle and governance workspace with recommendations and benchmark/evaluation comparisons.', features: [{ title: 'Model evaluation', description: 'Compare evaluation and benchmark information to support model selection and governance.' }] },
  { id: 'playground', category: 'AI Infrastructure and Gateway', title: 'API Playground & Threat Simulator', description: 'Compose and run governed AI requests, inspect results, view client snippets, and explore simulation presets.', features: [{ title: 'Orchestration request', description: 'Choose an application and capability, compose a prompt, then inspect the governed request result.' }, { title: 'Client snippets', description: 'View example cURL, Node.js, or Python request patterns.' }, { title: 'Threat simulation', description: 'Explore example traffic and compliance scenarios; simulations do not prove an external integration is connected.' }] },
  { id: 'service_management', category: 'Service Operations and Incidents', title: 'Services & SLA Engine', description: 'Service targets, metrics, catalogue entries, service desk tickets, and workflow approvals.', features: [{ title: 'SLA Designer & Metric Profiles', description: 'Review service targets and metric profiles.' }, { title: 'KPI Centre', description: 'Review service and business performance indicators.' }, { title: 'Service Catalogue', description: 'Browse catalogue entries for available services.' }, { title: 'Service Desk', description: 'Review and manage service desk work.' }, { title: 'Workflow Approvals', description: 'Review approval rules and related workflows.' }] },
  { id: 'incidents', category: 'Service Operations and Incidents', title: 'Incidents, PIRs & Alerts', description: 'Incident lifecycle board, timelines, problem/post-incident review material, knowledge articles, and alert records.', features: [{ title: 'Incident lifecycle', description: 'Track reported, investigating, assigned, mitigated, resolved, and closed stages.' }, { title: 'Incident 360', description: 'Select an incident to inspect its diagnostic view and related actions.' }, { title: 'Alerts', description: 'Review multi-channel alert records and delivery context.' }] },
  { id: 'operations_cmdb', category: 'Service Operations and Incidents', title: 'CMDB, Change & BCDR', description: 'Configuration management, change management, business continuity/disaster recovery, and vendor information.', features: [{ title: 'CMDB', description: 'Review configuration items and their relationships.' }, { title: 'Change management', description: 'Review change records and associated context.' }, { title: 'BCDR', description: 'Review continuity and disaster recovery information.' }, { title: 'Vendor 360', description: 'Inspect vendor details relevant to operations.' }] },
  { id: 'automation', category: 'Service Operations and Incidents', title: 'Workflows & Approvals', description: 'Review event-triggered rules, conditions, actions, and recent trigger status.', features: [{ title: 'Workflow rules', description: 'Inspect configured triggers and actions such as budget thresholds, SLA escalation, PII alerts, and provider failover.' }] },
  { id: 'sec_ops', category: 'Security, Risk and Compliance', title: 'Security Ops (SOC & Alerts)', description: 'Security operations dashboard for posture, event, and alert-related signals.', features: [{ title: 'Security posture', description: 'Review the security posture summaries and operational signals presented here.' }] },
  { id: 'policies', category: 'Security, Risk and Compliance', title: 'AI Guardrails & Policies', description: 'Review, create, edit, and remove AI policies, conditions, and enforcement settings.', features: [{ title: 'Policy conditions', description: 'Define or inspect conditions that determine how a policy applies.' }, { title: 'Enforcement settings', description: 'Review the configured action when a policy condition is met.' }] },
  { id: 'dcr_data_protection', category: 'Security, Risk and Compliance', title: 'Data Cloaking & Vault (DCR)', description: 'Test prompt transformations, inspect surrogate/token records, policies, and provenance events.', features: [{ title: 'Transformation test', description: 'Explore how configured transformations handle sample prompt data.' }, { title: 'Surrogates and event ledger', description: 'Inspect token/surrogate records and transformation provenance.' }] },
  { id: 'enterprise_risk', category: 'Security, Risk and Compliance', title: 'Risk Register & 5×5 Heatmap', description: 'Enterprise risk register, probability-versus-impact heatmap, security posture, and control summaries.', features: [{ title: '5×5 heatmap', description: 'Places risks by probability and impact to help prioritize review.' }] },
  { id: 'compliance', category: 'Security, Risk and Compliance', title: 'POPIA & GDPR Suite', description: 'Privacy enforcement, scanning, sovereignty context, data-subject requests, and device trust.', features: [{ title: 'Enforcement', description: 'Review processing outcomes and guardrail actions.' }, { title: 'Scanner', description: 'Review data and privacy scanning information.' }, { title: 'Sovereignty', description: 'Inspect data-location context.' }, { title: 'DSAR', description: 'Review data-subject access requests and their status.' }, { title: 'Device Trust', description: 'Review device-related trust controls.' }] },
  { id: 'trust_fabric', category: 'Security, Risk and Compliance', title: 'ALTIL Trust Fabric & Identity', description: 'Tenant, identity, device, credential, and linked evidence records across the platform.', features: [{ title: 'Tenants and identities', description: 'Inspect trust relationships between tenant and identity records.' }, { title: 'Devices and credentials', description: 'Review bound devices and associated credentials.' }, { title: 'Evidence chain', description: 'Follow linked evidence associated with trust records.' }] },
  { id: 'logs', category: 'Security, Risk and Compliance', title: 'Audit Trail Ledger', description: 'Search audit and usage activity with application, provider, and model context.', features: [{ title: 'Audit log detail', description: 'Select a record to inspect available event details and related context.' }] },
  { id: 'finops', category: 'Security, Risk and Compliance', title: 'FinOps & Token Economics', description: 'Review AI spend, budgets, usage/token economics, and cost in company or tenant/application scope.', features: [{ title: 'Usage and cost', description: 'Review the usage and cost indicators presented for the selected scope.' }, { title: 'Budgets and forecasts', description: 'Inspect available budget and forecast values; confirm their data source before relying on them.' }] }
];

export const HELP_ALIASES: Partial<Record<NavTabId, NavTabId>> = {
  dashboard: 'command_centre', customers: 'tenants', providers: 'ai_ops', telemetry: 'ai_ops', models: 'ai_ops', routing: 'ai_ops',
  applications: 'api_mgmt', keys: 'api_mgmt', usage: 'finops', system: 'admin_settings'
};

export function getHelpTopic(tab: NavTabId): HelpTopic | undefined {
  const normalized = HELP_ALIASES[tab] || tab;
  return HELP_TOPICS.find(topic => topic.id === normalized);
}

export function getFeatureHelp(title: string): HelpFeature | undefined {
  const normalized = title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  for (const topic of HELP_TOPICS) {
    const feature = topic.features.find(item => item.title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === normalized);
    if (feature) return feature;
  }
  return undefined;
}
