import { randomUUID } from 'node:crypto';
import { Router, type Response } from 'express';
import { executeQuery, withMariaDbTransaction } from '../db/mariadb';
import { requireAuthentication, requirePermission, type AuthenticatedRequest } from '../middleware/authMiddleware';
import { appendDurablyPersistedEvent } from '../logging/eventLogger';
import { CommercialMutationError, runDurableCommercialMutation, type CommercialMutationSql, type DurableMutationInput } from '../commercial/durableMutation';
import { PRODUCT_RELATIONSHIP_TYPES, hasEffectiveResaleGrant, isEffectiveAt, recommendedCustomerPrice, validateProductRelationship, validateResellerPrice, type ProductRelationshipType } from '../commercial/catalogue';
import { resolveCommercialOrganizationScope } from '../commercial/foundation';

type User = NonNullable<AuthenticatedRequest['user']>;
type Query = <T = any>(sql: string, params?: unknown[]) => Promise<T[]>;
const query: Query = (sql, params = []) => executeQuery(sql, params) as Promise<any[]>;
const txQuery = (tx: CommercialMutationSql): Query => async (sql, params = []) => (await tx.execute(sql, params))[0] as any[];
const globalSuperAdmin = (user: User) => user.authorization?.grants.some(grant => grant.visibility === 'GLOBAL' && grant.role === 'SUPER_ADMIN' && grant.permissions.includes('tenant.write')) === true;
const parseDate = (value: unknown): Date | null => { if (value === null || value === undefined || value === '') return null; const date = new Date(String(value)); return Number.isFinite(date.getTime()) ? date : null; };
const sqlDate = (date: Date | null) => date ? date.toISOString().slice(0, 23).replace('T', ' ') : null;
const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
};
const parseJson = (value: unknown): unknown => typeof value === 'string' ? JSON.parse(value) : value;
const rowsOf = <T,>(result: unknown): T[] => Array.isArray(result) ? result as T[] : [];

async function visibleOrganizationIds(user: User, permission: string, read: Query = query): Promise<Set<string>> {
  const context = user.authorization;
  if (!context) return new Set();
  const [organizations, scopes] = await Promise.all([
    read<{ id: string }>("SELECT id FROM commercial_organizations WHERE status='ACTIVE'"),
    read<{ organization_id: string; tenant_id: string; effective_from: Date; effective_to: Date | null }>("SELECT s.organization_id,s.tenant_id,s.effective_from,s.effective_to FROM commercial_organization_tenant_scopes s JOIN commercial_organizations o ON o.id=s.organization_id AND o.status='ACTIVE' WHERE s.status='ACTIVE'"),
  ]);
  return new Set(resolveCommercialOrganizationScope({ grants: context.grants, permission, organizationIds: organizations.map(row => row.id), tenantScopes: scopes.map(row => ({ organizationId: row.organization_id, tenantId: row.tenant_id, effectiveFrom: row.effective_from, effectiveTo: row.effective_to })), asOf: new Date() }));
}

async function consumeCatalogueApproval(tx: CommercialMutationSql, input: {
  approvalId: string; ownerOrganizationId: string; operation: string; targetOrganizationId?: string | null;
  targetProductId: string; details: Record<string, unknown>; resourceType: string; resourceId: string;
}): Promise<void> {
  const approvals = rowsOf<any>((await tx.execute(
    'SELECT id,target_organization_id,target_product_id,requested_details_json FROM commercial_evidence_approvals WHERE id=? AND organization_id=? AND operation=? FOR UPDATE',
    [input.approvalId, input.ownerOrganizationId, input.operation],
  ))[0]);
  const approval = approvals[0];
  if (!approval) throw new CommercialMutationError(409, 'A matching owner approval for the exact catalogue operation is required.');
  if (String(approval.target_product_id || '') !== input.targetProductId || String(approval.target_organization_id || '') !== String(input.targetOrganizationId || '')) throw new CommercialMutationError(409, 'The owner approval target does not match this product or reseller organization.');
  if (canonicalJson(parseJson(approval.requested_details_json)) !== canonicalJson(input.details)) throw new CommercialMutationError(409, 'The owner approval details do not match this exact request.');
  const used = rowsOf<any>((await tx.execute('SELECT approval_id FROM commercial_evidence_approval_uses WHERE approval_id=? FOR UPDATE', [input.approvalId]))[0]);
  if (used.length) throw new CommercialMutationError(409, 'This owner approval has already been consumed.');
  await tx.execute('INSERT INTO commercial_evidence_approval_uses (approval_id,resource_type,resource_id) VALUES (?,?,?)', [input.approvalId, input.resourceType, input.resourceId]);
}

function mutationInput(req: AuthenticatedRequest, operation: string, resourceType: string, body: unknown, organizationId?: string): DurableMutationInput {
  return {
    actorId: req.user!.id, actorEmail: req.user!.email, operation, resourceType,
    idempotencyKey: req.get('Idempotency-Key'), fingerprintInput: body,
    audit: { category: 'AUDIT', action: operation, organizationId, reason: 'Phase B1 catalogue mutation with explicit owner approval.' },
  };
}

async function sendMutation(req: AuthenticatedRequest, res: Response, input: DurableMutationInput, mutate: (tx: CommercialMutationSql) => Promise<{ statusCode: number; body: any; resourceId: string | null }>): Promise<void> {
  try {
    const result = await withMariaDbTransaction(connection => {
      const tx: CommercialMutationSql = { execute: (sql, params = []) => connection.execute(sql, params as any[]) };
      return runDurableCommercialMutation(tx, { ...input, idempotencyKey: req.get('Idempotency-Key') }, () => mutate(tx));
    });
    if (result.auditEvent) {
      try { await appendDurablyPersistedEvent(result.auditEvent); }
      catch { console.error(JSON.stringify({ event: 'commercial_catalogue_audit_file_append_failed', eventId: result.auditEvent.id })); }
    }
    res.status(result.statusCode).json(result.body);
  } catch (error) {
    if (error instanceof CommercialMutationError) { res.status(error.statusCode).json({ error: error.message }); return; }
    if ((error as NodeJS.ErrnoException)?.code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'A conflicting catalogue record already exists.' }); return; }
    console.error(JSON.stringify({ event: 'commercial_catalogue_operation_failed', errorName: error instanceof Error ? error.name : 'UnknownError', code: (error as NodeJS.ErrnoException)?.code || 'UNKNOWN' }));
    res.status(503).json({ error: 'Catalogue operation could not be completed.' });
  }
}

async function isIntrosoftDescendant(ownerId: string, from: Date, to: Date | null, read: Query): Promise<boolean> {
  if (ownerId === 'org-introsoft-root') return true;
  const rows = await read<{ parent_organization_id: string; child_organization_id: string; effective_from: Date; effective_to: Date | null }>("SELECT parent_organization_id,child_organization_id,effective_from,effective_to FROM commercial_organization_relationships WHERE status='ACTIVE'");
  const coversPeriod = (row: { effective_from: Date; effective_to: Date | null }) => new Date(row.effective_from).getTime() <= from.getTime() && (row.effective_to === null || (to !== null && new Date(row.effective_to).getTime() >= to.getTime()));
  const children = new Map<string, string[]>();
  for (const row of rows.filter(coversPeriod)) children.set(row.parent_organization_id, [...(children.get(row.parent_organization_id) || []), row.child_organization_id]);
  const visited = new Set<string>(['org-introsoft-root']);
  const queue = ['org-introsoft-root'];
  while (queue.length) for (const child of children.get(queue.shift()!) || []) if (!visited.has(child)) { visited.add(child); queue.push(child); }
  return visited.has(ownerId);
}

async function directResellerRelationship(ownerId: string, resellerId: string, from: Date, to: Date | null, read: Query): Promise<boolean> {
  const rows = await read<any>("SELECT r.id,r.relationship_type,r.effective_from,r.effective_to,o.organization_type FROM commercial_organization_relationships r JOIN commercial_organizations o ON o.id=r.child_organization_id AND o.status='ACTIVE' WHERE r.parent_organization_id=? AND r.child_organization_id=? AND r.status='ACTIVE' AND r.relationship_type IN ('PARTNER','RESELLER','SUBSIDIARY') AND o.organization_type IN ('PARTNER','RESELLER','SUBSIDIARY') FOR UPDATE", [ownerId, resellerId]);
  return rows.some(row => new Date(row.effective_from).getTime() <= from.getTime() && (row.effective_to === null || (to !== null && new Date(row.effective_to).getTime() >= to.getTime())));
}

export function createCommercialCatalogueRouter(): Router {
  const router = Router();

  // Catalogue visibility is independent from the explicit right to resell each product.
  router.get('/catalogue', requireAuthentication, requirePermission('billing.read'), async (req: AuthenticatedRequest, res) => {
    try {
      const visible = await visibleOrganizationIds(req.user!, 'billing.read');
      const organizationId = String(req.query.organizationId || '').trim();
      if (!organizationId || !visible.has(organizationId)) return res.status(404).json({ error: 'Catalogue is not available in the requested organization scope.' });
      const [products, relationships, authorizations] = await Promise.all([
        query<any>("SELECT id,sku,name,description,category,billing_unit,recurring,price,currency,is_active,sort_order FROM billing_products WHERE is_active=1 ORDER BY sort_order,name"),
        query<any>("SELECT r.id,r.source_product_id,r.target_product_id,r.relationship_type,r.quantity,r.explanation,DATE_FORMAT(r.effective_from,'%Y-%m-%dT%H:%i:%s.%fZ') AS effective_from,IF(r.effective_to IS NULL,NULL,DATE_FORMAT(r.effective_to,'%Y-%m-%dT%H:%i:%s.%fZ')) AS effective_to FROM commercial_product_relationships r JOIN billing_products s ON s.id=r.source_product_id AND s.is_active=1 JOIN billing_products t ON t.id=r.target_product_id AND t.is_active=1 WHERE r.status='ACTIVE' AND r.effective_from<=UTC_TIMESTAMP(3) AND (r.effective_to IS NULL OR r.effective_to>UTC_TIMESTAMP(3)) ORDER BY r.source_product_id,r.relationship_type,r.target_product_id"),
        query<any>("SELECT id,reseller_organization_id,product_id,status,DATE_FORMAT(effective_from,'%Y-%m-%dT%H:%i:%s.%fZ') AS effective_from,IF(effective_to IS NULL,NULL,DATE_FORMAT(effective_to,'%Y-%m-%dT%H:%i:%s.%fZ')) AS effective_to FROM commercial_reseller_product_authorizations WHERE reseller_organization_id=?", [organizationId]),
      ]);
      const grants = authorizations.map(row => ({ id: row.id, resellerOrganizationId: row.reseller_organization_id, productId: row.product_id, status: row.status, effectiveFrom: row.effective_from, effectiveTo: row.effective_to }));
      res.json({ organizationId, products: products.map(product => { const authorized = hasEffectiveResaleGrant({ resellerOrganizationId: organizationId, productId: product.id, grants }); const grant = authorized ? grants.find(item => item.resellerOrganizationId === organizationId && item.productId === product.id && item.status === 'ACTIVE' && isEffectiveAt(item.effectiveFrom, item.effectiveTo)) : null; return { ...product, price: Number(product.price), recurring: Boolean(product.recurring), isActive: Boolean(product.is_active), resaleAuthorized: authorized, resaleAuthorizationId: grant?.id || null }; }), relationships: relationships.map(row => ({ id: row.id, sourceProductId: row.source_product_id, targetProductId: row.target_product_id, relationshipType: row.relationship_type, quantity: Number(row.quantity), explanation: row.explanation, effectiveFrom: row.effective_from, effectiveTo: row.effective_to })) });
    } catch { res.status(503).json({ error: 'Commercial catalogue is unavailable.' }); }
  });

  router.get('/reseller-authorizations', requireAuthentication, requirePermission('billing.read'), async (req: AuthenticatedRequest, res) => {
    try {
      const visible = await visibleOrganizationIds(req.user!, 'billing.read');
      const organizationId = String(req.query.organizationId || '').trim();
      if (!organizationId || !visible.has(organizationId)) return res.status(404).json({ error: 'Reseller authorizations are unavailable in the requested scope.' });
      const rows = await query<any>("SELECT a.id,a.owner_organization_id,a.reseller_organization_id,a.product_id,a.status,DATE_FORMAT(a.effective_from,'%Y-%m-%dT%H:%i:%s.%fZ') AS effective_from,IF(a.effective_to IS NULL,NULL,DATE_FORMAT(a.effective_to,'%Y-%m-%dT%H:%i:%s.%fZ')) AS effective_to,a.created_at,o.name AS owner_name,r.name AS reseller_name,p.sku,p.name AS product_name FROM commercial_reseller_product_authorizations a JOIN commercial_organizations o ON o.id=a.owner_organization_id JOIN commercial_organizations r ON r.id=a.reseller_organization_id JOIN billing_products p ON p.id=a.product_id WHERE (a.owner_organization_id=? OR a.reseller_organization_id=?) ORDER BY a.created_at DESC", [organizationId, organizationId]);
      res.json({ authorizations: rows.map(row => ({ id: row.id, ownerOrganizationId: row.owner_organization_id, ownerName: row.owner_name, resellerOrganizationId: row.reseller_organization_id, resellerName: row.reseller_name, productId: row.product_id, productSku: row.sku, productName: row.product_name, status: row.status, effectiveFrom: row.effective_from, effectiveTo: row.effective_to, currentlyEffective: row.status === 'ACTIVE' && isEffectiveAt(row.effective_from, row.effective_to) })) });
    } catch { res.status(503).json({ error: 'Reseller authorization data is unavailable.' }); }
  });

  router.post('/catalogue/relationships', requireAuthentication, requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
    const body = req.body || {};
    const sourceProductId = String(body.sourceProductId || '').trim();
    const targetProductId = String(body.targetProductId || '').trim();
    const relationshipType = String(body.relationshipType || '').trim() as ProductRelationshipType;
    const quantity = body.quantity === undefined ? 1 : Number(body.quantity);
    const explanation = body.explanation === undefined || body.explanation === null ? null : String(body.explanation).trim();
    const effectiveFrom = parseDate(body.effectiveFrom);
    const effectiveTo = parseDate(body.effectiveTo);
    const approvalId = String(body.approvalId || '').trim();
    const organizationId = 'org-introsoft-root';
    if (!globalSuperAdmin(req.user!) || !sourceProductId || !targetProductId || !approvalId || !effectiveFrom || (body.effectiveTo && !effectiveTo) || !PRODUCT_RELATIONSHIP_TYPES.includes(relationshipType)) return res.status(400).json({ error: 'Global catalogue administration, two products, a relationship type, effective period, and approval are required.' });
    const normalized = { sourceProductId, targetProductId, relationshipType, quantity, explanation, effectiveFrom: effectiveFrom.toISOString(), effectiveTo: effectiveTo?.toISOString() || null };
    const errors = validateProductRelationship({ ...normalized, sourceIsBundle: false, targetIsBundle: false });
    if (errors.some(error => !error.includes('bundle'))) return res.status(400).json({ error: errors[0] });
    const details = { sourceProductId, targetProductId, relationshipType, quantity, explanation, effectiveFrom: normalized.effectiveFrom, effectiveTo: normalized.effectiveTo };
    const input: DurableMutationInput = { actorId: req.user!.id, actorEmail: req.user!.email, operation: 'commercial.catalogue.relationship.create', resourceType: 'commercial_product_relationship', idempotencyKey: req.get('Idempotency-Key'), fingerprintInput: { ...details, approvalId }, audit: { category: 'AUDIT', action: 'commercial.catalogue.relationship.create', organizationId, reason: 'Approved catalogue relationship version.' } };
    await sendMutation(req, res, input, async tx => {
      if (!globalSuperAdmin(req.user!)) throw new CommercialMutationError(403, 'An explicit global Super Admin grant is required for catalogue-wide changes.');
      const read = txQuery(tx);
      const products = await read<any>('SELECT id,category,is_active FROM billing_products WHERE id IN (?,?) ORDER BY id FOR UPDATE', [sourceProductId, targetProductId]);
      if (products.length !== 2 || products.some(product => !Boolean(product.is_active))) throw new CommercialMutationError(404, 'Both active catalogue products must exist.');
      const source = products.find(product => product.id === sourceProductId)!; const target = products.find(product => product.id === targetProductId)!;
      const exactErrors = validateProductRelationship({ ...normalized, sourceIsBundle: source.category === 'bundle', targetIsBundle: target.category === 'bundle' });
      if (exactErrors.length) throw new CommercialMutationError(400, exactErrors[0]);
      const matching = await read<any>("SELECT id,source_product_id,target_product_id,relationship_type FROM commercial_product_relationships WHERE status='ACTIVE' AND ((source_product_id=? AND target_product_id=?) OR (source_product_id=? AND target_product_id=?)) AND effective_from<COALESCE(?,'9999-12-31 23:59:59.999') AND (effective_to IS NULL OR effective_to>?) FOR UPDATE", [sourceProductId, targetProductId, targetProductId, sourceProductId, sqlDate(effectiveTo), sqlDate(effectiveFrom)]);
      const symmetricConflict = ['COMPATIBLE_WITH', 'INCOMPATIBLE_WITH'].includes(relationshipType) && matching.some(row => ['COMPATIBLE_WITH', 'INCOMPATIBLE_WITH'].includes(row.relationship_type) && row.relationship_type !== relationshipType);
      const sameRelationship = matching.some(row => row.relationship_type === relationshipType && (relationshipType === 'COMPATIBLE_WITH' || relationshipType === 'INCOMPATIBLE_WITH' || row.source_product_id === sourceProductId));
      if (sameRelationship || symmetricConflict) throw new CommercialMutationError(409, 'A duplicate or contradictory relationship overlaps this effective period.');
      if (relationshipType === 'BUNDLE_MEMBER' && matching.some(row => row.relationship_type === 'BUNDLE_MEMBER')) throw new CommercialMutationError(409, 'Nested or circular bundles are not supported.');
      const id = `prel-${randomUUID()}`;
      await consumeCatalogueApproval(tx, { approvalId, ownerOrganizationId: organizationId, operation: 'PRODUCT_RELATIONSHIP_CREATE', targetProductId, details, resourceType: 'commercial_product_relationship', resourceId: id });
      await tx.execute('INSERT INTO commercial_product_relationships (id,source_product_id,target_product_id,relationship_type,quantity,explanation,status,effective_from,effective_to,created_by) VALUES (?,?,?,?,?,? ,\'ACTIVE\',?,?,?)', [id, sourceProductId, targetProductId, relationshipType, quantity, explanation, sqlDate(effectiveFrom), sqlDate(effectiveTo), req.user!.id]);
      return { statusCode: 201, resourceId: id, body: { id, ...details, status: 'ACTIVE' } };
    });
  });

  router.post('/reseller-authorizations', requireAuthentication, requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
    const ownerOrganizationId = String(req.body?.ownerOrganizationId || '').trim();
    const resellerOrganizationId = String(req.body?.resellerOrganizationId || '').trim();
    const productId = String(req.body?.productId || '').trim();
    const approvalId = String(req.body?.approvalId || '').trim();
    const effectiveFrom = parseDate(req.body?.effectiveFrom);
    const effectiveTo = parseDate(req.body?.effectiveTo);
    if (!ownerOrganizationId || !resellerOrganizationId || !productId || !approvalId || !effectiveFrom || (req.body?.effectiveTo && !effectiveTo) || effectiveTo && effectiveTo <= effectiveFrom || ownerOrganizationId === resellerOrganizationId) return res.status(400).json({ error: 'Owner, reseller, product, approval, and a valid effective period are required.' });
    const details = { ownerOrganizationId, resellerOrganizationId, productId, effectiveFrom: effectiveFrom.toISOString(), effectiveTo: effectiveTo?.toISOString() || null };
    const body = { ...details, approvalId };
    const input: DurableMutationInput = { actorId: req.user!.id, actorEmail: req.user!.email, operation: 'commercial.reseller-authorization.create', resourceType: 'commercial_reseller_product_authorization', idempotencyKey: req.get('Idempotency-Key'), fingerprintInput: body, audit: { category: 'AUDIT', action: 'commercial.reseller-authorization.create', organizationId: ownerOrganizationId, reason: 'Owner-approved product resale authority.' } };
    await sendMutation(req, res, input, async tx => {
      const read = txQuery(tx);
      const visible = await visibleOrganizationIds(req.user!, 'tenant.write', read);
      if (!visible.has(ownerOrganizationId)) throw new CommercialMutationError(404, 'Owner organization is not in the authenticated write scope.');
      const organizationLocks = await read<any>('SELECT id FROM commercial_organizations WHERE id IN (?,?) ORDER BY id FOR UPDATE', [ownerOrganizationId, resellerOrganizationId]);
      if (organizationLocks.length !== 2) throw new CommercialMutationError(404, 'Owner or reseller organization was not found.');
      if (!(await isIntrosoftDescendant(ownerOrganizationId, effectiveFrom, effectiveTo, read))) throw new CommercialMutationError(409, 'Owner organization is not within the explicit Introsoft hierarchy for the complete authorization period.');
      if (!(await directResellerRelationship(ownerOrganizationId, resellerOrganizationId, effectiveFrom, effectiveTo, read))) throw new CommercialMutationError(409, 'Reseller must be an explicitly related child organization for the complete authorization period.');
      const product = await read<any>("SELECT id FROM billing_products WHERE id=? AND is_active=1 FOR UPDATE", [productId]);
      if (!product.length) throw new CommercialMutationError(404, 'Active catalogue product was not found.');
      const overlaps = await read<any>("SELECT id FROM commercial_reseller_product_authorizations WHERE owner_organization_id=? AND reseller_organization_id=? AND product_id=? AND status='ACTIVE' AND effective_from<COALESCE(?,'9999-12-31 23:59:59.999') AND (effective_to IS NULL OR effective_to>?) FOR UPDATE", [ownerOrganizationId, resellerOrganizationId, productId, sqlDate(effectiveTo), sqlDate(effectiveFrom)]);
      if (overlaps.length) throw new CommercialMutationError(409, 'An overlapping resale authorization already exists.');
      const id = `rpa-${randomUUID()}`;
      await consumeCatalogueApproval(tx, { approvalId, ownerOrganizationId, operation: 'RESELLER_PRODUCT_AUTHORIZATION_CREATE', targetOrganizationId: resellerOrganizationId, targetProductId: productId, details, resourceType: 'commercial_reseller_product_authorization', resourceId: id });
      await tx.execute('INSERT INTO commercial_reseller_product_authorizations (id,owner_organization_id,reseller_organization_id,product_id,status,effective_from,effective_to,approval_id,created_by) VALUES (?,?,?,?,\'ACTIVE\',?,?,?,?)', [id, ownerOrganizationId, resellerOrganizationId, productId, sqlDate(effectiveFrom), sqlDate(effectiveTo), approvalId, req.user!.id]);
      return { statusCode: 201, resourceId: id, body: { id, ...details, status: 'ACTIVE' } };
    });
  });

  router.get('/reseller-pricing', requireAuthentication, requirePermission('billing.read'), async (req: AuthenticatedRequest, res) => {
    try {
      const visible = await visibleOrganizationIds(req.user!, 'billing.read');
      const resellerOrganizationId = String(req.query.resellerOrganizationId || '').trim();
      const ownerOrganizationId = String(req.query.ownerOrganizationId || '').trim();
      if (!resellerOrganizationId || (!visible.has(resellerOrganizationId) && (!ownerOrganizationId || !visible.has(ownerOrganizationId)))) return res.status(404).json({ error: 'Reseller pricing is unavailable in the requested scope.' });
      const rows = await query<any>(`SELECT a.id AS authorization_id,a.owner_organization_id,a.reseller_organization_id,a.product_id,p.sku,p.name AS product_name,p.price AS base_price,p.currency AS base_currency,r.id AS price_id,r.currency,r.reseller_cost,r.minimum_customer_price,r.recommended_markup_percent,DATE_FORMAT(r.effective_from,'%Y-%m-%dT%H:%i:%s.%fZ') AS effective_from,IF(r.effective_to IS NULL,NULL,DATE_FORMAT(r.effective_to,'%Y-%m-%dT%H:%i:%s.%fZ')) AS effective_to FROM commercial_reseller_product_authorizations a JOIN billing_products p ON p.id=a.product_id JOIN commercial_reseller_product_prices r ON r.authorization_id=a.id AND r.status='ACTIVE' AND r.effective_from<=UTC_TIMESTAMP(3) AND (r.effective_to IS NULL OR r.effective_to>UTC_TIMESTAMP(3)) WHERE a.reseller_organization_id=? AND (?='' OR a.owner_organization_id=?) AND a.status='ACTIVE' AND a.effective_from<=UTC_TIMESTAMP(3) AND (a.effective_to IS NULL OR a.effective_to>UTC_TIMESTAMP(3)) ORDER BY p.name`, [resellerOrganizationId, ownerOrganizationId, ownerOrganizationId]);
      res.json({ resellerOrganizationId, prices: rows.map(row => ({ authorizationId: row.authorization_id, ownerOrganizationId: row.owner_organization_id, resellerOrganizationId: row.reseller_organization_id, productId: row.product_id, sku: row.sku, productName: row.product_name, basePrice: Number(row.base_price), baseCurrency: row.base_currency, currency: row.currency, resellerCost: Number(row.reseller_cost), minimumCustomerPrice: Number(row.minimum_customer_price), recommendedMarkupPercent: Number(row.recommended_markup_percent), recommendedCustomerPrice: recommendedCustomerPrice(Number(row.reseller_cost), Number(row.recommended_markup_percent)), effectiveFrom: row.effective_from, effectiveTo: row.effective_to })) });
    } catch { res.status(503).json({ error: 'Reseller pricing is unavailable.' }); }
  });

  router.post('/reseller-pricing', requireAuthentication, requirePermission('tenant.write'), async (req: AuthenticatedRequest, res) => {
    const ownerOrganizationId = String(req.body?.ownerOrganizationId || '').trim();
    const resellerOrganizationId = String(req.body?.resellerOrganizationId || '').trim();
    const productId = String(req.body?.productId || '').trim();
    const currency = String(req.body?.currency || '').trim().toUpperCase();
    const resellerCost = Number(req.body?.resellerCost);
    const minimumCustomerPrice = Number(req.body?.minimumCustomerPrice);
    const recommendedMarkupPercent = Number(req.body?.recommendedMarkupPercent);
    const approvalId = String(req.body?.approvalId || '').trim();
    const effectiveFrom = parseDate(req.body?.effectiveFrom);
    const effectiveTo = parseDate(req.body?.effectiveTo);
    if (!ownerOrganizationId || !resellerOrganizationId || !productId || !approvalId || !effectiveFrom || (req.body?.effectiveTo && !effectiveTo) || effectiveTo && effectiveTo <= effectiveFrom) return res.status(400).json({ error: 'Owner, reseller, product, approval, and a valid effective period are required.' });
    const details = { ownerOrganizationId, resellerOrganizationId, productId, currency, resellerCost, minimumCustomerPrice, recommendedMarkupPercent, effectiveFrom: effectiveFrom.toISOString(), effectiveTo: effectiveTo?.toISOString() || null };
    const errors = validateResellerPrice({ currency, resellerCost, minimumCustomerPrice, recommendedMarkupPercent, effectiveFrom: details.effectiveFrom, effectiveTo: details.effectiveTo });
    if (errors.length) return res.status(400).json({ error: errors[0] });
    const body = { ...details, approvalId };
    const input: DurableMutationInput = { actorId: req.user!.id, actorEmail: req.user!.email, operation: 'commercial.reseller-pricing.create', resourceType: 'commercial_reseller_product_price', idempotencyKey: req.get('Idempotency-Key'), fingerprintInput: body, audit: { category: 'AUDIT', action: 'commercial.reseller-pricing.create', organizationId: ownerOrganizationId, reason: 'Owner-approved effective-dated reseller pricing.' } };
    await sendMutation(req, res, input, async tx => {
      const read = txQuery(tx);
      const visible = await visibleOrganizationIds(req.user!, 'tenant.write', read);
      if (!visible.has(ownerOrganizationId)) throw new CommercialMutationError(404, 'Owner organization is not in the authenticated write scope.');
      if (!(await isIntrosoftDescendant(ownerOrganizationId, effectiveFrom, effectiveTo, read))) throw new CommercialMutationError(409, 'Owner organization is not within the explicit Introsoft hierarchy for the complete pricing period.');
      const grants = await read<any>("SELECT id,effective_from,effective_to FROM commercial_reseller_product_authorizations WHERE owner_organization_id=? AND reseller_organization_id=? AND product_id=? AND status='ACTIVE' AND effective_from<=? AND (effective_to IS NULL OR effective_to>=?) FOR UPDATE", [ownerOrganizationId, resellerOrganizationId, productId, sqlDate(effectiveFrom), sqlDate(effectiveTo)]);
      const authorization = grants.find(row => row.effective_to === null || (effectiveTo && new Date(row.effective_to).getTime() >= effectiveTo.getTime()));
      if (!authorization) throw new CommercialMutationError(409, 'An active resale authorization must cover the complete pricing period.');
      const product = await read<any>('SELECT id,currency FROM billing_products WHERE id=? AND is_active=1 FOR UPDATE', [productId]);
      if (!product.length || product[0].currency !== currency) throw new CommercialMutationError(409, 'Pricing currency must match the active product currency; FX pricing is not inferred.');
      const overlaps = await read<any>("SELECT id,effective_from,effective_to FROM commercial_reseller_product_prices WHERE authorization_id=? AND status='ACTIVE' AND effective_from<COALESCE(?,'9999-12-31 23:59:59.999') AND (effective_to IS NULL OR effective_to>?) ORDER BY effective_from FOR UPDATE", [authorization.id, sqlDate(effectiveTo), sqlDate(effectiveFrom)]);
      if (overlaps.some(row => new Date(row.effective_from).getTime() >= effectiveFrom.getTime() || row.effective_to !== null)) throw new CommercialMutationError(409, 'The new price version overlaps an existing version or would rewrite pricing history.');
      const id = `rprice-${randomUUID()}`;
      await consumeCatalogueApproval(tx, { approvalId, ownerOrganizationId, operation: 'RESELLER_PRODUCT_PRICE_CREATE', targetOrganizationId: resellerOrganizationId, targetProductId: productId, details, resourceType: 'commercial_reseller_product_price', resourceId: id });
      for (const prior of overlaps) await tx.execute('UPDATE commercial_reseller_product_prices SET effective_to=? WHERE id=? AND effective_to IS NULL', [sqlDate(effectiveFrom), prior.id]);
      await tx.execute('INSERT INTO commercial_reseller_product_prices (id,authorization_id,currency,reseller_cost,minimum_customer_price,recommended_markup_percent,status,effective_from,effective_to,approval_id,created_by) VALUES (?,?,?,?,?, ?,\'ACTIVE\',?,?,?,?)', [id, authorization.id, currency, resellerCost, minimumCustomerPrice, recommendedMarkupPercent, sqlDate(effectiveFrom), sqlDate(effectiveTo), approvalId, req.user!.id]);
      return { statusCode: 201, resourceId: id, body: { id, ...details, recommendedCustomerPrice: recommendedCustomerPrice(resellerCost, recommendedMarkupPercent), status: 'ACTIVE' } };
    });
  });

  return router;
}
