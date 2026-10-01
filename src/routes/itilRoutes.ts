import { randomUUID } from 'crypto';
import express from 'express';
import { ItilOperationsRepository } from '../db/itilRepository';
import { executeQuery, isDatabaseConnected } from '../db/mariadb';
import {
  requireAuthentication,
  requireRole,
  requirePermission,
  requireTenantAccess,
  AuthenticatedRequest
} from '../middleware/authMiddleware';
import { resolveAuthorizedTenantTarget } from '../security/tenantTarget';
import { canAccessIncidentTenant, resolveIncidentReadScope } from '../security/incidentAuthorization';
import { organizationsAuthorizedFor } from '../security/authorizationContext';

export const itilRouter = express.Router();

/**
 * GET /api/v1/itil/incidents
 * Retrieve all incidents with tenant isolation
 */
itilRouter.get('/incidents', requireAuthentication, requirePermission('tenant.read'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantFilter = resolveIncidentReadScope({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.query.tenantId as string | undefined });
    if (!tenantFilter) return res.status(403).json({ error: 'Incident scope is not authorized.' });
    const incidents = await ItilOperationsRepository.getIncidents(tenantFilter);
    const visibleTenantIds = tenantFilter === 'all' ? new Set(organizationsAuthorizedFor(req.user?.authorization, 'tenant.read')) : null;
    const scopedIncidents = visibleTenantIds ? incidents.filter(incident => incident.affectedTenantIds?.some(id => visibleTenantIds.has(id))) : incidents;
    res.json(scopedIncidents);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve ITIL incidents.' });
  }
});

/**
 * POST /api/v1/itil/incidents
 * Declare or update an incident
 */
itilRouter.post(
  '/incidents',
  requireAuthentication,
  requirePermission('tenant.update'),
  requireRole(['SUPER_ADMIN', 'INCIDENT_COMMANDER', 'TENANT_ADMIN', 'SRE_ENGINEER']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const incidentData = { ...(req.body || {}) };
      if (!incidentData.id) {
        incidentData.id = `INC-${randomUUID()}`;
      } else if (typeof incidentData.id !== 'string' || incidentData.id.length > 64 || !/^[A-Za-z0-9_-]+$/.test(incidentData.id)) {
        return res.status(400).json({ error: 'Incident identifier is invalid.' });
      }

      const tenantId = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: incidentData.tenantId, requiredPermission: 'tenant.update' });
      if (!tenantId || !canAccessIncidentTenant(req.user?.authorization, tenantId, 'tenant.update')) return res.status(403).json({ error: 'Incident tenant is outside the authorized scope.' });
      if ((await ItilOperationsRepository.getIncidents('all')).some(item => item.id === incidentData.id)) return res.status(409).json({ error: 'Incident identifier already exists.' });
      if (typeof incidentData.title !== 'string' || incidentData.title.trim().length < 1 || incidentData.title.length > 200 || typeof (incidentData.summary || incidentData.description || '') !== 'string' || String(incidentData.summary || incidentData.description || '').length > 4000) return res.status(400).json({ error: 'Incident details are invalid.' });
      if (incidentData.affectedTenantIds !== undefined && (!Array.isArray(incidentData.affectedTenantIds) || incidentData.affectedTenantIds.length !== 1 || incidentData.affectedTenantIds[0] !== tenantId)) return res.status(403).json({ error: 'Incident references must remain within the authorized tenant.' });
      if (incidentData.affectedAppIds !== undefined && (!Array.isArray(incidentData.affectedAppIds) || incidentData.affectedAppIds.length > 20 || incidentData.affectedAppIds.some((id: unknown) => typeof id !== 'string' || id.length > 128))) return res.status(400).json({ error: 'Incident application references are invalid.' });
      const appIds = incidentData.affectedAppIds || [];
      if (appIds.length) {
        if (!isDatabaseConnected()) return res.status(503).json({ error: 'Application relationship verification is unavailable.' });
        const ownedApps = await executeQuery<any>(`SELECT id FROM tenant_applications WHERE tenant_id=? AND id IN (${appIds.map(() => '?').join(',')})`, [tenantId, ...appIds]);
        if (ownedApps.length !== new Set(appIds).size) return res.status(403).json({ error: 'Incident references an application outside the authorized tenant.' });
      }
      incidentData.tenantId = tenantId;
      incidentData.affectedTenantIds = [tenantId];
      incidentData.affectedAppIds = appIds;

      const saved = await ItilOperationsRepository.saveIncident(incidentData, { actor: req.user.email, eventType: 'CREATE', tenantId, requestId: String(req.headers['x-request-id'] || '').slice(0, 128), priorState: null, newState: { status: incidentData.status || 'investigating' } });
      res.status(201).json({ status: 'ok', incident: saved, ...saved });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save ITIL incident.' });
    }
  }
);

/**
 * PUT /api/v1/itil/incidents/:id
 * Update incident details
 */
itilRouter.put(
  '/incidents/:id',
  requireAuthentication,
  requirePermission('tenant.update'),
  requireRole(['SUPER_ADMIN', 'INCIDENT_COMMANDER', 'TENANT_ADMIN', 'SRE_ENGINEER']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.body?.tenantId, requiredPermission: 'tenant.update' });
      if (!tenantId || !canAccessIncidentTenant(req.user?.authorization, tenantId, 'tenant.update')) return res.status(403).json({ error: 'Incident scope is not authorized.' });
      const existing = (await ItilOperationsRepository.getIncidents(tenantId)).find(item => item.id === req.params.id);
      if (!existing) return res.status(404).json({ error: 'Incident not found.' });
      const incidentData = { ...req.body, id: req.params.id };
      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'tenantId') && req.body.tenantId !== tenantId) return res.status(403).json({ error: 'Incident tenant cannot be reassigned.' });
      incidentData.tenantId = tenantId;
      if (incidentData.affectedTenantIds !== undefined && (!Array.isArray(incidentData.affectedTenantIds) || incidentData.affectedTenantIds.length !== 1 || incidentData.affectedTenantIds[0] !== tenantId)) return res.status(403).json({ error: 'Incident references must remain within the authorized tenant.' });
      const appIds = incidentData.affectedAppIds || existing.affectedAppIds || [];
      if (!Array.isArray(appIds) || appIds.length > 20 || appIds.some((id: unknown) => typeof id !== 'string' || id.length > 128)) return res.status(400).json({ error: 'Incident application references are invalid.' });
      if (appIds.length) {
        if (!isDatabaseConnected()) return res.status(503).json({ error: 'Application relationship verification is unavailable.' });
        const ownedApps = await executeQuery<any>(`SELECT id FROM tenant_applications WHERE tenant_id=? AND id IN (${appIds.map(() => '?').join(',')})`, [tenantId, ...appIds]);
        if (ownedApps.length !== new Set(appIds).size) return res.status(403).json({ error: 'Incident references an application outside the authorized tenant.' });
      }
      incidentData.affectedTenantIds = [tenantId];
      incidentData.affectedAppIds = appIds;
      const saved = await ItilOperationsRepository.saveIncident(incidentData, { actor: req.user.email, eventType: 'UPDATE', tenantId, requestId: String(req.headers['x-request-id'] || '').slice(0, 128), priorState: { status: existing.status }, newState: { status: incidentData.status || existing.status } });
      res.json({ status: 'ok', incident: saved, ...saved });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update ITIL incident.' });
    }
  }
);

/**
 * PATCH /api/v1/itil/incidents/:id/status
 * Update incident status / 1-click mitigation
 */
itilRouter.patch(
  '/incidents/:id/status',
  requireAuthentication,
  requirePermission('tenant.update'),
  requireRole(['SUPER_ADMIN', 'INCIDENT_COMMANDER', 'TENANT_ADMIN', 'SRE_ENGINEER']),
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { status, mitigationAction } = req.body;
    try {
      const tenantId = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.body?.tenantId, requiredPermission: 'tenant.update' });
      if (!tenantId || !canAccessIncidentTenant(req.user?.authorization, tenantId, 'tenant.update')) return res.status(403).json({ error: 'Incident scope is not authorized.' });
      const existing = (await ItilOperationsRepository.getIncidents(tenantId)).find(item => item.id === id);
      if (!existing) return res.status(404).json({ error: 'Incident not found.' });
      if (!['reported', 'investigating', 'assigned', 'mitigated', 'resolved', 'closed'].includes(status)) return res.status(400).json({ error: 'Incident status is invalid.' });
      if (mitigationAction !== undefined && (typeof mitigationAction !== 'string' || mitigationAction.length > 2000)) return res.status(400).json({ error: 'Mitigation details are invalid.' });
      await ItilOperationsRepository.updateIncidentStatus(id, tenantId, status, mitigationAction, { actor: req.user.email, requestId: String(req.headers['x-request-id'] || '').slice(0, 128), priorStatus: existing.status });
      res.json({ status: 'updated', incidentId: id, newStatus: status });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update incident status.' });
    }
  }
);

/**
 * POST /api/v1/itil/alerts
 * Dispatch multi-channel emergency alert
 */
itilRouter.post(
  '/alerts',
  requireAuthentication,
  requirePermission('tenant.update'),
  requireRole(['SUPER_ADMIN', 'INCIDENT_COMMANDER', 'SECURITY_ADMIN']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const input = req.body || {};
      if (typeof input.incidentId !== 'string' || typeof input.message !== 'string' || input.message.length > 2000 || !Array.isArray(input.channels) || !input.channels.length || input.channels.length > 3 || input.channels.some((channel: unknown) => !['sms', 'email', 'in_app'].includes(String(channel)))) return res.status(400).json({ error: 'Alert details are invalid.' });
      if (input.channels.includes('email') && (typeof input.recipientEmail !== 'string' || input.recipientEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.recipientEmail))) return res.status(400).json({ error: 'A valid alert email recipient is required.' });
      if (input.channels.includes('sms') && (typeof input.recipientPhone !== 'string' || !/^\+[1-9]\d{7,14}$/.test(input.recipientPhone))) return res.status(400).json({ error: 'A valid E.164 alert phone recipient is required.' });
      const tenantId = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: input.tenantId, requiredPermission: 'tenant.update' });
      if (!tenantId || !canAccessIncidentTenant(req.user?.authorization, tenantId, 'tenant.update')) return res.status(403).json({ error: 'Alert tenant is outside the authorized scope.' });
      const incident = (await ItilOperationsRepository.getIncidents(tenantId)).find(item => item.id === input.incidentId);
      if (!incident) return res.status(404).json({ error: 'Incident not found.' });
      const alertData = {
        id: `alt-${randomUUID()}`,
        incidentId: incident.id,
        incidentTitle: incident.title,
        severity: incident.severity,
        timestamp: new Date().toISOString(),
        message: input.message,
        channels: [...new Set(input.channels as ('sms' | 'email' | 'in_app')[])],
        recipientPhone: input.channels.includes('sms') ? input.recipientPhone : undefined,
        recipientEmail: input.channels.includes('email') ? input.recipientEmail : undefined,
        smsStatus: 'queued' as const,
        emailStatus: 'queued' as const,
        inAppStatus: 'read' as const,
        isRead: false,
      };
      const saved = await ItilOperationsRepository.saveAlert(alertData, { actor: req.user.email, tenantId, requestId: String(req.headers['x-request-id'] || '').slice(0, 128) });
      res.status(202).json({ status: 'queued', alert: { id: saved.id, incidentId: saved.incidentId, tenantId, channels: saved.channels } });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to dispatch alert', details: err.message });
    }
  }
);

/**
 * GET /api/v1/itil/rag/articles
 * Knowledge Base articles
 */
itilRouter.get('/rag/articles', requireAuthentication, requireRole(['SUPER_ADMIN', 'INCIDENT_COMMANDER', 'TENANT_ADMIN', 'SRE_ENGINEER', 'SECURITY_ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const articles = await ItilOperationsRepository.getRagArticles();
    res.json(articles);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch knowledge base articles', details: err.message });
  }
});

/**
 * GET /api/v1/itil/cmdb
 * ITIL Configuration Management Database (CMDB) configuration items
 */
itilRouter.get('/cmdb', requireAuthentication, requirePermission('tenant.read'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = resolveIncidentReadScope({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.query.tenantId as string | undefined });
    if (!tenantId) return res.status(403).json({ error: 'CMDB scope is not authorized.' });
    if (isDatabaseConnected()) {
      const visible = tenantId === 'all' ? organizationsAuthorizedFor(req.user?.authorization, 'tenant.read') : [tenantId];
      if (!visible.length) return res.json([]);
      const rows = await executeQuery<any>(`SELECT c.*, t.type_code FROM cmdb_items c LEFT JOIN cmdb_item_types t ON t.id=c.item_type_id WHERE c.tenant_id IN (${visible.map(() => '?').join(',')}) ORDER BY c.created_at DESC`, visible);
      return res.json(rows.map(row => ({ id:row.id, name:row.name, type:String(row.type_code || 'configuration_item').toLowerCase(), status:String(row.status || 'operational').toLowerCase(), tenantId:row.tenant_id, code:row.ci_code, environment:row.environment, criticality:row.criticality, attributes:row.attributes })));
    }
    const { initialCmdbNodes } = await import('../data/initialState');
    const visible = tenantId === 'all' ? new Set(organizationsAuthorizedFor(req.user?.authorization, 'tenant.read')) : new Set([tenantId]);
    res.json((initialCmdbNodes || []).filter((item: any) => item.tenantId && visible.has(item.tenantId)));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch CMDB items', details: err.message });
  }
});

/**
 * GET /api/v1/itil/problems
 * Root cause problems registry
 */
itilRouter.get('/problems', requireAuthentication, requirePermission('tenant.read'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = resolveIncidentReadScope({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.query.tenantId as string | undefined });
    if (!tenantId) return res.status(403).json({ error: 'Problem scope is not authorized.' });
    if (isDatabaseConnected()) {
      const visible = tenantId === 'all' ? organizationsAuthorizedFor(req.user?.authorization, 'tenant.read') : [tenantId];
      if (!visible.length) return res.json([]);
      const rows = await executeQuery<any>(`SELECT * FROM operations_problems WHERE tenant_id IN (${visible.map(() => '?').join(',')}) ORDER BY created_at DESC`, visible);
      return res.json(rows.map(row => ({ id:row.id, tenantId:row.tenant_id, title:row.title, rootCause:row.description, rootCauseCategory:row.root_cause_category, affectedServices:[], relatedIncidentIds:[], correctiveAction:row.permanent_fix || '', preventiveAction:row.workaround || '', knownError:Boolean(row.known_error), status:String(row.status || 'OPEN').toLowerCase(), createdAt:row.created_at })));
    }
    const { INITIAL_PROBLEMS_LIST } = await import('../data/incidentData');
    const visible = tenantId === 'all' ? new Set(organizationsAuthorizedFor(req.user?.authorization, 'tenant.read')) : new Set([tenantId]);
    res.json((INITIAL_PROBLEMS_LIST || []).filter((item: any) => item.tenantId && visible.has(item.tenantId)));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch problems', details: err.message });
  }
});

/**
 * GET /api/v1/itil/changes
 * RFC / Change management records
 */
itilRouter.get('/changes', requireAuthentication, requirePermission('tenant.read'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = resolveIncidentReadScope({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.query.tenantId as string | undefined });
    if (!tenantId) return res.status(403).json({ error: 'Change scope is not authorized.' });
    if (isDatabaseConnected()) {
      const visible = tenantId === 'all' ? organizationsAuthorizedFor(req.user?.authorization, 'tenant.read') : [tenantId];
      if (!visible.length) return res.json([]);
      const rows = await executeQuery<any>(`SELECT * FROM change_requests WHERE tenant_id IN (${visible.map(() => '?').join(',')}) ORDER BY created_at DESC`, visible);
      return res.json(rows.map(row => ({ id:row.id, tenantId:row.tenant_id, changeNumber:row.change_number, title:row.title, type:String(row.change_type || 'STANDARD').toLowerCase(), risk:String(row.risk_level || 'MEDIUM').toLowerCase(), impactScope:row.impact_scope, backoutPlan:row.backout_plan, status:String(row.approval_status || 'PENDING').toLowerCase(), approvedBy:row.approved_by, plannedDate:row.scheduled_start, createdAt:row.created_at })));
    }
    const sampleChanges = [
      { id: 'RFC-2026-104', title: 'Deploy MariaDB Galera Cluster v10.11.18', risk: 'MEDIUM', status: 'APPROVED', plannedDate: '2026-09-01' },
      { id: 'RFC-2026-105', title: 'Upgrade Groq Inference Adapter to HTTP/2', risk: 'LOW', status: 'IMPLEMENTED', plannedDate: '2026-08-28' }
    ];
    res.json([]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch changes', details: err.message });
  }
});
