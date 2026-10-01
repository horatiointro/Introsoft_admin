import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

dotenv.config({ quiet: true });
const baseUrl = 'http://127.0.0.1:3105/api/v1';
const databaseName = 'altil_e2e_test';
const host = process.env.MARIADB_HOST || '';
if (host !== '127.0.0.1' || process.env.DATABASE_URL?.trim() || !process.env.MARIADB_USER || !process.env.MARIADB_PASSWORD) {
  throw new Error('Phase A E2E refused: only discrete credentials for loopback altil_e2e_test are allowed.');
}

const database = await mysql.createConnection({ host, port: Number(process.env.MARIADB_PORT || 3306), user: process.env.MARIADB_USER, password: process.env.MARIADB_PASSWORD, database: databaseName, connectTimeout: 4000 });
try {
  const [target] = await database.query('SELECT DATABASE() AS database_name');
  if (target[0]?.database_name !== databaseName) throw new Error('Phase A E2E refused: connected database did not match the explicit test allowlist.');
  const [versionRows] = await database.query('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1');
  const [phaseAMigrationRows] = await database.query('SELECT version FROM schema_migrations WHERE version BETWEEN 25 AND 30 ORDER BY version');
  const latestMigration = Number(versionRows[0]?.version);
  const appliedPhaseAMigrations = new Set(phaseAMigrationRows.map(row => Number(row.version)));
  if (![25, 26, 27, 28, 29, 30].every(version => appliedPhaseAMigrations.has(version)) || !Number.isInteger(latestMigration) || latestMigration < 30) throw new Error('Phase A E2E requires migrations 025–030 on the isolated database.');
  const fixtureSuffix = randomUUID();
  const tenantId = `phase-a-e2e-${fixtureSuffix}`;
  await database.execute('INSERT INTO tenants (id,tenant_code,name,tier,region,status) VALUES (?,?,?,\'Starter\',\'local-e2e\',\'active\')', [tenantId, `PA-${fixtureSuffix.slice(0, 20)}`, `Phase A E2E ${fixtureSuffix.slice(0, 8)}`]);
  const alternateTenantId = `phase-a-e2e-other-${fixtureSuffix}`;
  await database.execute('INSERT INTO tenants (id,tenant_code,name,tier,region,status) VALUES (?,?,?,\'Starter\',\'local-e2e\',\'active\')', [alternateTenantId, `PX-${fixtureSuffix.slice(0, 20)}`, `Phase A E2E Other ${fixtureSuffix.slice(0, 8)}`]);

  async function request(path, { method = 'GET', body, key, token } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(key ? { 'Idempotency-Key': key } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const json = await response.json().catch(() => ({}));
    return { status: response.status, json };
  }

  const login = await request('/auth/login', { method: 'POST', body: { email: 'supertest@introsoft.co.za', password: 'supertest' } });
  if (login.status !== 200 || !login.json.token || !login.json.user?.roles?.includes('SUPER_ADMIN')) throw new Error(`Synthetic E2E Super Admin login failed with HTTP ${login.status}.`);
  const token = login.json.token;

  // Exercise rollback against MariaDB itself: a synthetic business write and idempotency claim
  // must both disappear when the atomic audit insert fails in this same transaction.
  const { runDurableCommercialMutation } = await import('../src/commercial/durableMutation.ts');
  const rollbackScopeId = `phase-a-rollback-${fixtureSuffix}`;
  const rollbackKey = `phase-a-rollback-${fixtureSuffix}`;
  let rollbackFailed = false;
  await database.beginTransaction();
  try {
    const failingAuditTx = {
      execute: async (sql, params = []) => {
        if (sql.startsWith('INSERT INTO audit_logs')) throw new Error('Synthetic audit insert failure.');
        return database.execute(sql, params);
      },
    };
    await runDurableCommercialMutation(failingAuditTx, {
      actorId: login.json.user.id,
      actorEmail: login.json.user.email,
      operation: 'phase-a.e2e.rollback-probe',
      resourceType: 'commercial_organization_tenant_scope',
      idempotencyKey: rollbackKey,
      fingerprintInput: { scopeId: rollbackScopeId, synthetic: true },
      audit: { category: 'AUDIT', action: 'phase-a.e2e.rollback-probe', organizationId: 'org-introsoft-root', tenantId },
    }, async () => {
      await database.execute(
        'INSERT INTO commercial_organization_tenant_scopes (id,organization_id,tenant_id,scope_link_type,status,effective_from,effective_to,created_by,updated_by) VALUES (?,?,?,\'PRIMARY\',\'ACTIVE\',NOW(3),NULL,?,?)',
        [rollbackScopeId, 'org-introsoft-root', tenantId, login.json.user.id, login.json.user.id],
      );
      return { statusCode: 201, resourceId: rollbackScopeId, body: { id: rollbackScopeId } };
    });
  } catch (error) {
    await database.rollback();
    if (!(error instanceof Error) || error.message !== 'Synthetic audit insert failure.') throw error;
    rollbackFailed = true;
  }
  if (!rollbackFailed) {
    await database.rollback();
    throw new Error('Synthetic audit failure unexpectedly committed.');
  }
  const rollbackKeyHash = createHash('sha256').update(rollbackKey).digest('hex');
  const [[rollbackIntegrity]] = await database.query(
    `SELECT
       (SELECT COUNT(*) FROM commercial_organization_tenant_scopes WHERE id=?) AS business_rows,
       (SELECT COUNT(*) FROM commercial_idempotency_records WHERE actor_id=? AND operation='phase-a.e2e.rollback-probe' AND idempotency_key_hash=?) AS idempotency_rows,
       (SELECT COUNT(*) FROM audit_logs WHERE action_type='phase-a.e2e.rollback-probe' AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.resourceId'))=?) AS audit_rows`,
    [rollbackScopeId, login.json.user.id, rollbackKeyHash, rollbackScopeId],
  );
  if (Number(rollbackIntegrity.business_rows) !== 0 || Number(rollbackIntegrity.idempotency_rows) !== 0 || Number(rollbackIntegrity.audit_rows) !== 0) throw new Error('MariaDB rollback left a business, idempotency, or audit row behind.');
  const authorization = await request('/commercial/organizations', { token });
  if (authorization.status !== 200 || !authorization.json.organizations?.some(row => row.id === 'org-introsoft-root')) throw new Error(`Authorized commercial organization read failed with HTTP ${authorization.status}.`);

  const key = () => `phase-a-${randomUUID()}`;
  async function createApproval(body, idemKey = key()) {
    const result = await request('/commercial/evidence-approvals', { method: 'POST', body, token, key: idemKey });
    const replay = await request('/commercial/evidence-approvals', { method: 'POST', body, token, key: idemKey });
    if (result.status !== 201 || replay.status !== 201 || result.json.approvalId !== replay.json.approvalId) throw new Error(`Owner approval idempotent retry failed with HTTP ${result.status}/${replay.status}.`);
    return result.json.approvalId;
  }

  const organizationApproval = await createApproval({ organizationId: 'org-introsoft-root', operation: 'ORGANIZATION_CREATE', evidenceReference: 'synthetic-e2e-organization-evidence', reason: 'Synthetic Phase A organization approval.' });
  const organizationBody = { name: `Phase A E2E Partner ${fixtureSuffix.slice(0, 8)}`, organizationType: 'PARTNER', parentOrganizationId: 'org-introsoft-root', approvalId: organizationApproval };
  const organizationKey = key();
  const organizationFirst = await request('/commercial/organizations', { method: 'POST', body: organizationBody, token, key: organizationKey });
  const organizationRetry = await request('/commercial/organizations', { method: 'POST', body: organizationBody, token, key: organizationKey });
  if (organizationFirst.status !== 201 || organizationRetry.status !== 201 || organizationFirst.json.id !== organizationRetry.json.id) throw new Error('Organization idempotent retry did not replay the same resource and status.');
  const organizationId = organizationFirst.json.id;
  const hierarchy = await request('/commercial/organizations', { token });
  if (hierarchy.status !== 200 || !hierarchy.json.organizations?.some(row => row.id === organizationId) || !hierarchy.json.relationships?.some(row => row.parent_organization_id === 'org-introsoft-root' && row.child_organization_id === organizationId)) throw new Error('Explicit organization hierarchy did not persist or was not visible in scope.');

  const customerApproval = await createApproval({ organizationId, operation: 'CUSTOMER_CREATE', evidenceReference: 'synthetic-e2e-owner-evidence', reason: 'Synthetic Phase A durability verification.' });
  const customerBody = { customerType: 'COMPANY', displayName: 'Phase A Synthetic Customer', companyName: 'Phase A Synthetic Customer Ltd', organizationId, approvalId: customerApproval };
  const customerKey = key();
  const customerFirst = await request('/commercial/customers', { method: 'POST', body: customerBody, token, key: customerKey });
  const customerRetry = await request('/commercial/customers', { method: 'POST', body: customerBody, token, key: customerKey });
  if (customerFirst.status !== 201 || customerRetry.status !== 201 || customerFirst.json.id !== customerRetry.json.id) throw new Error('Customer idempotent retry did not replay the same resource and status.');
  const changedPayload = await request('/commercial/customers', { method: 'POST', body: { ...customerBody, displayName: 'Changed Synthetic Customer' }, token, key: customerKey });
  if (changedPayload.status !== 409) throw new Error(`Changed-payload idempotency reuse should return 409, got ${changedPayload.status}.`);

  const concurrentApproval = await createApproval({ organizationId, operation: 'CUSTOMER_CREATE', evidenceReference: 'synthetic-e2e-concurrent-evidence', reason: 'Synthetic one-use approval race verification.' });
  const concurrentCustomerBody = { customerType: 'COMPANY', displayName: 'Phase A Approval Race Customer', companyName: 'Phase A Approval Race Ltd', organizationId, approvalId: concurrentApproval };
  const approvalConsumerKeys = [key(), key()];
  const [consumerA, consumerB] = await Promise.all([
    request('/commercial/customers', { method: 'POST', body: concurrentCustomerBody, token, key: approvalConsumerKeys[0] }),
    request('/commercial/customers', { method: 'POST', body: concurrentCustomerBody, token, key: approvalConsumerKeys[1] }),
  ]);
  const approvalRaceStatuses = [consumerA.status, consumerB.status].sort((a, b) => a - b);
  if (approvalRaceStatuses[0] !== 201 || approvalRaceStatuses[1] !== 409) throw new Error(`Concurrent consumers of one approval should resolve to one 201 and one 409; received ${approvalRaceStatuses.join(', ')}.`);

  const sameKeyApproval = await createApproval({ organizationId, operation: 'CUSTOMER_CREATE', evidenceReference: 'synthetic-e2e-idempotency-race', reason: 'Synthetic concurrent idempotency verification.' });
  const sameKeyBody = { customerType: 'COMPANY', displayName: 'Phase A Idempotency Race Customer', companyName: 'Phase A Idempotency Race Ltd', organizationId, approvalId: sameKeyApproval };
  const sameKey = key();
  const [retryA, retryB] = await Promise.all([
    request('/commercial/customers', { method: 'POST', body: sameKeyBody, token, key: sameKey }),
    request('/commercial/customers', { method: 'POST', body: sameKeyBody, token, key: sameKey }),
  ]);
  if (retryA.status !== 201 || retryB.status !== 201 || retryA.json.id !== retryB.json.id) throw new Error('Concurrent identical retries did not converge to the same successful customer resource.');
  const sameKeyCustomerId = retryA.json.id;

  const accountApproval = await createApproval({ organizationId, operation: 'ACCOUNT_CREATE', customerId: customerFirst.json.id, evidenceReference: 'synthetic-e2e-account-evidence', reason: 'Synthetic Phase A account approval.' });
  const accountBody = { customerId: customerFirst.json.id, accountName: 'Phase A Synthetic Billing Account', approvalId: accountApproval };
  const accountKey = key();
  const accountFirst = await request('/commercial/accounts', { method: 'POST', body: accountBody, token, key: accountKey });
  const accountRetry = await request('/commercial/accounts', { method: 'POST', body: accountBody, token, key: accountKey });
  if (accountFirst.status !== 201 || accountRetry.status !== 201 || accountFirst.json.id !== accountRetry.json.id) throw new Error('Account idempotent retry did not replay the same resource and status.');

  const legalEntityApproval = await createApproval({ organizationId, operation: 'LEGAL_ENTITY_CREATE', customerId: customerFirst.json.id, evidenceReference: 'synthetic-e2e-legal-entity-evidence', reason: 'Synthetic Phase A legal entity approval.' });
  const legalEntityBody = { customerId: customerFirst.json.id, legalName: 'Phase A Synthetic Legal Entity Ltd', jurisdiction: 'ZA', registrationReference: `SYN-${fixtureSuffix.slice(0, 12)}`, approvalId: legalEntityApproval };
  const legalEntityKey = key();
  const legalEntityFirst = await request('/commercial/legal-entities', { method: 'POST', body: legalEntityBody, token, key: legalEntityKey });
  const legalEntityRetry = await request('/commercial/legal-entities', { method: 'POST', body: legalEntityBody, token, key: legalEntityKey });
  if (legalEntityFirst.status !== 201 || legalEntityRetry.status !== 201 || legalEntityFirst.json.id !== legalEntityRetry.json.id) throw new Error('Legal entity idempotent retry did not replay the same resource and status.');

  const effectiveFrom = new Date(Date.now() - 60_000).toISOString();
  async function scopeApproval(from, targetTenantId = tenantId, scopeOrganizationId = organizationId, scopeLinkType = 'PRIMARY') {
    return createApproval({ organizationId: scopeOrganizationId, operation: 'ORGANIZATION_TENANT_SCOPE_CREATE', targetTenantId, scopeLinkType, effectiveFrom: from, effectiveTo: null, evidenceReference: 'synthetic-e2e-scope-evidence', reason: 'Synthetic Phase A technical scope owner approval.' });
  }
  const [approvalA, approvalB] = await Promise.all([scopeApproval(effectiveFrom), scopeApproval(new Date(Date.parse(effectiveFrom) + 10_000).toISOString())]);
  const scopePayload = (approvalId, from) => ({ organizationId, tenantId, scopeLinkType: 'PRIMARY', effectiveFrom: from, effectiveTo: null, approvalId });
  const scopeKeys = [key(), key()];
  const mismatchedOrganizationApproval = await request('/commercial/organization-tenant-scopes', { method: 'POST', body: { ...scopePayload(approvalA, effectiveFrom), organizationId: 'org-introsoft-root' }, token, key: key() });
  if (mismatchedOrganizationApproval.status !== 409) throw new Error(`A scope approval bound to another organization should return 409, got ${mismatchedOrganizationApproval.status}.`);
  const mismatchedTenantAuthorization = await scopeApproval(effectiveFrom);
  const mismatchedTenantApproval = await request('/commercial/organization-tenant-scopes', { method: 'POST', body: { ...scopePayload(mismatchedTenantAuthorization, effectiveFrom), tenantId: alternateTenantId }, token, key: key() });
  if (mismatchedTenantApproval.status !== 409) throw new Error(`A scope approval bound to another tenant should return 409, got ${mismatchedTenantApproval.status}.`);
  const [scopeA, scopeB] = await Promise.all([
    request('/commercial/organization-tenant-scopes', { method: 'POST', body: scopePayload(approvalA, effectiveFrom), token, key: scopeKeys[0] }),
    request('/commercial/organization-tenant-scopes', { method: 'POST', body: scopePayload(approvalB, new Date(Date.parse(effectiveFrom) + 10_000).toISOString()), token, key: scopeKeys[1] }),
  ]);
  const scopeStatuses = [scopeA.status, scopeB.status].sort((a, b) => a - b);
  if (scopeStatuses[0] !== 201 || scopeStatuses[1] !== 409) throw new Error(`Concurrent tenant ownership attempts should resolve to one 201 and one 409; received ${scopeStatuses.join(', ')}.`);
  const scopeWinnerIndex = scopeA.status === 201 ? 0 : 1;
  const scopeWinnerPayload = scopePayload(scopeWinnerIndex === 0 ? approvalA : approvalB, new Date(Date.parse(effectiveFrom) + scopeWinnerIndex * 10_000).toISOString());
  const scopeWinnerKey = scopeKeys[scopeWinnerIndex];
  const scopeWinnerId = (scopeWinnerIndex === 0 ? scopeA : scopeB).json.id;
  const scopeRetry = await request('/commercial/organization-tenant-scopes', { method: 'POST', body: scopeWinnerPayload, token, key: scopeWinnerKey });
  if (scopeRetry.status !== 201 || scopeRetry.json.id !== scopeWinnerId) throw new Error('Scope-link idempotent retry did not replay the same resource and status.');
  const competingOwnerApproval = await scopeApproval(effectiveFrom, tenantId, 'org-introsoft-root', 'PRODUCTION');
  const competingOwner = await request('/commercial/organization-tenant-scopes', { method: 'POST', body: { ...scopePayload(competingOwnerApproval, effectiveFrom), organizationId: 'org-introsoft-root', scopeLinkType: 'PRODUCTION' }, token, key: key() });
  if (competingOwner.status !== 409) throw new Error(`A second commercial organization must not own the same technical tenant for an overlapping period; got ${competingOwner.status}.`);
  const secondScopeApproval = await scopeApproval(effectiveFrom, alternateTenantId, organizationId);
  const secondOrgTenantScope = await request('/commercial/organization-tenant-scopes', { method: 'POST', body: { ...scopePayload(secondScopeApproval, effectiveFrom), tenantId: alternateTenantId }, token, key: key() });
  if (secondOrgTenantScope.status !== 201) throw new Error(`One organization should be allowed to link a second technical tenant; got ${secondOrgTenantScope.status}.`);
  const scopeRead = await request(`/commercial/organizations/${organizationId}/technical-scopes`, { token });
  if (scopeRead.status !== 200 || !scopeRead.json.technicalScopes?.some(row => row.tenant_id === tenantId) || !scopeRead.json.technicalScopes?.some(row => row.tenant_id === alternateTenantId)) throw new Error('Explicit technical scopes were not visible in their authorized organization workspace.');

  const keyHashes = [...approvalConsumerKeys, ...scopeKeys].map(value => createHash('sha256').update(value).digest('hex'));
  const [raceRecords] = await database.execute('SELECT idempotency_key_hash,state,response_status FROM commercial_idempotency_records WHERE idempotency_key_hash IN (?,?,?,?)', keyHashes);
  const raceStates = raceRecords.map(row => ({ keyHash: row.idempotency_key_hash, state: row.state, status: Number(row.response_status) }));
  for (const [response, idemKey] of [[consumerA, approvalConsumerKeys[0]], [consumerB, approvalConsumerKeys[1]], [scopeA, scopeKeys[0]], [scopeB, scopeKeys[1]]]) {
    const record = raceStates.find(item => item.keyHash === createHash('sha256').update(idemKey).digest('hex'));
    const expectedState = response.status === 201 ? 'COMPLETED' : 'FAILED';
    if (!record || record.state !== expectedState || record.status !== response.status) throw new Error('Concurrent approval/scope operation did not persist the expected idempotency state and response.');
  }

  const [integrity] = await database.query(
    `SELECT
       (SELECT COUNT(*) FROM commercial_organizations WHERE id=?) AS organization_rows,
       (SELECT COUNT(*) FROM commercial_organization_relationships WHERE child_organization_id=?) AS organization_relationship_rows,
       (SELECT COUNT(*) FROM commercial_customers WHERE id=?) AS customer_rows,
       (SELECT COUNT(*) FROM commercial_customers WHERE id=?) AS concurrent_customer_rows,
       (SELECT COUNT(*) FROM commercial_accounts WHERE id=?) AS account_rows,
       (SELECT COUNT(*) FROM commercial_legal_entities WHERE id=?) AS legal_entity_rows,
       (SELECT COUNT(*) FROM commercial_organization_tenant_scopes WHERE tenant_id=? AND status='ACTIVE' AND effective_from<=NOW(3) AND (effective_to IS NULL OR effective_to>NOW(3))) AS active_org_owner_rows,
       (SELECT COUNT(*) FROM commercial_organization_tenant_scopes WHERE tenant_id=? AND status='ACTIVE' AND effective_from<=NOW(3) AND (effective_to IS NULL OR effective_to>NOW(3))) AS second_tenant_owner_rows,
       (SELECT COUNT(*) FROM commercial_idempotency_records WHERE operation='commercial.organization.create' AND state='COMPLETED' AND resource_id=?) AS completed_organization_mutations,
       (SELECT COUNT(*) FROM commercial_idempotency_records WHERE operation='commercial.customer.create' AND state='COMPLETED' AND resource_id=?) AS completed_customer_mutations,
       (SELECT COUNT(*) FROM commercial_idempotency_records WHERE operation='commercial.customer.create' AND state='COMPLETED' AND resource_id=?) AS completed_concurrent_customer_mutations,
       (SELECT COUNT(*) FROM commercial_idempotency_records WHERE operation='commercial.account.create' AND state='COMPLETED' AND resource_id=?) AS completed_account_mutations,
       (SELECT COUNT(*) FROM commercial_idempotency_records WHERE operation='commercial.legal-entity.create' AND state='COMPLETED' AND resource_id=?) AS completed_legal_entity_mutations,
       (SELECT COUNT(*) FROM audit_logs WHERE action_type='commercial.organization.create' AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.resourceId'))=?) AS organization_audit_rows,
       (SELECT COUNT(*) FROM audit_logs WHERE action_type='commercial.customer.create' AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.resourceId'))=?) AS customer_audit_rows,
       (SELECT COUNT(*) FROM audit_logs WHERE action_type='commercial.customer.create' AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.resourceId'))=?) AS concurrent_customer_audit_rows,
       (SELECT COUNT(*) FROM audit_logs WHERE action_type='commercial.account.create' AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.resourceId'))=?) AS account_audit_rows,
       (SELECT COUNT(*) FROM audit_logs WHERE action_type='commercial.legal-entity.create' AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.resourceId'))=?) AS legal_entity_audit_rows,
       (SELECT COUNT(*) FROM audit_logs WHERE action_type='commercial.organization-tenant-scope.create' AND tenant_id=? AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.outcome'))='SUCCESS') AS scope_success_audit_rows,
       (SELECT COUNT(*) FROM audit_logs WHERE action_type='commercial.organization-tenant-scope.create' AND tenant_id=? AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.outcome'))='FAILURE') AS scope_conflict_audit_rows`,
    [organizationId, organizationId, customerFirst.json.id, sameKeyCustomerId, accountFirst.json.id, legalEntityFirst.json.id, tenantId, alternateTenantId, organizationId, customerFirst.json.id, sameKeyCustomerId, accountFirst.json.id, legalEntityFirst.json.id, organizationId, customerFirst.json.id, sameKeyCustomerId, accountFirst.json.id, legalEntityFirst.json.id, tenantId, tenantId],
  );
  if (Number(integrity[0].organization_rows) !== 1 || Number(integrity[0].organization_relationship_rows) !== 1 || Number(integrity[0].customer_rows) !== 1 || Number(integrity[0].concurrent_customer_rows) !== 1 || Number(integrity[0].account_rows) !== 1 || Number(integrity[0].legal_entity_rows) !== 1 || Number(integrity[0].active_org_owner_rows) !== 1 || Number(integrity[0].second_tenant_owner_rows) !== 1 || Number(integrity[0].completed_organization_mutations) !== 1 || Number(integrity[0].completed_customer_mutations) !== 1 || Number(integrity[0].completed_concurrent_customer_mutations) !== 1 || Number(integrity[0].completed_account_mutations) !== 1 || Number(integrity[0].completed_legal_entity_mutations) !== 1 || Number(integrity[0].organization_audit_rows) !== 1 || Number(integrity[0].customer_audit_rows) !== 1 || Number(integrity[0].concurrent_customer_audit_rows) !== 1 || Number(integrity[0].account_audit_rows) !== 1 || Number(integrity[0].legal_entity_audit_rows) !== 1 || Number(integrity[0].scope_success_audit_rows) !== 1 || Number(integrity[0].scope_conflict_audit_rows) !== 3) throw new Error('Database integrity counts did not confirm the expected resource and atomic audit records.');

  const logApi = await request('/logs', { token });
  if (logApi.status !== 200 || !Array.isArray(logApi.json)) throw new Error(`Authenticated persisted log API read failed with HTTP ${logApi.status}.`);
  const customerEvents = logApi.json.filter(row => row.action === 'commercial.customer.create' && row.resourceId === customerFirst.json.id);
  const accountEvents = logApi.json.filter(row => row.action === 'commercial.account.create' && row.resourceId === accountFirst.json.id);
  const organizationEvents = logApi.json.filter(row => row.action === 'commercial.organization.create' && row.resourceId === organizationId);
  const sameKeyCustomerEvents = logApi.json.filter(row => row.action === 'commercial.customer.create' && row.resourceId === sameKeyCustomerId);
  if (customerEvents.length !== 1 || sameKeyCustomerEvents.length !== 1 || accountEvents.length !== 1 || organizationEvents.length !== 1) throw new Error('Log API did not expose exactly one persisted event per successful idempotent create.');
  const logDirectory = path.resolve('.altil-data', 'logs');
  const eventFiles = (await readdir(logDirectory)).filter(file => /^events-[A-Za-z0-9_-]{8,80}\.ndjson$/.test(file));
  const fileEvents = (await Promise.all(eventFiles.map(async file => (await readFile(path.join(logDirectory, file), 'utf8')).split(/\r?\n/).filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return null; } })))).flat().filter(Boolean);
  if (!fileEvents.some(event => event.id === customerEvents[0].id && event.environment === 'local-test') || !fileEvents.some(event => event.id === sameKeyCustomerEvents[0].id && event.environment === 'local-test') || !fileEvents.some(event => event.id === accountEvents[0].id && event.environment === 'local-test') || !fileEvents.some(event => event.id === organizationEvents[0].id && event.environment === 'local-test')) throw new Error('Atomic audit events were not mirrored to a persisted LOCAL E2E structured log file.');

  console.log(JSON.stringify({ result: 'PASS', target: '127.0.0.1:3105 + 127.0.0.1:3306/altil_e2e_test', migration: String(latestMigration).padStart(3, '0'), authenticatedSuperAdmin: 'PASS', authorizedOrganizationRead: 'PASS', organizationCreateAndRetry: 'PASS', customerCreateSequentialAndConcurrentRetry: 'PASS', changedPayloadConflict: changedPayload.status, concurrentApprovalConsumerStatuses: approvalRaceStatuses, accountCreateAndRetry: 'PASS', legalEntityCreateAndRetry: 'PASS', mariaDbAuditFailureRollback: 'PASS', mismatchedOrganizationApproval: mismatchedOrganizationApproval.status, mismatchedTenantApproval: mismatchedTenantApproval.status, concurrentScopeOwnerStatuses: scopeStatuses, scopeIdempotentRetry: 'PASS', sameOrganizationMultipleTenants: 'PASS', competingOrganizationDenied: competingOwner.status, linkedScopeRead: 'PASS', logApi: 'PASS', localStructuredFile: 'PASS', integrityCounts: integrity[0], rollbackIntegrity }));
} finally {
  await database.end();
}
