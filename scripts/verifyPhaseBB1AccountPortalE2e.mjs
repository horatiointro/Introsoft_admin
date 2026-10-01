import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

dotenv.config();
const e2ePort = Number(process.env.ALTIL_LOCAL_E2E_PORT || '3107');
if (![3105, 3106, 3107, 3108].includes(e2ePort)) throw new Error('Refusing to use a non-allowlisted local E2E port.');
const baseUrl = `http://127.0.0.1:${e2ePort}/api/v1`;
if (process.env.MARIADB_HOST !== '127.0.0.1' || !process.env.MARIADB_USER || process.env.DATABASE_URL?.trim()) throw new Error('Refusing customer-identity E2E fixture setup outside discrete loopback database configuration.');
const testDatabase = 'altil_e2e_test';

async function request(path, token) {
  const response = await fetch(`${baseUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: response.status, json: await response.json().catch(() => ({})) };
}

const anonymous = await request('/commercial/account-portal?organizationId=org-introsoft-root');
if (anonymous.status !== 401) throw new Error(`Anonymous account-portal access should return 401, got ${anonymous.status}.`);

const loginResponse = await fetch(`${baseUrl}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'supertest@introsoft.co.za', password: 'supertest' }),
});
const login = await loginResponse.json().catch(() => ({}));
if (loginResponse.status !== 200 || !login.token || !login.user?.roles?.includes('SUPER_ADMIN')) throw new Error(`Synthetic local E2E login failed with HTTP ${loginResponse.status}.`);
const token = login.token;

const invalid = await request('/commercial/account-portal?organizationId=org-introsoft-root&customerId=not-used', token);
if (invalid.status !== 400) throw new Error(`Supplying both account identifiers should return 400, got ${invalid.status}.`);
const outOfScope = await request('/commercial/account-portal?organizationId=account-portal-out-of-scope', token);
if (outOfScope.status !== 404) throw new Error(`Out-of-scope account access should return 404, got ${outOfScope.status}.`);

const organizations = await request('/commercial/organizations', token);
if (organizations.status !== 200 || !organizations.json.organizations?.some(row => row.id === 'org-introsoft-root')) throw new Error(`Authorized organization list failed with HTTP ${organizations.status}.`);
const organization = await request('/commercial/account-portal?organizationId=org-introsoft-root', token);
if (organization.status !== 200 || organization.json.accountType !== 'ORGANIZATION' || organization.json.account?.id !== 'org-introsoft-root') throw new Error(`Authorized organization portal failed with HTTP ${organization.status}.`);
if (!Array.isArray(organization.json.relationships) || !Array.isArray(organization.json.customers) || !Array.isArray(organization.json.technicalScopes)) throw new Error('Organization portal omitted explicit relationship collections.');
if (organization.json.financials?.availability === 'AVAILABLE' && (!Array.isArray(organization.json.financials.invoices) || !Array.isArray(organization.json.financials.paymentIntents))) throw new Error('Authorized financial summary shape is invalid.');
if (JSON.stringify(organization.json).includes('contact_json') || JSON.stringify(organization.json).includes('registration_reference')) throw new Error('Portal response exposed raw contact or legal registration fields.');
if (organization.json.financials?.bankCashEvidence !== 'NOT_AVAILABLE') throw new Error('Portal must not claim bank-cash evidence.');

const customers = await request('/commercial/customers', token);
if (customers.status !== 200 || !Array.isArray(customers.json.customers)) throw new Error(`Authorized commercial customer list failed with HTTP ${customers.status}.`);
let customerVerified = false;
if (customers.json.customers.length) {
  const customerId = customers.json.customers[0].id;
  const customer = await request(`/commercial/account-portal?customerId=${encodeURIComponent(customerId)}`, token);
  if (customer.status !== 200 || customer.json.accountType !== 'CUSTOMER' || customer.json.account?.id !== customerId) throw new Error(`Authorized customer portal failed with HTTP ${customer.status}.`);
  if (customer.json.financials?.availability === 'AVAILABLE' && !customer.json.relationships.some(row => row.organization_id)) throw new Error('Customer finance was returned without an explicit organization relationship.');
  if (customer.json.financials?.availability === 'NOT_LINKED' && customer.json.financials.invoices?.length) throw new Error('Customer finance was populated without a commercial-to-technical link.');
  customerVerified = true;
}
const customerOutOfScope = await request('/commercial/account-portal?customerId=account-portal-out-of-scope', token);
if (customerOutOfScope.status !== 404) throw new Error(`Out-of-scope customer access should return 404, got ${customerOutOfScope.status}.`);

const key = () => `phase-b1-portal-${randomUUID()}`;
const ownerApproval = async (organizationId, operation, extra = {}) => {
  const result = await fetch(`${baseUrl}/commercial/evidence-approvals`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key() }, body: JSON.stringify({ organizationId, operation, evidenceReference: `synthetic-portal-${randomUUID()}`, reason: 'Synthetic isolated account portal verification.', ...extra }) });
  const json = await result.json().catch(() => ({}));
  if (result.status !== 201) throw new Error(`Synthetic ${operation} evidence approval failed with HTTP ${result.status}: ${json.error || 'no safe error summary'}.`);
  return json.approvalId;
};
const createCustomer = async (organizationId, type) => {
  const suffix = randomUUID().slice(0, 8);
  const approvalId = await ownerApproval(organizationId, 'CUSTOMER_CREATE');
  const body = type === 'INDIVIDUAL'
    ? { organizationId, approvalId, customerType: type, displayName: `Portal Individual ${suffix}`, individualGivenName: 'Portal', individualFamilyName: suffix, contact: { email: `portal-${suffix}@example.test`, notificationPreferences: { invoiceEmails: true, paymentReminders: true } } }
    : { organizationId, approvalId, customerType: type, displayName: `Portal Company ${suffix}`, companyName: `Portal Company ${suffix}`, contact: { email: `accounts-${suffix}@example.test`, registeredAddress: { country: 'ZA' } } };
  const response = await fetch(`${baseUrl}/commercial/customers`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key() }, body: JSON.stringify(body) });
  const json = await response.json().catch(() => ({}));
  if (response.status !== 201) throw new Error(`Synthetic ${type} customer creation failed with HTTP ${response.status}.`);
  return json.id;
};

const individualId = await createCustomer('org-introsoft-root', 'INDIVIDUAL');
const individualPortal = await request(`/commercial/account-portal?customerId=${encodeURIComponent(individualId)}`, token);
if (individualPortal.status !== 200 || individualPortal.json.account?.customer_type !== 'INDIVIDUAL' || individualPortal.json.financials?.availability !== 'NOT_LINKED' || individualPortal.json.catalogue?.availability !== 'AVAILABLE' || !individualPortal.json.catalogue.products.some(product => product.id === 'prod-ai-seat')) throw new Error(`Direct individual portal scenario failed: HTTP ${individualPortal.status}, accountType=${individualPortal.json.accountType || 'missing'}, financial=${individualPortal.json.financials?.availability || 'missing'}, catalogue=${individualPortal.json.catalogue?.availability || 'missing'}, productCount=${individualPortal.json.catalogue?.products?.length || 0}, error=${individualPortal.json.error || 'none'}.`);
const profileBody = { displayName: individualPortal.json.account.display_name, individualGivenName: 'Portal Updated', individualFamilyName: 'Individual', contact: { email: individualPortal.json.account.contact.email, notificationPreferences: { invoiceEmails: false, paymentReminders: true, productUpdates: false } } };
const profileKey = key();
const profilePath = `/commercial/account-portal/profile?customerId=${encodeURIComponent(individualId)}`;
const profileUpdate = await fetch(`${baseUrl}${profilePath}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': profileKey }, body: JSON.stringify(profileBody) });
const profileJson = await profileUpdate.json().catch(() => ({}));
const profileReplay = await fetch(`${baseUrl}${profilePath}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': profileKey }, body: JSON.stringify(profileBody) });
const replayJson = await profileReplay.json().catch(() => ({}));
if (profileUpdate.status !== 200 || profileReplay.status !== 200 || profileJson.accountId !== individualId || replayJson.accountId !== individualId) throw new Error('Profile update or idempotent retry did not return the same persisted account result.');
const conflictingProfile = await fetch(`${baseUrl}${profilePath}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': profileKey }, body: JSON.stringify({ ...profileBody, individualGivenName: 'Conflicting payload' }) });
if (conflictingProfile.status !== 409) throw new Error(`Changed payload with the same idempotency key should return 409, got ${conflictingProfile.status}.`);
const forbiddenProfile = await fetch(`${baseUrl}${profilePath}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key() }, body: JSON.stringify({ ...profileBody, roles: ['SUPER_ADMIN'] }) });
if (forbiddenProfile.status !== 400) throw new Error(`Mass-assignment profile field should return 400, got ${forbiddenProfile.status}.`);
const updatedPortal = await request(`/commercial/account-portal?customerId=${encodeURIComponent(individualId)}`, token);
if (updatedPortal.status !== 200 || updatedPortal.json.account.individual_given_name !== 'Portal Updated' || updatedPortal.json.account.contact.notificationPreferences.invoiceEmails !== false || !updatedPortal.json.activity?.some(event => event.action === 'commercial.account-profile.update')) throw new Error('Profile fields/preferences or persisted audit activity did not appear on the account portal.');

const companyId = await createCustomer('org-introsoft-root', 'COMPANY');
const companyPortal = await request(`/commercial/account-portal?customerId=${encodeURIComponent(companyId)}`, token);
if (companyPortal.status !== 200 || companyPortal.json.account?.customer_type !== 'COMPANY' || !companyPortal.json.account?.company_name) throw new Error('Company customer portal scenario failed.');

// Create a synthetic tenantless IAM identity only inside the hard-coded isolated E2E database.
const accountApprovalId = await ownerApproval('org-introsoft-root', 'ACCOUNT_CREATE', { customerId: individualId });
const accountResponse = await fetch(`${baseUrl}/commercial/accounts`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key() }, body: JSON.stringify({ customerId: individualId, accountName: `Portal individual account ${randomUUID().slice(0, 8)}`, approvalId: accountApprovalId }) });
const account = await accountResponse.json().catch(() => ({}));
if (accountResponse.status !== 201 || !account.id) throw new Error(`Direct customer account creation failed with HTTP ${accountResponse.status}.`);
const identityEmail = `b1-customer-${randomUUID()}@example.test`;
const identityPassword = randomBytes(24).toString('base64url');
let customerToken = '';
const testConnection = await mysql.createConnection({ host: process.env.MARIADB_HOST, port: Number(process.env.MARIADB_PORT || '3306'), user: process.env.MARIADB_USER, password: process.env.MARIADB_PASSWORD || '', database: testDatabase, connectTimeout: 4000 });
try {
  const [databaseRows] = await testConnection.query('SELECT DATABASE() AS selected_database');
  if (databaseRows[0]?.selected_database !== testDatabase) throw new Error('Customer identity E2E refused an unexpected database.');
  const iamUserId = `b1-customer-${randomUUID()}`;
  const passwordHash = await bcrypt.hash(identityPassword, 10);
  await testConnection.execute("INSERT INTO iam_users (id,tenant_id,email,password_hash,first_name,last_name,department,status,mfa_enabled,mfa_enforced,force_password_change,password_changed_at,created_by) VALUES (?,NULL,?,?,?,?,'LOCAL E2E CUSTOMER','ACTIVE',0,0,0,NOW(),'LOCAL_E2E_FIXTURE')", [iamUserId, identityEmail, passwordHash, 'Portal', 'Customer']);
  const effectiveFrom = new Date(Date.now() - 1000).toISOString();
  const requestedDetails = { accountId: account.id, userId: iamUserId, relationshipType: 'PRIMARY_CONTACT', effectiveFrom, effectiveTo: null };
  const identityEvidenceReference = `synthetic-identity-proof-${randomUUID()}`;
  const approvalId = await ownerApproval('org-introsoft-root', 'CUSTOMER_IAM_LINK', { customerId: individualId, requestedDetails, evidenceReference: identityEvidenceReference });
  const linkResponse = await fetch(`${baseUrl}/commercial/account-portal/identity-links`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key() }, body: JSON.stringify({ accountId: account.id, customerId: individualId, userId: iamUserId, relationshipType: 'PRIMARY_CONTACT', approvalId, evidenceReference: identityEvidenceReference, effectiveFrom, effectiveTo: null }) });
  const link = await linkResponse.json().catch(() => ({}));
  if (linkResponse.status !== 201 || link.userId !== iamUserId) throw new Error(`Customer IAM binding failed with HTTP ${linkResponse.status}: ${link.error || 'no safe error summary'}.`);
  const customerLoginResponse = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: identityEmail, password: identityPassword }) });
  const customerLogin = await customerLoginResponse.json().catch(() => ({}));
  if (customerLoginResponse.status !== 200 || !customerLogin.token || customerLogin.user?.roles?.length !== 1 || customerLogin.user.roles[0] !== 'CUSTOMER_ACCOUNT_USER') throw new Error(`Normal customer IAM login failed with HTTP ${customerLoginResponse.status}.`);
  customerToken = customerLogin.token;
  const ownAccount = await request('/commercial/account-portal', customerToken);
  if (ownAccount.status !== 200 || ownAccount.json.account?.id !== individualId || ownAccount.json.account?.commercialAccountId !== account.id || ownAccount.json.catalogue?.availability !== 'AVAILABLE') throw new Error(`Customer self-portal did not return only its linked account: HTTP ${ownAccount.status}.`);
  if ((await request(`/commercial/account-portal?customerId=${encodeURIComponent(companyId)}`, customerToken)).status !== 404) throw new Error('Customer identity accessed an unrelated customer account.');
  if ((await request('/commercial/account-portal?organizationId=org-introsoft-root', customerToken)).status !== 404) throw new Error('Customer identity accessed an organization account.');
  if ((await request('/tenant-portal/unrelated-tenant-e2e', customerToken)).status === 200) throw new Error('Customer identity accessed an unrelated technical tenant.');
  if ((await request('/commercial/organizations', customerToken)).status !== 403) throw new Error('Customer identity unexpectedly received the operator organization list.');
  if ((await request('/applications', customerToken)).status !== 403 || (await request('/api-keys', customerToken)).status !== 403) throw new Error('Customer account relationship unexpectedly granted technical application or credential access.');
  const selfProfile = await fetch(`${baseUrl}/commercial/account-portal/profile`, { method: 'PATCH', headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json', 'Idempotency-Key': key() }, body: JSON.stringify({ individualGivenName: 'Customer Updated' }) });
  if (selfProfile.status !== 200) throw new Error(`Bound customer could not edit own profile: HTTP ${selfProfile.status}.`);

  // Exercise audit failure through the real authenticated profile route. The
  // temporary trigger is confined to altil_e2e_test and is always removed.
  const rollbackKey = key();
  const rollbackValue = `Rollback ${randomUUID().slice(0, 8)}`;
  const rollbackRequest = () => fetch(`${baseUrl}/commercial/account-portal/profile`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json', 'Idempotency-Key': rollbackKey },
    body: JSON.stringify({ individualGivenName: rollbackValue }),
  });
  const rollbackKeyHash = createHash('sha256').update(rollbackKey).digest('hex');
  const [profileBeforeRows] = await testConnection.execute('SELECT individual_given_name FROM commercial_customers WHERE id=?', [individualId]);
  let canInjectAuditFailure = true;
  try {
    await testConnection.query(`CREATE TRIGGER b1_force_profile_audit_failure BEFORE INSERT ON audit_logs FOR EACH ROW BEGIN IF NEW.action_type = 'commercial.account-profile.update' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'B1 isolated audit failure injection'; END IF; END`);
  } catch (error) {
    if ((error)?.code !== 'ER_BINLOG_CREATE_ROUTINE_NEED_SUPER') throw error;
    canInjectAuditFailure = false;
  }
  if (canInjectAuditFailure) {
    let auditFailureStatus = 0;
    try { auditFailureStatus = (await rollbackRequest()).status; }
    finally { await testConnection.query('DROP TRIGGER IF EXISTS b1_force_profile_audit_failure'); }
    const [[profileAfterFailureRows], [rollbackStateRows]] = await Promise.all([
      testConnection.execute('SELECT individual_given_name FROM commercial_customers WHERE id=?', [individualId]),
      testConnection.execute('SELECT (SELECT COUNT(*) FROM commercial_idempotency_records WHERE actor_id=? AND operation=? AND idempotency_key_hash=?) AS idempotency_rows,(SELECT COUNT(*) FROM audit_logs WHERE action_type=? AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,\'$.resourceId\'))=?) AS audit_rows', [iamUserId, 'commercial.account-profile.update', rollbackKeyHash, 'commercial.account-profile.update', individualId]),
    ]);
    if (auditFailureStatus !== 503 || profileAfterFailureRows[0]?.individual_given_name !== profileBeforeRows[0]?.individual_given_name || Number(rollbackStateRows[0]?.idempotency_rows) !== 0 || Number(rollbackStateRows[0]?.audit_rows) !== 0) {
      throw new Error('Real profile-route audit failure did not roll back the profile, idempotency result, and audit record together.');
    }
    const auditRetry = await rollbackRequest();
    const auditRetryJson = await auditRetry.json().catch(() => ({}));
    const [[profileAfterRetryRows], [retryStateRows]] = await Promise.all([
      testConnection.execute('SELECT individual_given_name FROM commercial_customers WHERE id=?', [individualId]),
      testConnection.execute('SELECT (SELECT COUNT(*) FROM commercial_idempotency_records WHERE actor_id=? AND operation=? AND idempotency_key_hash=? AND state=\'COMPLETED\') AS idempotency_rows,(SELECT COUNT(*) FROM audit_logs WHERE action_type=? AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,\'$.resourceId\'))=?) AS audit_rows', [iamUserId, 'commercial.account-profile.update', rollbackKeyHash, 'commercial.account-profile.update', individualId]),
    ]);
    if (auditRetry.status !== 200 || auditRetryJson.accountId !== individualId || profileAfterRetryRows[0]?.individual_given_name !== rollbackValue || Number(retryStateRows[0]?.idempotency_rows) !== 1 || Number(retryStateRows[0]?.audit_rows) < 1) {
      throw new Error('Retry after profile-route audit failure did not commit profile, audit, and idempotency state exactly once.');
    }
    console.log('Actual profile-route audit insertion failure: PASS (mutation and idempotency rolled back, audit absent, retry committed).');
  } else {
    console.log('Actual profile-route audit insertion failure: BLOCKED (isolated DB account cannot create the required temporary trigger while binary logging is enabled; no global DB setting was changed).');
  }
} finally { await testConnection.end(); }

const resellerChoice = organizations.json.organizations.find(row => row.organization_type === 'RESELLER');
if (resellerChoice) {
  const resellerCustomerId = await createCustomer(resellerChoice.id, 'COMPANY');
  const resellerCustomerPortal = await request(`/commercial/account-portal?customerId=${encodeURIComponent(resellerCustomerId)}`, token);
  if (resellerCustomerPortal.status !== 200 || !resellerCustomerPortal.json.relationships.some(row => row.organization_id === resellerChoice.id)) throw new Error('Explicit reseller-owned customer portal scenario failed.');
  const resellerAccountPortal = await request(`/commercial/account-portal?organizationId=${encodeURIComponent(resellerChoice.id)}`, token);
  if (resellerAccountPortal.status !== 200 || !resellerAccountPortal.json.customers.some(row => row.id === resellerCustomerId)) throw new Error('Reseller portal did not restrict its customer view to explicitly linked customer records.');
  if ((await request(`/commercial/account-portal?customerId=${encodeURIComponent(resellerCustomerId)}`, customerToken)).status !== 404) throw new Error('Customer identity accessed a reseller-owned customer account without its own binding.');
}

console.log('Phase B1 account portal E2E passed against the isolated LOCAL E2E server.');
console.log(`Organization portal: HTTP ${organization.status}; financial visibility=${organization.json.financials?.availability}.`);
console.log(`Authorized customer portal exercised: ${customerVerified ? 'yes' : 'no authorized commercial customer records were available'}.`);
console.log('Anonymous access: 401; invalid selection: 400; out-of-scope organization/customer: 404.');
console.log(`Individual portal/catalogue/profile/audit/idempotency: PASS (${individualId}); company portal: PASS (${companyId}); reseller customer scope: ${resellerChoice ? 'PASS' : 'NOT PRESENT IN TEST FIXTURE'}.`);
console.log('Customer IAM binding/normal login/own account isolation/no technical application or API-key access: PASS (tenantless synthetic identity; altil_e2e_test only).');
