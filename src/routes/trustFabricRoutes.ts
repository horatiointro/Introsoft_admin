import { Router, Response } from 'express';
import crypto from 'crypto';
import {
  Tenant,
  Principal,
  Identity,
  Device,
  Credential,
  Contract,
  Consent,
  TrustRelationship,
  EvidenceEvent
} from '../types';
import { AuthenticatedRequest, requireAuthentication } from '../middleware/authMiddleware';

export const trustFabricRouter = Router();

// In-memory Trust Fabric store (synchronized with enterprise database model)
let tenants: Tenant[] = [
  { id: 'tenant-enterprise-1', name: 'ACME Corporation (Pty) Ltd', domain: 'acme.co.za', status: 'ACTIVE', planId: 'plan-enterprise', createdAt: new Date().toISOString() },
  { id: 'tenant-healthcare-1', name: 'MediClinic SA Health Group', domain: 'mediclinic.co.za', status: 'ACTIVE', planId: 'plan-enterprise', createdAt: new Date().toISOString() },
  { id: 'tenant-fintech-1', name: 'Investec Private Bank', domain: 'investec.co.za', status: 'ACTIVE', planId: 'plan-enterprise', createdAt: new Date().toISOString() }
];

let principals: Principal[] = [
  { id: 'prin-1', tenantId: 'tenant-enterprise-1', principalType: 'ORGANISATION', displayName: 'ACME Corporate HQ', status: 'ACTIVE' },
  { id: 'prin-2', tenantId: 'tenant-enterprise-1', principalType: 'PERSON', displayName: 'Horatio Huxham (Security Officer)', status: 'ACTIVE' },
  { id: 'prin-3', tenantId: 'tenant-healthcare-1', principalType: 'ORGANISATION', displayName: 'MediClinic Sandton', status: 'ACTIVE' }
];

let identities: Identity[] = [
  { id: 'ident-1', principalId: 'prin-2', altilId: 'ALTIL-USR-8F72A91C', createdAt: new Date().toISOString() },
  { id: 'ident-2', principalId: 'prin-1', altilId: 'ALTIL-TNT-ACME001', createdAt: new Date().toISOString() }
];

let devices: Device[] = [
  { id: 'dev-1', identityId: 'ident-1', deviceFingerprintHash: 'sha256-a1b2c3d4e5f67890', secureEnclaveStatus: 'ACTIVE_ARM_TZ', trustLevel: 'ultra_secure', registeredAt: new Date().toISOString() }
];

let credentials: Credential[] = [
  { id: 'cred-1', tenantId: 'tenant-enterprise-1', principalId: 'prin-2', credentialType: 'USER_CREDENTIAL', keyPrefix: 'ALTIL_9f8e', keyHash: 'hashed_secret_token_1', scopes: ['read:inference', 'write:inference'], status: 'ACTIVE', createdAt: new Date().toISOString() }
];

let contracts: Contract[] = [
  { id: 'cont-1', tenantId: 'tenant-enterprise-1', contractType: 'MASTER_SERVICES_AGREEMENT', version: '2.4.0', effectiveDate: '2026-01-01', status: 'ACTIVE', termsReference: 'ALTIL-MSA-2026-REV4', acceptanceTimestamp: new Date().toISOString(), acceptingIdentityId: 'ident-1', evidenceReference: 'EV-GEN-001' }
];

let consents: Consent[] = [
  { id: 'cons-1', principalId: 'prin-2', tenantId: 'tenant-enterprise-1', purpose: 'AI Prompt Telemetry & POPIA Compliance Redaction', scope: ['pii_redaction', 'audit_logging'], policyVersionId: '1.0.0', granted: true, timestamp: new Date().toISOString(), evidenceReference: 'EV-CONS-001' }
];

let relationships: TrustRelationship[] = [
  { relationshipId: 'rel-1', sourceIdentityId: 'ident-1', targetIdentityId: 'ident-2', relationshipType: 'USER_TO_TENANT', status: 'ACTIVE', scope: ['admin', 'governance'], createdAt: new Date().toISOString(), effectiveAt: new Date().toISOString() }
];

let evidenceLedger: EvidenceEvent[] = [
  {
    eventId: 'EV-GEN-001',
    eventType: 'TRUST_BOOTSTRAP',
    tenantId: 'tenant-enterprise-1',
    principalId: 'prin-2',
    identityId: 'ident-1',
    applicationId: 'app-default',
    credentialId: 'cred-1',
    timestamp: new Date().toISOString(),
    actor: 'Horatio Huxham',
    action: 'INITIALIZE_TRUST_FABRIC',
    policyVersion: '1.0.0',
    previousEventHash: '00000000000000000000000000000000',
    eventHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    metadata: { source: 'genesis_block' }
  }
];

// Tenants CRUD
trustFabricRouter.get('/tenants', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  res.json(tenants);
});

trustFabricRouter.post('/tenants', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  const { name, domain, planId } = req.body;
  if (!name) return res.status(400).json({ error: 'Tenant name is required' });
  const newTenant: Tenant = {
    id: `tenant-${Date.now()}`,
    name,
    domain: domain || '',
    status: 'ACTIVE',
    planId: planId || 'plan-standard',
    createdAt: new Date().toISOString()
  };
  tenants.unshift(newTenant);
  res.status(201).json(newTenant);
});

// Principals CRUD
trustFabricRouter.get('/principals', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  res.json(principals);
});

trustFabricRouter.post('/principals', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId, principalType, displayName } = req.body;
  if (!tenantId || !displayName) return res.status(400).json({ error: 'tenantId and displayName are required' });
  const newPrincipal: Principal = {
    id: `prin-${Date.now()}`,
    tenantId,
    principalType: principalType || 'PERSON',
    displayName,
    status: 'ACTIVE'
  };
  principals.unshift(newPrincipal);
  res.status(201).json(newPrincipal);
});

// Identities CRUD
trustFabricRouter.get('/identities', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  res.json(identities);
});

trustFabricRouter.post('/identities', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  const { principalId, altilId } = req.body;
  if (!principalId) return res.status(400).json({ error: 'principalId is required' });
  const newIdentity: Identity = {
    id: `ident-${Date.now()}`,
    principalId,
    altilId: altilId || `ALTIL-ID-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    createdAt: new Date().toISOString()
  };
  identities.unshift(newIdentity);
  res.status(201).json(newIdentity);
});

// Devices CRUD
trustFabricRouter.get('/devices', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  res.json(devices);
});

trustFabricRouter.post('/devices', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  const { identityId, deviceFingerprintHash, trustLevel } = req.body;
  if (!identityId) return res.status(400).json({ error: 'identityId is required' });
  const newDevice: Device = {
    id: `dev-${Date.now()}`,
    identityId,
    deviceFingerprintHash: deviceFingerprintHash || crypto.randomBytes(8).toString('hex'),
    secureEnclaveStatus: 'ACTIVE',
    trustLevel: trustLevel || 'secure',
    registeredAt: new Date().toISOString()
  };
  devices.unshift(newDevice);
  res.status(201).json(newDevice);
});

// Credentials CRUD
trustFabricRouter.get('/credentials', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  res.json(credentials);
});

trustFabricRouter.post('/credentials', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId, principalId, credentialType, scopes } = req.body;
  if (!tenantId || !principalId) return res.status(400).json({ error: 'tenantId and principalId are required' });
  const randomSuffix = crypto.randomBytes(16).toString('hex');
  const rawKey = `ALTIL_${randomSuffix}`;
  const keyPrefix = `ALTIL_${randomSuffix.slice(0, 6)}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const newCredential: Credential = {
    id: `cred-${Date.now()}`,
    tenantId,
    principalId,
    credentialType: credentialType || 'APPLICATION_API_KEY',
    keyPrefix,
    keyHash,
    scopes: scopes || ['read:inference'],
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  credentials.unshift(newCredential);
  res.status(201).json({ credential: newCredential, rawApiKey: rawKey });
});

// Contracts CRUD
trustFabricRouter.get('/contracts', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  res.json(contracts);
});

trustFabricRouter.post('/contracts', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId, contractType, version, termsReference, acceptingIdentityId } = req.body;
  if (!tenantId || !contractType) return res.status(400).json({ error: 'tenantId and contractType are required' });
  const newContract: Contract = {
    id: `cont-${Date.now()}`,
    tenantId,
    contractType,
    version: version || '1.0.0',
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    termsReference: termsReference || 'Standard Enterprise Terms',
    acceptanceTimestamp: new Date().toISOString(),
    acceptingIdentityId: acceptingIdentityId || 'system',
    evidenceReference: `EV-${Date.now()}`
  };
  contracts.unshift(newContract);
  res.status(201).json(newContract);
});

// Consent CRUD
trustFabricRouter.get('/consent', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  res.json(consents);
});

trustFabricRouter.post('/consent', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  const { principalId, tenantId, purpose, scope } = req.body;
  if (!principalId || !tenantId || !purpose) return res.status(400).json({ error: 'principalId, tenantId, and purpose are required' });
  const newConsent: Consent = {
    id: `cons-${Date.now()}`,
    principalId,
    tenantId,
    purpose,
    scope: scope || ['pii_redaction'],
    policyVersionId: '1.0.0',
    granted: true,
    timestamp: new Date().toISOString(),
    evidenceReference: `EV-CONS-${Date.now()}`
  };
  consents.unshift(newConsent);
  res.status(201).json(newConsent);
});

// Trust Relationships
trustFabricRouter.get('/relationships', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  res.json(relationships);
});

trustFabricRouter.post('/relationships', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  const { sourceIdentityId, targetIdentityId, relationshipType, scope } = req.body;
  if (!sourceIdentityId || !targetIdentityId) return res.status(400).json({ error: 'sourceIdentityId and targetIdentityId are required' });
  const newRel: TrustRelationship = {
    relationshipId: `rel-${Date.now()}`,
    sourceIdentityId,
    targetIdentityId,
    relationshipType: relationshipType || 'USER_TO_TENANT',
    status: 'ACTIVE',
    scope: scope || ['governance'],
    createdAt: new Date().toISOString(),
    effectiveAt: new Date().toISOString()
  };
  relationships.unshift(newRel);
  res.status(201).json(newRel);
});

// Evidence Ledger
trustFabricRouter.get('/evidence', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  res.json(evidenceLedger);
});

trustFabricRouter.post('/evidence', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  const { eventType, tenantId, principalId, identityId, action, metadata } = req.body;
  const prevHash = evidenceLedger.length > 0 ? evidenceLedger[0].eventHash : '00000000000000000000000000000000';
  const payload = JSON.stringify({ eventType, tenantId, principalId, identityId, action, metadata, prevHash });
  const eventHash = crypto.createHash('sha256').update(payload).digest('hex');

  const newEv: EvidenceEvent = {
    eventId: `EV-${Date.now()}`,
    eventType: eventType || 'CUSTOM_EVENT',
    tenantId: tenantId || 'tenant-enterprise-1',
    principalId: principalId || 'prin-1',
    identityId: identityId || 'ident-1',
    applicationId: 'app-default',
    credentialId: 'cred-1',
    timestamp: new Date().toISOString(),
    actor: 'ALTIL Trusted Gateway',
    action: action || 'RECORD_EVIDENCE',
    policyVersion: '1.0.0',
    previousEventHash: prevHash,
    eventHash,
    metadata: metadata || {}
  };
  evidenceLedger.unshift(newEv);
  res.status(201).json(newEv);
});
