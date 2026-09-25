import crypto from 'crypto';
import { Request } from 'express';

export type PrivilegedOperationType =
  | 'DATABASE_MIGRATION'
  | 'TENANT_DELETE'
  | 'PROVIDER_DISABLE'
  | 'ROUTING_CHANGE'
  | 'POLICY_CHANGE'
  | 'ROLE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'SECRET_ROTATION'
  | 'DSAR_ERASURE'
  | 'LICENSE_TERMINATION';

export interface PrivilegedOperation {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  tenantScope: string | null; // null for global/system
  operation: PrivilegedOperationType;
  targetResource: string;
  timestamp: string;
  justification: string;
  originatingIp: string;
  userAgent: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  approverId?: string;
  approverEmail?: string;
  approvedAt?: string;
  rejectedAt?: string;
  result?: string;
}

// In-memory state of privileged operations
const privilegedOperations: PrivilegedOperation[] = [];

export class PrivilegedOperationsRegistry {
  public static getAll(): PrivilegedOperation[] {
    return privilegedOperations;
  }

  public static getById(id: string): PrivilegedOperation | undefined {
    return privilegedOperations.find(op => op.id === id);
  }

  public static create(
    actor: { id: string; email: string; role: string; tenantId: string | null },
    operation: PrivilegedOperationType,
    targetResource: string,
    justification: string,
    req: Request
  ): PrivilegedOperation {
    const id = 'priv-op-' + crypto.randomBytes(8).toString('hex');
    const originatingIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'ALTIL Security Agent';

    const newOp: PrivilegedOperation = {
      id,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      tenantScope: actor.tenantId,
      operation,
      targetResource,
      timestamp: new Date().toISOString(),
      justification: justification || 'No justification provided.',
      originatingIp,
      userAgent,
      status: 'PENDING_APPROVAL',
    };

    privilegedOperations.unshift(newOp);
    console.log(`[Privileged Control] Created Operation: ${id} - Actor: ${actor.email} - Action: ${operation}`);
    return newOp;
  }

  public static approve(
    id: string,
    approver: { id: string; email: string }
  ): { success: boolean; error?: string; operation?: PrivilegedOperation } {
    const op = privilegedOperations.find(o => o.id === id);
    if (!op) {
      return { success: false, error: 'Operation not found' };
    }

    if (op.status !== 'PENDING_APPROVAL') {
      return { success: false, error: `Operation cannot be approved from status ${op.status}` };
    }

    // Requester cannot approve their own request! (Separation of duties / Four-Eyes)
    if (op.actorId === approver.id) {
      return { success: false, error: 'Self-approval violation: Requester cannot approve their own privileged request.' };
    }

    op.status = 'APPROVED';
    op.approverId = approver.id;
    op.approverEmail = approver.email;
    op.approvedAt = new Date().toISOString();

    console.log(`[Privileged Control] Approved Operation: ${id} by Approver: ${approver.email}`);
    return { success: true, operation: op };
  }

  public static reject(
    id: string,
    approver: { id: string; email: string }
  ): { success: boolean; error?: string; operation?: PrivilegedOperation } {
    const op = privilegedOperations.find(o => o.id === id);
    if (!op) {
      return { success: false, error: 'Operation not found' };
    }

    if (op.status !== 'PENDING_APPROVAL') {
      return { success: false, error: `Operation cannot be rejected from status ${op.status}` };
    }

    op.status = 'REJECTED';
    op.approverId = approver.id;
    op.approverEmail = approver.email;
    op.rejectedAt = new Date().toISOString();

    console.log(`[Privileged Control] Rejected Operation: ${id} by Approver: ${approver.email}`);
    return { success: true, operation: op };
  }

  public static execute(id: string, result: string): boolean {
    const op = privilegedOperations.find(o => o.id === id);
    if (!op || op.status !== 'APPROVED') {
      return false;
    }
    op.status = 'EXECUTED';
    op.result = result;
    return true;
  }

  public static hasValidApproval(
    actorId: string,
    operation: PrivilegedOperationType,
    targetResource: string
  ): PrivilegedOperation | undefined {
    return privilegedOperations.find(
      op =>
        op.actorId === actorId &&
        op.operation === operation &&
        op.targetResource === targetResource &&
        op.status === 'APPROVED'
    );
  }
}
