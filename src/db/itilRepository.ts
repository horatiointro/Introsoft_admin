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
        let sql = `SELECT * FROM itil_incidents`;
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
            title: r.title,
            severity: r.severity || 'P2_HIGH',
            status: r.status || 'investigating',
            commander: r.commander || r.assigned_to || 'NOC Commander',
            assignedTeam: (r.assigned_team as any) || 'NOC',
            assignedEngineer: r.assigned_engineer || r.assigned_to || undefined,
            affectedTenantIds: r.tenant_id ? [r.tenant_id] : ['cust-1'],
            affectedTenantNames: ['Introsoft Enterprise'],
            affectedAppIds: ['app-capitec-banking'],
            affectedAppNames: ['Capitec AI Assistant'],
            affectedServiceIds: [r.affected_service || 'srv-01'],
            startTime: r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19) : new Date().toISOString(),
            slaImpacted: Boolean(r.sla_breach),
            summary: r.description || r.title || '',
            category: (r.category as any) || 'API_Gateway',
            alertChannels: ['email', 'in_app'],
            smsAlertSent: false,
            emailAlertSent: true,
            inAppAlertSent: true,
            timeline: r.timeline ? (typeof r.timeline === 'string' ? JSON.parse(r.timeline) : r.timeline) : []
          }));
        }
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
        const sql = `
          INSERT INTO itil_incidents (
            id, title, description, severity, status, category, impact, urgency,
            affected_service, assigned_to, sla_breach, sla_time_remaining_min,
            mitigation_action, root_cause, timeline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            severity = VALUES(severity),
            status = VALUES(status),
            category = VALUES(category),
            affected_service = VALUES(affected_service),
            assigned_to = VALUES(assigned_to),
            timeline = VALUES(timeline),
            updated_at = NOW()
        `;
        await executeQuery(sql, [
          completeIncident.id,
          completeIncident.title,
          completeIncident.summary,
          completeIncident.severity,
          completeIncident.status,
          completeIncident.category,
          'MEDIUM',
          'MEDIUM',
          completeIncident.affectedServiceIds[0] || 'srv-01',
          completeIncident.commander,
          completeIncident.slaImpacted ? 1 : 0,
          120,
          '',
          '',
          JSON.stringify(completeIncident.timeline)
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
          `UPDATE itil_incidents SET status = ?, mitigation_action = COALESCE(?, mitigation_action), updated_at = NOW() WHERE id = ?`,
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
