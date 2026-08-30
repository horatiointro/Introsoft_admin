import express from 'express';
import { ComplianceRepository } from '../db/complianceRepository';
import {
  requireAuthentication,
  requireRole,
  requireTenantAccess,
  AuthenticatedRequest
} from '../middleware/authMiddleware';

export const complianceRouter = express.Router();

/**
 * GET /api/v1/compliance/config
 */
complianceRouter.get(
  '/config',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_OFFICER', 'AUDITOR']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const config = await ComplianceRepository.getConfig();
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve compliance configuration', details: err.message });
    }
  }
);

/**
 * PUT /api/v1/compliance/config
 */
complianceRouter.put(
  '/config',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_OFFICER']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const saved = await ComplianceRepository.saveConfig(req.body);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save compliance configuration', details: err.message });
    }
  }
);

/**
 * GET /api/v1/compliance/dsar & GET /api/v1/compliance/dsr
 */
const getDsarHandler = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('AUDITOR');
    const tenantFilter = isSuperAdmin
      ? ((req.query.tenantId as string) || undefined)
      : (req.user?.tenantId || undefined);

    const requests = await ComplianceRepository.getDsarRequests(tenantFilter);
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve DSAR records', details: err.message });
  }
};

complianceRouter.get('/dsar', requireAuthentication, getDsarHandler);
complianceRouter.get('/dsr', requireAuthentication, getDsarHandler);

/**
 * POST /api/v1/compliance/dsar & POST /api/v1/compliance/dsr
 */
const createDsarHandler = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const body = req.body;
    if (!body.id) {
      body.id = `DSR-${body.framework === 'GDPR' ? 'EU' : 'ZA'}-${Date.now().toString(36).toUpperCase()}`;
    }

    // Tenant isolation: non-super-admins cannot submit DSAR on behalf of another tenant
    const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN');
    if (!isSuperAdmin && req.user?.tenantId) {
      body.tenantId = req.user.tenantId;
    }

    const saved = await ComplianceRepository.saveDsarRequest(body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save DSAR request', details: err.message });
  }
};

complianceRouter.post(
  '/dsar',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'TENANT_ADMIN']),
  createDsarHandler
);
complianceRouter.post(
  '/dsr',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'TENANT_ADMIN']),
  createDsarHandler
);

/**
 * PUT /api/v1/compliance/dsar/:id & PUT /api/v1/compliance/dsr/:id
 */
const updateDsarHandler = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const body = { ...req.body, id: req.params.id };
    const saved = await ComplianceRepository.saveDsarRequest(body);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update DSAR request', details: err.message });
  }
};

complianceRouter.put(
  '/dsar/:id',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'TENANT_ADMIN']),
  updateDsarHandler
);
complianceRouter.put(
  '/dsr/:id',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'TENANT_ADMIN']),
  updateDsarHandler
);

/**
 * POST /api/v1/compliance/scan
 * Real-time POPIA / GDPR PII and regulatory compliance scanner
 */
complianceRouter.post(
  '/scan',
  requireAuthentication,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required for compliance scanning' });
      }

      const config = await ComplianceRepository.getConfig();
      const { scanAndSanitizePrompt } = await import('../utils/complianceEngine');
      
      const scanResult = scanAndSanitizePrompt(prompt, {
        popiaRules: config.popia,
        gdprRules: config.gdpr
      });

      const findings = [
        ...scanResult.popiaViolations.map(v => ({ framework: 'POPIA', ...v })),
        ...scanResult.gdprViolations.map(v => ({ framework: 'GDPR', ...v }))
      ];

      return res.json({
        sanitizedPrompt: scanResult.sanitizedPrompt,
        findings,
        actionTaken: scanResult.actionTaken,
        redacted: scanResult.sanitizedPrompt !== prompt,
        passed: scanResult.actionTaken !== 'BLOCKED'
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to execute compliance scan', details: err.message });
    }
  }
);
