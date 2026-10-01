import { executeQuery, isDatabaseConnected, withMariaDbTransaction } from './mariadb';
import { DataSubjectRequest, GlobalComplianceConfig } from '../types';
import { INITIAL_GLOBAL_COMPLIANCE_CONFIG } from '../data/initialState';
import { createHash, randomUUID } from 'node:crypto';
import { databaseDate, databaseStatus, mapDsarRow, statutoryBasis, type DsarRow } from './dsarPersistenceMapping';

let inMemoryConfig: GlobalComplianceConfig = { ...INITIAL_GLOBAL_COMPLIANCE_CONFIG };

export const ComplianceRepository = {
  /**
   * Get global compliance config
   */
  async getConfig(): Promise<GlobalComplianceConfig> {
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery<any>(`SELECT * FROM compliance_framework_configs`);
        if (rows && rows.length > 0) {
          // Can parse and enhance
        }
      } catch (err) {
        console.warn('[ComplianceRepository] Config load warning:', err);
      }
    }
    return inMemoryConfig;
  },

  /**
   * Save global compliance config
   */
  async saveConfig(cfg: GlobalComplianceConfig): Promise<GlobalComplianceConfig> {
    inMemoryConfig = cfg;
    return inMemoryConfig;
  },

  /**
   * Get DSAR requests
   */
  async getDsarRequests(tenantId?: string): Promise<DataSubjectRequest[]> {
    if (!isDatabaseConnected()) throw new Error('DSAR persistence is unavailable; no in-memory fallback is used.');
    let sql = 'SELECT * FROM compliance_dsar_requests';
    const params: any[] = [];
    if (tenantId && tenantId !== 'all') { sql += ' WHERE tenant_id = ?'; params.push(tenantId); }
    sql += ' ORDER BY created_at DESC';
    const rows = await executeQuery<DsarRow>(sql, params);
    return rows.map(mapDsarRow);
  },

  /**
   * Create or update DSAR request
   */
  async saveDsarRequest(dsar: DataSubjectRequest): Promise<DataSubjectRequest> {
    if (!isDatabaseConnected()) throw new Error('DSAR persistence is unavailable; no in-memory fallback is used.');
    if (!dsar.id || dsar.id.length > 64) throw new Error('DSAR id must contain 1 to 64 characters.');
    if (!dsar.tenantId || dsar.tenantId.length > 64) throw new Error('DSAR tenant scope is required.');
    if (!dsar.subjectIdentifier || dsar.subjectIdentifier.length > 128) throw new Error('DSAR subject identifier is required and must be at most 128 characters.');
    if (!dsar.requestorName || dsar.requestorName.length > 255) throw new Error('DSAR requestor name is required and must be at most 255 characters.');
    if (!['POPIA', 'GDPR'].includes(dsar.framework)) throw new Error('DSAR framework is invalid.');
    if (!['access', 'erasure', 'rectification', 'objection', 'portability'].includes(dsar.requestType)) throw new Error('DSAR request type is invalid.');
    if (!['pending', 'in_progress', 'fulfilled', 'rejected'].includes(dsar.status)) throw new Error('DSAR status is invalid.');
    if (dsar.appId && dsar.appId.length > 64) throw new Error('DSAR application id must be at most 64 characters.');
    const receivedDate = databaseDate(dsar.createdAt, 'createdAt');
    const dueDate = databaseDate(dsar.dueAt, 'dueAt');
    const requestNumber = dsar.id.length <= 32 ? dsar.id : `DSR-${randomUUID().replace(/-/g, '').slice(0, 24)}`;
    const status = databaseStatus(dsar.status);
    const summary = `${dsar.framework} ${dsar.requestType} request (${status}).`;
    const auditHash = createHash('sha256').update(JSON.stringify({ id: dsar.id, tenantId: dsar.tenantId, framework: dsar.framework, requestType: dsar.requestType, status, dueDate, appId: dsar.appId || null })).digest('hex');
    const sql = `
      INSERT INTO compliance_dsar_requests (
        id, request_number, tenant_id, data_subject_ref, request_type, status, statutory_basis,
        received_date, due_date, assigned_officer_email, identity_verified, verification_method,
        redacted_summary, audit_hash, framework, requestor_name, app_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, FALSE, 'NOT_VERIFIED', ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        data_subject_ref = VALUES(data_subject_ref), request_type = VALUES(request_type),
        status = VALUES(status), statutory_basis = VALUES(statutory_basis),
        due_date = VALUES(due_date), redacted_summary = VALUES(redacted_summary),
        audit_hash = VALUES(audit_hash), framework = VALUES(framework),
        requestor_name = VALUES(requestor_name), app_id = VALUES(app_id), notes = VALUES(notes),
        updated_at = CURRENT_TIMESTAMP
    `;
    const persistedRow = await withMariaDbTransaction(async connection => {
      await connection.execute(sql, [
        dsar.id, requestNumber, dsar.tenantId, dsar.subjectIdentifier, dsar.requestType.toUpperCase(), status,
        statutoryBasis(dsar.framework, dsar.requestType), receivedDate, dueDate, summary, auditHash,
        dsar.framework, dsar.requestorName, dsar.appId || null, dsar.notes || null,
      ]);
      const [rows] = await connection.execute('SELECT * FROM compliance_dsar_requests WHERE id = ? LIMIT 1', [dsar.id]);
      const result = rows as DsarRow[];
      if (!result.length) throw new Error('DSAR insert completed without a retrievable persisted row.');
      return result[0];
    });
    return mapDsarRow(persistedRow);
  },

  /**
   * Save a simulated traffic packet with law-breaker events and tokenized vault records
   */
  async saveSimulationPacket(packet: any): Promise<any> {
    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO compliance_traffic_simulations (
            id, transaction_id, tenant_id, company_name, source_app_id, target_model, target_provider,
            outbound_raw, outbound_sanitized, inbound_raw, inbound_sanitized,
            violations_json, tokenized_entities_json, action_taken, status,
            tokens_consumed, duration_ms, fines_prevented_zar, fines_prevented_eur
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await executeQuery(sql, [
          packet.id,
          packet.transactionId,
          packet.companyId,
          packet.companyName,
          packet.sourceApp,
          packet.targetModel,
          packet.targetProvider,
          packet.outboundRawPrompt,
          packet.outboundSanitizedPrompt,
          packet.inboundRawResponse,
          packet.inboundSanitizedResponse,
          JSON.stringify(packet.violations || []),
          JSON.stringify(packet.tokenizedEntities || []),
          packet.actionTaken,
          packet.status,
          packet.tokensConsumed || 0,
          packet.latencyMs || 0,
          packet.finesPreventedZar || 0,
          packet.finesPreventedEur || 0
        ]);

        // Save token vault items
        if (packet.tokenizedEntities && Array.isArray(packet.tokenizedEntities)) {
          for (const token of packet.tokenizedEntities) {
            const vaultSql = `
              INSERT INTO compliance_token_vault (
                id, token_id, tenant_id, entity_type, masked_display, encrypted_value, reversible, jurisdiction
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE masked_display = VALUES(masked_display)
            `;
            await executeQuery(vaultSql, [
              `VLT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              token.tokenId,
              token.tenantId || packet.companyId,
              token.entityType,
              token.maskedPreview,
              token.rawSensitiveValue,
              token.reversible ? 1 : 0,
              token.jurisdiction || 'POPIA'
            ]);
          }
        }
      } catch (err) {
        console.warn('[ComplianceRepository] Simulation DB save warning:', err);
      }
    }
    return packet;
  },

  /**
   * Get simulated traffic packets
   */
  async getSimulationPackets(tenantId?: string): Promise<any[]> {
    if (isDatabaseConnected()) {
      try {
        let sql = `SELECT * FROM compliance_traffic_simulations`;
        const params: any[] = [];
        if (tenantId && tenantId !== 'all') {
          sql += ` WHERE tenant_id = ?`;
          params.push(tenantId);
        }
        sql += ` ORDER BY created_at DESC LIMIT 100`;
        const rows = await executeQuery<any>(sql, params);
        if (rows && rows.length > 0) {
          return rows.map(r => ({
            id: r.id,
            transactionId: r.transaction_id,
            timestamp: r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19) : '',
            companyId: r.tenant_id,
            companyName: r.company_name,
            sourceApp: r.source_app_id,
            industry: 'Enterprise Commercial',
            targetProvider: r.target_provider,
            targetModel: r.target_model,
            outboundRawPrompt: r.outbound_raw,
            outboundSanitizedPrompt: r.outbound_sanitized,
            inboundRawResponse: r.inbound_raw,
            inboundSanitizedResponse: r.inbound_sanitized,
            violations: typeof r.violations_json === 'string' ? JSON.parse(r.violations_json) : (r.violations_json || []),
            tokenizedEntities: typeof r.tokenized_entities_json === 'string' ? JSON.parse(r.tokenized_entities_json) : (r.tokenized_entities_json || []),
            actionTaken: r.action_taken,
            status: r.status,
            sovereignRerouted: r.target_provider.toLowerCase().includes('ollama'),
            tokensConsumed: r.tokens_consumed,
            latencyMs: r.duration_ms,
            finesPreventedZar: Number(r.fines_prevented_zar) || 0,
            finesPreventedEur: Number(r.fines_prevented_eur) || 0
          }));
        }
      } catch (err) {
        console.warn('[ComplianceRepository] Simulation DB query warning:', err);
      }
    }
    const { IN_MEMORY_SIMULATED_TRAFFIC } = await import('../utils/complianceSimulationEngine');
    if (tenantId && tenantId !== 'all') return IN_MEMORY_SIMULATED_TRAFFIC.filter(packet => packet.companyId === tenantId);
    return IN_MEMORY_SIMULATED_TRAFFIC;
  },

  /**
   * Get all active token vault records
   */
  async getTokenVaultRecords(): Promise<any[]> {
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery<any>(`SELECT * FROM compliance_token_vault ORDER BY created_at DESC LIMIT 100`);
        if (rows && rows.length > 0) {
          return rows.map(r => ({
            tokenId: r.token_id,
            entityType: r.entity_type,
            rawSensitiveValue: r.encrypted_value,
            maskedPreview: r.masked_display,
            tokenFormat: 'CRYPT_SALTED_UUID_V4',
            tenantId: r.tenant_id,
            reversible: Boolean(r.reversible),
            jurisdiction: r.jurisdiction || 'POPIA (RSA)',
            retentionExpiry: '30 Days (Zero Model Retention)'
          }));
        }
      } catch (err) {
        console.warn('[ComplianceRepository] Vault DB fetch warning:', err);
      }
    }
    const { IN_MEMORY_TOKEN_VAULT } = await import('../utils/complianceSimulationEngine');
    return Array.from(IN_MEMORY_TOKEN_VAULT.values());
  },

  /**
   * Clear all simulation traffic logs
   */
  async clearSimulationLogs(): Promise<void> {
    const { IN_MEMORY_SIMULATED_TRAFFIC, IN_MEMORY_TOKEN_VAULT } = await import('../utils/complianceSimulationEngine');
    IN_MEMORY_SIMULATED_TRAFFIC.length = 0;
    IN_MEMORY_TOKEN_VAULT.clear();

    if (isDatabaseConnected()) {
      try {
        await executeQuery(`DELETE FROM compliance_traffic_simulations`);
        await executeQuery(`DELETE FROM compliance_token_vault`);
      } catch (err) {
        console.warn('[ComplianceRepository] Clear logs warning:', err);
      }
    }
  }
};
