import { randomUUID } from 'node:crypto';

export type EventEnvironment = 'production' | 'development' | 'local-test';
export type EventCategory = 'APPLICATION_LOG' | 'API_REQUEST' | 'AUTHORIZATION' | 'AUDIT' | 'SECURITY_EVENT' | 'ERROR';
export type EventOutcome = 'SUCCESS' | 'DENIED' | 'FAILURE' | 'INFO';

export interface AltilEvent {
  schemaVersion: 1;
  id: string;
  timestamp: string;
  environment: EventEnvironment;
  testRunId?: string;
  requestId: string;
  actorId?: string;
  actorEmail?: string;
  organizationId?: string;
  tenantId?: string;
  category: EventCategory;
  action: string;
  resourceType?: string;
  resourceId?: string;
  outcome: EventOutcome;
  statusCode?: number;
  requiredPermission?: string;
  grantedPermissions?: string[];
  actualScope?: string;
  reason?: string;
  detail?: string;
}

export type NewAltilEvent = Omit<AltilEvent, 'schemaVersion' | 'id' | 'timestamp' | 'environment' | 'testRunId' | 'requestId'> & {
  requestId?: string;
};

export function makeAltilEvent(input: NewAltilEvent, context: { environment: EventEnvironment; testRunId?: string }): AltilEvent {
  const requestId = input.requestId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)
    ? input.requestId
    : randomUUID();
  const clean = (value: string | undefined, max = 256) => value?.replace(/[\r\n\0]/g, ' ').slice(0, max);
  return {
    ...input,
    schemaVersion: 1,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    environment: context.environment,
    ...(context.environment === 'local-test' && context.testRunId ? { testRunId: context.testRunId } : {}),
    requestId,
    actorId: clean(input.actorId, 128),
    actorEmail: clean(input.actorEmail, 255),
    organizationId: clean(input.organizationId, 128),
    tenantId: clean(input.tenantId, 128),
    action: clean(input.action, 128) || 'unspecified',
    resourceType: clean(input.resourceType, 96),
    resourceId: clean(input.resourceId, 128),
    requiredPermission: clean(input.requiredPermission, 128),
    actualScope: clean(input.actualScope, 256),
    reason: clean(input.reason, 256),
    detail: clean(input.detail, 512),
    grantedPermissions: input.grantedPermissions?.slice(0, 64).map(permission => clean(permission, 128) || ''),
  };
}
