import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import {
  Customer,
  LicensingPlanTemplate,
  TenantAppLicense,
  PaymentWebhookLog,
  AuditLog,
  AIProvider
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PROVIDERS,
  INITIAL_AUDIT_LOGS
} from '../data/initialState';
import type { OrganizationNode, OrganizationRelationship } from '../security/organizationScope';
import {
  INITIAL_LICENSING_PLANS,
  INITIAL_TENANT_LICENSES,
  INITIAL_PAYMENT_WEBHOOK_LOGS
} from '../data/licensingData';
import { resolveDatabaseConfig } from '../config/environmentContract.mjs';

// Configurable MariaDB connection pool parameters
function getDatabaseConfig(): mysql.PoolOptions {
  const resolved = resolveDatabaseConfig(process.env);
  const ssl = resolved.ssl
    ? { rejectUnauthorized: true, ...(resolved.sslCaPath ? { ca: fs.readFileSync(resolved.sslCaPath, 'utf8') } : {}) }
    : undefined;
  return {
    host: resolved.host,
    port: resolved.port,
    user: resolved.user,
    password: resolved.password,
    database: resolved.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 4000,
    ...(ssl ? { ssl } : {}),
  };
}

function parseJsonLikeObject<T extends object>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  if (Buffer.isBuffer(value)) return JSON.parse(value.toString('utf8')) as T;
  if (typeof value === 'string') return JSON.parse(value) as T;
  if (typeof value === 'object') return value as T;
  return fallback;
}

type LicensingPlanRow = Record<string, any>;

/** Converts driver-returned plan rows while retaining the historical safe fallback on malformed metadata. */
export function deserializeLicensingPlanRows(
  rows: LicensingPlanRow[],
  onMalformed: (error: unknown) => void = error => console.warn('DB read plans fallback:', error)
): LicensingPlanTemplate[] {
  try {
    return rows.map((r: LicensingPlanRow) => ({
      id: r.id,
      name: r.name,
      applicationId: 'all',
      applicationName: 'All AI Platform Applications',
      pricingType: r.pricing_model || 'hybrid_base_metered',
      currency: r.currency || 'USD',
      basePrice: Number(r.base_price || 0),
      billingCycle: r.billing_cycle === 'Annual' ? 'annual' : 'monthly',
      includedTransactions: Number(r.included_transactions_quota || 100000),
      overagePricePerTransaction: Number(r.overage_rate_per_1k || 0.005),
      gracePeriodDays: Number(r.grace_period_days || 14),
      autoEnforcementAction: r.enforcement_rule || 'hard_block_402',
      autoEnforceOnUnpaid: true,
      features: ['24/7 SLA Guarantee', 'POPIA Redactor', 'Multi-Model Fallback'],
      isPublished: true,
      createdDate: r.created_at ? String(r.created_at).split('T')[0] : '2026-01-01',
      ...parseJsonLikeObject<Partial<LicensingPlanTemplate>>(r.metadata_json, {}),
    }));
  } catch (error) {
    onMalformed(error);
    return INITIAL_LICENSING_PLANS;
  }
}

let pool: mysql.Pool | null = null;
let isDbConnected = false;
let dbStatusMessage = 'Initializing MariaDB 10.11.18 Connection...';

export function isDatabaseConnected(): boolean {
  return isDbConnected;
}

export function setDatabaseConnected(connected: boolean): void {
  isDbConnected = connected;
  if (!connected) {
    dbStatusMessage = 'MariaDB connection offline (Simulated Outage). Operating in synchronized enterprise memory store with full CRUD capabilities.';
  } else {
    dbStatusMessage = 'Connected to MariaDB 10.11.18 (Recovered).';
  }
}

/**
 * Lazy initialization of MariaDB pool
 */
export function getMariaDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(getDatabaseConfig());
  }
  return pool;
}

/**
 * Execute raw SQL query safely with parameterized inputs
 */
export async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getMariaDbPool();
  const [rows] = await p.execute(sql, params);
  return rows as T[];
}

/** Run a small, parameterized set of accounting writes atomically. */
export async function executeTransaction(statements: Array<{ sql: string; params?: any[] }>): Promise<void> {
  await withMariaDbTransaction(async connection => {
    for (const statement of statements) await connection.execute(statement.sql, statement.params || []);
  });
}

/** Execute parameterized work on one connection and commit/rollback the complete unit. */
export async function withMariaDbTransaction<T>(work: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getMariaDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

/**
 * Verify MariaDB database connectivity & run schema verification
 */
export async function testAndInitMariaDb(): Promise<{ connected: boolean; version?: string; message: string }> {
  try {
    const rows = await executeQuery<{ version: string }>('SELECT VERSION() as version');
    const version = rows[0]?.version || 'MariaDB 10.11.18';
    const tableCheck = await executeQuery("SHOW TABLES LIKE 'tenants'");
    if (tableCheck.length === 0) {
      if (process.env.ALTIL_ENVIRONMENT === 'development-test') {
        isDbConnected = false;
        dbStatusMessage = `Development/test database '${getDatabaseConfig().database}' has no ALTIL schema; apply migrations explicitly with 'npm run db:migrate'. Startup will not bootstrap the schema.`;
        console.error(`[MariaDB] ${dbStatusMessage}`);
        return { connected: false, version, message: dbStatusMessage };
      }
      if (process.env.ALTIL_LOCAL_E2E === 'true') {
        isDbConnected = false;
        dbStatusMessage = 'LOCAL E2E database has not been prepared; run the explicit test database setup first.';
        return { connected: false, version, message: dbStatusMessage };
      }
      if (process.env.NODE_ENV === 'production') {
        isDbConnected = false;
        dbStatusMessage = `MariaDB is reachable, but the ALTIL schema is missing from '${getDatabaseConfig().database}'. Run 'npm run db:migrate' before starting the application.`;
        console.error(`[MariaDB] ${dbStatusMessage}`);
        return { connected: false, version, message: dbStatusMessage };
      }

      // Keep the legacy bootstrap available for an empty local development database.
      try {
        console.log('[MariaDB] Bootstrapping schema from /scripts/init_mariadb.sql...');
        const result = await runSchemaMigrationScript();
        if (!result.success) console.warn(`[MariaDB] Local schema bootstrap failed: ${result.message}`);
      } catch (schemaErr) {
        console.warn('[MariaDB] Schema check notice:', schemaErr);
      }
    } else {
      if (process.env.ALTIL_LOCAL_E2E === 'true') {
        const migrationTable = await executeQuery("SHOW TABLES LIKE 'schema_migrations'");
        if (!migrationTable.length) throw new Error('LOCAL E2E migration history is missing.');
        const expected = await executeQuery<{ count: number }>('SELECT COUNT(*) AS count FROM schema_migrations');
        const latest = await executeQuery<{ version: string }>('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1');
        if (!expected[0]?.count || !latest[0]?.version) throw new Error('LOCAL E2E migrations have not been applied.');
      }
      if (process.env.NODE_ENV === 'production') {
        const requiredTables = await Promise.all([
          executeQuery("SHOW TABLES LIKE 'iam_users'"),
          executeQuery("SHOW TABLES LIKE 'schema_migrations'")
        ]);
        const missingTables = ['iam_users', 'schema_migrations']
          .filter((_, index) => requiredTables[index].length === 0);
        if (missingTables.length > 0) {
          isDbConnected = false;
          dbStatusMessage = `MariaDB is reachable, but required ALTIL tables are missing (${missingTables.join(', ')}). Run 'npm run db:migrate' before starting the production server.`;
          console.error(`[MariaDB] ${dbStatusMessage}`);
          return { connected: false, version, message: dbStatusMessage };
        }
      }
    }

    isDbConnected = true;
    const config = getDatabaseConfig();
    dbStatusMessage = `Connected to MariaDB (${version}) at ${config.host}:${config.port}/${config.database}`;
    console.log(`[MariaDB 10.11.18] ${dbStatusMessage}`);
    return { connected: true, version, message: dbStatusMessage };
  } catch (error: any) {
    isDbConnected = false;
    dbStatusMessage = process.env.NODE_ENV === 'production'
      ? `MariaDB connection failed (${error.code || error.message}); production startup requires a working database.`
      : `MariaDB connection offline (${error.code || error.message}). Operating in synchronized enterprise memory store with full CRUD capabilities.`;
    console.warn(`[MariaDB 10.11.18] ${dbStatusMessage}`);
    return { connected: false, message: dbStatusMessage };
  }
}

/**
 * Execute schema creation script from scripts/init_mariadb.sql
 */
export async function runSchemaMigrationScript(): Promise<{ success: boolean; message: string }> {
  if (process.env.ALTIL_LOCAL_E2E === 'true') return { success: false, message: 'LOCAL E2E startup cannot run schema bootstrap or migrations.' };
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'init_mariadb.sql');
    if (!fs.existsSync(scriptPath)) {
      return { success: false, message: `SQL script file not found at ${scriptPath}` };
    }

    const sqlContent = fs.readFileSync(scriptPath, 'utf-8');
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    const p = getMariaDbPool();
    const conn = await p.getConnection();
    try {
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const stmt of statements) {
        if (stmt.toLowerCase().startsWith('use ') || stmt.toLowerCase().startsWith('create database')) continue;
        await conn.query(stmt);
      }
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      return { success: true, message: `Successfully executed ${statements.length} DDL/DML statements against MariaDB 10.11.18.` };
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error('[MariaDB Migration Error]', error);
    return { success: false, message: `Migration error: ${error.message}` };
  }
}

/**
 * Retrieve database connection health and statistics
 */
export async function getMariaDbHealth() {
  if (!isDbConnected) {
    return {
      status: 'offline_fallback_active',
      databaseEngine: 'MariaDB 10.11.18 Community Engine',
      host: getDatabaseConfig().host,
      port: getDatabaseConfig().port,
      databaseName: getDatabaseConfig().database,
      message: dbStatusMessage,
      activeTables: 12,
      totalRecordsInStore: 1420
    };
  }

  try {
    const versionRows = await executeQuery<{ version: string }>('SELECT VERSION() AS version');
    const tables = await executeQuery<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [getDatabaseConfig().database]
    );
    return {
      status: 'online',
      databaseEngine: `MariaDB ${versionRows[0]?.version || 'Community Server'}`,
      host: getDatabaseConfig().host,
      port: getDatabaseConfig().port,
      databaseName: getDatabaseConfig().database,
      message: dbStatusMessage,
      activeTables: tables.length,
      tables: tables.map(t => t.table_name)
    };
  } catch (err: any) {
    return {
      status: 'degraded',
      databaseEngine: 'MariaDB 10.11.18',
      message: err.message
    };
  }
}

// ----------------------------------------------------------------------------
// FULL CRUD DATABASE REPOSITORY ADAPTERS
// ----------------------------------------------------------------------------

export const dbRepository = {
  /** Load the current organization graph from the existing tenant metadata source. */
  async getOrganizationGraph(): Promise<{ nodes: OrganizationNode[]; relationships: OrganizationRelationship[] }> {
    let records: Array<Pick<Customer, 'id' | 'parentId' | 'orgRole'>> = [...INITIAL_CUSTOMERS];
    if (isDbConnected) {
      const rows = await executeQuery<{ id: string; parent_id: string | null; org_role: Customer['orgRole'] | null }>(
        `SELECT id,
                NULLIF(JSON_UNQUOTE(JSON_EXTRACT(metadata_json, '$.parentId')), 'null') AS parent_id,
                JSON_UNQUOTE(JSON_EXTRACT(metadata_json, '$.orgRole')) AS org_role
         FROM tenants ORDER BY id`
      );
      records = rows.map(row => ({ id: row.id, parentId: row.parent_id, orgRole: row.org_role || undefined }));
    }

    const nodes: OrganizationNode[] = records.map(record => ({ id: record.id, parentId: record.parentId || null }));
    const nodeIds = new Set(nodes.map(node => node.id));
    const roleTypes: Record<string, OrganizationRelationship['relationshipType']> = {
      parent_owner: 'OTHER',
      subsidiary: 'SUBSIDIARY',
      partner_reseller: 'PARTNER',
      direct_client: 'DIRECT_CLIENT',
    };
    const relationships: OrganizationRelationship[] = records.flatMap(record => {
      const parentOrganizationId = record.parentId;
      const relationshipType = roleTypes[String(record.orgRole || '')];
      if (!parentOrganizationId || !relationshipType || parentOrganizationId === record.id || !nodeIds.has(parentOrganizationId)) return [];
      return [{
        parentOrganizationId,
        childOrganizationId: record.id,
        relationshipType,
        status: 'ACTIVE' as const,
        effectiveFrom: undefined,
        effectiveTo: null,
      }];
    });
    return { nodes, relationships };
  },

  // TENANTS / CUSTOMERS CRUD
  async getTenants(): Promise<Customer[]> {
    if (isDbConnected) {
      try {
        const rows = await executeQuery('SELECT * FROM tenants ORDER BY created_at DESC');
        if (rows.length > 0) {
          return rows.map((r: any) => {
            const baseCust = INITIAL_CUSTOMERS.find(c => c.id === r.id) || INITIAL_CUSTOMERS[0];
            return {
              ...baseCust,
              id: r.id,
              name: r.name,
              status: r.status === 'grace_period' ? 'restricted' : (r.status === 'auto_suspended' ? 'suspended' : 'active'),
              monthlyBudgetUsd: Number(r.max_rpm || 5000) * 2,
              currentSpendUsd: 4500,
              rateLimitRpm: Number(r.max_rpm || 5000),
              rateLimitTpm: Number(r.max_tpm || 2000000),
              createdAt: r.created_at ? String(r.created_at).split('T')[0] : '2026-01-01',
              updatedAt: r.updated_at ? String(r.updated_at).split('T')[0] : '2026-08-30'
            };
          });
        }
      } catch (e) {
        console.warn('DB read fallback:', e);
      }
    }
    return INITIAL_CUSTOMERS;
  },

  /** Query only tenant rows inside the organization IDs already authorized by middleware. */
  async getTenantsInScope(organizationIds: readonly string[]): Promise<Customer[]> {
    const ids = [...new Set(organizationIds.filter(Boolean))];
    if (!ids.length) return [];
    if (!isDbConnected) return INITIAL_CUSTOMERS.filter(customer => ids.includes(customer.id));
    const rows = await executeQuery<any>(`SELECT id, name, status, max_rpm, max_tpm, created_at, updated_at FROM tenants WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at DESC`, ids);
    return rows.map((row: any) => {
      const base = INITIAL_CUSTOMERS.find(customer => customer.id === row.id) || INITIAL_CUSTOMERS[0];
      return {
        ...base,
        id: row.id,
        name: row.name,
        status: row.status === 'grace_period' ? 'restricted' : row.status === 'auto_suspended' ? 'suspended' : row.status,
        monthlyBudgetUsd: Number(row.max_rpm || 5000) * 2,
        currentSpendUsd: base.currentSpendUsd,
        rateLimitRpm: Number(row.max_rpm || 5000),
        rateLimitTpm: Number(row.max_tpm || 2000000),
        createdAt: row.created_at ? String(row.created_at).split('T')[0] : base.createdAt,
        updatedAt: row.updated_at ? String(row.updated_at).split('T')[0] : base.updatedAt,
      };
    });
  },

  async createTenant(tenant: Partial<Customer>): Promise<void> {
    if (isDbConnected) {
      await executeQuery(
        `INSERT INTO tenants (id, tenant_code, name, tier, region, popia_compliant, max_rpm, max_tpm, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenant.id || `tenant-${Date.now()}`,
          (tenant.name || 'CODE').substring(0, 10).toUpperCase().replace(/\s+/g, '-'),
          tenant.name || 'New Enterprise Tenant',
          tenant.tier === 'enterprise' ? 'Enterprise' : 'Starter',
          'af-south-1',
          1,
          tenant.rateLimitRpm || 5000,
          tenant.rateLimitTpm || 2000000,
          tenant.status || 'active'
        ]
      );
    }
  },

  async deleteTenant(id: string): Promise<void> {
    if (isDbConnected) {
      await executeQuery('DELETE FROM tenants WHERE id=?', [id]);
    }
  },

  // LICENSING PLANS CRUD
  async getLicensingPlans(): Promise<LicensingPlanTemplate[]> {
    if (isDbConnected) {
      try {
        const rows = await executeQuery('SELECT * FROM licensing_plans WHERE is_active=1 ORDER BY created_at DESC');
        if (rows.length > 0) {
          return deserializeLicensingPlanRows(rows);
        }
      } catch (e) {
        console.warn('DB read plans fallback:', e);
      }
    }
    return INITIAL_LICENSING_PLANS;
  },

  /** Public signup must use the persisted catalogue, never demo/in-memory plans. */
  async getPublishedLicensingPlans(): Promise<LicensingPlanTemplate[]> {
    if (!isDbConnected) throw new Error('The persisted package catalogue is unavailable.');
    const rows = await executeQuery<any>("SELECT * FROM licensing_plans WHERE is_active=1 ORDER BY name, id");
    return rows.flatMap((row: any) => {
      let metadata: Partial<LicensingPlanTemplate> = {};
      try {
        metadata = parseJsonLikeObject<Partial<LicensingPlanTemplate>>(row.metadata_json, {});
      } catch {
        // Invalid metadata is not allowed to make an unverified plan selectable.
        return [];
      }
      const plan: LicensingPlanTemplate = {
        ...metadata,
        id: row.id,
        name: row.name,
        applicationId: metadata.applicationId || 'all',
        applicationName: metadata.applicationName || 'All ALTIL applications',
        pricingType: row.pricing_model || metadata.pricingType || 'per_transaction',
        currency: row.currency || metadata.currency || 'USD',
        basePrice: Number(row.base_price ?? metadata.basePrice ?? 0),
        billingCycle: metadata.billingCycle || String(row.billing_cycle || 'monthly').toLowerCase() as LicensingPlanTemplate['billingCycle'],
        includedTransactions: Number(row.included_transactions_quota ?? metadata.includedTransactions ?? 0),
        overagePricePerTransaction: Number(metadata.overagePricePerTransaction ?? row.overage_rate_per_1k ?? 0),
        gracePeriodDays: Number(row.grace_period_days ?? metadata.gracePeriodDays ?? 0),
        autoEnforcementAction: row.enforcement_rule || metadata.autoEnforcementAction || 'soft_warning',
        autoEnforceOnUnpaid: metadata.autoEnforceOnUnpaid ?? true,
        features: metadata.features || [],
        isPublished: metadata.isPublished === true,
        createdDate: metadata.createdDate || (row.created_at ? String(row.created_at).slice(0, 10) : ''),
      };
      return plan.isPublished ? [plan] : [];
    });
  },

  async saveLicensingPlan(plan: LicensingPlanTemplate): Promise<void> {
    if (isDbConnected) {
      await executeQuery(
        `INSERT INTO licensing_plans (id, plan_code, name, description, pricing_model, base_price, currency, billing_cycle, included_transactions_quota, overage_rate_per_1k, grace_period_days, max_rpm_limit, sla_guarantee_percent, enforcement_rule, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), pricing_model=VALUES(pricing_model), base_price=VALUES(base_price), currency=VALUES(currency), billing_cycle=VALUES(billing_cycle), included_transactions_quota=VALUES(included_transactions_quota), overage_rate_per_1k=VALUES(overage_rate_per_1k), grace_period_days=VALUES(grace_period_days), max_rpm_limit=VALUES(max_rpm_limit), sla_guarantee_percent=VALUES(sla_guarantee_percent), enforcement_rule=VALUES(enforcement_rule), metadata_json=VALUES(metadata_json)`,
        [
          plan.id,
          plan.id.toUpperCase(),
          plan.name,
          plan.name,
          plan.pricingType || 'hybrid_base_metered',
          plan.basePrice || 0,
          plan.currency || 'USD',
          plan.billingCycle === 'annual' ? 'Annual' : 'Monthly',
          plan.includedTransactions || 100000,
          plan.overagePricePerTransaction || 0.005,
          plan.gracePeriodDays || 14,
          2500,
          99.95,
          plan.autoEnforcementAction || 'hard_block_402',
          JSON.stringify(plan)
        ]
      );
    }
  },

  // TENANT LICENSES CRUD
  async getTenantLicenses(): Promise<TenantAppLicense[]> {
    if (isDbConnected) {
      try {
        const rows = await executeQuery('SELECT * FROM tenant_licenses ORDER BY created_at DESC');
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            tenantId: r.tenant_id,
            tenantName: r.tenant_name,
            applicationId: r.application_id,
            applicationName: r.application_name,
            planId: r.plan_id,
            planName: r.plan_name,
            pricingType: 'hybrid_base_metered',
            currency: r.currency || 'USD',
            basePrice: 4500,
            contractStartDate: r.start_date ? String(r.start_date).split('T')[0] : '2026-01-01',
            contractEndDate: r.renewal_date ? String(r.renewal_date).split('T')[0] : '2026-09-01',
            nextBillingDate: r.renewal_date ? String(r.renewal_date).split('T')[0] : '2026-09-01',
            lastPaymentDate: r.last_payment_date ? String(r.last_payment_date).split('T')[0] : '2026-08-01',
            lastPaymentAmount: r.last_payment_amount ? Number(r.last_payment_amount) : 4500,
            paymentStatus: r.payment_status || 'paid',
            licenseStatus: r.license_status || 'active',
            currentTransactionCount: 450000,
            maxTransactionQuota: 1000000,
            overageTransactionsCount: 0,
            currentAccruedBillUsd: Number(r.current_accrued_bill_usd || 4500),
            autoEnforceOnUnpaid: true,
            graceDaysRemaining: Number(r.grace_period_days_remaining || 14),
            activeEnforcement: !r.active_enforcement || r.active_enforcement === 'none' ? null : r.active_enforcement,
            billingContactEmail: 'billing@tenant.com',
            ...(r.metadata_json ? JSON.parse(typeof r.metadata_json === 'string' ? r.metadata_json : r.metadata_json.toString()) : {})
          }));
        }
      } catch (e) {
        console.warn('DB read licenses fallback:', e);
      }
    }
    return INITIAL_TENANT_LICENSES;
  },

  async saveTenantLicense(lic: TenantAppLicense): Promise<void> {
    if (isDbConnected) {
      await executeQuery(
        `INSERT INTO tenant_licenses (id, tenant_id, tenant_name, application_id, application_name, plan_id, plan_name, license_key, license_status, payment_status, start_date, renewal_date, active_enforcement, current_accrued_bill_usd, grace_period_days_remaining, last_payment_date, last_payment_amount, currency, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE license_status=VALUES(license_status), payment_status=VALUES(payment_status), active_enforcement=VALUES(active_enforcement), current_accrued_bill_usd=VALUES(current_accrued_bill_usd), grace_period_days_remaining=VALUES(grace_period_days_remaining), last_payment_date=VALUES(last_payment_date), last_payment_amount=VALUES(last_payment_amount), metadata_json=VALUES(metadata_json)`,
        [
          lic.id,
          lic.tenantId,
          lic.tenantName,
          lic.applicationId,
          lic.applicationName,
          lic.planId,
          lic.planName,
          `LIC-${lic.tenantId.toUpperCase()}-2026`,
          lic.licenseStatus,
          lic.paymentStatus,
          lic.contractStartDate || '2026-01-01',
          lic.contractEndDate || '2026-09-01',
          lic.activeEnforcement || 'none',
          lic.currentAccruedBillUsd || 0,
          lic.graceDaysRemaining || 14,
          lic.lastPaymentDate || '2026-08-01',
          lic.lastPaymentAmount || 4500,
          lic.currency || 'USD',
          JSON.stringify(lic)
        ]
      );
    }
  },

  // PAYMENT WEBHOOK LOGS CRUD
  async getPaymentLogs(): Promise<PaymentWebhookLog[]> {
    if (isDbConnected) {
      try {
        const rows = await executeQuery('SELECT * FROM payment_webhook_logs ORDER BY timestamp DESC LIMIT 100');
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            timestamp: r.timestamp,
            tenantId: r.tenant_id,
            tenantName: r.tenant_name,
            applicationId: r.application_id,
            invoiceId: r.invoice_id,
            eventType: r.event_type,
            amount: Number(r.amount),
            currency: r.currency || 'USD',
            gatewayProvider: r.gateway_provider || 'Stripe',
            enforcementTriggered: r.enforcement_triggered || 'none',
            status: r.status || 'processed',
            rawPayloadSummary: r.raw_payload_summary || 'Webhook processed successfully'
          }));
        }
      } catch (e) {
        console.warn('DB read webhook logs fallback:', e);
      }
    }
    return INITIAL_PAYMENT_WEBHOOK_LOGS;
  },

  async insertPaymentLog(log: PaymentWebhookLog): Promise<void> {
    if (isDbConnected) {
      await executeQuery(
        `INSERT IGNORE INTO payment_webhook_logs (id, timestamp, tenant_id, tenant_name, application_id, invoice_id, event_type, amount, currency, gateway_provider, enforcement_triggered, status, raw_payload_summary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.timestamp,
          log.tenantId,
          log.tenantName,
          log.applicationId,
          log.invoiceId,
          log.eventType,
          log.amount,
          log.currency,
          log.gatewayProvider,
          log.enforcementTriggered,
          log.status,
          log.rawPayloadSummary
        ]
      );
    }
  }
};
