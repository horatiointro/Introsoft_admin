import { createHash, randomUUID } from 'node:crypto';
import type { AltilEvent, NewAltilEvent } from '../logging/eventModel';
import { makeCurrentAltilEvent } from '../logging/eventLogger';

export interface CommercialMutationSql {
  execute(sql: string, params?: unknown[]): Promise<[unknown, unknown]>;
}

export interface CommercialMutationResult<T = unknown> {
  statusCode: number;
  body: T;
  resourceId: string | null;
  replayed: boolean;
  auditEvent?: AltilEvent;
}

export class CommercialMutationError extends Error {
  constructor(readonly statusCode: number, message: string) { super(message); }
}

export interface DurableMutationInput {
  actorId: string;
  actorEmail: string;
  operation: string;
  resourceType: string;
  idempotencyKey: unknown;
  fingerprintInput: unknown;
  audit: Omit<NewAltilEvent, 'actorId' | 'actorEmail' | 'action' | 'resourceType' | 'resourceId' | 'outcome'> & { action?: string };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function rowsOf<T>(result: unknown): T[] {
  return Array.isArray(result) ? result as T[] : [];
}

async function insertAudit(tx: CommercialMutationSql, event: AltilEvent, statusCode: number): Promise<void> {
  const summary = JSON.stringify({ schemaVersion: 1, eventId: event.id, resourceType: event.resourceType, resourceId: event.resourceId, outcome: event.outcome, statusCode });
  await tx.execute(
    'INSERT INTO audit_logs (id,timestamp,tenant_id,user_email,action_type,category,severity,ip_address,request_payload,raw_response_payload,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [`EVT-${event.id}`.slice(0, 64), new Date(event.timestamp), event.tenantId || event.organizationId || null, event.actorEmail || null, event.action, event.category, event.outcome === 'SUCCESS' ? 'INFO' : event.outcome === 'DENIED' ? 'WARNING' : 'ERROR', null, JSON.stringify(event), summary, new Date(event.timestamp)],
  );
}

/**
 * Claims an actor/operation/key tuple, performs one mutation, writes the existing
 * audit_logs row, and completes the replay record on the same MariaDB transaction.
 */
export async function runDurableCommercialMutation<T>(tx: CommercialMutationSql, input: DurableMutationInput, mutate: () => Promise<{ statusCode: number; body: T; resourceId: string | null }>): Promise<CommercialMutationResult<T>> {
  const key = typeof input.idempotencyKey === 'string' ? input.idempotencyKey.trim() : '';
  if (key.length < 8 || key.length > 200 || /[\r\n\0]/.test(key)) throw new CommercialMutationError(400, 'A valid Idempotency-Key header (8–200 characters) is required.');
  const keyHash = createHash('sha256').update(key).digest('hex');
  const fingerprint = createHash('sha256').update(stableJson(input.fingerprintInput)).digest('hex');
  const id = `idem-${randomUUID()}`;
  let claimedNewKey = true;
  try {
    await tx.execute(
    `INSERT INTO commercial_idempotency_records (id,actor_id,application_key,operation,idempotency_key_hash,request_fingerprint,resource_type,state,expires_at)
     VALUES (?,?, 'ALTIL_CONTROL_PLANE_API', ?,?,?,?,'IN_PROGRESS',DATE_ADD(NOW(3), INTERVAL 24 HOUR))`,
    [id, input.actorId, input.operation, keyHash, fingerprint, input.resourceType],
    );
  } catch (error) {
    if ((error as { code?: string })?.code !== 'ER_DUP_ENTRY') throw error;
    claimedNewKey = false;
  }
  const existing = rowsOf<any>((await tx.execute(
    'SELECT id,request_fingerprint,resource_type,resource_id,response_status,response_body_json,state,expires_at FROM commercial_idempotency_records WHERE actor_id=? AND application_key=? AND operation=? AND idempotency_key_hash=? FOR UPDATE',
    [input.actorId, 'ALTIL_CONTROL_PLANE_API', input.operation, keyHash],
  ))[0]);
  const record = existing[0];
  if (!record) throw new Error('The durable idempotency record could not be claimed.');
  if (claimedNewKey) {
    // The unique actor/application/operation/key index made this request the owner.
  } else if (new Date(record.expires_at).getTime() <= Date.now()) {
    await tx.execute(
      `UPDATE commercial_idempotency_records SET request_fingerprint=?,resource_type=?,resource_id=NULL,response_status=NULL,response_body_json=NULL,state='IN_PROGRESS',created_at=NOW(3),completed_at=NULL,expires_at=DATE_ADD(NOW(3), INTERVAL 24 HOUR) WHERE id=?`,
      [fingerprint, input.resourceType, record.id],
    );
  } else {
    if (record.request_fingerprint !== fingerprint) throw new CommercialMutationError(409, 'Idempotency-Key was already used with a different request.');
    if (record.state === 'COMPLETED' || record.state === 'FAILED') {
      const body = typeof record.response_body_json === 'string' ? JSON.parse(record.response_body_json) : record.response_body_json;
      return { statusCode: Number(record.response_status), body, resourceId: record.resource_id || null, replayed: true };
    }
    throw new CommercialMutationError(409, 'An operation with this Idempotency-Key is already in progress.');
  }

  let statusCode: number;
  let body: T | { error: string };
  let resourceId: string | null;
  let state: 'COMPLETED' | 'FAILED';
  let outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  try {
    const result = await mutate();
    statusCode = result.statusCode;
    body = result.body;
    resourceId = result.resourceId;
    state = 'COMPLETED';
    outcome = 'SUCCESS';
  } catch (error) {
    if (!(error instanceof CommercialMutationError)) throw error;
    statusCode = error.statusCode;
    body = { error: error.message };
    resourceId = null;
    state = 'FAILED';
    outcome = error.statusCode === 403 ? 'DENIED' : 'FAILURE';
  }

  const event = makeCurrentAltilEvent({
    ...input.audit,
    category: input.audit.category || 'AUDIT',
    action: input.audit.action || input.operation,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    resourceType: input.resourceType,
    resourceId: resourceId || undefined,
    outcome,
    statusCode,
    detail: [input.audit.detail, 'application=ALTIL_CONTROL_PLANE_API', `idempotencyRef=${keyHash.slice(0, 16)}`].filter(Boolean).join('; '),
  });
  await insertAudit(tx, event, statusCode);
  await tx.execute(
    'UPDATE commercial_idempotency_records SET resource_id=?,response_status=?,response_body_json=?,state=?,completed_at=NOW(3) WHERE id=?',
    [resourceId, statusCode, JSON.stringify(body), state, record.id],
  );
  return { statusCode, body: body as T, resourceId, replayed: false, auditEvent: event };
}
