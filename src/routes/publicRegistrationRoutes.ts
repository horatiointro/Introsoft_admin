import express from 'express';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { IamRepository } from '../db/iamRepository';
import { dbRepository, executeQuery, isDatabaseConnected, withMariaDbTransaction } from '../db/mariadb';
import { requireAuthentication, requirePermission, requireRole, type AuthenticatedRequest } from '../middleware/authMiddleware';
import { hashApiKeySecret } from '../security/apiKeyCredential';

const router = express.Router();
const signupRequests = new Map<string, number[]>();
const emailPattern = /^\S+@\S+\.\S+$/;
const id = (prefix: string) => `${prefix}-${randomUUID()}`;
const sqlDate = (value: Date) => value.toISOString().slice(0, 23).replace('T', ' ');

router.get('/public/plans', async (_req, res) => {
  try { res.json(await dbRepository.getPublishedLicensingPlans()); }
  catch (error) {
    console.error('[Public packages] Persisted catalogue load failed:', { code: (error as any)?.code || 'UNKNOWN' });
    res.status(503).json({ error: 'Published package catalogue is temporarily unavailable.' });
  }
});

/** Public registration only records a request. Relationships and access wait for owner approval. */
router.post('/public/registrations', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const attempts = signupRequests.get(ip) || [];
  const recent = attempts.filter(at => at > Date.now() - 60 * 60 * 1000);
  if (recent.length >= 5) return res.status(429).json({ error: 'Signup limit reached for this network. Try again later.' });
  signupRequests.set(ip, [...recent, Date.now()]);

  const { email, password, accountType, planId, applicationName, acceptedTerms } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const type = typeof accountType === 'string' ? accountType.toLowerCase() : '';
  const firstName = typeof req.body.firstName === 'string' ? req.body.firstName.trim() : '';
  const lastName = typeof req.body.lastName === 'string' ? req.body.lastName.trim() : '';
  const companyName = typeof req.body.companyName === 'string' ? req.body.companyName.trim() : '';
  const displayName = type === 'company' ? companyName : `${firstName} ${lastName}`.trim();
  const appName = typeof applicationName === 'string' ? applicationName.trim() : '';
  const partyFieldsValid = type === 'individual' ? firstName.length >= 1 && firstName.length <= 100 && lastName.length >= 1 && lastName.length <= 100 : type === 'company' ? companyName.length >= 2 && companyName.length <= 180 && firstName.length >= 1 && firstName.length <= 100 && lastName.length >= 1 && lastName.length <= 100 : false;
  if (!partyFieldsValid || displayName.length < 2 || displayName.length > 180 || !emailPattern.test(normalizedEmail) || typeof password !== 'string' || password.length < 12 || password.length > 128 || !acceptedTerms || appName.length < 2 || appName.length > 180 || typeof planId !== 'string') {
    return res.status(400).json({ error: 'Provide valid customer details, account type, application, published package, password (12 characters minimum), and accepted terms.' });
  }
  if (!isDatabaseConnected()) return res.status(503).json({ error: 'Self-service registration requires the durable ALTIL account database.' });
  const passwordPolicy = IamRepository.validatePasswordPolicy(password);
  if (!passwordPolicy.valid) return res.status(400).json({ error: passwordPolicy.error || 'Password does not meet policy.' });

  try {
    const plan = (await dbRepository.getPublishedLicensingPlans()).find(item => item.id === planId);
    if (!plan) return res.status(400).json({ error: 'Choose an available published package.' });
    const registrationId = id('reg');
    const acceptedAt = new Date();
    const expiresAt = new Date(acceptedAt.getTime() + 7 * 86400000);
    const passwordHash = await IamRepository.hashPassword(password);
    await withMariaDbTransaction(async connection => {
      const [plans] = await connection.execute<any[]>('SELECT id,metadata_json FROM licensing_plans WHERE id=? AND is_active=1 FOR UPDATE', [planId]);
      let persistedMetadata: any = {};
      try { const value = plans[0]?.metadata_json; persistedMetadata = typeof value === 'string' ? JSON.parse(value) : Buffer.isBuffer(value) ? JSON.parse(value.toString('utf8')) : value && typeof value === 'object' ? value : {}; } catch {}
      if (!plans.length || persistedMetadata.isPublished !== true) throw new Error('PLAN_UNAVAILABLE');
      const [users] = await connection.execute<any[]>('SELECT id FROM iam_users WHERE LOWER(email)=? LIMIT 1 FOR UPDATE', [normalizedEmail]);
      if (users.length) throw new Error('EMAIL_EXISTS');
      await connection.execute("UPDATE public_registration_requests SET status='EXPIRED',pending_email=NULL WHERE pending_email=? AND status='PENDING_APPROVAL' AND expires_at<=NOW(3)", [normalizedEmail]);
      const [requests] = await connection.execute<any[]>("SELECT id FROM public_registration_requests WHERE pending_email=? AND status='PENDING_APPROVAL' AND expires_at>NOW(3) LIMIT 1 FOR UPDATE", [normalizedEmail]);
      if (requests.length) throw new Error('REQUEST_EXISTS');
      const country = String(req.body.country || 'South Africa').trim().slice(0, 80) || 'South Africa';
      await connection.execute(
        `INSERT INTO public_registration_requests
         (id,email,pending_email,password_hash,account_type,display_name,company_name,contact_first_name,contact_last_name,country,application_name,plan_id,accepted_terms,accepted_terms_at,status,expires_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,'PENDING_APPROVAL',?)`,
        [registrationId, normalizedEmail, normalizedEmail, passwordHash, type.toUpperCase(), displayName, type === 'company' ? companyName : null, firstName, lastName, country, appName, planId, acceptedAt, expiresAt],
      );
      const record = { id: registrationId, email: normalizedEmail, createdAt: acceptedAt.toISOString(), status: 'pending_approval', planId, acceptedPolicyVersion: 'ALTIL-2026-09-27-v1', acceptedAt: acceptedAt.toISOString() };
      await connection.execute('INSERT INTO tenant_registrations (id,email,status,created_at,payload_json) VALUES (?,?,?,?,?)', [registrationId, normalizedEmail, 'pending_approval', acceptedAt, JSON.stringify(record)]);
      await connection.execute('INSERT INTO audit_logs (id,timestamp,user_email,action_type,category,severity,request_payload) VALUES (?,?,?,?,?,?,?)', [id('audit'), acceptedAt, normalizedEmail, 'PUBLIC_REGISTRATION_REQUESTED', 'COMMERCIAL', 'INFO', JSON.stringify({ registrationId, accountType, planId })]);
    });
    return res.status(202).json({ status: 'pending_approval', registrationId, accountType, plan: { id: plan.id, name: plan.name }, message: 'Your request is awaiting ALTIL owner approval. No account access, API key, or license is issued before approval.' });
  } catch (error: any) {
    if (['EMAIL_EXISTS', 'REQUEST_EXISTS'].includes(error?.message) || error?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account or active registration already exists for this email.' });
    if (error?.message === 'PLAN_UNAVAILABLE') return res.status(409).json({ error: 'That package is no longer available. Refresh the published package list.' });
    console.error('[Self-service registration] Request could not be recorded:', { code: error?.code || 'UNKNOWN' });
    return res.status(503).json({ error: 'Registration could not be recorded. No partial account or provisioning was created.' });
  }
});

/** Owner approval creates all technical and commercial relationships atomically. */
router.post('/admin/registrations/:id/approve', requireAuthentication, requireRole(['SUPER_ADMIN']), requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
  const actor = req.user;
  if (!actor || !actor.authorization?.grants.some(grant => grant.role === 'SUPER_ADMIN' && grant.visibility === 'GLOBAL' && grant.permissions.includes('tenant.write'))) {
    return res.status(403).json({ error: 'Global owner authorization is required to approve a public registration.' });
  }
  const now = new Date();
  const effectiveFrom = sqlDate(now);
  const tenantId = id('tenant');
  const customerId = id('cc');
  const organizationId = id('org');
  const accountId = id('acct');
  const userId = id('user');
  const applicationId = id('app');
  const licenseId = id('lic');
  const keyId = id('key');
  const rawApiKey = `ALTIL-LIVE-${randomBytes(32).toString('hex').toUpperCase()}`;
  const tenantCode = `T-${randomBytes(12).toString('hex').toUpperCase()}`;

  try {
    if (!isDatabaseConnected()) return res.status(503).json({ error: 'Registration approval requires the durable ALTIL account database.' });
    const planCatalog = await dbRepository.getPublishedLicensingPlans();
    let result: any;
    await withMariaDbTransaction(async connection => {
      const [requests] = await connection.execute<any[]>("SELECT * FROM public_registration_requests WHERE id=? AND status='PENDING_APPROVAL' AND expires_at>NOW(3) FOR UPDATE", [req.params.id]);
      const request = requests[0];
      if (!request) throw new Error('REGISTRATION_NOT_PENDING');
      const plan = planCatalog.find(item => item.id === request.plan_id);
      if (!plan) throw new Error('REGISTRATION_PLAN_UNAVAILABLE');
      const [rootRows] = await connection.execute<any[]>("SELECT id FROM commercial_organizations WHERE canonical_key='INTROSOFT_ROOT' AND status='ACTIVE' FOR UPDATE");
      const [roleRows] = await connection.execute<any[]>("SELECT id FROM iam_roles WHERE role_code='CUSTOMER_ACCOUNT_USER' AND tenant_id IS NULL LIMIT 1 FOR UPDATE");
      if (!rootRows[0] || !roleRows[0]) throw new Error('COMMERCIAL_BOOTSTRAP_MISSING');
      const [existing] = await connection.execute<any[]>('SELECT id FROM iam_users WHERE LOWER(email)=? LIMIT 1 FOR UPDATE', [request.email]);
      if (existing.length) throw new Error('EMAIL_EXISTS');

      const type = String(request.account_type).toUpperCase();
      const fullName = String(request.display_name);
      const firstName = String(request.contact_first_name);
      const lastName = String(request.contact_last_name);
      const cycleEnd = new Date(now.getTime() + 30 * 86400000);
      const trialEnd = new Date(now.getTime() + 14 * 86400000);
      const apiMetadata = { id: keyId, customerId: tenantId, customerName: fullName, appId: applicationId, appName: request.application_name, name: `${fullName} API key`, prefix: `${rawApiKey.slice(0, 12)}...${rawApiKey.slice(-4)}`, status: 'active', createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 365 * 86400000).toISOString(), lastUsedAt: null, rateLimitRpm: 60, ipWhitelist: [], scopes: ['read:inference', 'read:models'], billingMode: 'included', monthlyRequestLimit: plan.includedTransactions || 10000, monthlySpendLimitUsd: 100 };
      const license = { id: licenseId, tenantId, tenantName: fullName, applicationId, applicationName: request.application_name, planId: plan.id, planName: plan.name, pricingType: plan.pricingType, currency: plan.currency, basePrice: plan.basePrice, contractStartDate: now.toISOString().slice(0, 10), contractEndDate: trialEnd.toISOString().slice(0, 10), nextBillingDate: cycleEnd.toISOString().slice(0, 10), lastPaymentDate: '', paymentStatus: 'pending', licenseStatus: 'active', currentTransactionCount: 0, maxTransactionQuota: plan.includedTransactions || 10000, overageTransactionsCount: 0, currentAccruedBillUsd: plan.basePrice, autoEnforceOnUnpaid: true, graceDaysRemaining: plan.gracePeriodDays, activeEnforcement: null, billingContactEmail: request.email };

      await connection.execute('INSERT INTO tenants (id,tenant_code,name,tier,region,popia_compliant,max_rpm,max_tpm,status,metadata_json) VALUES (?,?,?,?,?,1,60,100000,?,?)', [tenantId, tenantCode, fullName, 'Starter', request.country, 'active', JSON.stringify({ id: tenantId, name: fullName, type: type.toLowerCase(), status: 'trial', createdAt: now.toISOString() })]);
      await connection.execute('INSERT INTO commercial_customers (id,customer_type,display_name,company_name,individual_given_name,individual_family_name,contact_json,status,created_by) VALUES (?,?,?,?,?,?,?,\'ACTIVE\',?)', [customerId, type, fullName, type === 'COMPANY' ? request.company_name : null, type === 'INDIVIDUAL' ? firstName : null, type === 'INDIVIDUAL' ? lastName : null, JSON.stringify({ email: request.email, country: request.country, primaryContact: { firstName, lastName } }), actor.id]);
      await connection.execute('INSERT INTO commercial_organizations (id,name,organization_type,status,created_by) VALUES (?,?,\'CUSTOMER\',\'ACTIVE\',?)', [organizationId, fullName, actor.id]);
      await connection.execute('INSERT INTO commercial_accounts (id,customer_id,legal_entity_id,account_name,status,created_by) VALUES (?,?,NULL,?,\'ACTIVE\',?)', [accountId, customerId, fullName, actor.id]);
      await connection.execute('INSERT INTO commercial_customer_organization_relationships (id,customer_id,organization_id,relationship_type,status,effective_from,created_by) VALUES (?,?,?,\'CUSTOMER_OF\',\'ACTIVE\',?,?)', [id('ccorg'), customerId, organizationId, effectiveFrom, actor.id]);
      await connection.execute('INSERT INTO commercial_organization_relationships (id,parent_organization_id,child_organization_id,relationship_type,status,effective_from,created_by) VALUES (?,?,?,\'DIRECT_CLIENT\',\'ACTIVE\',?,?)', [id('orgrel'), rootRows[0].id, organizationId, effectiveFrom, actor.id]);
      await connection.execute('INSERT INTO commercial_relationships (id,account_id,organization_id,relationship_role,status,effective_from,created_by) VALUES (?,?,?,\'BILL_TO\',\'ACTIVE\',?,?)', [id('acctorg'), accountId, organizationId, effectiveFrom, actor.id]);
      const organizationScopeId = id('orgscope');
      await connection.execute('INSERT INTO commercial_organization_tenant_scopes (id,organization_id,tenant_id,scope_link_type,status,effective_from,created_by) VALUES (?,?,?,\'PRIMARY\',\'ACTIVE\',?,?)', [organizationScopeId, organizationId, tenantId, effectiveFrom, actor.id]);
      await connection.execute('INSERT INTO commercial_customer_tenant_links (id,customer_id,tenant_id,account_id,scope_link_type,status,effective_from,evidence_reference,approved_by,created_by) VALUES (?,?,?,?,\'CUSTOMER_RUNTIME\',\'ACTIVE\',?,?,?,?)', [id('custtenant'), customerId, tenantId, accountId, effectiveFrom, `SELF_REGISTRATION:${request.id}`, actor.id, actor.id]);
      await connection.execute('INSERT INTO tenant_applications (id,tenant_id,app_code,name,description,capability_type,status,metadata_json) VALUES (?,?,?,?,?,?,\'active\',?)', [applicationId, tenantId, String(request.application_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 64), request.application_name, `Primary application for ${fullName}`, 'general_ai', JSON.stringify({ customerId: tenantId, customerName: fullName, allowedCapabilities: ['general_ai', 'fast_chat', 'document_analysis'], contactEmail: request.email })]);
      await connection.execute('INSERT INTO iam_users (id,tenant_id,email,password_hash,first_name,last_name,department,status,mfa_enabled,mfa_enforced,force_password_change,created_by) VALUES (?,?,?,?,?,?,\'Customer\',\'ACTIVE\',0,0,0,?)', [userId, tenantId, request.email, request.password_hash, firstName, lastName, actor.id]);
      await connection.execute('INSERT INTO iam_user_roles (id,user_id,role_id,tenant_id,assigned_by,access_scope) VALUES (?,?,?,?,?,\'ORGANISATION\')', [id('ur'), userId, roleRows[0].id, tenantId, actor.id]);
      const accountUserRelationshipId = id('account-user');
      await connection.execute('INSERT INTO commercial_account_iam_relationships (id,account_id,user_id,relationship_type,status,effective_from,audit_reference,created_by) VALUES (?,?,?,\'PRIMARY_CONTACT\',\'ACTIVE\',?,?,?)', [accountUserRelationshipId, accountId, userId, effectiveFrom, `OWNER_APPROVAL:${request.id}`, actor.id]);
      await connection.execute('INSERT INTO tenant_api_keys (id,tenant_id,application_id,key_hash,key_prefix,status,metadata_json) VALUES (?,?,?,?,?,\'active\',?)', [keyId, tenantId, applicationId, hashApiKeySecret(rawApiKey), apiMetadata.prefix, JSON.stringify(apiMetadata)]);
      await connection.execute('INSERT INTO tenant_licenses (id,tenant_id,tenant_name,application_id,application_name,plan_id,plan_name,license_key,license_status,payment_status,start_date,renewal_date,active_enforcement,current_accrued_bill_usd,grace_period_days_remaining,last_payment_date,last_payment_amount,currency,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,\'none\',?,?,NULL,NULL,?,?)', [licenseId, tenantId, fullName, applicationId, request.application_name, plan.id, plan.name, `LIC-${randomBytes(16).toString('hex').toUpperCase()}`, 'active', 'pending', now.toISOString().slice(0, 10), trialEnd.toISOString().slice(0, 10), plan.basePrice, plan.gracePeriodDays, plan.currency, JSON.stringify(license)]);

      // The owner approval is persisted and consumed in the same transaction as the relationships.
      const scopeApprovalId = id('approval');
      await connection.execute('INSERT INTO commercial_evidence_approvals (id,organization_id,operation,customer_id,target_tenant_id,requested_scope_link_type,requested_effective_from,evidence_reference,approved_by,approval_reason) VALUES (?,? ,\'ORGANIZATION_TENANT_SCOPE_CREATE\',NULL,?,\'PRIMARY\',?,?,?,?)', [scopeApprovalId, rootRows[0].id, tenantId, effectiveFrom, `SELF_REGISTRATION:${request.id}`, actor.id, 'Owner-approved customer self-registration and explicit technical scope.']);
      await connection.execute('INSERT INTO commercial_evidence_approval_uses (approval_id,resource_type,resource_id) VALUES (?,\'organization_tenant_scope\',?)', [scopeApprovalId, organizationScopeId]);
      const identityApprovalId = id('approval');
      await connection.execute('INSERT INTO commercial_evidence_approvals (id,organization_id,operation,customer_id,evidence_reference,approved_by,approval_reason) VALUES (?,? ,\'CUSTOMER_IAM_LINK\',?,?,?,?)', [identityApprovalId, rootRows[0].id, customerId, `SELF_REGISTRATION:${request.id}`, actor.id, 'Owner-approved primary customer contact identity.']);
      await connection.execute('INSERT INTO commercial_evidence_approval_uses (approval_id,resource_type,resource_id) VALUES (?,\'commercial_account_iam_relationship\',?)', [identityApprovalId, accountUserRelationshipId]);

      const approvedRegistration = { id: request.id, email: request.email, createdAt: new Date(request.created_at).toISOString(), status: 'trial_active', planId: plan.id, tenantId, customerName: fullName, commercialCustomerId: customerId, organizationId, accountId, userId, acceptedPolicyVersion: 'ALTIL-2026-09-27-v1', acceptedAt: new Date(request.accepted_terms_at).toISOString(), approvedBy: actor.email, approvedAt: now.toISOString() };
      await connection.execute("UPDATE public_registration_requests SET status='APPROVED',pending_email=NULL,approved_by=?,approved_at=?,result_tenant_id=?,result_customer_id=?,result_organization_id=?,result_account_id=?,result_user_id=?,result_application_id=?,result_license_id=? WHERE id=?", [actor.id, now, tenantId, customerId, organizationId, accountId, userId, applicationId, licenseId, request.id]);
      await connection.execute("UPDATE tenant_registrations SET status='trial_active',payload_json=? WHERE id=?", [JSON.stringify(approvedRegistration), request.id]);
      await connection.execute('INSERT INTO audit_logs (id,timestamp,tenant_id,user_email,action_type,category,severity,request_payload) VALUES (?,?,?,?,?,?,?,?)', [id('audit'), now, tenantId, actor.email, 'PUBLIC_REGISTRATION_APPROVED_AND_PROVISIONED', 'COMMERCIAL', 'INFO', JSON.stringify({ registrationId: request.id, customerId, organizationId, accountId, tenantId, applicationId, userId, planId: plan.id, licenseId })]);
      result = { registration: approvedRegistration, plan, customer: { id: customerId, type: type.toLowerCase(), name: fullName }, tenant: { id: tenantId, name: fullName }, organization: { id: organizationId, name: fullName }, account: { id: accountId }, user: { id: userId, email: request.email }, application: { id: applicationId, name: request.application_name }, license: { id: licenseId, planId: plan.id } };
    });
    return res.status(200).json({ ...result, apiKey: rawApiKey, apiKeyHandling: 'Shown once in this approval response; only its digest and non-secret metadata were persisted.', nextSteps: ['Provide the one-time API key to the customer through an approved secure channel.', 'The customer can sign in with the password set during registration.', 'Payment is not collected by registration.'] });
  } catch (error: any) {
    if (error?.message === 'REGISTRATION_NOT_PENDING') return res.status(404).json({ error: 'Pending registration was not found or has expired.' });
    if (error?.message === 'REGISTRATION_PLAN_UNAVAILABLE') return res.status(409).json({ error: 'The selected package is no longer published.' });
    if (error?.message === 'EMAIL_EXISTS') return res.status(409).json({ error: 'An account already exists for this registration email.' });
    console.error('[Registration approval] Provisioning transaction failed:', { code: error?.code || error?.message || 'UNKNOWN' });
    return res.status(503).json({ error: 'Registration approval failed. The provisioning transaction was rolled back.' });
  }
});

export function createPublicRegistrationRouter() { return router; }
