import { randomUUID } from 'node:crypto';
import { Router, type Response } from 'express';
import { executeQuery, withMariaDbTransaction } from '../db/mariadb';
import { requireAuthentication, requirePermission, requireRole, type AuthenticatedRequest } from '../middleware/authMiddleware';
import { authorizeInContext } from '../security/authorizationContext';
import { appendDurablyPersistedEvent } from '../logging/eventLogger';
import { resolveCommercialOrganizationScope, normalizeCommercialContact, validateCommercialContactInput, validateCommercialCustomer, validateCommercialOrganizationType } from '../commercial/foundation';
import { CommercialMutationError, runDurableCommercialMutation, type CommercialMutationSql, type DurableMutationInput } from '../commercial/durableMutation';
import { recommendedCustomerPrice } from '../commercial/catalogue';

type ScopeUser = NonNullable<AuthenticatedRequest['user']>;
type Query = <T = any>(sql: string, params?: unknown[]) => Promise<T[]>;
const query: Query = (sql, params = []) => executeQuery(sql, params) as Promise<any[]>;
const txQuery = (tx: CommercialMutationSql): Query => async (sql, params = []) => (await tx.execute(sql, params))[0] as any[];
const asDate = (value: unknown): Date | null => {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date : null;
};
const sqlDate = (date: Date | null) => date ? date.toISOString().slice(0, 23).replace('T', ' ') : null;
const activeAt = (from: unknown, to: unknown) => {
  const now = Date.now();
  return new Date(String(from)).getTime() <= now && (!to || new Date(String(to)).getTime() > now);
};
const globalSuperAdmin = (user: ScopeUser) => user.authorization?.grants.some(grant => grant.visibility === 'GLOBAL' && grant.role === 'SUPER_ADMIN' && grant.permissions.includes('tenant.write')) === true;

async function authorizedOrganizationIds(user: ScopeUser, permission: string, read: Query = query): Promise<Set<string>> {
  const context = user.authorization;
  if (!context) return new Set();
  const [organizations, scopes] = await Promise.all([
    read<{ id: string }>("SELECT id FROM commercial_organizations WHERE status='ACTIVE'"),
    read<{ organization_id: string; tenant_id: string; effective_from: Date; effective_to: Date | null }>("SELECT s.organization_id,s.tenant_id,s.effective_from,s.effective_to FROM commercial_organization_tenant_scopes s JOIN commercial_organizations o ON o.id=s.organization_id AND o.status='ACTIVE' WHERE s.status='ACTIVE'"),
  ]);
  return new Set(resolveCommercialOrganizationScope({
    grants: context.grants, permission, organizationIds: organizations.map(row => row.id),
    tenantScopes: scopes.map(row => ({ organizationId: row.organization_id, tenantId: row.tenant_id, effectiveFrom: row.effective_from, effectiveTo: row.effective_to })),
    asOf: new Date(),
  }));
}

async function customerVisibleTo(user: ScopeUser, customerId: string, permission: string, read: Query = query): Promise<boolean> {
  const organizationIds = await authorizedOrganizationIds(user, permission, read);
  if (!organizationIds.size) return false;
  const links = await read<{ organization_id: string; effective_from: Date; effective_to: Date | null }>(
    "SELECT co.organization_id,co.effective_from,co.effective_to FROM commercial_customer_organization_relationships co JOIN commercial_customers c ON c.id=co.customer_id AND c.status='ACTIVE' WHERE co.customer_id=? AND co.status='ACTIVE'",
    [customerId],
  );
  return links.some(link => organizationIds.has(link.organization_id) && activeAt(link.effective_from, link.effective_to));
}

type CustomerAccountMembership = { account_id: string; customer_id: string; relationship_type: string };
async function ownCustomerAccount(user: ScopeUser, read: Query = query): Promise<CustomerAccountMembership | null> {
  if (user.roles.length !== 1 || user.roles[0] !== 'CUSTOMER_ACCOUNT_USER') return null;
  const memberships = await read<CustomerAccountMembership>(
    "SELECT m.account_id,c.id AS customer_id,m.relationship_type FROM commercial_account_iam_relationships m JOIN commercial_accounts a ON a.id=m.account_id AND a.status='ACTIVE' JOIN commercial_customers c ON c.id=a.customer_id AND c.status='ACTIVE' WHERE m.user_id=? AND m.status='ACTIVE' AND m.effective_from<=NOW(3) AND (m.effective_to IS NULL OR m.effective_to>NOW(3)) ORDER BY m.effective_from DESC",
    [user.id],
  );
  return memberships.length === 1 ? memberships[0] : null;
}

async function consumeApproval(tx: CommercialMutationSql, approvalId: string, matchSql: string, params: unknown[], resourceType: string, resourceId: string): Promise<any> {
  const approvals = (await tx.execute(`${matchSql} FOR UPDATE`, params))[0] as any[];
  const approval = approvals[0];
  if (!approval) throw new CommercialMutationError(409, 'A matching owner approval is required.');
  const uses = (await tx.execute('SELECT approval_id FROM commercial_evidence_approval_uses WHERE approval_id=? FOR UPDATE', [approvalId]))[0] as any[];
  if (uses.length) throw new CommercialMutationError(409, 'This owner approval has already been consumed.');
  await tx.execute('INSERT INTO commercial_evidence_approval_uses (approval_id,resource_type,resource_id) VALUES (?,?,?)', [approvalId, resourceType, resourceId]);
  return approval;
}

async function sendDurableMutation(req: AuthenticatedRequest, res: Response, input: DurableMutationInput, mutate: (tx: CommercialMutationSql) => Promise<{ statusCode: number; body: any; resourceId: string | null }>): Promise<void> {
  try {
    const result = await withMariaDbTransaction(connection => {
      const tx: CommercialMutationSql = { execute: (sql, params = []) => connection.execute(sql, params as any[]) };
      return runDurableCommercialMutation(tx, { ...input, idempotencyKey: req.get('Idempotency-Key') }, () => mutate(tx));
    });
    if (result.auditEvent) {
      try { await appendDurablyPersistedEvent(result.auditEvent); }
      catch { console.error(JSON.stringify({ event: 'commercial_audit_file_append_failed', eventId: result.auditEvent.id })); }
    }
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    if (error instanceof CommercialMutationError) { res.status(error.statusCode).json({ error: error.message }); return; }
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'A conflicting commercial record already exists.' }); return; }
    console.error(JSON.stringify({ event: 'commercial_operation_failed', errorName: error instanceof Error ? error.name : 'UnknownError', code: code || 'UNKNOWN' }));
    res.status(503).json({ error: 'Commercial operation could not be completed.' });
  }
}

const mutationInput = (req: AuthenticatedRequest, operation: string, resourceType: string, body: unknown, organizationId?: string, tenantId?: string, auditContext: { reason?: string; detail?: string } = {}) => ({
  actorId: req.user!.id, actorEmail: req.user!.email, operation, resourceType, idempotencyKey: req.get('Idempotency-Key'), fingerprintInput: body,
  audit: { category: 'AUDIT' as const, action: operation, organizationId, tenantId, reason: auditContext.reason || 'Commercial write with durable idempotency and atomic audit.', detail: auditContext.detail || ((body as any)?.approvalId ? `approvalRef=${(body as any).approvalId}` : undefined) },
});

const evidenceReference = (value: unknown): value is string => typeof value === 'string' && value.trim().length >= 4 && value.trim().length <= 180;
const scopeLinkTypes = new Set(['PRIMARY', 'PRODUCTION', 'SANDBOX', 'DEVELOPMENT']);
const canonicalDetails = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalDetails).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalDetails(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
};

export function createCommercialFoundationRouter(): Router {
  const router = Router();

  router.post('/evidence-approvals', requireAuthentication, requireRole(['SUPER_ADMIN']), requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
    const organizationId = String(req.body?.organizationId || '').trim();
    const operation = String(req.body?.operation || '').trim();
    const evidence = String(req.body?.evidenceReference || '').trim();
    const reason = String(req.body?.reason || '').trim();
    const customerId = req.body?.customerId ? String(req.body.customerId).trim() : null;
    const targetTenantId = req.body?.targetTenantId ? String(req.body.targetTenantId).trim() : null;
    const targetOrganizationId = req.body?.targetOrganizationId ? String(req.body.targetOrganizationId).trim() : null;
    const targetProductId = req.body?.targetProductId ? String(req.body.targetProductId).trim() : null;
    const requestedDetails = req.body?.requestedDetails && typeof req.body.requestedDetails === 'object' && !Array.isArray(req.body.requestedDetails) ? req.body.requestedDetails : null;
    const linkType = req.body?.scopeLinkType ? String(req.body.scopeLinkType) : null;
    const from = asDate(req.body?.effectiveFrom);
    const to = asDate(req.body?.effectiveTo);
    const catalogueOperations = new Set(['PRODUCT_RELATIONSHIP_CREATE', 'RESELLER_PRODUCT_AUTHORIZATION_CREATE', 'RESELLER_PRODUCT_PRICE_CREATE']);
    const operations = new Set(['ORGANIZATION_CREATE', 'CUSTOMER_CREATE', 'LEGAL_ENTITY_CREATE', 'ACCOUNT_CREATE', 'ORGANIZATION_TENANT_SCOPE_CREATE', 'CUSTOMER_IAM_LINK', ...catalogueOperations]);
    if (!organizationId || !operations.has(operation) || !evidenceReference(evidence) || !reason || reason.length > 500) { res.status(400).json({ error: 'Organization, supported operation, evidence reference and approval reason are required.' }); return; }
    if (!globalSuperAdmin(req.user!)) { res.status(403).json({ error: 'Evidence approval requires an explicitly global SUPER_ADMIN assignment.' }); return; }
    if (['ACCOUNT_CREATE', 'LEGAL_ENTITY_CREATE', 'CUSTOMER_IAM_LINK'].includes(operation) && !customerId) { res.status(400).json({ error: 'This approval must identify the commercial customer.' }); return; }
    if (operation === 'CUSTOMER_IAM_LINK') {
      const details = requestedDetails as Record<string, unknown> | null;
      if (!details || Object.keys(details).some(field => !['accountId', 'userId', 'relationshipType', 'effectiveFrom', 'effectiveTo'].includes(field)) || !['accountId', 'userId'].every(field => typeof details[field] === 'string' && details[field]) || !['PRIMARY_CONTACT', 'ACCOUNT_ADMIN', 'BILLING_CONTACT', 'AUTHORIZED_CONTACT'].includes(String(details.relationshipType)) || typeof details.effectiveFrom !== 'string' || !(details.effectiveTo === null || typeof details.effectiveTo === 'string')) { res.status(400).json({ error: 'Customer identity approval must identify the account, IAM user, relationship type and effective period.' }); return; }
    }
    if (operation === 'ORGANIZATION_TENANT_SCOPE_CREATE' && (!targetTenantId || !linkType || !scopeLinkTypes.has(linkType) || !from || (req.body?.effectiveTo && !to) || (to && from >= to))) { res.status(400).json({ error: 'A technical tenant, supported scope link type, and valid effective period are required.' }); return; }
    if (catalogueOperations.has(operation) && (!targetProductId || !requestedDetails || canonicalDetails(requestedDetails).length > 4000)) { res.status(400).json({ error: 'Catalogue approval must identify the target product and exact requested details.' }); return; }
    if (operation === 'RESELLER_PRODUCT_AUTHORIZATION_CREATE' && !targetOrganizationId) { res.status(400).json({ error: 'Reseller authorization approval must identify the target reseller organization.' }); return; }
    if (operation === 'PRODUCT_RELATIONSHIP_CREATE' && targetOrganizationId) { res.status(400).json({ error: 'Product relationship approval is catalogue-wide and cannot target a reseller organization.' }); return; }
    if (operation === 'RESELLER_PRODUCT_PRICE_CREATE' && !targetOrganizationId) { res.status(400).json({ error: 'Reseller pricing approval must identify the target reseller organization.' }); return; }
    if (catalogueOperations.has(operation) && requestedDetails) {
      const allowedFields: Record<string, readonly string[]> = {
        PRODUCT_RELATIONSHIP_CREATE: ['sourceProductId', 'targetProductId', 'relationshipType', 'quantity', 'explanation', 'effectiveFrom', 'effectiveTo'],
        RESELLER_PRODUCT_AUTHORIZATION_CREATE: ['ownerOrganizationId', 'resellerOrganizationId', 'productId', 'effectiveFrom', 'effectiveTo'],
        RESELLER_PRODUCT_PRICE_CREATE: ['ownerOrganizationId', 'resellerOrganizationId', 'productId', 'currency', 'resellerCost', 'minimumCustomerPrice', 'recommendedMarkupPercent', 'effectiveFrom', 'effectiveTo'],
      };
      if (Object.keys(requestedDetails).some(key => !allowedFields[operation].includes(key)) || requestedDetails.targetProductId && requestedDetails.targetProductId !== targetProductId || requestedDetails.productId && requestedDetails.productId !== targetProductId || requestedDetails.ownerOrganizationId && requestedDetails.ownerOrganizationId !== organizationId || requestedDetails.resellerOrganizationId && requestedDetails.resellerOrganizationId !== targetOrganizationId) {
        res.status(400).json({ error: 'Catalogue approval details contain unsupported or inconsistent fields.' }); return;
      }
      const requiredFields: Record<string, readonly string[]> = {
        PRODUCT_RELATIONSHIP_CREATE: ['sourceProductId', 'targetProductId', 'relationshipType', 'quantity', 'explanation', 'effectiveFrom', 'effectiveTo'],
        RESELLER_PRODUCT_AUTHORIZATION_CREATE: ['ownerOrganizationId', 'resellerOrganizationId', 'productId', 'effectiveFrom', 'effectiveTo'],
        RESELLER_PRODUCT_PRICE_CREATE: ['ownerOrganizationId', 'resellerOrganizationId', 'productId', 'currency', 'resellerCost', 'minimumCustomerPrice', 'recommendedMarkupPercent', 'effectiveFrom', 'effectiveTo'],
      };
      if (requiredFields[operation].some(key => !Object.hasOwn(requestedDetails, key))) { res.status(400).json({ error: 'Catalogue approval is missing required operation details.' }); return; }
      if (operation === 'PRODUCT_RELATIONSHIP_CREATE' && (requestedDetails.targetProductId !== targetProductId || typeof requestedDetails.sourceProductId !== 'string' || typeof requestedDetails.relationshipType !== 'string' || !Number.isFinite(Number(requestedDetails.quantity)) || typeof requestedDetails.effectiveFrom !== 'string' || !(requestedDetails.effectiveTo === null || typeof requestedDetails.effectiveTo === 'string'))) { res.status(400).json({ error: 'Product relationship approval details are incomplete or invalid.' }); return; }
      if (operation === 'RESELLER_PRODUCT_AUTHORIZATION_CREATE' && (typeof requestedDetails.resellerOrganizationId !== 'string' || requestedDetails.resellerOrganizationId !== targetOrganizationId || typeof requestedDetails.effectiveFrom !== 'string' || !(requestedDetails.effectiveTo === null || typeof requestedDetails.effectiveTo === 'string'))) { res.status(400).json({ error: 'Reseller authorization approval details are incomplete or invalid.' }); return; }
      if (operation === 'RESELLER_PRODUCT_PRICE_CREATE' && (typeof requestedDetails.resellerOrganizationId !== 'string' || requestedDetails.resellerOrganizationId !== targetOrganizationId || typeof requestedDetails.currency !== 'string' || !['resellerCost', 'minimumCustomerPrice', 'recommendedMarkupPercent'].every(key => Number.isFinite(Number(requestedDetails[key]))) || typeof requestedDetails.effectiveFrom !== 'string' || !(requestedDetails.effectiveTo === null || typeof requestedDetails.effectiveTo === 'string'))) { res.status(400).json({ error: 'Reseller pricing approval details are incomplete or invalid.' }); return; }
    }
    const body = { organizationId, operation, customerId, targetTenantId, targetOrganizationId, targetProductId, requestedDetails, linkType, from: from?.toISOString() || null, to: to?.toISOString() || null, evidence, reason };
    await sendDurableMutation(req, res, mutationInput(req, 'commercial.evidence-approval.create', 'commercial_evidence_approval', body, organizationId, targetTenantId || undefined, { reason, detail: `evidenceRef=${evidence}` }), async tx => {
      const read = txQuery(tx);
      if (!(await authorizedOrganizationIds(req.user!, 'tenant.write', read)).has(organizationId)) throw new CommercialMutationError(404, 'Organization not found in authorized scope.');
      if (customerId && !(await customerVisibleTo(req.user!, customerId, 'tenant.write', read))) throw new CommercialMutationError(404, 'Customer not found in authorized scope.');
      if (targetTenantId) {
        if (!authorizeInContext(req.user!.authorization, targetTenantId, 'tenant.write')) throw new CommercialMutationError(404, 'Technical tenant not found in authorized scope.');
        const tenants = await read('SELECT id FROM tenants WHERE id=? LIMIT 1', [targetTenantId]);
        if (!tenants.length) throw new CommercialMutationError(404, 'Technical tenant not found.');
      }
      const id = `evid-${randomUUID()}`;
      await tx.execute('INSERT INTO commercial_evidence_approvals (id,organization_id,operation,customer_id,target_tenant_id,target_organization_id,target_product_id,requested_details_json,requested_scope_link_type,requested_effective_from,requested_effective_to,evidence_reference,approved_by,approval_reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [id, organizationId, operation, customerId, targetTenantId, targetOrganizationId, targetProductId, requestedDetails ? JSON.stringify(requestedDetails) : null, linkType, sqlDate(from), sqlDate(to), evidence, req.user!.id, reason]);
      return { statusCode: 201, resourceId: id, body: { approvalId: id, organizationId, operation, customerId, targetTenantId, targetOrganizationId, targetProductId, requestedDetails, status: 'AVAILABLE_FOR_ONE_USE' } };
    });
  });

  router.get('/organizations', requireAuthentication, requirePermission('tenant.read'), async (req: AuthenticatedRequest, res) => {
    try {
      const allowed = await authorizedOrganizationIds(req.user!, 'tenant.read');
      const [organizations, edges, customerLinks, scopeLinks] = await Promise.all([
        executeQuery<any>('SELECT id,canonical_key,name,organization_type,status,created_at FROM commercial_organizations ORDER BY name'),
        executeQuery<any>("SELECT id,parent_organization_id,child_organization_id,relationship_type,effective_from,effective_to FROM commercial_organization_relationships WHERE status='ACTIVE'"),
        allowed.size ? executeQuery<any>(`SELECT co.organization_id,co.effective_from,co.effective_to,c.id AS customer_id,c.customer_type,c.display_name,c.status,co.relationship_type FROM commercial_customer_organization_relationships co JOIN commercial_customers c ON c.id=co.customer_id WHERE co.status='ACTIVE' AND c.status='ACTIVE' AND co.organization_id IN (${[...allowed].map(() => '?').join(',')})`, [...allowed]) : Promise.resolve([]),
        allowed.size ? executeQuery<any>(`SELECT s.id,s.organization_id,s.tenant_id,s.scope_link_type,s.status,s.effective_from,s.effective_to,s.created_by,s.created_at,s.updated_by,s.updated_at,t.name AS tenant_name FROM commercial_organization_tenant_scopes s JOIN tenants t ON t.id=s.tenant_id WHERE s.organization_id IN (${[...allowed].map(() => '?').join(',')}) ORDER BY s.effective_from DESC`, [...allowed]) : Promise.resolve([]),
      ]);
      res.json({ organizations: organizations.filter(row => allowed.has(row.id)), relationships: edges.filter(row => allowed.has(row.parent_organization_id) && allowed.has(row.child_organization_id) && activeAt(row.effective_from, row.effective_to)), customers: customerLinks.filter(row => activeAt(row.effective_from, row.effective_to)), technicalScopes: scopeLinks.filter(row => allowed.has(row.organization_id)) });
    } catch { res.status(503).json({ error: 'Commercial organization data is unavailable.' }); }
  });

  router.get('/account-portal', requireAuthentication, async (req: AuthenticatedRequest, res) => {
    const organizationId = typeof req.query.organizationId === 'string' ? req.query.organizationId.trim() : '';
    let customerId = typeof req.query.customerId === 'string' ? req.query.customerId.trim() : '';
    const customerSelf = req.user!.roles.length === 1 && req.user!.roles[0] === 'CUSTOMER_ACCOUNT_USER';
    const membership = customerSelf ? await ownCustomerAccount(req.user!) : null;
    if (customerSelf) {
      if (organizationId || customerId || !membership) { res.status(404).json({ error: 'Commercial account not found in the authenticated account scope.' }); return; }
      customerId = membership.customer_id;
    } else if (!req.user!.authorization?.grants.some(grant => grant.permissions.includes('tenant.read'))) {
      res.status(403).json({ error: 'tenant.read permission required.' }); return;
    }
    if (!customerSelf && Boolean(organizationId) === Boolean(customerId)) {
      res.status(400).json({ error: 'Provide exactly one organizationId or customerId.' }); return;
    }
    try {
      const visibleOrganizations = await authorizedOrganizationIds(req.user!, 'tenant.read');
      let account: any;
      let relationships: any[] = [];
      let customers: any[] = [];
      let accounts: any[] = [];
      let legalEntities: any[] = [];
      let technicalScopes: any[] = [];
      let tenantIds: string[] = [];
      let billingAuthorized = false;
      let accountBillingPermission = false;
      let profileAuthorized = false;
      let accountOrganizationIds: string[] = [];

      if (organizationId) {
        if (!visibleOrganizations.has(organizationId)) { res.status(404).json({ error: 'Commercial account not found in authorized scope.' }); return; }
        const rows = await executeQuery<any>("SELECT id,name,organization_type,status,created_at FROM commercial_organizations WHERE id=? AND status='ACTIVE' LIMIT 1", [organizationId]);
        account = rows[0];
        if (!account) { res.status(404).json({ error: 'Commercial account not found in authorized scope.' }); return; }
        profileAuthorized = (await authorizedOrganizationIds(req.user!, 'tenant.write')).has(organizationId);
        accountOrganizationIds = [organizationId];
        const [edges, customerRows, scopeRows] = await Promise.all([
          executeQuery<any>("SELECT r.parent_organization_id,r.child_organization_id,r.relationship_type,r.effective_from,r.effective_to,p.name AS parent_name,c.name AS child_name FROM commercial_organization_relationships r JOIN commercial_organizations p ON p.id=r.parent_organization_id JOIN commercial_organizations c ON c.id=r.child_organization_id WHERE r.status='ACTIVE' AND (r.parent_organization_id=? OR r.child_organization_id=?)", [organizationId, organizationId]),
          executeQuery<any>("SELECT c.id,c.customer_type,c.display_name,c.company_name,c.individual_given_name,c.individual_family_name,c.status,r.relationship_type,r.effective_from,r.effective_to FROM commercial_customer_organization_relationships r JOIN commercial_customers c ON c.id=r.customer_id WHERE r.organization_id=? AND r.status='ACTIVE' AND c.status='ACTIVE'", [organizationId]),
          executeQuery<any>("SELECT s.tenant_id,s.scope_link_type,s.effective_from,s.effective_to,t.name AS tenant_name FROM commercial_organization_tenant_scopes s JOIN tenants t ON t.id=s.tenant_id WHERE s.organization_id=? AND s.status='ACTIVE'", [organizationId]),
        ]);
        relationships = edges.filter(row => activeAt(row.effective_from, row.effective_to) && visibleOrganizations.has(row.parent_organization_id) && visibleOrganizations.has(row.child_organization_id)).map(row => ({
          parentOrganizationId: row.parent_organization_id, parentName: row.parent_name, childOrganizationId: row.child_organization_id, childName: row.child_name,
          relatedOrganizationId: row.parent_organization_id === organizationId ? row.child_organization_id : row.parent_organization_id,
          relatedOrganizationName: row.parent_organization_id === organizationId ? row.child_name : row.parent_name,
          direction: row.parent_organization_id === organizationId ? 'CHILD' : 'PARENT', relationshipType: row.relationship_type,
        }));
        const customerGroups = new Map<string, any>();
        customerRows.filter(row => activeAt(row.effective_from, row.effective_to)).forEach(row => {
          const existing = customerGroups.get(row.id) || { id: row.id, customer_type: row.customer_type, display_name: row.display_name, company_name: row.company_name, individual_given_name: row.individual_given_name, individual_family_name: row.individual_family_name, status: row.status, relationshipTypes: new Set<string>(), activeRelationshipCount: 0 };
          existing.relationshipTypes.add(row.relationship_type); existing.activeRelationshipCount += 1; customerGroups.set(row.id, existing);
        });
        customers = [...customerGroups.values()].map(row => ({ ...row, relationship_type: [...row.relationshipTypes].join(', '), relationshipAmbiguous: row.activeRelationshipCount > 1, relationshipTypes: [...row.relationshipTypes] }));
        technicalScopes = scopeRows.filter(row => activeAt(row.effective_from, row.effective_to)).map(({ effective_from, effective_to, ...row }) => row);
      const customerIds = customers.map(row => row.id);
        if (customerIds.length) {
          const marks = customerIds.map(() => '?').join(',');
          [accounts, legalEntities] = await Promise.all([
            executeQuery<any>(`SELECT id,customer_id,legal_entity_id,account_name,status,created_at FROM commercial_accounts WHERE status='ACTIVE' AND customer_id IN (${marks}) ORDER BY account_name`, customerIds),
            executeQuery<any>(`SELECT id,customer_id,organization_id,legal_name,jurisdiction,status,created_at FROM commercial_legal_entities WHERE status='ACTIVE' AND customer_id IN (${marks}) ORDER BY legal_name`, customerIds),
          ]);
        }
        const billingOrganizations = await authorizedOrganizationIds(req.user!, 'billing.read');
        billingAuthorized = billingOrganizations.has(organizationId);
        accountBillingPermission = billingAuthorized;
        if (billingAuthorized) {
          tenantIds = [...new Set(technicalScopes.filter(row => authorizeInContext(req.user!.authorization, row.tenant_id, 'billing.read')).map(row => row.tenant_id))];
        }
      } else {
        if (!customerSelf && !(await customerVisibleTo(req.user!, customerId, 'tenant.read'))) { res.status(404).json({ error: 'Commercial account not found in authorized scope.' }); return; }
        const [customerRows, linkRows, accountRows, entityRows, explicitTenantLinks] = await Promise.all([
          executeQuery<any>("SELECT id,customer_type,display_name,company_name,individual_given_name,individual_family_name,status,contact_json,created_at,updated_at FROM commercial_customers WHERE id=? AND status='ACTIVE' LIMIT 1", [customerId]),
          executeQuery<any>("SELECT r.organization_id,r.relationship_type,r.effective_from,r.effective_to,o.name AS organization_name FROM commercial_customer_organization_relationships r JOIN commercial_organizations o ON o.id=r.organization_id WHERE r.customer_id=? AND r.status='ACTIVE'", [customerId]),
          executeQuery<any>("SELECT id,customer_id,legal_entity_id,account_name,status,created_at FROM commercial_accounts WHERE customer_id=? AND status='ACTIVE' AND (? IS NULL OR id=?) ORDER BY account_name", [customerId, customerSelf ? membership!.account_id : null, customerSelf ? membership!.account_id : null]),
          executeQuery<any>("SELECT id,customer_id,organization_id,legal_name,jurisdiction,status,created_at FROM commercial_legal_entities WHERE customer_id=? AND status='ACTIVE' AND (? IS NULL OR id IN (SELECT legal_entity_id FROM commercial_accounts WHERE id=? AND customer_id=?)) ORDER BY legal_name", [customerId, customerSelf ? membership!.account_id : null, customerSelf ? membership!.account_id : null, customerId]),
          executeQuery<any>("SELECT l.tenant_id,l.effective_from,l.effective_to FROM commercial_customer_tenant_links l WHERE l.customer_id=? AND l.status='ACTIVE' AND (? IS NULL OR l.account_id=?) AND NOT EXISTS (SELECT 1 FROM commercial_customer_tenant_links other WHERE other.tenant_id=l.tenant_id AND other.customer_id<>l.customer_id AND other.status='ACTIVE' AND other.effective_from<=NOW(3) AND (other.effective_to IS NULL OR other.effective_to>NOW(3)))", [customerId, customerSelf ? membership!.account_id : null, customerSelf ? membership!.account_id : null]),
        ]);
        account = customerRows[0];
        if (!account) { res.status(404).json({ error: 'Commercial account not found in authorized scope.' }); return; }
        const storedContact = typeof account.contact_json === 'string' ? JSON.parse(account.contact_json) : account.contact_json;
        const normalizedContact = normalizeCommercialContact(storedContact);
        const contact = normalizedContact ? JSON.parse(normalizedContact) : null;
        account = { ...account, contact };
        delete account.contact_json;
        relationships = linkRows.filter(row => activeAt(row.effective_from, row.effective_to) && (customerSelf || visibleOrganizations.has(row.organization_id))).map(({ effective_from, effective_to, ...row }) => ({ ...row, relatedOrganizationId: row.organization_id, relatedOrganizationName: row.organization_name, direction: 'OWNER' }));
        accountOrganizationIds = [...new Set(linkRows.filter(row => activeAt(row.effective_from, row.effective_to) && (customerSelf || visibleOrganizations.has(row.organization_id))).map(row => row.organization_id))];
        profileAuthorized = customerSelf ? ['PRIMARY_CONTACT', 'ACCOUNT_ADMIN'].includes(membership!.relationship_type) : await customerVisibleTo(req.user!, customerId, 'tenant.write');
        const billingOrganizations = await authorizedOrganizationIds(req.user!, 'billing.read');
        accountBillingPermission = accountOrganizationIds.some(id => billingOrganizations.has(id));
        accounts = accountRows;
        legalEntities = entityRows.map(({ registration_reference, ...row }) => row);
        tenantIds = [...new Set(explicitTenantLinks.filter(row => activeAt(row.effective_from, row.effective_to) && (customerSelf || authorizeInContext(req.user!.authorization, row.tenant_id, 'billing.read'))).map(row => row.tenant_id))];
        billingAuthorized = tenantIds.length > 0;
        if (customerSelf) { account.commercialAccountId = membership!.account_id; account.accountRelationship = membership!.relationship_type; }
      }

      const financials = billingAuthorized && tenantIds.length ? await loadCommercialAccountFinancials(tenantIds) : null;
      const catalogueOrganizationIds = await authorizedOrganizationIds(req.user!, 'billing.read');
      const primaryOrganization = accountOrganizationIds.find(id => catalogueOrganizationIds.has(id)) || (customerSelf ? accountOrganizationIds[0] : undefined);
      accountBillingPermission = accountBillingPermission || customerSelf;
      const catalog = accountBillingPermission && primaryOrganization ? await loadAccountPortalCatalogue(primaryOrganization) : { availability: 'NOT_AUTHORIZED', products: [], relationships: [], note: 'Catalogue pricing requires billing.read in an explicitly linked organization.' };
      const auditOrganizationIds = await authorizedOrganizationIds(req.user!, 'audit.read');
      const activity = await loadAccountPortalActivity(organizationId || customerId, accountOrganizationIds.filter(id => auditOrganizationIds.has(id)), req.user!.id);
      const attention = financials ? buildNeedsAttention(financials) : [];
      const financialPermission = billingAuthorized || accountBillingPermission;
      res.json({
        accountType: organizationId ? 'ORGANIZATION' : 'CUSTOMER', account, relationships, customers, accounts,
        legalEntities, technicalScopes,
        financials: financials || { availability: financialPermission ? 'NOT_LINKED' : 'NOT_AUTHORIZED', orders: [], invoices: [], paymentIntents: [], refunds: [], schedules: [], bankCashEvidence: 'NOT_AVAILABLE' },
        catalogue: catalog,
        activity,
        attention,
        credits: financials?.credits || { availability: financialPermission ? 'NO_ACCOUNT_CREDIT' : 'NOT_AUTHORIZED', balances: [] },
        profileManagement: { availability: profileAuthorized ? 'AVAILABLE' : 'NOT_AUTHORIZED', canEdit: profileAuthorized, editableFields: organizationId ? ['name'] : ['displayName', 'individualGivenName', 'individualFamilyName', 'companyName', 'contact'], unsupportedCompanyFields: organizationId ? [] : ['legalName', 'registrationNumber', 'tax/VAT identifiers require a dedicated legal-entity profile workflow'] },
      });
    } catch {
      res.status(503).json({ error: 'Commercial account data is unavailable.' });
    }
  });

  router.patch('/account-portal/profile', requireAuthentication, async (req: AuthenticatedRequest, res) => {
    const organizationId = typeof req.query.organizationId === 'string' ? req.query.organizationId.trim() : '';
    let customerId = typeof req.query.customerId === 'string' ? req.query.customerId.trim() : '';
    const customerSelf = req.user!.roles.length === 1 && req.user!.roles[0] === 'CUSTOMER_ACCOUNT_USER';
    const membership = customerSelf ? await ownCustomerAccount(req.user!) : null;
    if (customerSelf) {
      if (organizationId || customerId || !membership || !['PRIMARY_CONTACT', 'ACCOUNT_ADMIN'].includes(membership.relationship_type)) { res.status(404).json({ error: 'Commercial account not found in the authenticated account scope.' }); return; }
      customerId = membership.customer_id;
    } else if (!req.user!.authorization?.grants.some(grant => grant.permissions.includes('tenant.write'))) {
      res.status(403).json({ error: 'tenant.write permission required.' }); return;
    }
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body as Record<string, unknown> : {};
    if (Boolean(organizationId) === Boolean(customerId)) { res.status(400).json({ error: 'Provide exactly one organizationId or customerId.' }); return; }
    const allowedOrganizationFields = new Set(['name']);
    const allowedCustomerFields = new Set(['displayName', 'individualGivenName', 'individualFamilyName', 'companyName', 'contact']);
    const allowed = organizationId ? allowedOrganizationFields : allowedCustomerFields;
    if (!Object.keys(body).length || Object.keys(body).some(key => !allowed.has(key))) { res.status(400).json({ error: 'Profile contains no supported fields or includes a protected field.' }); return; }
    let contact: string | null | undefined;
    if (Object.hasOwn(body, 'contact')) {
      const contactError = validateCommercialContactInput(body.contact);
      if (contactError) { res.status(400).json({ error: contactError }); return; }
      try { contact = normalizeCommercialContact(body.contact); }
      catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid contact details.' }); return; }
    }
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (key === 'contact') normalized.contact = contact;
      else if (typeof body[key] !== 'string' || !String(body[key]).trim() || String(body[key]).length > 180) { res.status(400).json({ error: `Invalid ${key}.` }); return; }
      else normalized[key] = String(body[key]).trim();
    }
    const operation = 'commercial.account-profile.update';
    const resourceType = organizationId ? 'commercial_organization' : 'commercial_customer';
    await sendDurableMutation(req, res, mutationInput(req, operation, resourceType, { organizationId: organizationId || null, customerId: customerId || null, profile: normalized }, organizationId || undefined), async tx => {
      const read = txQuery(tx);
      let organizationScope = organizationId;
      if (organizationId) {
        if (!(await authorizedOrganizationIds(req.user!, 'tenant.write', read)).has(organizationId)) throw new CommercialMutationError(404, 'Commercial account not found in authorized scope.');
        const rows = await read<any>("SELECT id FROM commercial_organizations WHERE id=? AND status='ACTIVE' FOR UPDATE", [organizationId]);
        if (!rows.length) throw new CommercialMutationError(404, 'Commercial account not found.');
        await tx.execute('UPDATE commercial_organizations SET name=?,updated_at=NOW(3) WHERE id=?', [normalized.name, organizationId]);
      } else {
        if (!customerSelf && !(await customerVisibleTo(req.user!, customerId, 'tenant.write', read))) throw new CommercialMutationError(404, 'Commercial account not found in authorized scope.');
        const rows = await read<any>("SELECT id,customer_type FROM commercial_customers WHERE id=? AND status='ACTIVE' FOR UPDATE", [customerId]);
        const current = rows[0];
        if (!current) throw new CommercialMutationError(404, 'Commercial account not found.');
        if (Object.hasOwn(normalized, 'companyName') && current.customer_type !== 'COMPANY') throw new CommercialMutationError(400, 'Company fields are not accepted for an individual customer.');
        if ((Object.hasOwn(normalized, 'individualGivenName') || Object.hasOwn(normalized, 'individualFamilyName')) && current.customer_type !== 'INDIVIDUAL') throw new CommercialMutationError(400, 'Individual fields are not accepted for a company customer.');
        const columns: Record<string, string> = { displayName: 'display_name', individualGivenName: 'individual_given_name', individualFamilyName: 'individual_family_name', companyName: 'company_name', contact: 'contact_json' };
        const setters = Object.keys(normalized).map(key => `${columns[key]}=?`);
        const values = Object.keys(normalized).map(key => normalized[key]);
        await tx.execute(`UPDATE commercial_customers SET ${setters.join(',')},updated_at=NOW(3) WHERE id=?`, [...values, customerId]);
        const ownerRows = await read<any>("SELECT organization_id FROM commercial_customer_organization_relationships WHERE customer_id=? AND status='ACTIVE' AND effective_from<=NOW(3) AND (effective_to IS NULL OR effective_to>NOW(3)) ORDER BY effective_from DESC LIMIT 1", [customerId]);
        organizationScope = ownerRows[0]?.organization_id;
      }
      const resourceId = organizationId || customerId;
      return { statusCode: 200, resourceId, body: { accountId: resourceId, accountType: organizationId ? 'ORGANIZATION' : 'CUSTOMER', updatedFields: Object.keys(normalized), status: 'UPDATED' } };
    });
  });

  router.post('/account-portal/identity-links', requireAuthentication, requireRole(['SUPER_ADMIN']), requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
    const accountId = String(req.body?.accountId || '').trim();
    const userId = String(req.body?.userId || '').trim();
    const customerId = String(req.body?.customerId || '').trim();
    const relationshipType = String(req.body?.relationshipType || '').trim();
    const approvalId = String(req.body?.approvalId || '').trim();
    const evidenceReference = String(req.body?.evidenceReference || '').trim();
    const effectiveFrom = asDate(req.body?.effectiveFrom) || new Date();
    const effectiveTo = asDate(req.body?.effectiveTo);
    if (!accountId || !customerId || !userId || !['PRIMARY_CONTACT', 'ACCOUNT_ADMIN', 'BILLING_CONTACT', 'AUTHORIZED_CONTACT'].includes(relationshipType) || !approvalId || !evidenceReference || evidenceReference.length > 180 || (req.body?.effectiveTo && !effectiveTo) || (effectiveTo && effectiveFrom >= effectiveTo)) { res.status(400).json({ error: 'Account, customer, IAM user, supported relationship, evidence, approval and a valid effective period are required.' }); return; }
    const requestedDetails = { accountId, userId, relationshipType, effectiveFrom: effectiveFrom.toISOString(), effectiveTo: effectiveTo?.toISOString() || null };
    const ownerRows = await executeQuery<any>("SELECT organization_id FROM commercial_customer_organization_relationships WHERE customer_id=? AND status='ACTIVE' AND effective_from<=NOW(3) AND (effective_to IS NULL OR effective_to>NOW(3)) ORDER BY effective_from DESC LIMIT 2", [customerId]);
    if (ownerRows.length !== 1) { res.status(404).json({ error: 'Customer owner relationship is not unique and active.' }); return; }
    const ownerOrganizationId = ownerRows[0].organization_id as string;
    const mutationBody = { accountId, customerId, userId, relationshipType, approvalId, evidenceReference, effectiveFrom: requestedDetails.effectiveFrom, effectiveTo: requestedDetails.effectiveTo };
    await sendDurableMutation(req, res, mutationInput(req, 'commercial.account-iam-link.create', 'commercial_account_iam_relationship', mutationBody, ownerOrganizationId, undefined, { reason: 'Approved commercial account identity relationship.', detail: `user=${userId}; relationship=${relationshipType}; evidence=${evidenceReference}` }), async tx => {
      const read = txQuery(tx);
      if (!globalSuperAdmin(req.user!) || !(await authorizedOrganizationIds(req.user!, 'tenant.write', read)).has(ownerOrganizationId)) throw new CommercialMutationError(404, 'Commercial customer not found in authorized scope.');
      const accounts = await read<any>("SELECT a.id,a.customer_id FROM commercial_accounts a JOIN commercial_customers c ON c.id=a.customer_id AND c.status='ACTIVE' WHERE a.id=? AND a.customer_id=? AND a.status='ACTIVE' FOR UPDATE", [accountId, customerId]);
      if (!accounts.length) throw new CommercialMutationError(404, 'Commercial account not found.');
      const users = await read<any>("SELECT id,tenant_id,status FROM iam_users WHERE id=? FOR UPDATE", [userId]);
      if (!users.length || users[0].status !== 'ACTIVE' || users[0].tenant_id !== null) throw new CommercialMutationError(409, 'IAM user must be active and have no technical tenant assignment.');
      const existingRoles = await read<any>('SELECT r.role_code FROM iam_user_roles ur JOIN iam_roles r ON r.id=ur.role_id WHERE ur.user_id=? FOR UPDATE', [userId]);
      if (existingRoles.some(row => row.role_code !== 'CUSTOMER_ACCOUNT_USER')) throw new CommercialMutationError(409, 'IAM identity already has another role assignment and cannot be converted into a customer-only identity.');
      const approvals = await read<any>("SELECT id,requested_details_json,evidence_reference FROM commercial_evidence_approvals WHERE id=? AND organization_id=? AND operation='CUSTOMER_IAM_LINK' AND customer_id=? FOR UPDATE", [approvalId, ownerOrganizationId, customerId]);
      const approval = approvals[0];
      const approvedDetails = approval?.requested_details_json ? (typeof approval.requested_details_json === 'string' ? JSON.parse(approval.requested_details_json) : approval.requested_details_json) : null;
      if (!approval || approval.evidence_reference !== evidenceReference || canonicalDetails(approvedDetails) !== canonicalDetails(requestedDetails)) throw new CommercialMutationError(409, 'A matching owner approval for this exact identity relationship and evidence reference is required.');
      if ((await read('SELECT approval_id FROM commercial_evidence_approval_uses WHERE approval_id=? FOR UPDATE', [approvalId])).length) throw new CommercialMutationError(409, 'This owner approval has already been consumed.');
      const overlaps = await read<any>("SELECT id FROM commercial_account_iam_relationships WHERE user_id=? AND status='ACTIVE' AND effective_from<COALESCE(?, '9999-12-31 23:59:59.999') AND (effective_to IS NULL OR effective_to>?) FOR UPDATE", [userId, sqlDate(effectiveTo), sqlDate(effectiveFrom)]);
      if (overlaps.length) throw new CommercialMutationError(409, 'This IAM identity already has an overlapping commercial account relationship.');
      if (relationshipType === 'PRIMARY_CONTACT') {
        const primary = await read<any>("SELECT id FROM commercial_account_iam_relationships WHERE account_id=? AND relationship_type='PRIMARY_CONTACT' AND status='ACTIVE' AND effective_from<COALESCE(?, '9999-12-31 23:59:59.999') AND (effective_to IS NULL OR effective_to>?) FOR UPDATE", [accountId, sqlDate(effectiveTo), sqlDate(effectiveFrom)]);
        if (primary.length) throw new CommercialMutationError(409, 'The account already has an overlapping primary contact relationship.');
      }
      if (!existingRoles.length) await tx.execute("INSERT INTO iam_user_roles (id,user_id,role_id,tenant_id,assigned_by,access_scope) VALUES (?,?,?,NULL,?,'ORGANISATION')", [`customer-role-${randomUUID()}`, userId, 'role_customer_account_user', req.user!.id]);
      const id = `acctiam-${randomUUID()}`;
      const activeOwner = await read<any>("SELECT id FROM commercial_customer_organization_relationships WHERE customer_id=? AND organization_id=? AND status='ACTIVE' AND effective_from<=NOW(3) AND (effective_to IS NULL OR effective_to>NOW(3)) FOR UPDATE", [customerId, ownerOrganizationId]);
      if (!activeOwner.length) throw new CommercialMutationError(409, 'The approved customer owner relationship is no longer active.');
      await tx.execute("INSERT INTO commercial_account_iam_relationships (id,account_id,user_id,relationship_type,status,effective_from,effective_to,audit_reference,created_by) VALUES (?,?,?,?,'ACTIVE',?,?,?,?)", [id, accountId, userId, relationshipType, effectiveFrom, effectiveTo, evidenceReference, req.user!.id]);
      await tx.execute("INSERT INTO commercial_evidence_approval_uses (approval_id,resource_type,resource_id) VALUES (?,'commercial_account_iam_relationship',?)", [approvalId, id]);
      return { statusCode: 201, resourceId: id, body: { id, accountId, customerId, userId, relationshipType, status: 'ACTIVE', effectiveFrom: requestedDetails.effectiveFrom, effectiveTo: requestedDetails.effectiveTo } };
    });
  });

  router.get('/organizations/:organizationId/technical-scopes', requireAuthentication, requirePermission('tenant.read'), async (req: AuthenticatedRequest, res) => {
    try {
      const allowed = await authorizedOrganizationIds(req.user!, 'tenant.read');
      if (!allowed.has(req.params.organizationId)) { res.status(404).json({ error: 'Organization not found in authorized scope.' }); return; }
      const scopes = await executeQuery<any>('SELECT s.id,s.organization_id,s.tenant_id,s.scope_link_type,s.status,s.effective_from,s.effective_to,s.created_by,s.created_at,s.updated_by,s.updated_at,t.name AS tenant_name FROM commercial_organization_tenant_scopes s JOIN tenants t ON t.id=s.tenant_id WHERE s.organization_id=? ORDER BY s.effective_from DESC', [req.params.organizationId]);
      res.json({ technicalScopes: scopes });
    } catch { res.status(503).json({ error: 'Commercial technical scopes are unavailable.' }); }
  });

  router.post('/organization-tenant-scopes', requireAuthentication, requireRole(['SUPER_ADMIN']), requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
    const organizationId = String(req.body?.organizationId || '').trim();
    const tenantId = String(req.body?.tenantId || '').trim();
    const scopeLinkType = String(req.body?.scopeLinkType || '').trim();
    const approvalId = String(req.body?.approvalId || '').trim();
    const effectiveFrom = asDate(req.body?.effectiveFrom);
    const effectiveTo = asDate(req.body?.effectiveTo);
    if (!organizationId || !tenantId || !scopeLinkTypes.has(scopeLinkType) || !approvalId || !effectiveFrom || (req.body?.effectiveTo && !effectiveTo) || (effectiveTo && effectiveFrom >= effectiveTo)) { res.status(400).json({ error: 'Organization, technical tenant, supported link type, approval, and valid effective period are required.' }); return; }
    const body = { organizationId, tenantId, scopeLinkType, approvalId, effectiveFrom: effectiveFrom.toISOString(), effectiveTo: effectiveTo?.toISOString() || null };
    await sendDurableMutation(req, res, mutationInput(req, 'commercial.organization-tenant-scope.create', 'commercial_organization_tenant_scope', body, organizationId, tenantId), async tx => {
      const read = txQuery(tx);
      if (!globalSuperAdmin(req.user!)) throw new CommercialMutationError(403, 'A globally scoped SUPER_ADMIN assignment is required.');
      if (!(await authorizedOrganizationIds(req.user!, 'tenant.write', read)).has(organizationId)) throw new CommercialMutationError(404, 'Organization not found in authorized scope.');
      if (!authorizeInContext(req.user!.authorization, tenantId, 'tenant.write')) throw new CommercialMutationError(404, 'Technical tenant not found in authorized scope.');
      const tenantRows = await read<{ id: string }>('SELECT id FROM tenants WHERE id=? FOR UPDATE', [tenantId]);
      if (!tenantRows.length) throw new CommercialMutationError(404, 'Technical tenant not found.');
      const approvalRows = (await tx.execute(
        "SELECT id,approved_by FROM commercial_evidence_approvals WHERE id=? AND organization_id=? AND operation='ORGANIZATION_TENANT_SCOPE_CREATE' AND customer_id IS NULL AND target_tenant_id=? AND requested_scope_link_type=? AND requested_effective_from=? AND requested_effective_to <=> ? FOR UPDATE",
        [approvalId, organizationId, tenantId, scopeLinkType, sqlDate(effectiveFrom), sqlDate(effectiveTo)],
      ))[0] as any[];
      const approval = approvalRows[0];
      if (!approval) throw new CommercialMutationError(409, 'A matching owner approval is required.');
      if ((await read('SELECT approval_id FROM commercial_evidence_approval_uses WHERE approval_id=? FOR UPDATE', [approvalId])).length) throw new CommercialMutationError(409, 'This owner approval has already been consumed.');
      const overlap = await read('SELECT id FROM commercial_organization_tenant_scopes WHERE tenant_id=? AND status=\'ACTIVE\' AND effective_from < COALESCE(?,\'9999-12-31 23:59:59.999\') AND (effective_to IS NULL OR effective_to > ?) LIMIT 1 FOR UPDATE', [tenantId, sqlDate(effectiveTo), sqlDate(effectiveFrom)]);
      if (overlap.length) throw new CommercialMutationError(409, 'The technical tenant already has an overlapping commercial organization scope.');
      const id = approval.resource_id || `scope-${randomUUID()}`;
      // Approval consumption is deferred until all conflict checks have passed.
      await tx.execute('INSERT INTO commercial_evidence_approval_uses (approval_id,resource_type,resource_id) VALUES (?,?,?)', [approvalId, 'commercial_organization_tenant_scope', id]);
      await tx.execute('INSERT INTO commercial_organization_tenant_scopes (id,organization_id,tenant_id,scope_link_type,status,effective_from,effective_to,created_by,updated_by) VALUES (?,?,?, ?,\'ACTIVE\',?,?,?,?)', [id, organizationId, tenantId, scopeLinkType, sqlDate(effectiveFrom), sqlDate(effectiveTo), req.user!.id, req.user!.id]);
      return { statusCode: 201, resourceId: id, body: { id, organizationId, tenantId, scopeLinkType, effectiveFrom: effectiveFrom.toISOString(), effectiveTo: effectiveTo?.toISOString() || null, status: 'ACTIVE', approvedBy: approval.approved_by } };
    });
  });

  router.post('/organizations', requireAuthentication, requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
    const name = String(req.body?.name || '').trim(); const type = req.body?.organizationType; const parentId = String(req.body?.parentOrganizationId || '').trim(); const approvalId = String(req.body?.approvalId || '').trim();
    if (!name || name.length > 180 || !validateCommercialOrganizationType(type) || !parentId || !approvalId) { res.status(400).json({ error: 'Name, permitted organization type, parent organization and approvalId are required.' }); return; }
    const body = { name, organizationType: type, parentOrganizationId: parentId, approvalId };
    await sendDurableMutation(req, res, mutationInput(req, 'commercial.organization.create', 'commercial_organization', body, parentId), async tx => {
      const read = txQuery(tx); const allowed = await authorizedOrganizationIds(req.user!, 'tenant.write', read);
      if (!allowed.has(parentId)) throw new CommercialMutationError(404, 'Parent organization not found in authorized scope.');
      if (!(await read('SELECT id FROM commercial_organizations WHERE id=? AND status=\'ACTIVE\' FOR UPDATE', [parentId])).length) throw new CommercialMutationError(404, 'Parent organization not found.');
      const id = `org-${randomUUID()}`; const relationshipId = `orgrel-${randomUUID()}`; const now = new Date();
      await consumeApproval(tx, approvalId, "SELECT id FROM commercial_evidence_approvals WHERE id=? AND organization_id=? AND operation='ORGANIZATION_CREATE' AND customer_id IS NULL", [approvalId, parentId], 'commercial_organization', id);
      await tx.execute('INSERT INTO commercial_organizations (id,name,organization_type,status,created_by) VALUES (?,?,?,\'ACTIVE\',?)', [id, name, type, req.user!.id]);
      await tx.execute('INSERT INTO commercial_organization_relationships (id,parent_organization_id,child_organization_id,relationship_type,status,effective_from,created_by) VALUES (?,?,?, ?,\'ACTIVE\',?,?)', [relationshipId, parentId, id, type, now, req.user!.id]);
      return { statusCode: 201, resourceId: id, body: { id, name, organizationType: type, parentOrganizationId: parentId, status: 'ACTIVE' } };
    });
  });

  router.get('/customers', requireAuthentication, requirePermission('tenant.read'), async (req: AuthenticatedRequest, res) => {
    try {
      const allowed = await authorizedOrganizationIds(req.user!, 'tenant.read');
      if (!allowed.size) { res.json({ customers: [] }); return; }
      const rows = await executeQuery<any>(`SELECT c.id,c.customer_type,c.display_name,c.company_name,c.individual_given_name,c.individual_family_name,c.status,co.organization_id,co.relationship_type,co.effective_from,co.effective_to FROM commercial_customers c JOIN commercial_customer_organization_relationships co ON co.customer_id=c.id WHERE c.status='ACTIVE' AND co.status='ACTIVE' AND co.organization_id IN (${[...allowed].map(() => '?').join(',')}) ORDER BY c.display_name`, [...allowed]);
      res.json({ customers: rows.filter(row => activeAt(row.effective_from, row.effective_to)) });
    } catch { res.status(503).json({ error: 'Commercial customer data is unavailable.' }); }
  });

  router.post('/customers', requireAuthentication, requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
    const body = req.body || {}; const customer = { customerType: body.customerType, displayName: String(body.displayName || ''), companyName: body.companyName, individualGivenName: body.individualGivenName, individualFamilyName: body.individualFamilyName };
    const errors = validateCommercialCustomer(customer as any); const organizationId = String(body.organizationId || '').trim(); const approvalId = String(body.approvalId || '').trim();
    if (errors.length || !organizationId || !approvalId) { res.status(400).json({ error: errors[0] || 'Organization and approvalId are required.' }); return; }
    let contact: string | null; try { contact = normalizeCommercialContact(body.contact); } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid contact information.' }); return; }
    const fingerprint = { customer, contact, organizationId, approvalId };
    await sendDurableMutation(req, res, mutationInput(req, 'commercial.customer.create', 'commercial_customer', fingerprint, organizationId), async tx => {
      const read = txQuery(tx); if (!(await authorizedOrganizationIds(req.user!, 'tenant.write', read)).has(organizationId)) throw new CommercialMutationError(404, 'Organization not found in authorized scope.');
      const customerId = `cust-${randomUUID()}`; const relationshipId = `custorg-${randomUUID()}`; const now = new Date();
      await consumeApproval(tx, approvalId, "SELECT id FROM commercial_evidence_approvals WHERE id=? AND organization_id=? AND operation='CUSTOMER_CREATE' AND customer_id IS NULL", [approvalId, organizationId], 'commercial_customer', customerId);
      await tx.execute('INSERT INTO commercial_customers (id,customer_type,display_name,company_name,individual_given_name,individual_family_name,contact_json,status,created_by) VALUES (?,?,?,?,?,?,?,\'ACTIVE\',?)', [customerId, customer.customerType, customer.displayName.trim(), customer.companyName || null, customer.individualGivenName || null, customer.individualFamilyName || null, contact, req.user!.id]);
      await tx.execute('INSERT INTO commercial_customer_organization_relationships (id,customer_id,organization_id,relationship_type,status,effective_from,created_by) VALUES (?,?,?,\'CUSTOMER_OWNER\',\'ACTIVE\',?,?)', [relationshipId, customerId, organizationId, now, req.user!.id]);
      return { statusCode: 201, resourceId: customerId, body: { id: customerId, customerType: customer.customerType, displayName: customer.displayName.trim(), organizationId, status: 'ACTIVE' } };
    });
  });

  router.post('/accounts', requireAuthentication, requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
    const customerId = String(req.body?.customerId || '').trim(); const accountName = String(req.body?.accountName || '').trim(); const legalEntityId = req.body?.legalEntityId ? String(req.body.legalEntityId).trim() : null; const approvalId = String(req.body?.approvalId || '').trim();
    if (!customerId || !accountName || accountName.length > 180 || !approvalId) { res.status(400).json({ error: 'Customer, account name and approvalId are required.' }); return; }
    const body = { customerId, accountName, legalEntityId, approvalId };
    const mutation = mutationInput(req, 'commercial.account.create', 'commercial_account', body);
    await sendDurableMutation(req, res, mutation, async tx => {
      const read = txQuery(tx); if (!(await customerVisibleTo(req.user!, customerId, 'tenant.write', read))) throw new CommercialMutationError(404, 'Customer not found in authorized scope.');
      if (legalEntityId && !(await read('SELECT id FROM commercial_legal_entities WHERE id=? AND customer_id=? LIMIT 1', [legalEntityId, customerId])).length) throw new CommercialMutationError(400, 'Legal entity must belong to the selected customer.');
      const approvalRows = (await tx.execute("SELECT ea.id,ea.organization_id FROM commercial_evidence_approvals ea JOIN commercial_customer_organization_relationships co ON co.customer_id=ea.customer_id AND co.organization_id=ea.organization_id WHERE ea.id=? AND ea.operation='ACCOUNT_CREATE' AND ea.customer_id=? AND co.status='ACTIVE' AND co.effective_from<=NOW(3) AND (co.effective_to IS NULL OR co.effective_to>NOW(3)) FOR UPDATE", [approvalId, customerId]))[0] as any[];
      const approval = approvalRows[0]; if (!approval || !(await authorizedOrganizationIds(req.user!, 'tenant.write', read)).has(approval.organization_id)) throw new CommercialMutationError(409, 'A matching owner approval is required.');
      mutation.audit.organizationId = approval.organization_id;
      if ((await read('SELECT approval_id FROM commercial_evidence_approval_uses WHERE approval_id=? FOR UPDATE', [approvalId])).length) throw new CommercialMutationError(409, 'This owner approval has already been consumed.');
      const id = `acct-${randomUUID()}`;
      await tx.execute('INSERT INTO commercial_evidence_approval_uses (approval_id,resource_type,resource_id) VALUES (?,\'commercial_account\',?)', [approvalId, id]);
      await tx.execute('INSERT INTO commercial_accounts (id,customer_id,legal_entity_id,account_name,status,created_by) VALUES (?,?,?, ?,\'ACTIVE\',?)', [id, customerId, legalEntityId, accountName, req.user!.id]);
      return { statusCode: 201, resourceId: id, body: { id, customerId, legalEntityId, accountName, status: 'ACTIVE' } };
    });
  });

  router.get('/customers/:customerId/legal-entities', requireAuthentication, requirePermission('tenant.read'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!(await customerVisibleTo(req.user!, req.params.customerId, 'tenant.read'))) { res.status(404).json({ error: 'Customer not found in authorized scope.' }); return; }
      const legalEntities = await executeQuery<any>('SELECT id,customer_id,organization_id,legal_name,jurisdiction,status,created_at FROM commercial_legal_entities WHERE customer_id=? AND status=\'ACTIVE\' ORDER BY legal_name', [req.params.customerId]);
      res.json({ legalEntities });
    } catch { res.status(503).json({ error: 'Commercial legal entity data is unavailable.' }); }
  });

  router.post('/legal-entities', requireAuthentication, requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
    const customerId = String(req.body?.customerId || '').trim(); const legalName = String(req.body?.legalName || '').trim(); const jurisdiction = String(req.body?.jurisdiction || '').trim().toUpperCase(); const registrationReference = req.body?.registrationReference ? String(req.body.registrationReference).trim() : null; const approvalId = String(req.body?.approvalId || '').trim();
    if (!customerId || !legalName || legalName.length > 180 || !/^[A-Z]{2}$/.test(jurisdiction) || (registrationReference && registrationReference.length > 160) || !approvalId) { res.status(400).json({ error: 'Customer, legal name, ISO 3166-1 alpha-2 jurisdiction and approvalId are required.' }); return; }
    const body = { customerId, legalName, jurisdiction, registrationReference, approvalId };
    const mutation = mutationInput(req, 'commercial.legal-entity.create', 'commercial_legal_entity', body);
    await sendDurableMutation(req, res, mutation, async tx => {
      const read = txQuery(tx); if (!(await customerVisibleTo(req.user!, customerId, 'tenant.write', read))) throw new CommercialMutationError(404, 'Customer not found in authorized scope.');
      const approvals = (await tx.execute("SELECT ea.id,ea.organization_id FROM commercial_evidence_approvals ea JOIN commercial_customer_organization_relationships co ON co.customer_id=ea.customer_id AND co.organization_id=ea.organization_id WHERE ea.id=? AND ea.operation='LEGAL_ENTITY_CREATE' AND ea.customer_id=? AND co.status='ACTIVE' AND co.effective_from<=NOW(3) AND (co.effective_to IS NULL OR co.effective_to>NOW(3)) FOR UPDATE", [approvalId, customerId]))[0] as any[];
      const approval = approvals[0];
      if (!approval || !(await authorizedOrganizationIds(req.user!, 'tenant.write', read)).has(approval.organization_id)) throw new CommercialMutationError(409, 'A matching owner approval is required.');
      mutation.audit.organizationId = approval.organization_id;
      if ((await read('SELECT approval_id FROM commercial_evidence_approval_uses WHERE approval_id=? FOR UPDATE', [approvalId])).length) throw new CommercialMutationError(409, 'This owner approval has already been consumed.');
      const id = `legal-${randomUUID()}`;
      await tx.execute('INSERT INTO commercial_evidence_approval_uses (approval_id,resource_type,resource_id) VALUES (?,\'commercial_legal_entity\',?)', [approvalId, id]);
      await tx.execute('INSERT INTO commercial_legal_entities (id,customer_id,legal_name,jurisdiction,registration_reference,status,created_by) VALUES (?,?,?,?,?,\'ACTIVE\',?)', [id, customerId, legalName, jurisdiction, registrationReference, req.user!.id]);
      return { statusCode: 201, resourceId: id, body: { id, customerId, legalName, jurisdiction, status: 'ACTIVE' } };
    });
  });

  return router;
}

async function loadCommercialAccountFinancials(tenantIds: string[]): Promise<any> {
  const marks = tenantIds.map(() => '?').join(',');
  const [orders, invoices, paymentIntents, refunds, schedules, credits, invoiceAging] = await Promise.all([
    executeQuery<any>(`SELECT status,currency,COUNT(*) AS count,SUM(total) AS total FROM billing_orders WHERE tenant_id IN (${marks}) GROUP BY status,currency ORDER BY currency,status`, tenantIds),
    executeQuery<any>(`SELECT status,currency,COUNT(*) AS count,SUM(total) AS total,SUM(paid) AS paid,SUM(GREATEST(total-paid,0)) AS outstanding FROM billing_invoices WHERE tenant_id IN (${marks}) GROUP BY status,currency ORDER BY currency,status`, tenantIds),
    executeQuery<any>(`SELECT status,currency,COUNT(*) AS count,SUM(amount) AS amount,SUM(captured_amount) AS captured FROM billing_payment_intents WHERE tenant_id IN (${marks}) GROUP BY status,currency ORDER BY currency,status`, tenantIds),
    executeQuery<any>(`SELECT status,currency,COUNT(*) AS count,SUM(amount) AS amount FROM billing_refunds WHERE tenant_id IN (${marks}) GROUP BY status,currency ORDER BY currency,status`, tenantIds),
    executeQuery<any>(`SELECT status,currency,COUNT(*) AS count,SUM(last_collected_amount) AS last_collected FROM billing_schedules WHERE tenant_id IN (${marks}) GROUP BY status,currency ORDER BY currency,status`, tenantIds),
    executeQuery<any>(`SELECT currency,SUM(amount) AS amount,COUNT(*) AS count FROM billing_ledger_entries WHERE tenant_id IN (${marks}) AND kind='credit' GROUP BY currency ORDER BY currency`, tenantIds),
    executeQuery<any>(`SELECT currency,SUM(GREATEST(total-paid,0)) AS outstanding,SUM(CASE WHEN due_at<CURDATE() THEN GREATEST(total-paid,0) ELSE 0 END) AS overdue,SUM(CASE WHEN due_at>=CURDATE() THEN GREATEST(total-paid,0) ELSE 0 END) AS due, SUM(CASE WHEN due_at<CURDATE() THEN 1 ELSE 0 END) AS overdue_count,SUM(CASE WHEN due_at>=CURDATE() THEN 1 ELSE 0 END) AS due_count FROM billing_invoices WHERE tenant_id IN (${marks}) AND status NOT IN ('paid','void') AND total>paid GROUP BY currency ORDER BY currency`, tenantIds),
  ]);
  const [recentOrders, recentInvoices, recentPayments, recentSchedules] = await Promise.all([
    executeQuery<any>(`SELECT id,order_number,status,currency,total,created_at FROM billing_orders WHERE tenant_id IN (${marks}) ORDER BY created_at DESC LIMIT 10`, tenantIds),
    executeQuery<any>(`SELECT id,invoice_number,status,currency,due_at,total,paid,created_at,payload_json FROM billing_invoices WHERE tenant_id IN (${marks}) ORDER BY created_at DESC LIMIT 10`, tenantIds),
    executeQuery<any>(`SELECT id,invoice_id,provider,status,currency,amount,captured_amount,created_at,updated_at,settlement_reference FROM billing_payment_intents WHERE tenant_id IN (${marks}) ORDER BY created_at DESC LIMIT 10`, tenantIds),
    executeQuery<any>(`SELECT id,schedule_type,status,currency,cadence,next_run_at,last_collected_amount,payment_method_id,created_at FROM billing_schedules WHERE tenant_id IN (${marks}) ORDER BY created_at DESC LIMIT 20`, tenantIds),
  ]);
  const recentInvoiceRows = recentInvoices.map(row => {
    let payload: any = {};
    try { payload = typeof row.payload_json === 'string' ? JSON.parse(row.payload_json) : row.payload_json || {}; } catch { payload = {}; }
    const { payload_json, ...columns } = row;
    const relatedPayments = recentPayments.filter(payment => payment.invoice_id === row.id).map(payment => ({ id: payment.id, provider: payment.provider, status: payment.status, amount: payment.amount, capturedAmount: payment.captured_amount, currency: payment.currency, createdAt: payment.created_at }));
    return { ...columns, subtotal: Number(payload.subtotal || 0), tax: Number(payload.tax || 0), orderReference: payload.orderId || payload.orderReference || null, paymentHistory: relatedPayments };
  });
  const dueInvoices = recentInvoiceRows.filter(row => Number(row.total) > Number(row.paid) && !['paid', 'void'].includes(String(row.status).toLowerCase()));
  const overdueInvoices = dueInvoices.filter(row => new Date(row.due_at).getTime() < Date.now());
  return {
    availability: 'AVAILABLE', orders, invoices, paymentIntents, refunds, schedules,
    recentOrders, recentInvoices: recentInvoiceRows, recentPayments: recentPayments.map(({ settlement_reference, ...row }) => ({ ...row, settlementReferencePresent: Boolean(settlement_reference) })),
    subscriptions: recentSchedules, dueInvoices, overdueInvoices,
    aging: invoiceAging,
    counts: { invoicesDue: invoiceAging.reduce((sum, row) => sum + Number(row.due_count), 0), invoicesOverdue: invoiceAging.reduce((sum, row) => sum + Number(row.overdue_count), 0), ordersAwaitingPayment: orders.filter(row => ['awaiting_payment', 'payment_required', 'pending_payment'].includes(String(row.status).toLowerCase())).reduce((sum, row) => sum + Number(row.count), 0), paymentAttempts: paymentIntents.reduce((sum, row) => sum + Number(row.count), 0), confirmedPayments: paymentIntents.filter(row => ['succeeded', 'captured', 'confirmed'].includes(String(row.status).toLowerCase())).reduce((sum, row) => sum + Number(row.count), 0) },
    credits: { availability: credits.length ? 'RECORDED_CREDITS_NO_SPENDABLE_BALANCE_SEMANTICS' : 'NO_ACCOUNT_CREDIT', balances: credits, note: 'Ledger credit entries are adjustments; the current model does not persist an authoritative spendable customer-credit balance.' },
    bankCashEvidence: 'NOT_AVAILABLE', settlementEvidence: 'Settlement references are not bank-cash evidence.'
  };
}

async function loadAccountPortalActivity(accountId: string, organizationIds: string[], actorId: string): Promise<any[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (organizationIds.length) { clauses.push(`JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.organizationId')) IN (${organizationIds.map(() => '?').join(',')})`); params.push(...organizationIds); }
  if (organizationIds.length) { clauses.push("JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.resourceId'))=?"); params.push(accountId); }
  else { clauses.push("JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.actorId'))=?"); params.push(actorId); }
  const rows = await executeQuery<any>(`SELECT timestamp,action_type,category,request_payload FROM audit_logs WHERE (${clauses.join(' OR ')}) ORDER BY timestamp DESC LIMIT 30`, params);
  return rows.map(row => {
    let event: any = {};
    try { event = typeof row.request_payload === 'string' ? JSON.parse(row.request_payload) : row.request_payload || {}; } catch { event = {}; }
    return { timestamp: row.timestamp, action: String(event.action || row.action_type || 'Commercial activity'), category: String(event.category || row.category || 'AUDIT'), resourceType: event.resourceType || null, outcome: event.outcome || 'INFO', statusCode: event.statusCode || null, organizationId: event.organizationId || null, requestId: event.requestId || null };
  });
}

async function loadAccountPortalCatalogue(organizationId: string): Promise<any> {
  const organizations = await executeQuery<any>("SELECT id,organization_type FROM commercial_organizations WHERE id=? AND status='ACTIVE' LIMIT 1", [organizationId]);
  if (!organizations.length) return { availability: 'NOT_LINKED', products: [], relationships: [] };
  const isReseller = organizations[0].organization_type === 'RESELLER';
  const [products, resale, relationships] = await Promise.all([
    executeQuery<any>('SELECT id,sku,name,description,category,billing_unit,recurring,price,currency FROM billing_products WHERE is_active=1 ORDER BY sort_order,name'),
    isReseller ? executeQuery<any>("SELECT a.owner_organization_id,a.product_id,r.minimum_customer_price,r.reseller_cost,r.recommended_markup_percent FROM commercial_reseller_product_authorizations a JOIN commercial_organization_relationships edge ON edge.parent_organization_id=a.owner_organization_id AND edge.child_organization_id=a.reseller_organization_id AND edge.relationship_type IN ('PARTNER','RESELLER','SUBSIDIARY') AND edge.status='ACTIVE' AND edge.effective_from<=NOW(3) AND (edge.effective_to IS NULL OR edge.effective_to>NOW(3)) JOIN commercial_reseller_product_prices r ON r.authorization_id=a.id AND r.status='ACTIVE' AND r.effective_from<=NOW(3) AND (r.effective_to IS NULL OR r.effective_to>NOW(3)) JOIN billing_products p ON p.id=a.product_id AND p.is_active=1 WHERE a.reseller_organization_id=? AND a.status='ACTIVE' AND a.effective_from<=NOW(3) AND (a.effective_to IS NULL OR a.effective_to>NOW(3))", [organizationId]) : Promise.resolve([]),
    executeQuery<any>("SELECT source_product_id,target_product_id,relationship_type,quantity,explanation FROM commercial_product_relationships WHERE status='ACTIVE' AND effective_from<=NOW(3) AND (effective_to IS NULL OR effective_to>NOW(3)) ORDER BY source_product_id,relationship_type,target_product_id"),
  ]);
  const priceRowsByProduct = new Map<string, any[]>();
  resale.forEach(row => priceRowsByProduct.set(row.product_id, [...(priceRowsByProduct.get(row.product_id) || []), row]));
  const visibleProducts = isReseller ? products.filter(row => priceRowsByProduct.get(row.id)?.length === 1) : products;
  return { availability: 'AVAILABLE', organizationId, products: visibleProducts.map(row => {
    const priceRows = priceRowsByProduct.get(row.id) || [];
    const resalePrice = priceRows.length === 1 ? priceRows[0] : null;
    return { id: row.id, sku: row.sku, name: row.name, description: row.description, category: row.category, billingUnit: row.billing_unit, recurring: Boolean(row.recurring), price: resalePrice ? recommendedCustomerPrice(Number(resalePrice.reseller_cost), Number(resalePrice.recommended_markup_percent)) : Number(row.price), currency: row.currency, eligibility: resalePrice ? 'EXPLICIT_RESELLER_AUTHORIZATION' : 'ACTIVE_CATALOGUE_PRODUCT', priceBasis: resalePrice ? 'RECOMMENDED_RESELLER_CUSTOMER_PRICE' : 'CATALOGUE_PRICE', ...(resalePrice ? { ownerOrganizationId: resalePrice.owner_organization_id, minimumCustomerPrice: Number(resalePrice.minimum_customer_price) } : {}) };
  }), ambiguousResellerProductCount: isReseller ? [...priceRowsByProduct.values()].filter(rows => rows.length > 1).length : 0, relationships: relationships.map(row => ({ sourceProductId: row.source_product_id, targetProductId: row.target_product_id, type: row.relationship_type, quantity: Number(row.quantity), explanation: row.explanation })), note: isReseller ? 'Only products with one unambiguous, effective owner-to-reseller relationship, authorization, and price are shown. The displayed reseller price is the configured recommendation.' : 'Prices are catalogue prices; this view does not create an order or quote.' };
}

function buildNeedsAttention(financials: any): any[] {
  return (financials.dueInvoices || []).map((invoice: any) => ({ kind: new Date(invoice.due_at).getTime() < Date.now() ? 'INVOICE_OVERDUE' : 'PAYMENT_REQUIRED', resourceId: invoice.id, reference: invoice.invoice_number, amount: Math.max(0, Number(invoice.total) - Number(invoice.paid)), currency: invoice.currency, dueAt: invoice.due_at, nextAction: 'View invoice and use the existing payment workflow.' })).slice(0, 20);
}
