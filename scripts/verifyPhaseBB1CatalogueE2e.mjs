import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';

dotenv.config({ quiet: true });
const databaseName = 'altil_e2e_test';
const baseUrl = 'http://127.0.0.1:3106/api/v1';
if (process.env.MARIADB_HOST !== '127.0.0.1' || process.env.DATABASE_URL?.trim() || !process.env.MARIADB_USER || !process.env.MARIADB_PASSWORD) {
  throw new Error('Phase B1 E2E refused: only discrete credentials for loopback altil_e2e_test are allowed.');
}

const database = await mysql.createConnection({ host: '127.0.0.1', port: Number(process.env.MARIADB_PORT || 3306), user: process.env.MARIADB_USER, password: process.env.MARIADB_PASSWORD, database: databaseName, connectTimeout: 4000 });
try {
  const [target] = await database.query('SELECT DATABASE() AS database_name');
  if (target[0]?.database_name !== databaseName) throw new Error('Phase B1 E2E refused: connected database did not match its allowlist.');
  const [versions] = await database.query('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1');
  if (String(versions[0]?.version).padStart(3, '0') !== '031') throw new Error('Phase B1 E2E requires migration 031 on the isolated database.');

  async function request(path, { method = 'GET', body, key, token } = {}) {
    const response = await fetch(`${baseUrl}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(key ? { 'Idempotency-Key': key } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, json: await response.json().catch(() => ({})) };
  }
  const key = () => `phase-b1-${randomUUID()}`;
  const login = await request('/auth/login', { method: 'POST', body: { email: 'supertest@introsoft.co.za', password: 'supertest' } });
  if (login.status !== 200 || !login.json.token || !login.json.user?.roles?.includes('SUPER_ADMIN')) throw new Error(`Isolated synthetic login failed with HTTP ${login.status}.`);
  const token = login.json.token;
  const approval = async (organizationId, operation, details, targetProductId, targetOrganizationId = null) => {
    const result = await request('/commercial/evidence-approvals', { method: 'POST', token, key: key(), body: { organizationId, operation, ...(targetProductId ? { targetProductId } : {}), ...(targetOrganizationId ? { targetOrganizationId } : {}), ...(details ? { requestedDetails: details } : {}), evidenceReference: `synthetic-phase-b1-${randomUUID()}`, reason: 'Synthetic isolated catalogue authorization evidence.' } });
    if (result.status !== 201) throw new Error(`Owner approval for ${operation} failed with HTTP ${result.status}.`);
    return result.json.approvalId;
  };

  const organizationId = 'org-introsoft-root';
  const catalog = await request(`/commercial/catalogue?organizationId=${organizationId}`, { token });
  if (catalog.status !== 200 || !Array.isArray(catalog.json.products) || !Array.isArray(catalog.json.relationships)) throw new Error(`Authorized catalogue read failed with HTTP ${catalog.status}.`);
  const denied = await request('/commercial/catalogue?organizationId=not-in-the-commercial-scope', { token });
  if (denied.status !== 404) throw new Error(`Unknown organization catalogue scope should return 404, got ${denied.status}.`);

  const resellerName = `Phase B1 Reseller ${randomUUID().slice(0, 8)}`;
  const orgApproval = await approval(organizationId, 'ORGANIZATION_CREATE');
  const createdOrg = await request('/commercial/organizations', { method: 'POST', token, key: key(), body: { name: resellerName, organizationType: 'RESELLER', parentOrganizationId: organizationId, approvalId: orgApproval } });
  if (createdOrg.status !== 201) throw new Error(`Synthetic reseller organization creation failed with HTTP ${createdOrg.status}.`);
  const resellerOrganizationId = createdOrg.json.id;

  const products = catalog.json.products;
  const bundle = products.find(product => product.category === 'bundle');
  const bundleMember = products.find(product => product.is_active !== false && product.id !== bundle?.id && product.category !== 'bundle' && !catalog.json.relationships.some(edge => edge.sourceProductId === bundle?.id && edge.targetProductId === product.id && edge.relationshipType === 'BUNDLE_MEMBER'));
  if (!bundle || !bundleMember) throw new Error('No unused existing bundle/product pair was available for safe B1 verification.');
  const now = new Date(Date.now() - 10_000).toISOString();
  const bundleDetails = { sourceProductId: bundle.id, targetProductId: bundleMember.id, relationshipType: 'BUNDLE_MEMBER', quantity: 1, explanation: null, effectiveFrom: now, effectiveTo: null };
  const bundleApproval = await approval(organizationId, 'PRODUCT_RELATIONSHIP_CREATE', bundleDetails, bundleMember.id);
  const bundleKey = key();
  const bundleBody = { ...bundleDetails, approvalId: bundleApproval };
  const [bundleCreated, bundleRetry] = await Promise.all([
    request('/commercial/catalogue/relationships', { method: 'POST', token, key: bundleKey, body: bundleBody }),
    request('/commercial/catalogue/relationships', { method: 'POST', token, key: bundleKey, body: bundleBody }),
  ]);
  if (bundleCreated.status !== 201 || bundleRetry.status !== 201 || bundleCreated.json.id !== bundleRetry.json.id) throw new Error(`Concurrent bundle relationship retry failed (${bundleCreated.status},${bundleRetry.status}; ${bundleCreated.json.error || bundleRetry.json.error || 'response mismatch'}).`);

  const recommendationSource = products.find(product => product.category !== 'bundle' && product.id !== bundleMember.id);
  const recommendationTarget = products.find(product => product.id !== recommendationSource?.id && product.category !== 'bundle' && !catalog.json.relationships.some(edge => edge.sourceProductId === recommendationSource?.id && edge.targetProductId === product.id && edge.relationshipType === 'RECOMMENDS'));
  if (!recommendationSource || !recommendationTarget) throw new Error('No unused product pair was available for recommendation verification.');
  const recommendationDetails = { sourceProductId: recommendationSource.id, targetProductId: recommendationTarget.id, relationshipType: 'RECOMMENDS', quantity: 1, explanation: 'Synthetic test relationship; product pairing is explicit, persisted, and explainable.', effectiveFrom: now, effectiveTo: null };
  const recommendationApproval = await approval(organizationId, 'PRODUCT_RELATIONSHIP_CREATE', recommendationDetails, recommendationTarget.id);
  const recommendation = await request('/commercial/catalogue/relationships', { method: 'POST', token, key: key(), body: { ...recommendationDetails, approvalId: recommendationApproval } });
  if (recommendation.status !== 201) throw new Error(`Explainable product recommendation creation failed with HTTP ${recommendation.status}.`);

  const authStart = new Date().toISOString();
  const authDetails = { ownerOrganizationId: organizationId, resellerOrganizationId, productId: bundleMember.id, effectiveFrom: authStart, effectiveTo: null };
  const authApproval = await approval(organizationId, 'RESELLER_PRODUCT_AUTHORIZATION_CREATE', authDetails, bundleMember.id, resellerOrganizationId);
  const authKey = key();
  const authBody = { ...authDetails, approvalId: authApproval };
  const [authCreated, authRetry] = await Promise.all([
    request('/commercial/reseller-authorizations', { method: 'POST', token, key: authKey, body: authBody }),
    request('/commercial/reseller-authorizations', { method: 'POST', token, key: authKey, body: authBody }),
  ]);
  if (authCreated.status !== 201 || authRetry.status !== 201 || authCreated.json.id !== authRetry.json.id) throw new Error(`Reseller authorization retry failed (${authCreated.status},${authRetry.status}; ${authCreated.json.error || authRetry.json.error || 'response mismatch'}).`);
  const overlappingAuthorization = { ...authDetails, effectiveFrom: new Date(Date.parse(authStart) + 1_000).toISOString() };
  const overlapApproval = await approval(organizationId, 'RESELLER_PRODUCT_AUTHORIZATION_CREATE', overlappingAuthorization, bundleMember.id, resellerOrganizationId);
  const overlapResult = await request('/commercial/reseller-authorizations', { method: 'POST', token, key: key(), body: { ...overlappingAuthorization, approvalId: overlapApproval } });
  if (overlapResult.status !== 409) throw new Error(`Overlapping resale authorization should be rejected with HTTP 409, got ${overlapResult.status}.`);
  await new Promise(resolve => setTimeout(resolve, 25));

  const resellerCatalog = await request(`/commercial/catalogue?organizationId=${resellerOrganizationId}`, { token });
  if (resellerCatalog.status !== 200 || !resellerCatalog.json.products.find(product => product.id === bundleMember.id)?.resaleAuthorized || !resellerCatalog.json.relationships.some(edge => edge.id === bundleCreated.json.id && edge.relationshipType === 'BUNDLE_MEMBER') || !resellerCatalog.json.relationships.some(edge => edge.id === recommendation.json.id && edge.relationshipType === 'RECOMMENDS')) throw new Error('Explicit resale authority, bundle composition, or explainable recommendation was not reflected in the authorized catalogue.');
  const unauthorizedProduct = resellerCatalog.json.products.find(product => product.id !== bundleMember.id);
  if (unauthorizedProduct?.resaleAuthorized) throw new Error('Catalogue visibility incorrectly granted resale authority to an unauthorized product.');

  const basePrice = Number(bundleMember.price);
  const cost = Number((basePrice * 0.6).toFixed(6));
  const minimum = Number((cost * 1.05).toFixed(6));
  const priceDetails = { ownerOrganizationId: organizationId, resellerOrganizationId, productId: bundleMember.id, currency: bundleMember.currency, resellerCost: cost, minimumCustomerPrice: minimum, recommendedMarkupPercent: 50, effectiveFrom: authStart, effectiveTo: null };
  const priceApproval = await approval(organizationId, 'RESELLER_PRODUCT_PRICE_CREATE', priceDetails, bundleMember.id, resellerOrganizationId);
  const priceKey = key();
  const priceBody = { ...priceDetails, approvalId: priceApproval };
  const [priceCreated, priceRetry] = await Promise.all([
    request('/commercial/reseller-pricing', { method: 'POST', token, key: priceKey, body: priceBody }),
    request('/commercial/reseller-pricing', { method: 'POST', token, key: priceKey, body: priceBody }),
  ]);
  if (priceCreated.status !== 201 || priceRetry.status !== 201 || priceCreated.json.id !== priceRetry.json.id) throw new Error(`Reseller price retry failed (${priceCreated.status},${priceRetry.status}; ${priceCreated.json.error || priceRetry.json.error || 'response mismatch'}).`);
  const prices = await request(`/commercial/reseller-pricing?resellerOrganizationId=${resellerOrganizationId}`, { token });
  const resolvedPrice = prices.json.prices?.find(row => row.productId === bundleMember.id);
  if (prices.status !== 200 || !resolvedPrice || resolvedPrice.resellerCost !== cost || resolvedPrice.recommendedCustomerPrice < resolvedPrice.minimumCustomerPrice) throw new Error('Authorized effective reseller pricing was not resolved correctly.');

  const eventIds = [bundleCreated.json.id, recommendation.json.id, authCreated.json.id, priceCreated.json.id];
  const [rows] = await database.execute('SELECT (SELECT COUNT(*) FROM commercial_product_relationships WHERE id IN (?,?)) AS relationship_count,(SELECT COUNT(*) FROM commercial_reseller_product_authorizations WHERE id=?) AS authorization_count,(SELECT COUNT(*) FROM commercial_reseller_product_prices WHERE id=?) AS price_count,(SELECT COUNT(*) FROM commercial_evidence_approval_uses WHERE approval_id IN (?,?,?,?)) AS approval_uses,(SELECT COUNT(*) FROM commercial_idempotency_records WHERE resource_id IN (?,?,?,?)) AS completed_mutations,(SELECT COUNT(*) FROM audit_logs WHERE JSON_UNQUOTE(JSON_EXTRACT(request_payload,\'$.resourceId\')) IN (?,?,?,?)) AS audit_rows', [...eventIds.slice(0, 2), authCreated.json.id, priceCreated.json.id, bundleApproval, recommendationApproval, authApproval, priceApproval, ...eventIds, ...eventIds]);
  const counts = rows[0];
  if (Number(counts.relationship_count) !== 2 || Number(counts.authorization_count) !== 1 || Number(counts.price_count) !== 1 || Number(counts.approval_uses) !== 4 || Number(counts.completed_mutations) !== 4 || Number(counts.audit_rows) !== 4) throw new Error('Persisted B1 resource, approval-use, idempotency, or audit integrity count was not exactly one per mutation.');
  const logs = await request('/logs', { token });
  if (logs.status !== 200 || !eventIds.every(id => Array.isArray(logs.json) && logs.json.some(event => event.resourceId === id))) throw new Error(`Persisted B1 audit events were not visible through the authorized log API (HTTP ${logs.status}).`);
  console.log(JSON.stringify({ result: 'PASS', target: '127.0.0.1:3106 + 127.0.0.1:3306/altil_e2e_test', migration: '031', authenticatedRead: 'PASS', outOfScopeCatalogue: denied.status, bundleCreateAndConcurrentRetry: 'PASS', explainableRecommendation: 'PASS', resellerAuthorizationAndRetry: 'PASS', catalogueVisibilitySeparateFromResale: 'PASS', resellerPricingAndRetry: 'PASS', persistedIntegrity: counts }));
} finally { await database.end(); }
