import { executeQuery, isDatabaseConnected } from './mariadb';
import {
  DcrTransformationRecord,
  DcrPolicyRule,
  DcrProvenanceEvent,
  DcrVaultKeyMetadata,
  DataClassificationType,
  DcrTransformationStrategy
} from '../types';
import { TransformationKeyService } from '../utils/dcrKeyService';

function readJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  if (Buffer.isBuffer(value)) value = value.toString('utf8');
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function productionPersistenceRequired(): boolean {
  return process.env.NODE_ENV?.trim().toLowerCase() === 'production';
}

function persistenceFailure(operation: string, error: unknown): never | void {
  if (productionPersistenceRequired()) {
    throw new Error(`DCR durable persistence unavailable during ${operation}.`);
  }
  console.warn(`[DcrRepository] ${operation} DB fallback:`, error instanceof Error ? error.name : 'UnknownError');
}

// Default seeded DCR policy rules
const INITIAL_DCR_POLICIES: DcrPolicyRule[] = [
  {
    id: 'DCR-POL-ZA-ID',
    tenantId: 'all',
    tenantName: 'Total Company Scope',
    classification: 'SPECIAL_PERSONAL',
    entityType: 'SA_ID_NUMBER',
    strategy: 'EXACT_TOKEN',
    scope: 'SESSION',
    providerRestrictions: ['openai', 'anthropic', 'google_vertex'],
    permittedProviders: ['ollama_sovereign_local', 'aws_bedrock_af_south_1'],
    semanticConfig: { maskFormat: 'ALTIL_ZAID_{HASH6}' },
    status: 'ACTIVE',
    priority: 10,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'DCR-POL-NAMES',
    tenantId: 'all',
    tenantName: 'Total Company Scope',
    classification: 'PERSONAL',
    entityType: 'PERSON_NAME',
    strategy: 'PSEUDONYM',
    scope: 'CONVERSATION',
    providerRestrictions: ['openai', 'anthropic', 'cohere'],
    permittedProviders: ['ollama_sovereign_local'],
    semanticConfig: { generalisationLevel: 'HIGH' },
    status: 'ACTIVE',
    priority: 20,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'DCR-POL-FIN-SALARY',
    tenantId: 'all',
    tenantName: 'Total Company Scope',
    classification: 'FINANCIAL',
    entityType: 'SALARY_AMOUNT',
    strategy: 'RANGE_PRESERVE',
    scope: 'REQUEST',
    providerRestrictions: ['openai', 'anthropic'],
    permittedProviders: ['ollama_sovereign_local'],
    semanticConfig: { rangeVariancePercent: 5, preserveCurrency: true },
    status: 'ACTIVE',
    priority: 30,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'DCR-POL-HEALTH-DIAGNOSIS',
    tenantId: 'all',
    tenantName: 'Total Company Scope',
    classification: 'HEALTH',
    entityType: 'MEDICAL_DIAGNOSIS',
    strategy: 'SEMANTIC_GENERALISE',
    scope: 'SESSION',
    providerRestrictions: ['openai', 'anthropic', 'google_vertex'],
    permittedProviders: ['ollama_sovereign_local'],
    semanticConfig: { generalisationLevel: 'HIGH' },
    status: 'ACTIVE',
    priority: 5,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'DCR-POL-RELATIONSHIPS',
    tenantId: 'all',
    tenantName: 'Total Company Scope',
    classification: 'PERSONAL',
    entityType: 'ENTITY_RELATIONSHIP',
    strategy: 'RELATIONSHIP_PRESERVE',
    scope: 'CONVERSATION',
    providerRestrictions: ['openai', 'anthropic'],
    permittedProviders: ['ollama_sovereign_local'],
    semanticConfig: { preserveCase: true },
    status: 'ACTIVE',
    priority: 25,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'DCR-POL-PHONE-NUMBERS',
    tenantId: 'all',
    tenantName: 'Total Company Scope',
    classification: 'PERSONAL',
    entityType: 'PHONE_NUMBER',
    strategy: 'FORMAT_PRESERVE',
    scope: 'SESSION',
    providerRestrictions: ['openai', 'anthropic'],
    permittedProviders: ['ollama_sovereign_local'],
    status: 'ACTIVE',
    priority: 40,
    updatedAt: new Date().toISOString()
  }
];

// Seeded Transformation Records
const IN_MEMORY_TRANSFORMATION_RECORDS: DcrTransformationRecord[] = [
  {
    id: 'DCR-REC-001',
    requestId: 'REQ-DCR-2026-091',
    tenantId: 'cust-fineduca',
    principalId: 'usr-agent-01',
    applicationId: 'app-fineduca',
    classification: 'PERSONAL',
    dataType: 'PERSON_NAME',
    originalValueCiphertext: TransformationKeyService.encrypt('Thabo Khumalo', 'cust-fineduca').ciphertext,
    originalValueHash: TransformationKeyService.hashValue('Thabo Khumalo'),
    originalMaskedPreview: 'T**** K******',
    surrogateValue: 'David Miller',
    transformationStrategy: 'PSEUDONYM',
    scope: 'CONVERSATION',
    keyReference: 'KEY-CUST-FINEDUCA-V1-A891',
    semanticConstraints: { preserveCase: true },
    status: 'ACTIVE',
    reconstructionCount: 2,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    lastReconstructedAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'DCR-REC-002',
    requestId: 'REQ-DCR-2026-091',
    tenantId: 'cust-fineduca',
    principalId: 'usr-agent-01',
    applicationId: 'app-fineduca',
    classification: 'SPECIAL_PERSONAL',
    dataType: 'SA_ID_NUMBER',
    originalValueCiphertext: TransformationKeyService.encrypt('8803155123087', 'cust-fineduca').ciphertext,
    originalValueHash: TransformationKeyService.hashValue('8803155123087'),
    originalMaskedPreview: '880315*****87',
    surrogateValue: 'ALTIL_ZAID_88B39F',
    transformationStrategy: 'EXACT_TOKEN',
    scope: 'SESSION',
    keyReference: 'KEY-CUST-FINEDUCA-V1-A891',
    status: 'ACTIVE',
    reconstructionCount: 1,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: 'DCR-REC-003',
    requestId: 'REQ-DCR-2026-092',
    tenantId: 'cust-mvisecure',
    principalId: 'usr-analyst-04',
    applicationId: 'app-mvisecure',
    classification: 'FINANCIAL',
    dataType: 'SALARY_AMOUNT',
    originalValueCiphertext: TransformationKeyService.encrypt('R48,750.00', 'cust-mvisecure').ciphertext,
    originalValueHash: TransformationKeyService.hashValue('R48,750.00'),
    originalMaskedPreview: 'R48,***.**',
    surrogateValue: 'R49,120.00',
    transformationStrategy: 'RANGE_PRESERVE',
    scope: 'REQUEST',
    keyReference: 'KEY-CUST-MVISECURE-V1-C729',
    semanticConstraints: { rangeDelta: 370, currency: 'ZAR', originalMagnitude: 48750 },
    status: 'RECONSTRUCTED',
    reconstructionCount: 1,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    lastReconstructedAt: new Date(Date.now() - 7190000).toISOString()
  }
];

// Seeded Provenance Events
const IN_MEMORY_PROVENANCE_LEDGER: DcrProvenanceEvent[] = [
  {
    eventId: 'EVT-DCR-001',
    eventType: 'DATA_DETECTED',
    requestId: 'REQ-DCR-2026-091',
    tenantId: 'cust-fineduca',
    classification: 'PERSONAL',
    sourceHash: TransformationKeyService.hashValue('Thabo Khumalo'),
    surrogateHash: TransformationKeyService.hashValue('David Miller'),
    transformationStrategy: 'PSEUDONYM',
    provenanceCategory: 'ORIGINAL',
    policyVersion: '1.0.0',
    timestamp: new Date(Date.now() - 3605000).toISOString(),
    previousEventHash: '0000000000000000000000000000000000000000000000000000000000000000',
    eventHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    description: 'Detected personal name entity under POPIA Section 1 / GDPR Art 4(1).'
  },
  {
    eventId: 'EVT-DCR-002',
    eventType: 'VALUE_TRANSFORMED',
    requestId: 'REQ-DCR-2026-091',
    tenantId: 'cust-fineduca',
    classification: 'PERSONAL',
    sourceHash: TransformationKeyService.hashValue('Thabo Khumalo'),
    surrogateHash: TransformationKeyService.hashValue('David Miller'),
    transformationStrategy: 'PSEUDONYM',
    provenanceCategory: 'ALTIL_SURROGATE',
    policyVersion: '1.0.0',
    timestamp: new Date(Date.now() - 3604000).toISOString(),
    previousEventHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    eventHash: 'fa21098bcae9124401826bbd9241aaef83748291048591029485728192039485',
    description: 'Cloaked personal name with semantic pseudonym "David Miller" (AES-256 encrypted in vault).'
  },
  {
    eventId: 'EVT-DCR-003',
    eventType: 'PROTECTED_REQUEST_CREATED',
    requestId: 'REQ-DCR-2026-091',
    tenantId: 'cust-fineduca',
    classification: 'SPECIAL_PERSONAL',
    sourceHash: TransformationKeyService.hashValue('8803155123087'),
    surrogateHash: TransformationKeyService.hashValue('ALTIL_ZAID_88B39F'),
    transformationStrategy: 'EXACT_TOKEN',
    provenanceCategory: 'ALTIL_SURROGATE',
    policyVersion: '1.0.0',
    timestamp: new Date(Date.now() - 3602000).toISOString(),
    previousEventHash: 'fa21098bcae9124401826bbd9241aaef83748291048591029485728192039485',
    eventHash: '9847120394857102938475610293847561029384756102938475610293847561',
    description: 'Zero PII outbound request transmitted to upstream AI provider.'
  },
  {
    eventId: 'EVT-DCR-004',
    eventType: 'VALUE_RECONSTRUCTED',
    requestId: 'REQ-DCR-2026-091',
    tenantId: 'cust-fineduca',
    classification: 'PERSONAL',
    sourceHash: TransformationKeyService.hashValue('Thabo Khumalo'),
    surrogateHash: TransformationKeyService.hashValue('David Miller'),
    transformationStrategy: 'PSEUDONYM',
    provenanceCategory: 'ORIGINAL',
    policyVersion: '1.0.0',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    previousEventHash: '9847120394857102938475610293847561029384756102938475610293847561',
    eventHash: '3948571029384756102938475610293847561029384756102938475610293847',
    description: 'Reconstructed surrogate "David Miller" to original authorized context.'
  }
];

export const DcrRepository = {
  /**
   * Save a transformation record in database and memory
   */
  async saveTransformationRecord(record: DcrTransformationRecord): Promise<DcrTransformationRecord> {
    const existingIdx = IN_MEMORY_TRANSFORMATION_RECORDS.findIndex(r => r.id === record.id);
    if (existingIdx >= 0) {
      IN_MEMORY_TRANSFORMATION_RECORDS[existingIdx] = record;
    } else {
      IN_MEMORY_TRANSFORMATION_RECORDS.unshift(record);
    }

    try {
      await executeQuery(
        `INSERT INTO dcr_transformation_records (
          id, request_id, tenant_id, principal_id, identity_id, application_id,
          classification, data_type, original_value_ciphertext, original_value_hash,
          original_masked_preview, surrogate_value, transformation_strategy, scope,
          key_reference, semantic_constraints_json, status, reconstruction_count,
          created_at, expires_at, last_reconstructed_at, transaction_id,
          conversation_id, mapping_set_id, organization_id, environment_id,
          policy_version, provider_restrictions_json, reconstruction_policy_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          reconstruction_count = VALUES(reconstruction_count),
          last_reconstructed_at = VALUES(last_reconstructed_at),
          expires_at = VALUES(expires_at),
          transaction_id = VALUES(transaction_id), conversation_id = VALUES(conversation_id),
          mapping_set_id = VALUES(mapping_set_id), organization_id = VALUES(organization_id),
          environment_id = VALUES(environment_id), policy_version = VALUES(policy_version),
          provider_restrictions_json = VALUES(provider_restrictions_json),
          reconstruction_policy_json = VALUES(reconstruction_policy_json)`,
        [
          record.id,
          record.requestId,
          record.tenantId,
          record.principalId || null,
          record.identityId || null,
          record.applicationId || null,
          record.classification,
          record.dataType,
          record.originalValueCiphertext,
          record.originalValueHash,
          record.originalMaskedPreview,
          record.surrogateValue,
          record.transformationStrategy,
          record.scope,
          record.keyReference,
          record.semanticConstraints ? JSON.stringify(record.semanticConstraints) : null,
          record.status,
          record.reconstructionCount,
          record.createdAt.replace('T', ' ').slice(0, 19),
          record.expiresAt.replace('T', ' ').slice(0, 19),
          record.lastReconstructedAt ? record.lastReconstructedAt.replace('T', ' ').slice(0, 19) : null,
          record.transactionId || record.requestId,
          record.conversationId || null,
          record.mappingSetId || null,
          record.organizationId || null,
          record.environmentId || null,
          record.policyVersion || null,
          record.providerRestrictions ? JSON.stringify(record.providerRestrictions) : null,
          record.reconstructionPolicy ? JSON.stringify(record.reconstructionPolicy) : null
        ]
      );
    } catch (err: any) {
      if (productionPersistenceRequired()) {
        const failedIndex = IN_MEMORY_TRANSFORMATION_RECORDS.findIndex(r => r.id === record.id);
        if (failedIndex >= 0) IN_MEMORY_TRANSFORMATION_RECORDS.splice(failedIndex, 1);
      }
      persistenceFailure('saveTransformationRecord', err);
    }

    return record;
  },

  /**
   * Find an active transformation record matching surrogate value
   */
async findActiveSurrogate(
    surrogate: string,
    tenantId: string,
    requestId?: string
  ): Promise<DcrTransformationRecord | undefined> {
    const scope = String(tenantId || '').trim();
    if (!scope) throw new Error('DCR tenant scope is required to resolve a surrogate.');
    const globalScope = scope === 'all';
    const findInMemory = (): DcrTransformationRecord | undefined => IN_MEMORY_TRANSFORMATION_RECORDS.find(r => {
      const matchSurrogate = r.surrogateValue.toLowerCase() === surrogate.trim().toLowerCase() ||
                             r.surrogateValue === surrogate.trim();
      const matchTenant = globalScope || r.tenantId === scope;
      const matchRequest = !requestId || r.scope !== 'REQUEST' || r.requestId === requestId;
      const isNotExpired = new Date(r.expiresAt).getTime() > Date.now();
      return matchSurrogate && matchTenant && matchRequest && isNotExpired && r.status !== 'REVOKED';
    });

    // A connected database is authoritative. Synthetic in-memory records are
    // only a local fallback when no durable database is available.
    if (!isDatabaseConnected()) return findInMemory();

    try {
      const rows = await executeQuery<any>(
        `SELECT * FROM dcr_transformation_records 
         WHERE surrogate_value = ? 
         AND status != 'REVOKED' 
         AND expires_at > NOW() 
         ${globalScope ? '' : 'AND tenant_id = ?'} 
         LIMIT 1`,
        globalScope ? [surrogate] : [surrogate, scope]
      );

      if (rows && rows.length > 0) {
        const row: any = rows[0];
        return {
          id: row.id,
          requestId: row.request_id,
          tenantId: row.tenant_id,
          principalId: row.principal_id,
          identityId: row.identity_id,
          applicationId: row.application_id,
          classification: row.classification as DataClassificationType,
          dataType: row.data_type,
          originalValueCiphertext: row.original_value_ciphertext,
          originalValueHash: row.original_value_hash,
          originalMaskedPreview: row.original_masked_preview,
          surrogateValue: row.surrogate_value,
          transformationStrategy: row.transformation_strategy as DcrTransformationStrategy,
          scope: row.scope,
          keyReference: row.key_reference,
          semanticConstraints: readJsonValue(row.semantic_constraints_json, undefined),
          status: row.status,
          reconstructionCount: row.reconstruction_count,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          lastReconstructedAt: row.last_reconstructed_at,
          transactionId: row.transaction_id || row.request_id,
          conversationId: row.conversation_id || undefined,
          mappingSetId: row.mapping_set_id || undefined,
          organizationId: row.organization_id || undefined,
          environmentId: row.environment_id || undefined,
          policyVersion: row.policy_version || undefined,
          providerRestrictions: readJsonValue(row.provider_restrictions_json, undefined),
          reconstructionPolicy: readJsonValue(row.reconstruction_policy_json, undefined)
        };
      }
    } catch (error) {
      persistenceFailure('findActiveSurrogate', error);
      return undefined;
    }

    return undefined;
  },

/**
   * Retrieve transformation vault records for one tenant.
   * The tenant scope is mandatory: an omitted scope must never widen to every tenant.
   */
  async getTransformationRecords(tenantId: string, requestId?: string): Promise<DcrTransformationRecord[]> {
    const scope = String(tenantId || '').trim();
    if (!scope) throw new Error('DCR tenant scope is required to read the transformation vault.');
    const globalScope = scope === 'all';
    const databaseAuthoritative = isDatabaseConnected();
    try {
      let query = `SELECT * FROM dcr_transformation_records WHERE 1=1`;
      const params: any[] = [];
      if (!globalScope) {
        query += ` AND tenant_id = ?`;
        params.push(scope);
      }
      if (requestId) {
        query += ` AND request_id = ?`;
        params.push(requestId);
      }
      query += ` ORDER BY created_at DESC LIMIT 100`;

      const rows = await executeQuery<any>(query, params);
      if (databaseAuthoritative) {
        return (rows || []).map((row: any) => ({
          id: row.id,
          requestId: row.request_id,
          tenantId: row.tenant_id,
          principalId: row.principal_id,
          identityId: row.identity_id,
          applicationId: row.application_id,
          classification: row.classification as DataClassificationType,
          dataType: row.data_type,
          originalValueCiphertext: row.original_value_ciphertext,
          originalValueHash: row.original_value_hash,
          originalMaskedPreview: row.original_masked_preview,
          surrogateValue: row.surrogate_value,
          transformationStrategy: row.transformation_strategy as DcrTransformationStrategy,
          scope: row.scope,
          keyReference: row.key_reference,
          semanticConstraints: readJsonValue(row.semantic_constraints_json, undefined),
          status: row.status,
          reconstructionCount: row.reconstruction_count,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          lastReconstructedAt: row.last_reconstructed_at,
          transactionId: row.transaction_id || row.request_id,
          conversationId: row.conversation_id || undefined,
          mappingSetId: row.mapping_set_id || undefined,
          organizationId: row.organization_id || undefined,
          environmentId: row.environment_id || undefined,
          policyVersion: row.policy_version || undefined,
          providerRestrictions: readJsonValue(row.provider_restrictions_json, undefined),
          reconstructionPolicy: readJsonValue(row.reconstruction_policy_json, undefined)
        }));
      }
    } catch (error) {
      persistenceFailure('getTransformationRecords', error);
      if (databaseAuthoritative) return [];
    }

    if (databaseAuthoritative) return [];

return IN_MEMORY_TRANSFORMATION_RECORDS.filter(r => {
      if (!globalScope && r.tenantId !== scope) return false;
      if (requestId && r.requestId !== requestId) return false;
      return true;
    });
  },

  /**
   * Retrieve DCR policy rules
   */
async getDcrPolicyRules(tenantId: string): Promise<DcrPolicyRule[]> {
    const scope = String(tenantId || '').trim();
    if (!scope) throw new Error('DCR tenant scope is required to read transformation policies.');
    const globalScope = scope === 'all';
    const databaseAuthoritative = isDatabaseConnected();
    try {
      const rows = await executeQuery<any>(
        `SELECT * FROM dcr_policy_rules ${globalScope ? '' : 'WHERE tenant_id = ? OR tenant_id = "all"'} ORDER BY priority ASC`,
        globalScope ? [] : [scope]
      );
      if (databaseAuthoritative) {
        return (rows || []).map((row: any) => ({
          id: row.id,
          tenantId: row.tenant_id,
          classification: row.classification as DataClassificationType,
          entityType: row.entity_type,
          strategy: row.strategy as DcrTransformationStrategy,
          scope: row.scope,
          providerRestrictions: readJsonValue(row.provider_restrictions_json, []),
          permittedProviders: readJsonValue(row.permitted_providers_json, []),
          semanticConfig: readJsonValue(row.semantic_config_json, undefined),
          priority: row.priority,
          status: row.status,
          updatedAt: row.updated_at
        }));
      }
    } catch (error) {
      persistenceFailure('getDcrPolicyRules', error);
      if (databaseAuthoritative) return [];
    }

    if (databaseAuthoritative) return [];

    return INITIAL_DCR_POLICIES;
  },

  /**
   * Save or update a DCR policy rule
   */
  async saveDcrPolicyRule(rule: DcrPolicyRule): Promise<DcrPolicyRule> {
    const idx = INITIAL_DCR_POLICIES.findIndex(p => p.id === rule.id);
    const previous = idx >= 0 ? INITIAL_DCR_POLICIES[idx] : undefined;
    if (idx >= 0) {
      INITIAL_DCR_POLICIES[idx] = rule;
    } else {
      INITIAL_DCR_POLICIES.push(rule);
    }

    try {
      await executeQuery(
        `INSERT INTO dcr_policy_rules (
          id, tenant_id, classification, entity_type, strategy, scope,
          provider_restrictions_json, permitted_providers_json, semantic_config_json,
          priority, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          strategy = VALUES(strategy),
          scope = VALUES(scope),
          provider_restrictions_json = VALUES(provider_restrictions_json),
          permitted_providers_json = VALUES(permitted_providers_json),
          semantic_config_json = VALUES(semantic_config_json),
          priority = VALUES(priority),
          status = VALUES(status)`,
        [
          rule.id,
          rule.tenantId,
          rule.classification,
          rule.entityType || null,
          rule.strategy,
          rule.scope,
          JSON.stringify(rule.providerRestrictions),
          JSON.stringify(rule.permittedProviders),
          rule.semanticConfig ? JSON.stringify(rule.semanticConfig) : null,
          rule.priority,
          rule.status
        ]
      );
    } catch (error) {
      if (productionPersistenceRequired()) {
        if (idx >= 0 && previous) INITIAL_DCR_POLICIES[idx] = previous;
        else {
          const failedIndex = INITIAL_DCR_POLICIES.findIndex(item => item.id === rule.id);
          if (failedIndex >= 0) INITIAL_DCR_POLICIES.splice(failedIndex, 1);
        }
      }
      persistenceFailure('saveDcrPolicyRule', error);
    }

    return rule;
  },

  /**
   * Append an immutable provenance & transformation event
   */
  async appendProvenanceEvent(event: DcrProvenanceEvent): Promise<DcrProvenanceEvent> {
    IN_MEMORY_PROVENANCE_LEDGER.unshift(event);
    if (IN_MEMORY_PROVENANCE_LEDGER.length > 500) {
      IN_MEMORY_PROVENANCE_LEDGER.pop();
    }

    try {
      await executeQuery(
        `INSERT INTO dcr_provenance_ledger (
          event_id, event_type, request_id, tenant_id, identity_id, classification,
          source_hash, surrogate_hash, transformation_strategy, provenance_category,
          policy_version, description, previous_event_hash, event_hash, details_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.eventId,
          event.eventType,
          event.requestId,
          event.tenantId,
          event.identityId || null,
          event.classification,
          event.sourceHash,
          event.surrogateHash,
          event.transformationStrategy,
          event.provenanceCategory,
          event.policyVersion,
          event.description,
          event.previousEventHash,
          event.eventHash,
          event.details ? JSON.stringify(event.details) : null,
          event.timestamp.replace('T', ' ').slice(0, 19)
        ]
      );
    } catch (error) {
      if (productionPersistenceRequired()) {
        const failedIndex = IN_MEMORY_PROVENANCE_LEDGER.findIndex(item => item.eventId === event.eventId);
        if (failedIndex >= 0) IN_MEMORY_PROVENANCE_LEDGER.splice(failedIndex, 1);
      }
      persistenceFailure('appendProvenanceEvent', error);
    }

    return event;
  },

  /**
   * Get provenance ledger events
   */
  async getProvenanceEvents(tenantId: string, requestId?: string, limit: number = 50): Promise<DcrProvenanceEvent[]> {
    const scope = String(tenantId || '').trim();
    if (!scope) throw new Error('DCR tenant scope is required to read the provenance ledger.');
    const globalScope = scope === 'all';
    try {
      let query = `SELECT * FROM dcr_provenance_ledger WHERE 1=1`;
      const params: any[] = [];
      if (!globalScope) {
        query += ` AND tenant_id = ?`;
        params.push(scope);
      }
      if (requestId) {
        query += ` AND request_id = ?`;
        params.push(requestId);
      }
      query += ` ORDER BY created_at DESC LIMIT ?`;
      params.push(limit);

      const rows = await executeQuery<any>(query, params);
      if (rows && rows.length > 0) {
        return rows.map((row: any) => ({
          eventId: row.event_id,
          eventType: row.event_type,
          requestId: row.request_id,
          tenantId: row.tenant_id,
          identityId: row.identity_id,
          classification: row.classification as DataClassificationType,
          sourceHash: row.source_hash,
          surrogateHash: row.surrogate_hash,
          transformationStrategy: row.transformation_strategy as DcrTransformationStrategy,
          provenanceCategory: row.provenance_category,
          policyVersion: row.policy_version,
          description: row.description,
          previousEventHash: row.previous_event_hash,
          eventHash: row.event_hash,
          details: readJsonValue(row.details_json, undefined),
          timestamp: row.created_at
        }));
      }
    } catch (error) { persistenceFailure('getProvenanceEvents', error); }

    return IN_MEMORY_PROVENANCE_LEDGER.filter(e => {
      if (!globalScope && e.tenantId !== scope) return false;
      if (requestId && e.requestId !== requestId) return false;
      return true;
    }).slice(0, limit);
  },

  /**
   * Get the last event hash for cryptographic chaining
   */
  getLastEventHash(): string {
    if (IN_MEMORY_PROVENANCE_LEDGER.length > 0) {
      return IN_MEMORY_PROVENANCE_LEDGER[0].eventHash;
    }
    return '0000000000000000000000000000000000000000000000000000000000000000';
  },

  /**
   * Clear expired records
   */
  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    const beforeCount = IN_MEMORY_TRANSFORMATION_RECORDS.length;
    for (let i = IN_MEMORY_TRANSFORMATION_RECORDS.length - 1; i >= 0; i--) {
      const rec = IN_MEMORY_TRANSFORMATION_RECORDS[i];
      if (new Date(rec.expiresAt).getTime() <= now && rec.scope === 'REQUEST') {
        IN_MEMORY_TRANSFORMATION_RECORDS.splice(i, 1);
      }
    }
    try {
      await executeQuery(`DELETE FROM dcr_transformation_records WHERE expires_at < NOW() AND scope = 'REQUEST'`);
    } catch (error) { persistenceFailure('cleanupExpired', error); }
    return beforeCount - IN_MEMORY_TRANSFORMATION_RECORDS.length;
  }
};
