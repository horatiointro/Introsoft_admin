import { executeQuery, isDatabaseConnected } from './mariadb';
import { DataSubjectRequest, GlobalComplianceConfig } from '../types';
import { INITIAL_DATA_SUBJECT_REQUESTS, INITIAL_GLOBAL_COMPLIANCE_CONFIG } from '../data/initialState';

let inMemoryDsar: DataSubjectRequest[] = [...INITIAL_DATA_SUBJECT_REQUESTS];
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
    if (isDatabaseConnected()) {
      try {
        let sql = `SELECT * FROM compliance_dsar_requests`;
        const params: any[] = [];
        if (tenantId && tenantId !== 'all') {
          sql += ` WHERE tenant_id = ?`;
          params.push(tenantId);
        }
        sql += ` ORDER BY created_at DESC`;
        const rows = await executeQuery<any>(sql, params);
        if (rows && rows.length > 0) {
          return rows.map(r => ({
            id: r.id,
            tenantId: r.tenant_id || undefined,
            framework: (r.framework as 'POPIA' | 'GDPR') || 'POPIA',
            requestType: r.request_type || 'access',
            subjectIdentifier: r.subject_identifier || r.id_number_or_passport || r.data_subject_email || '',
            requestorName: r.requestor_name || r.data_subject_name || 'Subject',
            appId: r.app_id || undefined,
            status: r.status || 'pending',
            createdAt: r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19) : '',
            dueAt: r.due_at || r.statutory_deadline || new Date(Date.now() + 30 * 86400000).toISOString().replace('T', ' ').slice(0, 10),
            notes: r.notes || ''
          }));
        }
      } catch (err) {
        console.warn('[ComplianceRepository] DSAR DB fetch warning:', err);
      }
    }
    if (tenantId && tenantId !== 'all') return inMemoryDsar.filter(request => request.tenantId === tenantId);
    return inMemoryDsar;
  },

  /**
   * Create or update DSAR request
   */
  async saveDsarRequest(dsar: DataSubjectRequest): Promise<DataSubjectRequest> {
    const idx = inMemoryDsar.findIndex(d => d.id === dsar.id);
    if (idx >= 0) inMemoryDsar[idx] = dsar;
    else inMemoryDsar.unshift(dsar);

    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO compliance_dsar_requests (
            id, request_type, data_subject_name, data_subject_email, id_number_or_passport,
            status, priority, scope, notes, statutory_deadline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            priority = VALUES(priority),
            scope = VALUES(scope),
            notes = VALUES(notes),
            updated_at = NOW()
        `;
        await executeQuery(sql, [
          dsar.id,
          dsar.requestType,
          dsar.requestorName || 'Data Subject',
          dsar.subjectIdentifier || 'unknown',
          dsar.subjectIdentifier || '',
          dsar.status,
          'standard',
          'ALL_MODELS',
          dsar.notes || '',
          dsar.dueAt || null
        ]);
      } catch (err) {
        console.warn('[ComplianceRepository] DSAR DB save warning:', err);
      }
    }
    return dsar;
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
