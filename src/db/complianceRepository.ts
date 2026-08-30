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
          sql += ` WHERE tenant_id = ? OR tenant_id IS NULL`;
          params.push(tenantId);
        }
        sql += ` ORDER BY created_at DESC`;
        const rows = await executeQuery<any>(sql, params);
        if (rows && rows.length > 0) {
          return rows.map(r => ({
            id: r.id,
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
  }
};
