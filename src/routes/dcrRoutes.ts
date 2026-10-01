import express from 'express';
import {
  requireAuthentication,
  requireRole,
  AuthenticatedRequest
} from '../middleware/authMiddleware';
import { DcrEngine } from '../utils/dcrEngine';
import { DcrRepository } from '../db/dcrRepository';
import { TransformationKeyService } from '../utils/dcrKeyService';
import { resolveAuthorizedTenantTarget } from '../security/tenantTarget';

export const dcrRouter = express.Router();

/**
 * POST /api/v1/dcr/classify
 * Analyzes text spans and classifies PII & regulatory data
 */
dcrRouter.post(
  '/classify',
  requireAuthentication,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { text, strategy } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text payload is required' });
      }
      const findings = DcrEngine.classifyPayload(text, strategy);
      res.json({ count: findings.length, findings });
    } catch (err: any) {
      res.status(500).json({ error: 'Classification failed', details: err.message });
    }
  }
);

/**
 * POST /api/v1/dcr/cloak
 * Executes DCR cloaking, generates surrogates, and stores encrypted originals in vault
 */
dcrRouter.post(
  '/cloak',
  requireAuthentication,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { text, strategy, scope, tenantId } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text payload is required' });
      }

      const activeTenant = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: tenantId });
      if (!activeTenant) return res.status(403).json({ error: 'DCR tenant is outside the authenticated scope.' });
      const result = await DcrEngine.cloakPayload(text, {
        tenantId: activeTenant,
        forcedStrategy: strategy,
        scope: scope || 'CONVERSATION'
      });

      res.json({
        success: true,
        cloakedText: result.cloakedText,
        transformationsCount: result.records.length,
        records: result.records,
        events: result.events
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Cloaking failed', details: err.message });
    }
  }
);

/**
 * POST /api/v1/dcr/reconstruct
 * Reconstructs AI response using cryptographically verified transformation records
 */
dcrRouter.post(
  '/reconstruct',
  requireAuthentication,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { responseText, requestId, tenantId } = req.body;
      if (!responseText) {
        return res.status(400).json({ error: 'Response text is required' });
      }

      const activeTenant = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: tenantId });
      if (!activeTenant) return res.status(403).json({ error: 'DCR tenant is outside the authenticated scope.' });
      const result = await DcrEngine.reconstructResponse(responseText, {
        tenantId: activeTenant,
        requestId
      });

      res.json({
        success: true,
        reconstructedText: result.reconstructedText,
        reconstructedItems: result.reconstructedItems,
        unreconstructedItems: result.unreconstructedItems
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Reconstruction failed', details: err.message });
    }
  }
);

/**
 * POST /api/v1/dcr/pipeline
 * Full end-to-end Cloak -> Inference -> Provenance Verification -> Reconstruction Pipeline
 */
dcrRouter.post(
  '/pipeline',
  requireAuthentication,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt, preferredStrategy, simulatedAiResponse, tenantId } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required for DCR pipeline' });
      }

      const activeTenant = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: tenantId });
      if (!activeTenant) return res.status(403).json({ error: 'DCR tenant is outside the authenticated scope.' });
      const result = await DcrEngine.runFullPipeline(prompt, {
        tenantId: activeTenant,
        preferredStrategy,
        simulatedAiResponse
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Pipeline execution failed', details: err.message });
    }
  }
);

/**
 * GET /api/v1/dcr/vault
 * Retrieves active transformation records with encrypted previews
 */
dcrRouter.get(
  '/vault',
  requireAuthentication,
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantFilter = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.query.tenantId as string | undefined, allowGlobalList: true });
      if (!tenantFilter) return res.status(403).json({ error: 'DCR tenant scope is required.' });

      const records = await DcrRepository.getTransformationRecords(tenantFilter);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve transformation vault', details: err.message });
    }
  }
);

/**
 * POST /api/v1/dcr/vault/reveal
 * DPO Authorized Decryption & Inspection of a Vault Record (Recorded in Audit Ledger)
 */
dcrRouter.post(
  '/vault/reveal',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_OFFICER']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { recordId } = req.body;
      if (!recordId) {
        return res.status(400).json({ error: 'Record ID is required' });
      }

      const isGlobal = req.user?.authorization?.grants.some(grant => grant.role === 'SUPER_ADMIN' && grant.visibility === 'GLOBAL') === true;
      const records = await DcrRepository.getTransformationRecords(isGlobal ? 'all' : req.user?.tenantId || undefined);
      const record = records.find(r => r.id === recordId);
      if (!record) {
        return res.status(404).json({ error: 'Transformation record not found in vault' });
      }

      const decrypted = TransformationKeyService.decrypt(record.originalValueCiphertext, record.keyReference);
      
      // Append Audit Log for Key Decryption
      const lastHash = DcrRepository.getLastEventHash();
      const evtHash = TransformationKeyService.computeEventHash(lastHash, {
        type: 'KEY_ACCESSED',
        recordId,
        actor: req.user?.email || 'DPO'
      });
      await DcrRepository.appendProvenanceEvent({
        eventId: `EVT-DCR-DPO-${Date.now()}`,
        eventType: 'KEY_ROTATED', // or vault inspection
        requestId: record.requestId,
        tenantId: record.tenantId,
        classification: record.classification,
        sourceHash: record.originalValueHash,
        surrogateHash: TransformationKeyService.hashValue(record.surrogateValue),
        transformationStrategy: record.transformationStrategy,
        provenanceCategory: 'ORIGINAL',
        policyVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        previousEventHash: lastHash,
        eventHash: evtHash,
        description: `DPO/Auditor (${req.user?.email || 'Super Admin'}) performed authorized vault decryption inspection.`
      });

      res.json({
        success: true,
        recordId: record.id,
        surrogateValue: record.surrogateValue,
        decryptedValue: decrypted,
        keyReference: record.keyReference,
        status: record.status
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to decrypt vault record', details: err.message });
    }
  }
);

/**
 * GET /api/v1/dcr/policies
 * Retrieves DCR policy and strategy rules
 */
dcrRouter.get(
  '/policies',
  requireAuthentication,
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantFilter = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.query.tenantId as string | undefined, allowGlobalList: true });
      if (!tenantFilter) return res.status(403).json({ error: 'DCR tenant scope is required.' });
      const policies = await DcrRepository.getDcrPolicyRules(tenantFilter);
      res.json(policies);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve DCR policies', details: err.message });
    }
  }
);

/**
 * POST /api/v1/dcr/policies
 * Creates or updates DCR policy rule
 */
dcrRouter.post(
  '/policies',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_OFFICER']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.body?.tenantId });
      if (!tenantId) return res.status(403).json({ error: 'DCR policy tenant is outside the authenticated scope.' });
      const saved = await DcrRepository.saveDcrPolicyRule({ ...req.body, tenantId });
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save DCR policy rule', details: err.message });
    }
  }
);

/**
 * GET /api/v1/dcr/ledger
 * Retrieves cryptographic provenance audit events
 */
dcrRouter.get(
  '/ledger',
  requireAuthentication,
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.query.tenantId as string | undefined });
      if (!tenantId) return res.status(403).json({ error: 'DCR tenant scope is required.' });
      const requestId = req.query.requestId as string;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const events = await DcrRepository.getProvenanceEvents(tenantId, requestId, limit);
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve provenance ledger', details: err.message });
    }
  }
);

/**
 * GET /api/v1/dcr/keys
 * Cryptographic keystore status and active key metadata
 */
dcrRouter.get(
  '/keys',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'SECURITY_ADMIN']),
  async (_req: AuthenticatedRequest, res) => {
    try {
      const keys = TransformationKeyService.getAllKeysMetadata();
      res.json(keys);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve cryptographic keystore', details: err.message });
    }
  }
);

/**
 * POST /api/v1/dcr/keys/rotate
 * Trigger cryptographic key rotation for a tenant
 */
dcrRouter.post(
  '/keys/rotate',
  requireAuthentication,
  requireRole(['SUPER_ADMIN', 'SECURITY_ADMIN']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = resolveAuthorizedTenantTarget({ context: req.user?.authorization, actorTenantId: req.user?.tenantId, requestedTenantId: req.body.tenantId });
      if (!tenantId) return res.status(403).json({ error: 'DCR tenant is outside the authenticated scope.' });
      const rotatedKey = TransformationKeyService.rotateKey(tenantId);
      res.json({ success: true, message: `Key rotated for tenant ${tenantId}`, key: rotatedKey });
    } catch (err: any) {
      res.status(500).json({ error: 'Key rotation failed', details: err.message });
    }
  }
);
