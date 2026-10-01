import type { DataSubjectRequest } from '../types';

export type DsarRow = Record<string, any>;

export function databaseDate(value: string, field: string): string {
  const date = String(value || '').slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error(`DSAR ${field} must be a valid YYYY-MM-DD date.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error(`DSAR ${field} must be a valid YYYY-MM-DD date.`);
  }
  return date;
}

export function mapDsarStatus(status: unknown): DataSubjectRequest['status'] {
  switch (String(status || '').toUpperCase()) {
    case 'NEW': case 'PENDING': return 'pending';
    case 'IDENTITY_VERIFIED': case 'PROCESSING': case 'IN_PROGRESS': return 'in_progress';
    case 'FULFILLED': return 'fulfilled';
    case 'REJECTED': return 'rejected';
    default: return 'pending';
  }
}

export function mapDsarRow(row: DsarRow): DataSubjectRequest {
  const created = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || '');
  const due = row.due_date instanceof Date ? row.due_date.toISOString() : String(row.due_date || '');
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    framework: String(row.framework || 'POPIA').toUpperCase() === 'GDPR' ? 'GDPR' : 'POPIA',
    requestType: String(row.request_type || 'ACCESS').toLowerCase() as DataSubjectRequest['requestType'],
    subjectIdentifier: String(row.data_subject_ref || ''),
    requestorName: String(row.requestor_name || 'Subject'),
    appId: row.app_id ? String(row.app_id) : undefined,
    status: mapDsarStatus(row.status),
    createdAt: created ? created.replace('T', ' ').slice(0, 19) : '',
    dueAt: due ? due.replace('T', ' ').slice(0, 10) : '',
    notes: row.notes || '',
  };
}

export function statutoryBasis(framework: DataSubjectRequest['framework'], requestType: DataSubjectRequest['requestType']): string {
  if (framework === 'GDPR') {
    return ({ access: 'GDPR_ARTICLE_15', portability: 'GDPR_ARTICLE_20', rectification: 'GDPR_ARTICLE_16', erasure: 'GDPR_ARTICLE_17', objection: 'GDPR_ARTICLE_21' })[requestType];
  }
  return ({ access: 'POPIA_SECTION_23', portability: 'POPIA_SECTION_23', rectification: 'POPIA_SECTION_24', erasure: 'POPIA_SECTION_24', objection: 'POPIA_SECTION_11' })[requestType];
}

export function databaseStatus(status: DataSubjectRequest['status']): string {
  return ({ pending: 'NEW', in_progress: 'PROCESSING', fulfilled: 'FULFILLED', rejected: 'REJECTED' })[status];
}
