import { DcrEngine } from '../utils/dcrEngine';
import type { DcrTransformationRecord, AIProvider } from '../types';
import { scanAndSanitizePrompt } from '../utils/complianceEngine';
import { detectReidentification } from './reidentification';

export interface ResponseGateResult {
  deliveredText: string;
  blocked: boolean;
  dlpApplied: boolean;
  reconstructedItems: number;
  unreconstructedItems: number;
  reidentificationDetected: boolean;
  reidentificationRecordIds: string[];
  reason?: string;
}

/**
 * Applies the response-side boundary before an upstream answer is returned.
 * DLP runs while values are still surrogates; reconstruction is then performed
 * only for records authorised by the caller-provided decision.
 */
export async function applyResponseGate(input: {
  responseText: string;
  tenantId: string;
  requestId: string;
  records?: DcrTransformationRecord[];
  popiaRules?: Parameters<typeof scanAndSanitizePrompt>[1]['popiaRules'];
  gdprRules?: Parameters<typeof scanAndSanitizePrompt>[1]['gdprRules'];
  allowReconstruction?: (record: DcrTransformationRecord) => boolean;
  /** Deployment the upstream answer came from; drives the response-side transfer flag. */
  targetProvider?: AIProvider;
}): Promise<ResponseGateResult> {
  const detection = detectReidentification(input.responseText, input.records || []);
  if (detection.detected) {
    return {
      deliveredText: detection.sanitizedText,
      blocked: false,
      dlpApplied: true,
      reconstructedItems: 0,
      unreconstructedItems: detection.recordIds.length,
      reidentificationDetected: true,
      reidentificationRecordIds: detection.recordIds,
      reason: 'Upstream response attempted to re-identify protected entities; the disclosed values were redacted.',
    };
  }
  const compliance = scanAndSanitizePrompt(input.responseText, {
    popiaRules: input.popiaRules,
    gdprRules: input.gdprRules,
    targetProvider: input.targetProvider,
  });
  if (compliance.actionTaken === 'BLOCKED') {
    return {
      deliveredText: '',
      blocked: true,
      dlpApplied: true,
      reconstructedItems: 0,
      unreconstructedItems: 0,
      reidentificationDetected: false,
      reidentificationRecordIds: [],
      reason: 'Upstream response failed the configured response privacy gate.',
    };
  }

  const reconstruction = await DcrEngine.reconstructResponse(compliance.sanitizedPrompt, {
    tenantId: input.tenantId,
    requestId: input.requestId,
    activeRecords: input.records,
    canReconstruct: input.allowReconstruction,
  });
  return {
    deliveredText: reconstruction.reconstructedText,
    blocked: false,
    dlpApplied: compliance.sanitizedPrompt !== input.responseText,
    reconstructedItems: reconstruction.reconstructedItems.length,
    unreconstructedItems: reconstruction.unreconstructedItems.length,
    reidentificationDetected: false,
    reidentificationRecordIds: [],
  };
}
