export type TrustControlId = 'organisation' | 'legal_entity' | 'contract' | 'policy' | 'identity' | 'credential' | 'data_classification' | 'provider_approval' | 'region_approval' | 'security' | 'budget' | 'audit';
export type TrustControlState = 'VERIFIED' | 'PENDING' | 'BLOCKED' | 'REQUIRES_REVIEW' | 'NOT_CONFIGURED' | 'UNKNOWN' | 'NOT_AUTHORIZED';
export interface TrustControl { readonly id: TrustControlId; readonly label: string; readonly state: TrustControlState; readonly sourceReference: string | null; readonly detail: string; }
export type TrustPostureInput = Partial<Record<TrustControlId, { readonly state: TrustControlState; readonly sourceReference?: string | null; readonly detail?: string }>>;
const controlLabels: Record<TrustControlId, string> = { organisation: 'Organisation', legal_entity: 'Legal Entity', contract: 'Contract authority', policy: 'Policy', identity: 'Identity', credential: 'Credential', data_classification: 'Data classification', provider_approval: 'Provider approval', region_approval: 'Region approval', security: 'Security', budget: 'Budget', audit: 'Audit trail' };
export function buildTrustPosture(input: TrustPostureInput): readonly TrustControl[] {
  return Object.freeze((Object.keys(controlLabels) as TrustControlId[]).map(id => Object.freeze({ id, label: controlLabels[id], state: input[id]?.state ?? 'UNKNOWN', sourceReference: input[id]?.sourceReference ?? null, detail: input[id]?.detail ?? 'No verified control evidence supplied.' })));
}
