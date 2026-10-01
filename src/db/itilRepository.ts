import { randomUUID } from 'crypto';
import { executeQuery, executeTransaction, isDatabaseConnected } from './mariadb';
import { Incident, IncidentStatus, MultiChannelAlert, RagKnowledgeArticle } from '../types';
import { INITIAL_INCIDENTS_LIST, INITIAL_ALERTS_LIST, INITIAL_RAG_KNOWLEDGE_BASE } from '../data/incidentData';

let inMemoryIncidents: Incident[] = [...INITIAL_INCIDENTS_LIST];
let inMemoryAlerts: MultiChannelAlert[] = [...INITIAL_ALERTS_LIST];
let inMemoryRagArticles: RagKnowledgeArticle[] = [...INITIAL_RAG_KNOWLEDGE_BASE];
const inMemoryIncidentEvents: Array<{ id: string; incidentId: string; actor: string; type: string; tenantId: string; createdAt: string }> = [];

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
          sql += ` WHERE tenant_id = ?`;
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
    if (tenantId && tenantId !== 'all') return inMemoryIncidents.filter(incident => incident.affectedTenantIds?.includes(tenantId));
    return inMemoryIncidents;
  },

  /**
   * Create or update incident
   */
  async saveIncident(incident: any, audit?: { actor: string; eventType: string; tenantId: string; requestId?: string; priorState?: unknown; newState?: unknown }): Promise<Incident> {
    const completeIncident: Incident = {
      id: incident.id,
      title: incident.title || 'New Incident',
      severity: incident.severity || 'P2_HIGH',
      status: incident.status || 'investigating',
      commander: incident.commander || 'NOC Commander',
      assignedTeam: incident.assignedTeam || 'NOC',
      assignedEngineer: incident.assignedEngineer || 'Tebogo Molefe',
      affectedTenantIds: incident.affectedTenantIds || (incident.tenantId ? [incident.tenantId] : []),
      affectedTenantNames: incident.affectedTenantNames || ['Enterprise Tenant'],
      affectedAppIds: incident.affectedAppIds || [],
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

    if (isDatabaseConnected()) {
      try {
        const tenantCandidate = audit?.tenantId || completeIncident.affectedTenantIds[0];
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
        const params = [
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
        ];
        const statements = [{ sql, params }];
        if (audit) statements.push({ sql: 'INSERT INTO incident_events (id, incident_id, actor_email, event_type, description, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())', params: [`evt-${randomUUID()}`, completeIncident.id, audit.actor, audit.eventType, `Incident ${audit.eventType.toLowerCase()} by authenticated operator.`, JSON.stringify({ tenantId: audit.tenantId, requestId: audit.requestId || null, priorState: audit.priorState ?? null, newState: audit.newState ?? null })] });
        await executeTransaction(statements);
      } catch (err) {
        throw err;
      }
    }

    const idx = inMemoryIncidents.findIndex(i => i.id === completeIncident.id);
    if (idx >= 0) inMemoryIncidents[idx] = completeIncident;
    else inMemoryIncidents.unshift(completeIncident);

    if (audit) inMemoryIncidentEvents.unshift({ id: `evt-${randomUUID()}`, incidentId: completeIncident.id, actor: audit.actor, type: audit.eventType, tenantId: audit.tenantId, createdAt: new Date().toISOString() });

    return completeIncident;
  },

  /**
   * Update incident status
   */
  async updateIncidentStatus(incidentId: string, tenantId: string, status: IncidentStatus, mitigationAction?: string, audit?: { actor: string; requestId?: string; priorStatus?: string }): Promise<boolean> {
    const inc = inMemoryIncidents.find(i => i.id === incidentId && i.affectedTenantIds?.includes(tenantId));

    if (isDatabaseConnected()) {
      try {
        const statements = [{ sql: 'UPDATE operations_incidents SET status = ?, resolution_summary = COALESCE(?, resolution_summary), updated_at = NOW() WHERE id = ? AND tenant_id = ?', params: [status, mitigationAction || null, incidentId, tenantId] }];
        if (audit) statements.push({ sql: 'INSERT INTO incident_events (id, incident_id, actor_email, event_type, description, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())', params: [`evt-${randomUUID()}`, incidentId, audit.actor, 'STATUS_CHANGE', `Incident status changed to ${status}.`, JSON.stringify({ tenantId, requestId: audit.requestId || null, priorStatus: audit.priorStatus || null, newStatus: status })] });
        await executeTransaction(statements);
      } catch (err) {
        throw err;
      }
    }
    if (inc) inc.status = status;
    if (audit) inMemoryIncidentEvents.unshift({ id: `evt-${randomUUID()}`, incidentId, actor: audit.actor, type: 'STATUS_CHANGE', tenantId, createdAt: new Date().toISOString() });
    return true;
  },

  getIncidentAuditEvents() { return [...inMemoryIncidentEvents]; },

  /**
   * Dispatch and store multi-channel alert
   */
  async saveAlert(alert: MultiChannelAlert, audit?: { actor: string; tenantId: string; requestId?: string }): Promise<MultiChannelAlert> {
    if (isDatabaseConnected()) {
      const sql = `
          INSERT INTO alert_notifications (
            id, incident_id, severity, channel, recipient, message, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
      const statements = alert.channels.map(ch => {
        const rec = ch === 'sms' ? alert.recipientPhone : ch === 'email' ? alert.recipientEmail : null;
        return { sql, params: [
            `${alert.id}-${ch}`,
            alert.incidentId,
            alert.severity,
            ch,
            rec,
            alert.message,
            'QUEUED'
          ] };
      });
      if (audit) statements.push({ sql: 'INSERT INTO incident_events (id, incident_id, actor_email, event_type, description, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())', params: [`evt-${randomUUID()}`, alert.incidentId, audit.actor, 'ALERT_QUEUED', 'An incident alert was queued by an authorized operator.', JSON.stringify({ tenantId: audit.tenantId, requestId: audit.requestId || null, alertId: alert.id, channels: alert.channels })] });
      await executeTransaction(statements);
    }
    inMemoryAlerts.unshift(alert);
    if (audit) inMemoryIncidentEvents.unshift({ id: `evt-${randomUUID()}`, incidentId: alert.incidentId, actor: audit.actor, type: 'ALERT_QUEUED', tenantId: audit.tenantId, createdAt: new Date().toISOString() });
    return alert;
  },

  /**
   * Get RAG Knowledge Base articles
   */
  async getRagArticles(): Promise<RagKnowledgeArticle[]> {
    return inMemoryRagArticles;
  }
};
