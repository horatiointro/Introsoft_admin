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

/**
 * GET /api/v1/compliance/scenarios
 * Returns enterprise traffic scenarios for simulation
 */
complianceRouter.get(
  '/scenarios',
  requireAuthentication,
  async (_req: AuthenticatedRequest, res) => {
    try {
      const { COMPANY_TRAFFIC_SCENARIOS } = await import('../utils/complianceSimulationEngine');
      res.json(COMPANY_TRAFFIC_SCENARIOS);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve scenarios', details: err.message });
    }
  }
);

/**
 * POST /api/v1/compliance/simulate-traffic
 * Simulates company requests with POPIA/GDPR law-breakers, tokenizes, inspects egress, and persists to DB
 */
complianceRouter.post(
  '/simulate-traffic',
  requireAuthentication,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { scenarioId, runAll, customPrompt, companyName } = req.body;
      const {
        COMPANY_TRAFFIC_SCENARIOS,
        executeComplianceSimulation
      } = await import('../utils/complianceSimulationEngine');

      if (runAll) {
        const results = [];
        for (const scen of COMPANY_TRAFFIC_SCENARIOS) {
          const packet = executeComplianceSimulation(scen);
          await ComplianceRepository.saveSimulationPacket(packet);
          results.push(packet);
        }
        return res.json({ success: true, count: results.length, packets: results });
      }

      let selectedScenario = COMPANY_TRAFFIC_SCENARIOS.find(s => s.id === scenarioId);
      if (!selectedScenario && customPrompt) {
        selectedScenario = {
          id: `scen-custom-${Date.now()}`,
          companyName: companyName || 'Ad-Hoc Enterprise Client',
          companyId: req.user?.tenantId || 'cust-adhoc',
          sourceApp: 'Custom Ingress Gateway API',
          industry: 'Financial & Multi-Tenant Services',
          requestedCapability: 'general_ai',
          preferredProvider: 'openai',
          preferredModel: 'gpt-4o',
          scenarioDescription: 'Ad-hoc live corporate stream with embedded regulatory flags',
          tags: ['Live Ad-Hoc Stream', 'POPIA / GDPR Check'],
          rawPrompt: customPrompt,
          simulatedRawModelResponse: `AI Inference processed input payload containing prompt context. Summary generated.`
        };
      } else if (!selectedScenario) {
        // Pick a random scenario
        const randIdx = Math.floor(Math.random() * COMPANY_TRAFFIC_SCENARIOS.length);
        selectedScenario = COMPANY_TRAFFIC_SCENARIOS[randIdx];
      }

      const packet = executeComplianceSimulation(selectedScenario);
      await ComplianceRepository.saveSimulationPacket(packet);

      return res.json({ success: true, packet });
    } catch (err: any) {
      return res.status(500).json({ error: 'Simulation execution failed', details: err.message });
    }
  }
);

/**
 * GET /api/v1/compliance/simulated-logs
 * Retrieves simulated traffic audit records from database
 */
complianceRouter.get(
  '/simulated-logs',
  requireAuthentication,
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.query.tenantId as string;
      const packets = await ComplianceRepository.getSimulationPackets(tenantId);
      res.json(packets);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve simulation logs', details: err.message });
    }
  }
);

/**
 * DELETE /api/v1/compliance/simulated-logs
 * Clears simulation logs from database and memory
 */
complianceRouter.delete(
  '/simulated-logs',
  requireAuthentication,
  async (_req: AuthenticatedRequest, res) => {
    try {
      await ComplianceRepository.clearSimulationLogs();
      res.json({ success: true, message: 'Simulation logs and token vault cleared successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to clear simulation logs', details: err.message });
    }
  }
);

/**
 * GET /api/v1/compliance/token-vault
 * Retrieves token vault mapping records from database
 */
complianceRouter.get(
  '/token-vault',
  requireAuthentication,
  async (_req: AuthenticatedRequest, res) => {
    try {
      const tokens = await ComplianceRepository.getTokenVaultRecords();
      res.json(tokens);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve token vault records', details: err.message });
    }
  }
);
