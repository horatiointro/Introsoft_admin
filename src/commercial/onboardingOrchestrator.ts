import bcrypt from 'bcryptjs';
import crypto, { createHash, randomBytes, randomUUID } from 'node:crypto';
import { executeQuery, withMariaDbTransaction } from '../db/mariadb';
import { CommercialMutationError, runDurableCommercialMutation, type CommercialMutationSql } from './durableMutation';
import { emitAltilEvent } from '../logging/eventLogger';

export interface CommercialOnboardingInput {
  // 1. Relationship & Upline
  relationshipType?: 'SUBSIDIARY' | 'PARTNER' | 'RESELLER' | 'DIRECT_CLIENT' | 'DIRECT_CUSTOMER';
  parentOrganizationId?: string;

  // 2. Organization & Customer Details
  organizationName: string;
  customerType?: 'company' | 'individual';
  displayName?: string;
  legalName?: string;
  registrationNumber?: string;
  taxVatNumber?: string;
  country?: string;
  industry?: string;

  // 3. Primary Administrator
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone?: string;
  adminDesignation?: string;

  // 4. Governance / Statutory Officers (Optional)
  informationOfficer?: {
    name: string;
    email: string;
    phone?: string;
    designation?: string;
    registrationNumber?: string;
    deputyOfficerName?: string;
    deputyOfficerEmail?: string;
  };
  dataProtectionOfficer?: {
    name: string;
    email: string;
    phone?: string;
    dpoType?: 'internal' | 'external_counsel';
    leadSupervisoryAuthority?: string;
    registrationNumber?: string;
  };

  // 5. Commercial Terms & Pricing
  tier?: 'starter' | 'growth' | 'scale' | 'enterprise';
  currency?: string;
  monthlyBudgetUsd?: number;
  rateLimitRpm?: number;
  rateLimitTpm?: number;
  billingCycle?: 'monthly' | 'annual' | 'quarterly';
  invoiceDay?: number;
  notes?: string;

  // 6. Selected Products & Orders
  selectedProductIds?: string[];
  licensingPlanId?: string;
  licenseExpiryOption?: '30d' | '60d' | '90d' | '12m' | 'never';

  // 7. Initial Application
  initialApplicationName?: string;
  initialApplicationCode?: string;
  capabilityType?: string;

  // 8. Initial API Key
  apiKeyName?: string;
  apiKeyScopes?: string[];
  rateLimitKeyRpm?: number;
}

export interface OnboardingOrchestrationResult {
  success: boolean;
  message: string;
  organization: {
    id: string;
    name: string;
    type: string;
    parentId: string | null;
  };
  customer: {
    id: string;
    displayName: string;
    type: string;
    legalEntityId?: string;
  };
  tenant: {
    id: string;
    code: string;
    name: string;
    tier: string;
  };
  account: {
    id: string;
    name: string;
  };
  primaryAdmin: {
    id: string;
    email: string;
    name: string;
    invitationToken: string;
    activationUrl: string;
  };
  application: {
    id: string;
    name: string;
    code: string;
  };
  apiKey: {
    id: string;
    name: string;
    prefix: string;
    rawSecretKey: string;
    scopes: string[];
  };
  order: {
    id: string;
    orderNumber: string;
    total: number;
    currency: string;
  } | null;
  license: {
    id: string;
    planId: string;
    status: string;
  } | null;
  certificateSummary: {
    timestamp: string;
    certificateId: string;
    certifiedBy: string;
    provenance: string;
  };
}

export async function orchestrateCommercialOnboarding(
  actor: { id: string; email: string; roles: string[]; tenantId?: string | null },
  input: CommercialOnboardingInput,
  originBaseUrl: string = 'http://localhost:3000'
): Promise<OnboardingOrchestrationResult> {
  // Validate mandatory fields
  const orgName = (input.organizationName || input.displayName || '').trim();
  if (!orgName) throw new CommercialMutationError(400, 'Organization or customer name is required.');

  const adminEmail = (input.adminEmail || '').trim().toLowerCase();
  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new CommercialMutationError(400, 'A valid primary administrator email address is required.');
  }

  const adminFirst = (input.adminFirstName || 'Admin').trim();
  const adminLast = (input.adminLastName || 'User').trim();
  const relationshipType = (input.relationshipType || 'DIRECT_CUSTOMER').toUpperCase();
  const customerType = (input.customerType || 'company').toUpperCase() === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'COMPANY';
  const tier = input.tier || 'growth';
  const currency = (input.currency || 'USD').toUpperCase();
  const rpm = input.rateLimitRpm || (tier === 'enterprise' ? 5000 : tier === 'scale' ? 1000 : tier === 'growth' ? 240 : 60);
  const tpm = input.rateLimitTpm || (tier === 'enterprise' ? 2000000 : tier === 'scale' ? 1000000 : 250000);
  const budget = input.monthlyBudgetUsd || (tier === 'enterprise' ? 25000 : tier === 'scale' ? 10000 : tier === 'growth' ? 2500 : 500);
  const invoiceDay = Math.min(31, Math.max(1, input.invoiceDay || 24));

  // Determine parent organization
  let parentOrgId = input.parentOrganizationId?.trim() || null;

  // Run in a single, robust MariaDB transaction with atomic rollback
  const result = await withMariaDbTransaction(async (connection) => {
    // 1. Resolve Root or Parent Organization if none supplied
    if (!parentOrgId) {
      const [roots] = await connection.execute<any[]>(
        "SELECT id FROM commercial_organizations WHERE canonical_key='INTROSOFT_ROOT' OR organization_type='INTROSOFT' LIMIT 1"
      );
      if (roots.length > 0) {
        parentOrgId = roots[0].id;
      } else {
        const [anyOrg] = await connection.execute<any[]>("SELECT id FROM commercial_organizations ORDER BY created_at ASC LIMIT 1");
        parentOrgId = anyOrg[0]?.id || 'org-introsoft-root';
      }
    }

    // 2. Generate clean, identifiable UUIDs for all artifacts
    const orgId = `org-${randomUUID()}`;
    const custId = `cust-${randomUUID()}`;
    const tenantId = `tenant-${randomUUID()}`;
    const accountId = `acct-${randomUUID()}`;
    const legalId = input.legalName?.trim() || input.registrationNumber?.trim() ? `legal-${randomUUID()}` : null;
    const appId = `app-${randomUUID()}`;
    const keyId = `key-${randomUUID()}`;
    const userId = `usr-${randomUUID()}`;
    const invId = `inv-${randomUUID()}`;
    const now = new Date();
    const nowIso = now.toISOString();

    const tenantCode = `TEN-${orgName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'ALTIL'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const appCode = input.initialApplicationCode?.trim() || `APP-${Math.floor(100000 + Math.random() * 900000)}`;
    const appName = input.initialApplicationName?.trim() || `${orgName} AI Ingress`;

    // 3. Create Commercial Organization
    await connection.execute(
      `INSERT INTO commercial_organizations (id, name, organization_type, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, 'ACTIVE', ?, NOW(3), NOW(3))`,
      [orgId, orgName, relationshipType === 'SUBSIDIARY' ? 'SUBSIDIARY' : relationshipType === 'PARTNER' || relationshipType === 'RESELLER' ? 'PARTNER' : 'CUSTOMER', actor.id]
    );

    // 4. Create Parent-Child Organization Relationship
    if (parentOrgId) {
      const orgRelId = `orgrel-${randomUUID()}`;
      await connection.execute(
        `INSERT INTO commercial_organization_relationships
         (id, parent_organization_id, child_organization_id, relationship_type, status, effective_from, created_by, created_at)
         VALUES (?, ?, ?, ?, 'ACTIVE', NOW(3), ?, NOW(3))`,
        [orgRelId, parentOrgId, orgId, relationshipType, actor.id]
      );
    }

    // 5. Create Commercial Customer
    const contactJson = JSON.stringify({
      name: `${adminFirst} ${adminLast}`.trim(),
      email: adminEmail,
      phone: input.adminPhone || null,
      role: input.adminDesignation || 'Primary Administrator',
      country: input.country || 'South Africa',
      industry: input.industry || 'General Business',
      statutoryOfficers: {
        informationOfficer: input.informationOfficer || null,
        dataProtectionOfficer: input.dataProtectionOfficer || null
      }
    });

    await connection.execute(
      `INSERT INTO commercial_customers
       (id, customer_type, display_name, company_name, individual_given_name, individual_family_name, contact_json, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, NOW(3), NOW(3))`,
      [custId, customerType, orgName, customerType === 'COMPANY' ? (input.legalName || orgName) : null, customerType === 'INDIVIDUAL' ? adminFirst : null, customerType === 'INDIVIDUAL' ? adminLast : null, contactJson, actor.id]
    );

    // 6. Link Customer to Organization
    const custOrgRelId = `custorg-${randomUUID()}`;
    await connection.execute(
      `INSERT INTO commercial_customer_organization_relationships
       (id, customer_id, organization_id, relationship_type, status, effective_from, created_by, created_at)
       VALUES (?, ?, ?, 'CUSTOMER_OWNER', 'ACTIVE', NOW(3), ?, NOW(3))`,
      [custOrgRelId, custId, orgId, actor.id]
    );

    // 7. Create Legal Entity (if details provided)
    if (legalId && input.legalName?.trim()) {
      const jurisdiction = (input.country?.includes('South Africa') ? 'ZA' : 'US').slice(0, 2);
      await connection.execute(
        `INSERT INTO commercial_legal_entities
         (id, customer_id, organization_id, legal_name, jurisdiction, registration_reference, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, NOW(3), NOW(3))`,
        [legalId, custId, orgId, input.legalName.trim(), jurisdiction, input.registrationNumber?.trim() || null, actor.id]
      );
    }

    // 8. Create Commercial Account
    await connection.execute(
      `INSERT INTO commercial_accounts
       (id, customer_id, legal_entity_id, account_name, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', ?, NOW(3), NOW(3))`,
      [accountId, custId, legalId, `${orgName} Billing Account`, actor.id]
    );

    // 9. Create Technical Tenant in `tenants`
    await connection.execute(
      `INSERT INTO tenants
       (id, tenant_code, name, tier, region, popia_compliant, max_rpm, max_tpm, status, invoice_day, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'South Africa (af-south-1)', 1, ?, ?, 'active', ?, NOW(3), NOW(3))`,
      [tenantId, tenantCode, orgName, tier.charAt(0).toUpperCase() + tier.slice(1), rpm, tpm, invoiceDay]
    );

    // 10. Link Tenant to Organization & Customer
    const orgScopeId = `orgscope-${randomUUID()}`;
    await connection.execute(
      `INSERT INTO commercial_organization_tenant_scopes
       (id, organization_id, tenant_id, scope_link_type, status, effective_from, created_by, created_at)
       VALUES (?, ?, ?, 'PRIMARY', 'ACTIVE', NOW(3), ?, NOW(3))`,
      [orgScopeId, orgId, tenantId, actor.id]
    );

    const custTenantLinkId = `custlink-${randomUUID()}`;
    await connection.execute(
      `INSERT INTO commercial_customer_tenant_links
       (id, customer_id, tenant_id, account_id, status, effective_from, evidence_reference, approved_by, created_by, created_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', NOW(3), 'ONBOARDING_WIZARD_ACTIVATION', ?, ?, NOW(3))`,
      [custTenantLinkId, custId, tenantId, accountId, actor.id, actor.id]
    );

    // 11. Provision Primary Administrator User
    // Use temporary secure hash; user will activate via single-use invitation token
    const tempPassword = `AltilPass#${randomBytes(4).toString('hex')}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Check if email already exists
    const [existingUsers] = await connection.execute<any[]>("SELECT id FROM iam_users WHERE email=?", [adminEmail]);
    let primaryUserId = userId;
    if (existingUsers.length > 0) {
      primaryUserId = existingUsers[0].id;
      await connection.execute("UPDATE iam_users SET tenant_id=? WHERE id=?", [tenantId, primaryUserId]);
    } else {
      await connection.execute(
        `INSERT INTO iam_users
         (id, tenant_id, email, password_hash, first_name, last_name, department, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, NOW(3), NOW(3))`,
        [primaryUserId, tenantId, adminEmail, passwordHash, adminFirst, adminLast, input.adminDesignation || 'Management', actor.id]
      );
    }

    // 12. Assign IAM Roles to Primary Admin
    const userRoleId = `ur-${randomUUID()}`;
    await connection.execute(
      `INSERT IGNORE INTO iam_user_roles (id, user_id, role_id, tenant_id, assigned_by, access_scope)
       VALUES (?, ?, 'role_tenant_admin', ?, ?, 'ORGANISATION')`,
      [userRoleId, primaryUserId, tenantId, actor.id]
    );

    // Also link commercial account IAM relationship
    const acctIamRelId = `acctiam-${randomUUID()}`;
    await connection.execute(
      `INSERT IGNORE INTO commercial_account_iam_relationships
       (id, account_id, user_id, relationship_type, status, effective_from, audit_reference, created_by, created_at, updated_at)
       VALUES (?, ?, ?, 'ACCOUNT_ADMINISTRATOR', 'ACTIVE', NOW(3), 'ONBOARDING_WIZARD', ?, NOW(3), NOW(3))`,
      [acctIamRelId, accountId, primaryUserId, actor.id]
    );

    // 13. Generate One-Time Administrator Activation Token
    const rawInvitationToken = `altil_act_${randomBytes(24).toString('hex')}`;
    const tokenHash = createHash('sha256').update(rawInvitationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await connection.execute(
      `INSERT INTO iam_user_invitations (id, user_id, token_hash, expires_at, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, NOW(3))`,
      [invId, primaryUserId, tokenHash, expiresAt, actor.id]
    );

    // 14. Create Tenant Application
    await connection.execute(
      `INSERT INTO tenant_applications
       (id, tenant_id, app_code, name, description, capability_type, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(3))`,
      [appId, tenantId, appCode, appName, `Primary AI Ingress Application for ${orgName}`, input.capabilityType || 'General_AI']
    );

    // 15. Issue Initial API Gateway Key
    const keyPrefix = `ALTIL_${orgName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'LIVE'}`;
    const rawApiKeySecret = `${keyPrefix}_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawApiKeySecret).digest('hex');
    const scopes = input.apiKeyScopes?.length ? input.apiKeyScopes : ['inference:chat', 'inference:stream', 'models:read', 'policies:enforce'];
    const keyMetadata = JSON.stringify({
      keyName: input.apiKeyName || 'Primary Production Key',
      scopes,
      rateLimitRpm: input.rateLimitKeyRpm || rpm,
      expiresInDays: 365,
      ipWhitelist: [],
      createdBy: actor.email,
      createdDate: nowIso.slice(0, 10)
    });

    await connection.execute(
      `INSERT INTO tenant_api_keys
       (id, tenant_id, application_id, key_hash, key_prefix, status, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, NOW(3), NOW(3))`,
      [keyId, tenantId, appId, keyHash, keyPrefix, keyMetadata]
    );

    // 16. If licensing plan specified, assign it
    let licenseResult: { id: string; planId: string; status: string } | null = null;
    const planId = input.licensingPlanId || (tier === 'enterprise' ? 'plan-clinical-annual' : tier === 'scale' ? 'plan-scale-1m' : 'plan-team-100k');
    if (planId) {
      const licId = `lic-${randomUUID()}`;
      const expiryOpt = input.licenseExpiryOption || '12m';
      const renewalExpr = expiryOpt === 'never' ? "DATE_ADD(NOW(3), INTERVAL 50 YEAR)" : (expiryOpt === '30d' ? "DATE_ADD(NOW(3), INTERVAL 30 DAY)" : expiryOpt === '60d' ? "DATE_ADD(NOW(3), INTERVAL 60 DAY)" : expiryOpt === '90d' ? "DATE_ADD(NOW(3), INTERVAL 90 DAY)" : "DATE_ADD(NOW(3), INTERVAL 1 YEAR)");
      const planName = planId === 'plan-clinical-annual' ? 'Clinical AI Suite' : planId === 'plan-scale-1m' ? 'Scale 1M Plan' : 'Team 100k Plan';
      const licenseKey = `LIC-${orgName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'ALTIL'}-${randomBytes(4).toString('hex').toUpperCase()}`;

      await connection.execute(
        `INSERT INTO tenant_licenses
         (id, tenant_id, tenant_name, application_id, application_name, plan_id, plan_name, license_key, license_status, payment_status, start_date, renewal_date, currency, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'paid', NOW(3), ${renewalExpr}, ?, NOW(3))`,
        [licId, tenantId, orgName, appId, appName, planId, planName, licenseKey, currency]
      );
      licenseResult = { id: licId, planId, status: 'active' };
    }

    // 17. If products selected or default bundle requested, create initial Order
    let orderResult: { id: string; orderNumber: string; total: number; currency: string } | null = null;
    const selectedProducts = input.selectedProductIds || ['prod-ai-seat', 'prod-privacy'];
    if (selectedProducts.length > 0) {
      const orderId = `ord-${randomUUID()}`;
      const orderNumber = `ORD-${nowIso.slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Fetch product prices
      const marks = selectedProducts.map(() => '?').join(',');
      const [prodRows] = await connection.execute<any[]>(
        `SELECT id, name, price, currency, recurring, billing_unit FROM billing_products WHERE id IN (${marks})`,
        selectedProducts
      );

      let subtotal = 0;
      for (const prod of prodRows) {
        const lineId = `ordline-${randomUUID()}`;
        const unitPrice = Number(prod.price) || 0;
        const lineTotal = unitPrice * 1;
        subtotal += lineTotal;
        await connection.execute(
          `INSERT INTO billing_order_lines
           (id, order_id, tenant_id, product_id, description, quantity, unit_price, line_total, currency, recurring, billing_unit, active, payload_json, created_at)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 1, '{}', NOW(3))`,
          [lineId, orderId, tenantId, prod.id, prod.name, unitPrice, lineTotal, prod.currency || currency, prod.recurring ? 1 : 0, prod.billing_unit || 'month']
        );
      }

      await connection.execute(
        `INSERT INTO billing_orders
         (id, order_number, tenant_id, tenant_name, status, currency, subtotal, discount_amount, total, source, source_reference, created_by, created_at, payload_json)
         VALUES (?, ?, ?, ?, 'active', ?, ?, 0, ?, 'ONBOARDING_WIZARD', 'NEW_CUSTOMER_PROVISIONING', ?, NOW(3), '{}')`,
        [orderId, orderNumber, tenantId, orgName, currency, subtotal, subtotal, actor.email]
      );

      orderResult = { id: orderId, orderNumber, total: subtotal, currency };
    }

    // 18. Durably write audit log
    const auditId = `EVT-${randomUUID()}`.slice(0, 64);
    const auditPayload = JSON.stringify({
      operation: 'commercial.onboarding.orchestrate',
      organizationId: orgId,
      customerId: custId,
      tenantId,
      accountId,
      adminEmail,
      actor: actor.email,
      timestamp: nowIso
    });

    await connection.execute(
      `INSERT INTO audit_logs
       (id, timestamp, tenant_id, user_email, action_type, category, severity, request_payload, raw_response_payload, created_at)
       VALUES (?, NOW(3), ?, ?, 'COMMERCIAL_ONBOARDING', 'AUDIT', 'INFO', ?, '{"status":"SUCCESS"}', NOW(3))`,
      [auditId, tenantId, actor.email, auditPayload]
    );

    const activationUrl = `${originBaseUrl}/activate?token=${rawInvitationToken}`;

    return {
      success: true,
      message: `Successfully orchestrated complete commercial and technical onboarding for ${orgName}.`,
      organization: {
        id: orgId,
        name: orgName,
        type: relationshipType,
        parentId: parentOrgId
      },
      customer: {
        id: custId,
        displayName: orgName,
        type: customerType,
        legalEntityId: legalId || undefined
      },
      tenant: {
        id: tenantId,
        code: tenantCode,
        name: orgName,
        tier
      },
      account: {
        id: accountId,
        name: `${orgName} Billing Account`
      },
      primaryAdmin: {
        id: primaryUserId,
        email: adminEmail,
        name: `${adminFirst} ${adminLast}`.trim(),
        invitationToken: rawInvitationToken,
        activationUrl
      },
      application: {
        id: appId,
        name: appName,
        code: appCode
      },
      apiKey: {
        id: keyId,
        name: input.apiKeyName || 'Primary Production Key',
        prefix: keyPrefix,
        rawSecretKey: rawApiKeySecret,
        scopes
      },
      order: orderResult,
      license: licenseResult,
      certificateSummary: {
        timestamp: nowIso,
        certificateId: `ALTIL-ONBOARD-CERT-${Math.floor(100000 + Math.random() * 900000)}`,
        certifiedBy: 'ALTIL Governance & Commercial Orchestrator',
        provenance: 'MariaDB Atomic Transaction Layer'
      }
    };
  });

  return result;
}
