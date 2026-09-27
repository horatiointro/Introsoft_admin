import express from 'express';
import { ItilOperationsRepository } from '../db/itilRepository';
import { executeQuery, isDatabaseConnected } from '../db/mariadb';
import {
  requireAuthentication,
  requireRole,
  requireTenantAccess,
  AuthenticatedRequest
} from '../middleware/authMiddleware';

export const itilRouter = express.Router();

/**
 * GET /api/v1/itil/incidents
 * Retrieve all incidents with tenant isolation
 */
itilRouter.get('/incidents', requireAuthentication, async (req: AuthenticatedRequest, res) => {
  try {
    const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('AUDITOR');
    const tenantFilter = isSuperAdmin
      ? ((req.query.tenantId as string) || undefined)
      : (req.user?.tenantId || undefined);

    const incidents = await ItilOperationsRepository.getIncidents(tenantFilter);
    res.json(incidents);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve ITIL incidents', details: err.message });
  }
});

/**
 * POST /api/v1/itil/incidents
 * Declare or update an incident
 */
itilRouter.post(
  '/incidents',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'INCIDENT_COMMANDER', 'TENANT_ADMIN', 'SRE_ENGINEER']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const incidentData = req.body;
      if (!incidentData.id) {
        incidentData.id = `INC-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
      }

      // Enforce tenant boundary for non-super-admins
      const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN');
      if (!isSuperAdmin && req.user?.tenantId) {
        incidentData.tenantId = req.user.tenantId;
      }

      const saved = await ItilOperationsRepository.saveIncident(incidentData);
      res.status(201).json({ status: 'ok', incident: saved, ...saved });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save ITIL incident', details: err.message });
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
  requireRole(['SUPER_ADMIN', 'INCIDENT_COMMANDER', 'TENANT_ADMIN', 'SRE_ENGINEER']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const incidentData = { ...req.body, id: req.params.id };
      const saved = await ItilOperationsRepository.saveIncident(incidentData);
      res.json({ status: 'ok', incident: saved, ...saved });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update ITIL incident', details: err.message });
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
  requireRole(['SUPER_ADMIN', 'INCIDENT_COMMANDER', 'TENANT_ADMIN', 'SRE_ENGINEER']),
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { status, mitigationAction } = req.body;
    try {
      await ItilOperationsRepository.updateIncidentStatus(id, status, mitigationAction);
      res.json({ status: 'updated', incidentId: id, newStatus: status });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update incident status', details: err.message });
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
  requireRole(['SUPER_ADMIN', 'INCIDENT_COMMANDER', 'SECURITY_ADMIN']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const alertData = req.body;
      if (!alertData.id) {
        alertData.id = `alt-${Date.now().toString(36)}`;
      }
      const saved = await ItilOperationsRepository.saveAlert(alertData);
      res.json({ status: 'dispatched', alert: saved });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to dispatch alert', details: err.message });
    }
  }
);

/**
 * GET /api/v1/itil/rag/articles
 * Knowledge Base articles
 */
itilRouter.get('/rag/articles', requireAuthentication, async (req: AuthenticatedRequest, res) => {
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
itilRouter.get('/cmdb', requireAuthentication, async (req: AuthenticatedRequest, res) => {
  try {
    if (isDatabaseConnected()) {
      const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('AUDITOR');
      const tenantId = isSuperAdmin ? String(req.query.tenantId || '') : String(req.user?.tenantId || '');
      const rows = tenantId
        ? await executeQuery<any>('SELECT c.*, t.type_code FROM cmdb_items c LEFT JOIN cmdb_item_types t ON t.id=c.item_type_id WHERE c.tenant_id=? OR c.tenant_id IS NULL ORDER BY c.created_at DESC', [tenantId])
        : await executeQuery<any>('SELECT c.*, t.type_code FROM cmdb_items c LEFT JOIN cmdb_item_types t ON t.id=c.item_type_id ORDER BY c.created_at DESC');
      return res.json(rows.map(row => ({ id:row.id, name:row.name, type:String(row.type_code || 'configuration_item').toLowerCase(), status:String(row.status || 'operational').toLowerCase(), tenantId:row.tenant_id, code:row.ci_code, environment:row.environment, criticality:row.criticality, attributes:row.attributes })));
    }
    const { initialCmdbNodes } = await import('../data/initialState');
    res.json(initialCmdbNodes || []);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch CMDB items', details: err.message });
  }
});

/**
 * GET /api/v1/itil/problems
 * Root cause problems registry
 */
itilRouter.get('/problems', requireAuthentication, async (req: AuthenticatedRequest, res) => {
  try {
    if (isDatabaseConnected()) {
      const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('AUDITOR');
      const tenantId = isSuperAdmin ? String(req.query.tenantId || '') : String(req.user?.tenantId || '');
      const rows = tenantId ? await executeQuery<any>('SELECT * FROM operations_problems WHERE tenant_id=? OR tenant_id IS NULL ORDER BY created_at DESC',[tenantId]) : await executeQuery<any>('SELECT * FROM operations_problems ORDER BY created_at DESC');
      return res.json(rows.map(row => ({ id:row.id, tenantId:row.tenant_id, title:row.title, rootCause:row.description, rootCauseCategory:row.root_cause_category, affectedServices:[], relatedIncidentIds:[], correctiveAction:row.permanent_fix || '', preventiveAction:row.workaround || '', knownError:Boolean(row.known_error), status:String(row.status || 'OPEN').toLowerCase(), createdAt:row.created_at })));
    }
    const { INITIAL_PROBLEMS_LIST } = await import('../data/incidentData');
    res.json(INITIAL_PROBLEMS_LIST || []);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch problems', details: err.message });
  }
});

/**
 * GET /api/v1/itil/changes
 * RFC / Change management records
 */
itilRouter.get('/changes', requireAuthentication, async (req: AuthenticatedRequest, res) => {
  try {
    if (isDatabaseConnected()) {
      const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('AUDITOR');
      const tenantId = isSuperAdmin ? String(req.query.tenantId || '') : String(req.user?.tenantId || '');
      const rows = tenantId ? await executeQuery<any>('SELECT * FROM change_requests WHERE tenant_id=? OR tenant_id IS NULL ORDER BY created_at DESC',[tenantId]) : await executeQuery<any>('SELECT * FROM change_requests ORDER BY created_at DESC');
      return res.json(rows.map(row => ({ id:row.id, tenantId:row.tenant_id, changeNumber:row.change_number, title:row.title, type:String(row.change_type || 'STANDARD').toLowerCase(), risk:String(row.risk_level || 'MEDIUM').toLowerCase(), impactScope:row.impact_scope, backoutPlan:row.backout_plan, status:String(row.approval_status || 'PENDING').toLowerCase(), approvedBy:row.approved_by, plannedDate:row.scheduled_start, createdAt:row.created_at })));
    }
    const sampleChanges = [
      { id: 'RFC-2026-104', title: 'Deploy MariaDB Galera Cluster v10.11.18', risk: 'MEDIUM', status: 'APPROVED', plannedDate: '2026-09-01' },
      { id: 'RFC-2026-105', title: 'Upgrade Groq Inference Adapter to HTTP/2', risk: 'LOW', status: 'IMPLEMENTED', plannedDate: '2026-08-28' }
    ];
    res.json(sampleChanges);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch changes', details: err.message });
  }
});
