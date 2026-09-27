import { executeQuery, isDatabaseConnected } from './mariadb';
import { Incident, IncidentStatus, MultiChannelAlert, RagKnowledgeArticle } from '../types';
import { INITIAL_INCIDENTS_LIST, INITIAL_ALERTS_LIST, INITIAL_RAG_KNOWLEDGE_BASE } from '../data/incidentData';

let inMemoryIncidents: Incident[] = [...INITIAL_INCIDENTS_LIST];
let inMemoryAlerts: MultiChannelAlert[] = [...INITIAL_ALERTS_LIST];
let inMemoryRagArticles: RagKnowledgeArticle[] = [...INITIAL_RAG_KNOWLEDGE_BASE];

export const ItilOperationsRepository = {
  /**
   * Fetch all incidents, optionally filtered by tenant
   */
  async getIncidents(tenantId?: string): Promise<Incident[]> {
    if (isDatabaseConnected()) {
      try {
        let sql = `SELECT * FROM operations_incidents`;
        const params: any[] = [];
        if (tenantId && tenantId !== 'all') {
          sql += ` WHERE tenant_id = ? OR tenant_id IS NULL`;
          params.push(tenantId);
        }
        sql += ` ORDER BY created_at DESC`;
        const rows = await executeQuery<any>(sql, params);
        return (rows || []).map(r => ({
            id: r.id,
            title: r.title,
            severity: r.severity || 'P2_HIGH',
            status: r.status || 'investigating',
            commander: r.owner_email || r.assignee_email || 'ALTIL Operations',
            assignedTeam: 'NOC',
            assignedEngineer: r.assignee_email || undefined,
            affectedTenantIds: r.tenant_id ? [r.tenant_id] : [],
            affectedTenantNames: r.tenant_name ? [r.tenant_name] : [],
            affectedAppIds: r.application_id ? [r.application_id] : [],
            affectedAppNames: r.application_name ? [r.application_name] : [],
            affectedServiceIds: [r.affected_service || 'srv-01'],
            startTime: r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19) : new Date().toISOString(),
            slaImpacted: Boolean(r.sla_breached),
            summary: r.description || r.title || '',
            category: 'API_Gateway',
            alertChannels: ['email', 'in_app'],
            smsAlertSent: false,
            emailAlertSent: true,
            inAppAlertSent: true,
            timeline: []
          }));
      } catch (err) {
        console.warn('[ItilOperationsRepository] DB query failed, falling back to in-memory store:', err);
      }
    }
    return inMemoryIncidents;
  },

  /**
   * Create or update incident
   */
  async saveIncident(incident: any): Promise<Incident> {
    const completeIncident: Incident = {
      id: incident.id,
      title: incident.title || 'New Incident',
      severity: incident.severity || 'P2_HIGH',
      status: incident.status || 'investigating',
      commander: incident.commander || 'NOC Commander',
      assignedTeam: incident.assignedTeam || 'NOC',
      assignedEngineer: incident.assignedEngineer || 'Tebogo Molefe',
      affectedTenantIds: incident.affectedTenantIds || (incident.tenantId ? [incident.tenantId] : ['cust-1']),
      affectedTenantNames: incident.affectedTenantNames || ['Enterprise Tenant'],
      affectedAppIds: incident.affectedAppIds || ['app-01'],
      affectedAppNames: incident.affectedAppNames || ['Enterprise AI App'],
      affectedServiceIds: incident.affectedServiceIds || ['srv-01'],
      startTime: incident.startTime || new Date().toISOString().replace('T', ' ').slice(0, 19),
      slaImpacted: Boolean(incident.slaImpacted ?? incident.slaBreach),
      summary: incident.summary || incident.description || incident.title || '',
      category: incident.category || 'API_Gateway',
      alertChannels: incident.alertChannels || ['email', 'in_app'],
      smsAlertSent: Boolean(incident.smsAlertSent),
      emailAlertSent: Boolean(incident.emailAlertSent ?? true),
      inAppAlertSent: Boolean(incident.inAppAlertSent ?? true),
      timeline: incident.timeline || [
        { timestamp: new Date().toISOString().slice(11, 19), author: 'ALTIL NOC', note: 'Incident logged in ITIL system.' }
      ]
    };

    const idx = inMemoryIncidents.findIndex(i => i.id === completeIncident.id);
    if (idx >= 0) {
      inMemoryIncidents[idx] = completeIncident;
    } else {
      inMemoryIncidents.unshift(completeIncident);
    }

    if (isDatabaseConnected()) {
      try {
        const tenantCandidate = completeIncident.affectedTenantIds[0];
        const validTenant = tenantCandidate ? await executeQuery<any>('SELECT id FROM tenants WHERE id=? LIMIT 1', [tenantCandidate]) : [];
        const sql = `
          INSERT INTO operations_incidents (
            id, incident_number, tenant_id, tenant_name, application_id, application_name,
            title, description, severity, status, affected_service, owner_email, assignee_email,
            sla_breached, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            severity = VALUES(severity),
            status = VALUES(status),
            affected_service = VALUES(affected_service),
            assignee_email = VALUES(assignee_email),
            sla_breached = VALUES(sla_breached),
            updated_at = NOW()
        `;
        await executeQuery(sql, [
          completeIncident.id,
          completeIncident.id,
          validTenant.length ? tenantCandidate : null,
          completeIncident.affectedTenantNames[0] || null,
          completeIncident.affectedAppIds[0] || null,
          completeIncident.affectedAppNames[0] || null,
          completeIncident.title,
          completeIncident.summary,
          completeIncident.severity,
          completeIncident.status,
          completeIncident.affectedServiceIds[0] || 'srv-01',
          completeIncident.commander,
          completeIncident.assignedEngineer || completeIncident.commander,
          completeIncident.slaImpacted ? 1 : 0,
          completeIncident.startTime,
          completeIncident.startTime
        ]);
      } catch (err) {
        console.warn('[ItilOperationsRepository] Failed to persist incident in MariaDB:', err);
      }
    }

    return completeIncident;
  },

  /**
   * Update incident status
   */
  async updateIncidentStatus(incidentId: string, status: IncidentStatus, mitigationAction?: string): Promise<boolean> {
    const inc = inMemoryIncidents.find(i => i.id === incidentId);
    if (inc) {
      inc.status = status;
    }

    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          `UPDATE operations_incidents SET status = ?, resolution_summary = COALESCE(?, resolution_summary), updated_at = NOW() WHERE id = ?`,
          [status, mitigationAction || null, incidentId]
        );
      } catch (err) {
        console.warn('[ItilOperationsRepository] DB update failed:', err);
      }
    }
    return true;
  },

  /**
   * Dispatch and store multi-channel alert
   */
  async saveAlert(alert: MultiChannelAlert): Promise<MultiChannelAlert> {
    inMemoryAlerts.unshift(alert);
    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO alert_notifications (
            id, incident_id, severity, channel, recipient, message, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        for (const ch of alert.channels) {
          const rec = ch === 'sms' ? alert.recipientPhone : alert.recipientEmail;
          await executeQuery(sql, [
            `${alert.id}-${ch}`,
            alert.incidentId,
            alert.severity,
            ch,
            rec || 'admin@altil.com',
            alert.message,
            'DELIVERED'
          ]);
        }
      } catch (err) {
        console.warn('[ItilOperationsRepository] Alert DB save warning:', err);
      }
    }
    return alert;
  },

  /**
   * Get RAG Knowledge Base articles
   */
  async getRagArticles(): Promise<RagKnowledgeArticle[]> {
    return inMemoryRagArticles;
  }
};
