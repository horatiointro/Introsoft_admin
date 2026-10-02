import { randomUUID } from 'node:crypto';
import express, { type Response } from 'express';
import type { AIPolicy, ApiKey, Application, AuditLog, Customer } from '../types.ts';
import { authorizeAllInContext, authorizeInContext, organizationsAuthorizedFor } from '../security/authorizationContext.ts';
import { auditRequestedScopes, evaluateCredentialScopeGrant } from '../security/credentialScopeAuthority.ts';
import { validateApiKeyRestrictions, validateApplicationProfileUpdate } from '../security/commercialMutationValidation.ts';
import { requireAuthentication, requireOrganizationPermission, requirePermission, requireRole, type AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { canonicalClientIp } from '../security/clientIp.ts';

export interface ApplicationCredentialRouteDependencies {
  getApplications(): Application[];
  setApplications(next: Application[]): void;
  getApiKeys(): ApiKey[];
  setApiKeys(next: ApiKey[]): void;
  getCustomers(): Customer[];
  getPolicies(): AIPolicy[];
  appendAuditLog(event: AuditLog): void;
  loadTenantApplications(tenantIds: readonly string[]): Promise<void>;
  loadPersistedApiKeys(tenantIds: readonly string[]): Promise<void>;
  saveTenantApplication(record: Application): Promise<void>;
  saveApiKeyRecord(record: ApiKey): Promise<void>;
  updatePersistedApiKey(record: ApiKey): Promise<void>;
  isDatabaseConnected(): boolean;
  executeQuery(sql: string, params?: unknown[]): Promise<unknown[]>;
  generateTenantApplicationId(value: string): string;
  generateApiKeySecret(prefix?: string): string;
  storeIssuedApiKey(record: ApiKey): void;
  resolveApiKey(secret: string): Promise<ApiKey | undefined>;
  recordControlPlaneAuditBestEffort(input: { actorEmail: string; tenantId: string; action: string; resourceId: string; requestId?: string; priorState?: unknown; newState?: unknown; outcome?: 'SUCCESS' | 'DENIED' | 'FAILURE' }): Promise<void>;
}

/** The production server and isolated HTTP tests use these same route handlers. */
export function createApplicationCredentialRouter(deps: ApplicationCredentialRouteDependencies): express.Router {
  const router = express.Router();

  router.post('/customers/:id/keys', requireAuthentication, requireOrganizationPermission('apikeys.create', 'id'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    const cust = deps.getCustomers().find(customer => customer.id === req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });
    const appRecords = deps.getApplications();
    const targetApp = appRecords.find(app => app.id === req.body.appId && app.customerId === cust.id && app.status === 'active')
      || appRecords.find(app => cust.connectedAppIds.includes(app.id) && app.customerId === cust.id && app.status === 'active');
    if (!targetApp) return res.status(400).json({ error: 'Create or choose an active application belonging to this tenant before issuing a key.' });
    const requestedScopeInput = req.body.scopes === undefined ? ['read:inference'] : req.body.scopes;
    const scopeGrant = evaluateCredentialScopeGrant({ authorization: req.user?.authorization, targetOrganizationId: cust.id, application: targetApp, requestedScopes: requestedScopeInput });
    if (scopeGrant.allowed === false) {
      await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: cust.id, action: 'API_KEY_CREATE_DENIED', resourceId: targetApp.id, requestId: String(req.headers['x-request-id'] || ''), newState: { applicationId: targetApp.id, requestedScopes: auditRequestedScopes(requestedScopeInput), grantedScopes: [], result: 'DENY', reason: scopeGrant.code }, outcome: 'DENIED' });
      return res.status(403).json({ error: 'Requested credential scopes are not grantable for this application.' });
    }
    const expiration = req.body.expiresInDays === undefined || req.body.expiresInDays === null || req.body.expiresInDays === '' ? null : Number(req.body.expiresInDays);
    if (expiration !== null && (!Number.isInteger(expiration) || expiration < 1 || expiration > 3650)) return res.status(400).json({ error: 'Key expiration must be between 1 and 3,650 days.' });
    const expiresAt = expiration === null ? null : new Date(Date.now() + expiration * 24 * 60 * 60 * 1000).toISOString();
    const restrictions = validateApiKeyRestrictions({ scopes: req.body.scopes, ipWhitelist: req.body.ipWhitelist, rateLimitRpm: req.body.rateLimitRpm, expiresAt });
    const requestLimit = req.body.monthlyRequestLimit == null || req.body.monthlyRequestLimit === '' ? null : Number(req.body.monthlyRequestLimit);
    const spendLimit = req.body.monthlySpendLimitUsd == null || req.body.monthlySpendLimitUsd === '' ? null : Number(req.body.monthlySpendLimitUsd);
    if (!restrictions || (req.body.name !== undefined && (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.trim().length > 120)) || (requestLimit !== null && (!Number.isSafeInteger(requestLimit) || requestLimit < 1 || requestLimit > 1_000_000_000)) || (spendLimit !== null && (!Number.isFinite(spendLimit) || spendLimit < 0 || spendLimit > 1_000_000_000)) || (req.body.functionIdentifier !== undefined && req.body.functionIdentifier !== targetApp.functionIdentifier)) return res.status(400).json({ error: 'Key metadata or restrictions are invalid for the selected application.' });
    const rawKey = deps.generateApiKeySecret('ALTIL-LIVE');
    const newKey: ApiKey = {
      id: `key-${randomUUID()}`, customerId: cust.id, customerName: cust.name, appId: targetApp.id, appName: targetApp.name,
      subApplicationId: targetApp.applicationType && targetApp.applicationType !== 'application' ? targetApp.id : undefined,
      functionIdentifier: req.body.functionIdentifier || targetApp.functionIdentifier, name: req.body.name?.trim() || `${cust.name} API Key`,
      key: rawKey, prefix: `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`, status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19), expiresAt: restrictions.expiresAt, lastUsedAt: null,
      rateLimitRpm: restrictions.rateLimitRpm, ipWhitelist: restrictions.ipWhitelist, scopes: restrictions.scopes,
      billingMode: req.body.billingMode === 'included' ? 'included' : 'metered', monthlyRequestLimit: requestLimit, monthlySpendLimitUsd: spendLimit,
    };
    deps.storeIssuedApiKey(newKey);
    try { await deps.saveApiKeyRecord(newKey); }
    catch {
      deps.setApiKeys(deps.getApiKeys().filter(key => key.id !== newKey.id));
      await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: cust.id, action: 'API_KEY_CREATE_FAILED', resourceId: targetApp.id, requestId: String(req.headers['x-request-id'] || ''), newState: { applicationId: targetApp.id, requestedScopes: auditRequestedScopes(requestedScopeInput), grantedScopes: scopeGrant.grantedScopes, result: 'FAILURE', reason: 'PERSISTENCE_FAILED' }, outcome: 'FAILURE' });
      return res.status(503).json({ error: 'The key registry could not save this key safely. Please retry.' });
    }
    await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: cust.id, action: 'API_KEY_CREATE', resourceId: newKey.id, requestId: String(req.headers['x-request-id'] || ''), newState: { applicationId: targetApp.id, status: newKey.status, requestedScopes: auditRequestedScopes(requestedScopeInput), grantedScopes: scopeGrant.grantedScopes, result: 'ALLOW' } });
    return res.status(201).json(newKey);
  });

  router.post('/customers/validate-key', async (req, res) => {
    const supplied = typeof req.body?.key === 'string' ? req.body.key.trim() : '';
    if (!supplied) return res.status(400).json({ valid: false, error: 'API key is required' });
    // An exact secret is required. A display prefix cannot authenticate or retrieve account metadata.
    const keyRecord = await deps.resolveApiKey(supplied);
    if (!keyRecord) return res.status(401).json({ valid: false, status: 'INVALID', error: 'Provided key not found in ALTIL Gateway registry' });
    if (keyRecord.status === 'revoked') return res.status(403).json({ valid: false, status: 'REVOKED', error: 'This API key has been revoked by the customer administrator or statutory officer' });
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt).getTime() < Date.now()) return res.status(403).json({ valid: false, status: 'EXPIRED', error: `This API key expired on ${keyRecord.expiresAt}` });
    const customer = deps.getCustomers().find(item => item.id === keyRecord.customerId);
    const application = deps.getApplications().find(item => item.id === keyRecord.appId);
    return res.json({
      valid: true, status: 'ACTIVE', keyId: keyRecord.id, keyPrefix: keyRecord.prefix,
      customer: customer ? {
        id: customer.id, name: customer.name, type: customer.type, country: customer.country, tier: customer.tier, status: customer.status,
        informationOfficer: customer.statutoryOfficers?.informationOfficer ? 'Nominated' : 'Not nominated',
        dataProtectionOfficer: customer.statutoryOfficers?.dataProtectionOfficer ? 'Nominated' : 'Not nominated',
      } : null,
      application: application ? { id: application.id, name: application.name, environment: application.environment, allowedCapabilities: application.allowedCapabilities } : { id: 'all', name: 'All Connected Applications' },
      rateLimitRpm: keyRecord.rateLimitRpm, scopes: keyRecord.scopes, ipWhitelist: keyRecord.ipWhitelist,
    });
  });

  router.get('/applications', requireAuthentication, requirePermission('tenant.read'), async (req: AuthenticatedRequest, res) => {
    const visible = organizationsAuthorizedFor(req.user?.authorization, 'tenant.read');
    if (!visible.length) return res.json([]);
    await deps.loadTenantApplications(visible);
    return res.json(deps.getApplications().filter(application => Boolean(application.customerId) && visible.includes(application.customerId!)));
  });

  router.post('/applications', requireAuthentication, requireOrganizationPermission('tenant.update', 'tenantId'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const appId = deps.generateTenantApplicationId(req.body.appIdentifier || req.body.name || 'app');
    const applicationTenantId = String(req.body?.customerId || req.body?.tenantId || req.user?.authorization?.organizationId || '').trim();
    if (!applicationTenantId || !authorizeAllInContext(req.user?.authorization, applicationTenantId, ['tenant.update', 'apikeys.create'])) return res.status(403).json({ error: 'Application organization is outside the authorized scope.' });
    if (typeof req.body?.name !== 'string' || !req.body.name.trim() || req.body.name.trim().length > 120 || (req.body.description !== undefined && (typeof req.body.description !== 'string' || req.body.description.length > 2000)) || (req.body.contactEmail !== undefined && (typeof req.body.contactEmail !== 'string' || req.body.contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.contactEmail)))) return res.status(400).json({ error: 'Application profile fields are invalid.' });
    if ((req.body.appIdentifier !== undefined && (typeof req.body.appIdentifier !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(req.body.appIdentifier))) || (req.body.environment !== undefined && !['production', 'staging', 'development'].includes(req.body.environment)) || (req.body.status !== undefined && !['active', 'suspended', 'revoked'].includes(req.body.status)) || (req.body.applicationType !== undefined && !['application', 'sub_application', 'function'].includes(req.body.applicationType))) return res.status(400).json({ error: 'Application identity or lifecycle fields are invalid.' });
    if (req.body.allowedCapabilities !== undefined && (!Array.isArray(req.body.allowedCapabilities) || req.body.allowedCapabilities.length > 50 || req.body.allowedCapabilities.some((value: unknown) => typeof value !== 'string' || !value.trim() || value.length > 100))) return res.status(400).json({ error: 'Application capabilities are invalid.' });
    if ((req.body.rateLimitRpm !== undefined && (!Number.isSafeInteger(Number(req.body.rateLimitRpm)) || Number(req.body.rateLimitRpm) < 1 || Number(req.body.rateLimitRpm) > 1_000_000)) || (req.body.quotaMonthlyRequests !== undefined && (!Number.isSafeInteger(Number(req.body.quotaMonthlyRequests)) || Number(req.body.quotaMonthlyRequests) < 1 || Number(req.body.quotaMonthlyRequests) > 1_000_000_000))) return res.status(400).json({ error: 'Application quota limits are invalid.' });
    const policies = deps.getPolicies();
    if (req.body.assignedPolicyIds !== undefined && (!Array.isArray(req.body.assignedPolicyIds) || req.body.assignedPolicyIds.length > 50 || req.body.assignedPolicyIds.some((id: unknown) => typeof id !== 'string' || !authorizeInContext(req.user?.authorization, applicationTenantId, 'policy.read') || !policies.some(policy => policy.id === id && (policy.tenantId === applicationTenantId || !policy.tenantId))))) return res.status(403).json({ error: 'Application policies must be readable in the target organization scope.' });
    const appRecords = deps.getApplications();
    const parentApplicationId = String(req.body.parentApplicationId || '').trim() || null;
    const parentApp = parentApplicationId ? appRecords.find(app => app.id === parentApplicationId && app.customerId === applicationTenantId && app.status === 'active') : undefined;
    if (parentApplicationId && !parentApp) return res.status(400).json({ error: 'The parent application must be active and belong to the same tenant.' });
    const applicationType = parentApplicationId ? (req.body.applicationType === 'function' ? 'function' : 'sub_application') : 'application';
    const customer = deps.getCustomers().find(item => item.id === applicationTenantId);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newApp: Application = {
      id: appId, customerId: applicationTenantId, customerName: customer?.name || req.body.customerName || 'Customer',
      parentApplicationId, applicationType,
      functionIdentifier: applicationType === 'function' ? String(req.body.functionIdentifier || req.body.appIdentifier || req.body.name || '').slice(0, 100) : undefined,
      appIdentifier: String(req.body.appIdentifier || req.body.name || 'app').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 64),
      name: req.body.name || 'New Application', description: req.body.description || '', status: req.body.status || 'active',
      environment: req.body.environment || 'production', allowedCapabilities: req.body.allowedCapabilities || ['general_ai', 'fast_chat'],
      rateLimitRpm: Number(req.body.rateLimitRpm) || 120, quotaMonthlyRequests: Number(req.body.quotaMonthlyRequests) || 50000,
      quotaUsedRequests: 0, assignedPolicyIds: req.body.assignedPolicyIds || ['pol-global-safety'],
      contactEmail: req.body.contactEmail || 'admin@introsoft.internal', createdAt: now, updatedAt: now,
    };
    if (!customer) return res.status(400).json({ error: 'The target tenant does not exist.' });
    const applicationScopeGrant = evaluateCredentialScopeGrant({ authorization: req.user?.authorization, targetOrganizationId: newApp.customerId, application: newApp, requestedScopes: ['read:inference'] });
    if (applicationScopeGrant.allowed === false) {
      await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: newApp.customerId, action: 'APPLICATION_CREATE_DENIED', resourceId: newApp.id, requestId: String(req.headers['x-request-id'] || ''), newState: { applicationId: newApp.id, requestedScopes: ['read:inference'], grantedScopes: [], result: 'DENY', reason: applicationScopeGrant.code }, outcome: 'DENIED' });
      return res.status(403).json({ error: 'The application has no grantable runtime scope.' });
    }
    try { await deps.saveTenantApplication(newApp); }
    catch { return res.status(503).json({ error: 'Application registry is temporarily unavailable.' }); }
    deps.setApplications([newApp, ...appRecords]);
    const keyRaw = deps.generateApiKeySecret();
    const newKey: ApiKey = {
      id: `key-${randomUUID()}`, customerId: newApp.customerId, customerName: newApp.customerName, appId: newApp.id,
      subApplicationId: newApp.applicationType && newApp.applicationType !== 'application' ? newApp.id : undefined,
      functionIdentifier: newApp.functionIdentifier, name: `${newApp.name} Primary Key`, key: keyRaw,
      prefix: `${keyRaw.slice(0, 10)}...${keyRaw.slice(-4)}`, status: 'active', createdAt: now, expiresAt: null, lastUsedAt: null,
      rateLimitRpm: newApp.rateLimitRpm, ipWhitelist: [], scopes: ['read:inference'],
    };
    deps.storeIssuedApiKey(newKey);
    try { await deps.saveApiKeyRecord(newKey); }
    catch {
      deps.setApiKeys(deps.getApiKeys().filter(key => key.id !== newKey.id));
      deps.setApplications(deps.getApplications().filter(app => app.id !== newApp.id));
      await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: newApp.customerId!, action: 'APPLICATION_CREATE_FAILED', resourceId: newApp.id, requestId: String(req.headers['x-request-id'] || ''), newState: { applicationId: newApp.id, requestedScopes: ['read:inference'], grantedScopes: applicationScopeGrant.grantedScopes, result: 'FAILURE', reason: 'CREDENTIAL_PERSISTENCE_FAILED' }, outcome: 'FAILURE' });
      return res.status(503).json({ error: 'The application was not activated because its credential could not be saved.' });
    }
    await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: newApp.customerId!, action: 'APPLICATION_CREATE', resourceId: newApp.id, requestId: String(req.headers['x-request-id'] || ''), newState: { applicationId: newApp.id, status: newApp.status, apiKeyId: newKey.id, requestedScopes: ['read:inference'], grantedScopes: applicationScopeGrant.grantedScopes, result: 'ALLOW' } });
    return res.status(201).json({ application: newApp, apiKey: newKey });
  });

  router.put('/applications/:id', requireAuthentication, requirePermission('tenant.update'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const records = deps.getApplications();
    const idx = records.findIndex(app => app.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Application not found' });
    const originalOrganizationId = records[idx].customerId;
    const prior = { status: records[idx].status, name: records[idx].name, environment: records[idx].environment };
    if (!originalOrganizationId || !authorizeInContext(req.user?.authorization, originalOrganizationId, 'tenant.update')) return res.status(404).json({ error: 'Application not found' });
    const profile = validateApplicationProfileUpdate(req.body);
    if (!profile) return res.status(400).json({ error: 'Application profile update contains unsupported or invalid fields.' });
    if ('assignedPolicyIds' in profile && ((profile.assignedPolicyIds as string[]).some(id => !deps.getPolicies().some(policy => policy.id === id && (policy.tenantId === originalOrganizationId || !policy.tenantId))) || !authorizeInContext(req.user?.authorization, originalOrganizationId, 'policy.read'))) return res.status(403).json({ error: 'Application policy assignment is outside the authorized organization.' });
    const updated = { ...records[idx], ...profile, updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) };
    const next = [...records]; next[idx] = updated;
    deps.setApplications(next);
    try { await deps.saveTenantApplication(updated); }
    catch { return res.status(503).json({ error: 'Application settings could not be saved durably.' }); }
    await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: originalOrganizationId, action: 'APPLICATION_UPDATE', resourceId: updated.id, requestId: String(req.headers['x-request-id'] || ''), priorState: prior, newState: { changedFields: Object.keys(profile) } });
    return res.json(updated);
  });

  router.delete('/applications/:id', requireAuthentication, requirePermission('tenant.update'), requirePermission('apikeys.revoke'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const target = deps.getApplications().find(app => app.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'Application not found' });
    if (!target.customerId || !authorizeAllInContext(req.user?.authorization, target.customerId, ['tenant.update', 'apikeys.revoke'])) return res.status(404).json({ error: 'Application not found' });
    if (deps.isDatabaseConnected()) {
      try {
        await deps.executeQuery('DELETE FROM tenant_api_keys WHERE application_id = ?', [req.params.id]);
        await deps.executeQuery('DELETE FROM tenant_applications WHERE id = ?', [req.params.id]);
      } catch { return res.status(503).json({ error: 'Application removal could not be completed in the durable registry.' }); }
    }
    deps.setApplications(deps.getApplications().filter(app => app.id !== req.params.id));
    deps.setApiKeys(deps.getApiKeys().filter(key => key.appId !== req.params.id));
    await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: target.customerId, action: 'APPLICATION_DELETE', resourceId: target.id, requestId: String(req.headers['x-request-id'] || ''), priorState: { status: target.status } });
    return res.json({ success: true });
  });

  router.get('/api-keys', requireAuthentication, requirePermission('tenant.read'), async (req: AuthenticatedRequest, res) => {
    const visible = organizationsAuthorizedFor(req.user?.authorization, 'tenant.read');
    if (!visible.length) return res.json([]);
    await deps.loadPersistedApiKeys(visible);
    return res.json(deps.getApiKeys().filter(key => Boolean(key.customerId) && visible.includes(key.customerId!)).map(key => {
      const { key: _secret, keyHash: _hash, ...safeKey } = key as ApiKey & { keyHash?: string };
      return { ...safeKey, key: undefined };
    }));
  });

  router.post('/api-keys', requireAuthentication, requirePermission('apikeys.create'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const targetCustId = String(req.body?.customerId || req.user?.authorization?.organizationId || '').trim();
    if (!targetCustId || !authorizeInContext(req.user?.authorization, targetCustId, 'apikeys.create')) return res.status(403).json({ error: 'API key organization is outside the authorized scope.' });
    const appRecords = deps.getApplications();
    const targetApp = appRecords.find(app => app.id === (req.body.appId || appRecords.find(item => item.customerId === targetCustId)?.id));
    if (!targetApp || targetApp.customerId !== targetCustId || targetApp.status !== 'active') return res.status(400).json({ error: 'Choose an active application that belongs to this tenant before creating its key.' });
    const requestedScopeInput = req.body.scopes === undefined ? ['read:inference'] : req.body.scopes;
    const scopeGrant = evaluateCredentialScopeGrant({ authorization: req.user?.authorization, targetOrganizationId: targetCustId, application: targetApp, requestedScopes: requestedScopeInput });
    if (scopeGrant.allowed === false) {
      await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: targetCustId, action: 'API_KEY_CREATE_DENIED', resourceId: targetApp.id, requestId: String(req.headers['x-request-id'] || ''), newState: { applicationId: targetApp.id, requestedScopes: auditRequestedScopes(requestedScopeInput), grantedScopes: [], result: 'DENY', reason: scopeGrant.code }, outcome: 'DENIED' });
      return res.status(403).json({ error: 'Requested credential scopes are not grantable for this application.' });
    }
    const restrictions = validateApiKeyRestrictions(req.body || {});
    if (!restrictions || (req.body?.name !== undefined && (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.trim().length > 120))) return res.status(400).json({ error: 'API key restrictions or name are invalid.' });
    const requestLimit = req.body.monthlyRequestLimit == null || req.body.monthlyRequestLimit === '' ? null : Number(req.body.monthlyRequestLimit);
    const spendLimit = req.body.monthlySpendLimitUsd == null || req.body.monthlySpendLimitUsd === '' ? null : Number(req.body.monthlySpendLimitUsd);
    if ((requestLimit !== null && (!Number.isSafeInteger(requestLimit) || requestLimit < 1 || requestLimit > 1_000_000_000)) || (spendLimit !== null && (!Number.isFinite(spendLimit) || spendLimit < 0 || spendLimit > 1_000_000_000))) return res.status(400).json({ error: 'API key billing limits are invalid.' });
    const keyRaw = deps.generateApiKeySecret();
    const newKey: ApiKey = {
      id: `key-${randomUUID()}`, customerId: targetCustId, customerName: deps.getCustomers().find(customer => customer.id === targetCustId)?.name || 'Customer',
      appId: targetApp.id, appName: targetApp.name, subApplicationId: targetApp.applicationType && targetApp.applicationType !== 'application' ? targetApp.id : undefined,
      functionIdentifier: req.body.functionIdentifier || targetApp.functionIdentifier, name: req.body.name?.trim() || 'Application API Key',
      key: keyRaw, prefix: `${keyRaw.slice(0, 10)}...${keyRaw.slice(-4)}`, status: 'active', createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      expiresAt: restrictions.expiresAt, lastUsedAt: null, rateLimitRpm: restrictions.rateLimitRpm, ipWhitelist: restrictions.ipWhitelist,
      scopes: restrictions.scopes, billingMode: ['included', 'prepaid'].includes(req.body.billingMode) ? req.body.billingMode : 'metered',
      monthlyRequestLimit: requestLimit, monthlySpendLimitUsd: spendLimit,
    };
    deps.storeIssuedApiKey(newKey);
    try { await deps.saveApiKeyRecord(newKey); }
    catch {
      deps.setApiKeys(deps.getApiKeys().filter(key => key.id !== newKey.id));
      await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: targetCustId, action: 'API_KEY_CREATE_FAILED', resourceId: targetApp.id, requestId: String(req.headers['x-request-id'] || ''), newState: { applicationId: targetApp.id, requestedScopes: auditRequestedScopes(requestedScopeInput), grantedScopes: scopeGrant.grantedScopes, result: 'FAILURE', reason: 'PERSISTENCE_FAILED' }, outcome: 'FAILURE' });
      return res.status(503).json({ error: 'Key registry is temporarily unavailable; no key was issued.' });
    }
    await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: targetCustId, action: 'API_KEY_CREATE', resourceId: newKey.id, requestId: String(req.headers['x-request-id'] || ''), newState: { applicationId: targetApp.id, status: newKey.status, requestedScopes: auditRequestedScopes(requestedScopeInput), grantedScopes: scopeGrant.grantedScopes, result: 'ALLOW' } });
    return res.status(201).json(newKey);
  });

  router.put('/api-keys/:id/revoke', requireAuthentication, requirePermission('apikeys.revoke'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const record = deps.getApiKeys().find(key => key.id === req.params.id);
    if (!record) return res.status(404).json({ error: 'Key not found' });
    if (!record.customerId || !authorizeInContext(req.user?.authorization, record.customerId, 'apikeys.revoke')) return res.status(404).json({ error: 'Key not found' });
    const updated: ApiKey = { ...record, status: 'revoked' };
    deps.setApiKeys(deps.getApiKeys().map(key => key.id === updated.id ? updated : key));
    try { await deps.updatePersistedApiKey(updated); }
    catch { return res.status(503).json({ error: 'Key is blocked in this runtime but the registry could not confirm durable revocation. Contact ALTIL support.' }); }
    await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: record.customerId, action: 'API_KEY_REVOKE', resourceId: record.id, requestId: String(req.headers['x-request-id'] || ''), priorState: { status: 'active' }, newState: { status: updated.status } });
    const clientIp = canonicalClientIp(req);
    const event: AuditLog = {
      id: `KEY-REV-${Date.now()}`, timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19), appId: record.appId || 'system-gateway',
      appName: record.appName || 'ALTIL Control Plane', apiKeyPrefix: record.prefix || 'UNKNOWN', requestType: 'api_key_revocation', capability: 'apikeys.revoke',
      providerId: 'none', providerName: 'System Registry', modelId: 'none', modelIdentifier: 'key-management-v1', durationSeconds: 0,
      status: 'SUCCESS', fallbackAttempted: false, inputTokens: 0, outputTokens: 0, costEstimated: 0, policyApplied: 'Key Management Governance Policy',
      sanitizedPromptPreview: `API Key ${record.id} belonging to Customer ${record.customerId} revoked by ${req.user.email}`,
      sanitizedResponsePreview: `Key ${record.id} revoked.`, clientIp,
    };
    deps.appendAuditLog(event);
    const { key: _secret, keyHash: _hash, ...safeKey } = updated as ApiKey & { keyHash?: string };
    return res.json(safeKey);
  });

  router.delete('/api-keys/:id', requireAuthentication, requireRole(['SUPER_ADMIN']), requirePermission('apikeys.revoke'), async (req: AuthenticatedRequest, res) => {
    const record = deps.getApiKeys().find(key => key.id === req.params.id);
    if (!record) return res.status(404).json({ error: 'Key not found' });
    if (!record.customerId || !authorizeInContext(req.user?.authorization, record.customerId, 'apikeys.revoke')) return res.status(404).json({ error: 'Key not found' });
    deps.setApiKeys(deps.getApiKeys().filter(key => key.id !== req.params.id));
    if (deps.isDatabaseConnected()) {
      try { await deps.executeQuery('DELETE FROM tenant_api_keys WHERE id = ?', [record.id]); }
      catch { deps.setApiKeys([record, ...deps.getApiKeys()]); return res.status(503).json({ error: 'Could not confirm key removal in the durable registry.' }); }
    }
    await deps.recordControlPlaneAuditBestEffort({ actorEmail: req.user.email, tenantId: record.customerId, action: 'API_KEY_DELETE', resourceId: record.id, requestId: String(req.headers['x-request-id'] || ''), priorState: { status: record.status } });
    const clientIp = canonicalClientIp(req);
    const event: AuditLog = {
      id: `KEY-DEL-${Date.now()}`, timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19), appId: record.appId || 'system-gateway',
      appName: record.appName || 'ALTIL Control Plane', apiKeyPrefix: record.prefix || 'UNKNOWN', requestType: 'api_key_deletion', capability: 'apikeys.delete',
      providerId: 'none', providerName: 'System Registry', modelId: 'none', modelIdentifier: 'key-management-v1', durationSeconds: 0,
      status: 'SUCCESS', fallbackAttempted: false, inputTokens: 0, outputTokens: 0, costEstimated: 0, policyApplied: 'Key Management Governance Policy',
      sanitizedPromptPreview: `API Key ${record.id} belonging to Customer ${record.customerId} deleted by ${req.user.email}`,
      sanitizedResponsePreview: `Key ${record.id} deleted.`, clientIp,
    };
    deps.appendAuditLog(event);
    return res.json({ success: true });
  });

  return router;
}
