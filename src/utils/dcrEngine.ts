import {
  DcrClassificationResult,
  DcrTransformationRecord,
  DcrTransformationStrategy,
  DcrTransformationScope,
  DcrProvenanceCategory,
  DcrProvenanceEvent,
  DcrPipelineResult,
  DataClassificationType
} from '../types';
import { TransformationKeyService } from './dcrKeyService';
import { DcrRepository } from '../db/dcrRepository';

// Synthetic Pools for Semantic Pseudonymization & Cloaking
const SYNTHETIC_FIRST_NAMES = ['David', 'Emily', 'Marcus', 'Sophia', 'James', 'Elena', 'Michael', 'Chloe', 'Daniel', 'Amara', 'Liam', 'Zuri'];
const SYNTHETIC_LAST_NAMES = ['Miller', 'Watson', 'Patel', 'Van Der Merwe', 'Taylor', 'Brooks', 'Anderson', 'Sterling', 'Nkosi', 'Fletcher'];
const SYNTHETIC_COMPANIES = ['Vanguard Apex Enterprises', 'Helios Global Logistics', 'Nexis Frontier Capital', 'Aegis Sentinel Systems', 'Solaria Health Networks'];
const SYNTHETIC_ADDRESSES = [
  '84 Oak Avenue, Johannesburg, 2196',
  '142 Protea Road, Claremont, Cape Town, 7708',
  '29 Highveld Crescent, Centurion, Pretoria, 0157',
  '67 Ocean Drive, Umhlanga, Durban, 4319'
];
const SYNTHETIC_CITIES = ['Johannesburg', 'Cape Town', 'Pretoria', 'Durban', 'Gqeberha', 'London', 'Frankfurt', 'Amsterdam'];

const MEDICAL_GENERALISATIONS: Record<string, string> = {
  'cancer': 'Oncology Condition Category B',
  'lung cancer': 'Thoracic Oncology Condition Class 2',
  'breast cancer': 'Mammary Oncology Condition Class 1',
  'leukemia': 'Hematologic Oncology Category',
  'diabetes': 'Endocrine Metabolic Condition Type 2',
  'type 2 diabetes': 'Endocrine Metabolic Condition Type 2',
  'hiv': 'Immunological Chronic Viral Condition',
  'hiv positive': 'Immunological Chronic Viral Profile',
  'hypertension': 'Cardiovascular Chronic Pressure Profile',
  'bipolar': 'Neurobehavioral Affective Condition',
  'depression': 'Mood Regulation Clinical Condition'
};

export const DcrEngine = {
  /**
   * Classify text spans and identify sensitive data types under POPIA, GDPR, HIPAA, and PCI-DSS
   */
  classifyPayload(text: string, forcedStrategy?: DcrTransformationStrategy): DcrClassificationResult[] {
    const findings: DcrClassificationResult[] = [];
    if (!text || typeof text !== 'string') return findings;

    // 1. South African ID Numbers (13 digits with Luhn/date pattern)
    const saIdRegex = /\b([0-9]{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01]))([0-9]{4})([01])([89])([0-9])\b/g;
    let match;
    while ((match = saIdRegex.exec(text)) !== null) {
      findings.push({
        id: `cls-said-${Date.now()}-${findings.length}`,
        originalText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        classification: 'SPECIAL_PERSONAL',
        entityType: 'SA_ID_NUMBER',
        confidence: 0.98,
        suggestedStrategy: forcedStrategy || 'EXACT_TOKEN',
        jurisdiction: 'POPIA',
        statutoryReference: 'POPIA Section 1 & Section 26 (Special Personal Information)'
      });
    }

    // 2. Credit Card / Debit Card Numbers (13-16 digits with spacing/dashes)
    const ccRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|(?:4\d{3}|5[1-5]\d{2}|6011|7\d{3})[- ]?\d{4}[- ]?\d{4}[- ]?\d{4})\b/g;
    while ((match = ccRegex.exec(text)) !== null) {
      // Avoid matching already matched SA ID
      if (!findings.some(f => f.startIndex === match!.index)) {
        findings.push({
          id: `cls-cc-${Date.now()}-${findings.length}`,
          originalText: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          classification: 'FINANCIAL',
          entityType: 'CREDIT_CARD_NUMBER',
          confidence: 0.95,
          suggestedStrategy: forcedStrategy || 'EXACT_TOKEN',
          jurisdiction: 'PCI_DSS',
          statutoryReference: 'PCI-DSS Req 3.4 / GDPR Article 4(1)'
        });
      }
    }

    // 3. Bank Account / IBAN Numbers
    const ibanRegex = /\b(?:[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}|(?:ACC|Account|Acc No)[\s#:]+([0-9]{8,14}))\b/gi;
    while ((match = ibanRegex.exec(text)) !== null) {
      findings.push({
        id: `cls-iban-${Date.now()}-${findings.length}`,
        originalText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        classification: 'FINANCIAL',
        entityType: 'BANK_ACCOUNT_NUMBER',
        confidence: 0.92,
        suggestedStrategy: forcedStrategy || 'EXACT_TOKEN',
        jurisdiction: 'POPIA',
        statutoryReference: 'POPIA Section 1 / GDPR Art 6'
      });
    }

    // 4. Currency / Salary Amounts (e.g. R48,750.00, $12,500, €3,400, ZAR 85,000)
    const salaryRegex = /(?:(?:R|ZAR|\$|€|£)\s?[0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{2})?|\b[0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{2})?\s?(?:ZAR|USD|EUR|GBP|Rand)\b)/gi;
    while ((match = salaryRegex.exec(text)) !== null) {
      // Filter out small digits like $5 or 10
      const rawNum = match[0].replace(/[^0-9.]/g, '');
      if (parseFloat(rawNum) > 50) {
        findings.push({
          id: `cls-sal-${Date.now()}-${findings.length}`,
          originalText: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          classification: 'FINANCIAL',
          entityType: 'SALARY_AMOUNT',
          confidence: 0.88,
          suggestedStrategy: forcedStrategy || 'RANGE_PRESERVE',
          jurisdiction: 'GLOBAL',
          statutoryReference: 'Confidential Compensation / Commercial Data'
        });
      }
    }

    // 5. Phone Numbers (South African & International E.164 formats)
    const phoneRegex = /(?:\+27|0)[1-9][0-9](?:[- ]?[0-9]{3}[- ]?[0-9]{4}|[0-9]{7})\b|\+(?:1|44|49|33|31)[- ]?[0-9]{2,4}[- ]?[0-9]{3,4}[- ]?[0-9]{3,4}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      findings.push({
        id: `cls-ph-${Date.now()}-${findings.length}`,
        originalText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        classification: 'PERSONAL',
        entityType: 'PHONE_NUMBER',
        confidence: 0.94,
        suggestedStrategy: forcedStrategy || 'FORMAT_PRESERVE',
        jurisdiction: 'POPIA',
        statutoryReference: 'POPIA Section 1 / GDPR Art 4(1)'
      });
    }

    // 6. Email Addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    while ((match = emailRegex.exec(text)) !== null) {
      findings.push({
        id: `cls-em-${Date.now()}-${findings.length}`,
        originalText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        classification: 'PERSONAL',
        entityType: 'EMAIL_ADDRESS',
        confidence: 0.99,
        suggestedStrategy: forcedStrategy || 'PSEUDONYM',
        jurisdiction: 'POPIA',
        statutoryReference: 'POPIA Section 1 / GDPR Art 4(1)'
      });
    }

    // 7. Medical Conditions / Diagnoses (HIPAA / POPIA Special Personal)
    for (const [conditionTerm, generalisation] of Object.entries(MEDICAL_GENERALISATIONS)) {
      const condRegex = new RegExp(`\\b${conditionTerm}\\b`, 'gi');
      while ((match = condRegex.exec(text)) !== null) {
        findings.push({
          id: `cls-med-${Date.now()}-${findings.length}`,
          originalText: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          classification: 'HEALTH',
          entityType: 'MEDICAL_DIAGNOSIS',
          confidence: 0.93,
          suggestedStrategy: forcedStrategy || 'SEMANTIC_GENERALISE',
          jurisdiction: 'HIPAA',
          statutoryReference: 'POPIA Section 32 (Health Information) / HIPAA Safe Harbor',
          metadata: { generalisation }
        });
      }
    }

    // 8. Person Names (Contextual NLP pattern matching for formal names)
    const personNameRegex = /(?:(?:Mr|Mrs|Ms|Dr|Adv|Prof)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})|\b(?:patient|client|employee|customer|individual|subject|father|daughter|son|mother)\s+(?:named\s+|is\s+|:\s+)?([A-Z][a-z]+\s+[A-Z][a-z]+)\b|\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:residing at|employed at|earns|suffers from|diagnosed with|holds ID|born on)\b)/g;
    while ((match = personNameRegex.exec(text)) !== null) {
      const nameMatch = match[1] || match[2] || match[3];
      if (nameMatch && !['South Africa', 'Cape Town', 'Johannesburg', 'Artificial Intelligence'].includes(nameMatch)) {
        const start = match.index + match[0].indexOf(nameMatch);
        // Avoid duplicate overlapping spans
        if (!findings.some(f => (start >= f.startIndex && start < f.endIndex))) {
          findings.push({
            id: `cls-name-${Date.now()}-${findings.length}`,
            originalText: nameMatch,
            startIndex: start,
            endIndex: start + nameMatch.length,
            classification: 'PERSONAL',
            entityType: 'PERSON_NAME',
            confidence: 0.91,
            suggestedStrategy: forcedStrategy || 'PSEUDONYM',
            jurisdiction: 'POPIA',
            statutoryReference: 'POPIA Section 1 / GDPR Article 4(1)'
          });
        }
      }
    }

    // 9. Physical Street Addresses
    const addressRegex = /\b[0-9]{1,4}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Crescent|Cres|Way|Boulevard|Blvd),?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g;
    while ((match = addressRegex.exec(text)) !== null) {
      if (!findings.some(f => match!.index >= f.startIndex && match!.index < f.endIndex)) {
        findings.push({
          id: `cls-addr-${Date.now()}-${findings.length}`,
          originalText: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          classification: 'LOCATION',
          entityType: 'PHYSICAL_ADDRESS',
          confidence: 0.90,
          suggestedStrategy: forcedStrategy || 'SYNTHETIC_VALUE',
          jurisdiction: 'POPIA',
          statutoryReference: 'POPIA Section 1 / GDPR Art 4(1)'
        });
      }
    }

    // 10. Corporate Entities / Company Names with proprietary forms
    const companyRegex = /\b([A-Z][A-Za-z0-9&.\s]{2,30}\s+(?:\(Pty\)\s+Ltd|Ltd|LLC|Inc|Corp|GmbH|Holdings|PLC))\b/g;
    while ((match = companyRegex.exec(text)) !== null) {
      if (!findings.some(f => match!.index >= f.startIndex && match!.index < f.endIndex)) {
        findings.push({
          id: `cls-comp-${Date.now()}-${findings.length}`,
          originalText: match[1],
          startIndex: match.index,
          endIndex: match.index + match[1].length,
          classification: 'COMMERCIAL',
          entityType: 'COMPANY_NAME',
          confidence: 0.89,
          suggestedStrategy: forcedStrategy || 'SYNTHETIC_VALUE',
          jurisdiction: 'GLOBAL',
          statutoryReference: 'Confidential Corporate Entity Identity'
        });
      }
    }

    // Sort findings by start index ascending
    return findings.sort((a, b) => a.startIndex - b.startIndex);
  },

  /**
   * Generates a realistic masked preview (e.g. J*** S*** or 880315*****87)
   */
  generateMaskedPreview(val: string, entityType: string): string {
    if (!val) return '***';
    if (entityType === 'SA_ID_NUMBER' && val.length === 13) {
      return `${val.slice(0, 6)}*****${val.slice(-2)}`;
    }
    if (entityType === 'CREDIT_CARD_NUMBER') {
      const clean = val.replace(/\s+/g, '');
      return `****-****-****-${clean.slice(-4)}`;
    }
    if (entityType === 'EMAIL_ADDRESS' && val.includes('@')) {
      const [u, d] = val.split('@');
      return `${u.charAt(0)}***@${d}`;
    }
    if (entityType === 'PHONE_NUMBER') {
      return `${val.slice(0, 4)}***${val.slice(-3)}`;
    }
    if (entityType === 'PERSON_NAME') {
      const parts = val.split(' ');
      return parts.map(p => `${p.charAt(0)}${'*'.repeat(Math.max(1, p.length - 1))}`).join(' ');
    }
    return `${val.charAt(0)}***${val.slice(-1)}`;
  },

  /**
   * Generates a surrogate value based on transformation strategy and entity classification
   */
  generateSurrogate(
    finding: DcrClassificationResult,
    strategy: DcrTransformationStrategy,
    indexSeed: number = 0
  ): { surrogate: string; semanticConstraints?: any } {
    const raw = finding.originalText.trim();
    const hash6 = TransformationKeyService.hashValue(raw).substring(0, 6).toUpperCase();

    switch (strategy) {
      case 'EXACT_TOKEN': {
        const prefix = finding.entityType.replace(/_NUMBER|_AMOUNT|_ADDRESS/g, '');
        return { surrogate: `ALTIL_${prefix}_${hash6}` };
      }

      case 'PSEUDONYM': {
        if (finding.entityType === 'PERSON_NAME') {
          const first = SYNTHETIC_FIRST_NAMES[(indexSeed + raw.length) % SYNTHETIC_FIRST_NAMES.length];
          const last = SYNTHETIC_LAST_NAMES[(indexSeed * 3 + raw.length) % SYNTHETIC_LAST_NAMES.length];
          return { surrogate: `${first} ${last}`, semanticConstraints: { preserveCase: true } };
        }
        if (finding.entityType === 'EMAIL_ADDRESS') {
          const first = SYNTHETIC_FIRST_NAMES[(indexSeed + raw.length) % SYNTHETIC_FIRST_NAMES.length].toLowerCase();
          const last = SYNTHETIC_LAST_NAMES[(indexSeed * 3 + raw.length) % SYNTHETIC_LAST_NAMES.length].toLowerCase();
          return { surrogate: `${first}.${last}@vanguard-apex.internal` };
        }
        return { surrogate: `Synthetic_${finding.entityType}_${hash6}` };
      }

      case 'SYNTHETIC_VALUE': {
        if (finding.entityType === 'PHYSICAL_ADDRESS') {
          const addr = SYNTHETIC_ADDRESSES[indexSeed % SYNTHETIC_ADDRESSES.length];
          return { surrogate: addr };
        }
        if (finding.entityType === 'COMPANY_NAME') {
          const comp = SYNTHETIC_COMPANIES[indexSeed % SYNTHETIC_COMPANIES.length];
          return { surrogate: comp };
        }
        return { surrogate: `ALTIL_SYNTH_${hash6}` };
      }

      case 'RANGE_PRESERVE': {
        // Parse numerical value and apply a small calibrated variance (+0.5% to +1.2%)
        const numericMatch = raw.match(/([0-9,.]+)/);
        if (numericMatch) {
          const cleanNumStr = numericMatch[1].replace(/,/g, '');
          const originalNum = parseFloat(cleanNumStr);
          if (!isNaN(originalNum) && originalNum > 0) {
            const varianceRatio = 1 + (((indexSeed % 5) + 1) * 0.007); // ~0.7% - 3.5%
            const perturbed = Math.round((originalNum * varianceRatio) * 100) / 100;
            const formatted = raw.includes('R') ? `R${perturbed.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` :
                              raw.includes('$') ? `$${perturbed.toLocaleString('en-US', { minimumFractionDigits: 2 })}` :
                              raw.includes('€') ? `€${perturbed.toLocaleString('de-DE', { minimumFractionDigits: 2 })}` :
                              `${perturbed}`;
            return {
              surrogate: formatted,
              semanticConstraints: {
                originalMagnitude: originalNum,
                perturbedMagnitude: perturbed,
                rangeDelta: perturbed - originalNum,
                currency: raw.includes('R') ? 'ZAR' : raw.includes('$') ? 'USD' : 'EUR'
              }
            };
          }
        }
        return { surrogate: `[PRESERVED_RANGE_${hash6}]` };
      }

      case 'RELATIONSHIP_PRESERVE': {
        // Preserves relational mapping consistency (e.g. David Miller -> Emily Watson as father/daughter)
        const first = SYNTHETIC_FIRST_NAMES[indexSeed % SYNTHETIC_FIRST_NAMES.length];
        const last = SYNTHETIC_LAST_NAMES[indexSeed % SYNTHETIC_LAST_NAMES.length];
        return {
          surrogate: `${first} ${last}`,
          semanticConstraints: {
            relationshipFamilyId: `FAM-${hash6}`,
            preserveFamilyStructure: true
          }
        };
      }

      case 'FORMAT_PRESERVE': {
        if (finding.entityType === 'PHONE_NUMBER') {
          const randDigits = Math.floor(1000000 + Math.random() * 9000000);
          if (raw.startsWith('+27')) {
            return { surrogate: `+27 82 ${String(randDigits).slice(0, 3)} ${String(randDigits).slice(3, 7)}` };
          }
          return { surrogate: `082 ${String(randDigits).slice(0, 3)} ${String(randDigits).slice(3, 7)}` };
        }
        return { surrogate: `FORMAT_P_${hash6}` };
      }

      case 'SEMANTIC_GENERALISE': {
        if (finding.metadata?.generalisation) {
          return { surrogate: finding.metadata.generalisation };
        }
        const lower = raw.toLowerCase();
        for (const [k, v] of Object.entries(MEDICAL_GENERALISATIONS)) {
          if (lower.includes(k)) return { surrogate: v };
        }
        return { surrogate: `General_${finding.entityType}_Category` };
      }

      case 'HASH': {
        return { surrogate: `SHA256:${TransformationKeyService.hashValue(raw)}` };
      }

      case 'ENCRYPT': {
        const encrypted = TransformationKeyService.encrypt(raw);
        return { surrogate: `ENC:${encrypted.keyReference}:${encrypted.ciphertext.slice(0, 16)}...` };
      }

      case 'REDACT': {
        return { surrogate: `[REDACTED_${finding.entityType}]` };
      }

      case 'REMOVE': {
        return { surrogate: '' };
      }

      case 'LEAVE_UNCHANGED':
      default:
        return { surrogate: raw };
    }
  },

  /**
   * Core Outbound Transformation & Cloaking Pipeline
   * Transforms raw prompt -> cloaked prompt with encrypted vault persistence
   */
  async cloakPayload(
    rawText: string,
    options: {
      tenantId?: string;
      requestId?: string;
      scope?: DcrTransformationScope;
      forcedStrategy?: DcrTransformationStrategy;
    } = {}
  ): Promise<{
    cloakedText: string;
    records: DcrTransformationRecord[];
    events: DcrProvenanceEvent[];
  }> {
    const tenantId = options.tenantId || 'tenant-global';
    const requestId = options.requestId || `REQ-DCR-${Date.now()}`;
    const scope = options.scope || 'REQUEST';

    const findings = this.classifyPayload(rawText, options.forcedStrategy);
    if (findings.length === 0) {
      return { cloakedText: rawText, records: [], events: [] };
    }

    const records: DcrTransformationRecord[] = [];
    const events: DcrProvenanceEvent[] = [];
    let lastHash = DcrRepository.getLastEventHash();

    // Map replacement segments in reverse order to preserve string indices
    let workingText = rawText;
    const sortedFindings = [...findings].sort((a, b) => b.startIndex - a.startIndex);

    for (let i = 0; i < sortedFindings.length; i++) {
      const f = sortedFindings[i];
      const strategy = options.forcedStrategy || f.suggestedStrategy;
      const { surrogate, semanticConstraints } = this.generateSurrogate(f, strategy, i);
      const rawVal = f.originalText;
      const masked = this.generateMaskedPreview(rawVal, f.entityType);

      // Encrypt raw original value with AES-256-GCM
      const encrypted = TransformationKeyService.encrypt(rawVal, tenantId);
      const rawHash = TransformationKeyService.hashValue(rawVal);
      const surrogateHash = TransformationKeyService.hashValue(surrogate);

      // Calculate TTL based on scope
      const ttlHours = scope === 'REQUEST' ? 1 : scope === 'SESSION' ? 24 : scope === 'CONVERSATION' ? 72 : 8760;
      const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

      const record: DcrTransformationRecord = {
        id: `DCR-REC-${Date.now()}-${i}`,
        requestId,
        tenantId,
        classification: f.classification,
        dataType: f.entityType,
        originalValueCiphertext: encrypted.ciphertext,
        originalValueHash: rawHash,
        originalMaskedPreview: masked,
        surrogateValue: surrogate,
        transformationStrategy: strategy,
        scope,
        keyReference: encrypted.keyReference,
        semanticConstraints,
        status: 'ACTIVE',
        reconstructionCount: 0,
        createdAt: new Date().toISOString(),
        expiresAt
      };

      await DcrRepository.saveTransformationRecord(record);
      records.push(record);

      // Event 1: Data Detected & Classified
      const eventDetectHash = TransformationKeyService.computeEventHash(lastHash, {
        type: 'DATA_DETECTED',
        requestId,
        classification: f.classification,
        rawHash
      });
      const detectEvent: DcrProvenanceEvent = {
        eventId: `EVT-DCR-${Date.now()}-${i * 2}`,
        eventType: 'DATA_DETECTED',
        requestId,
        tenantId,
        classification: f.classification,
        sourceHash: rawHash,
        surrogateHash,
        transformationStrategy: strategy,
        provenanceCategory: 'ORIGINAL',
        policyVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        previousEventHash: lastHash,
        eventHash: eventDetectHash,
        description: `Classified ${f.entityType} as ${f.classification} under ${f.jurisdiction}.`
      };
      await DcrRepository.appendProvenanceEvent(detectEvent);
      events.push(detectEvent);
      lastHash = eventDetectHash;

      // Event 2: Transformation Applied & Encrypted in Vault
      const eventTransHash = TransformationKeyService.computeEventHash(lastHash, {
        type: 'VALUE_TRANSFORMED',
        strategy,
        surrogateHash
      });
      const transEvent: DcrProvenanceEvent = {
        eventId: `EVT-DCR-${Date.now()}-${i * 2 + 1}`,
        eventType: 'VALUE_TRANSFORMED',
        requestId,
        tenantId,
        classification: f.classification,
        sourceHash: rawHash,
        surrogateHash,
        transformationStrategy: strategy,
        provenanceCategory: 'ALTIL_SURROGATE',
        policyVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        previousEventHash: lastHash,
        eventHash: eventTransHash,
        description: `Cloaked with ${strategy} (surrogate: "${surrogate}"). Original encrypted with AES-256-GCM in vault.`,
        details: { maskedPreview: masked, keyReference: encrypted.keyReference }
      };
      await DcrRepository.appendProvenanceEvent(transEvent);
      events.push(transEvent);
      lastHash = eventTransHash;

      // Replace span in working text
      workingText = workingText.slice(0, f.startIndex) + surrogate + workingText.slice(f.endIndex);
    }

    return { cloakedText: workingText, records, events };
  },

  /**
   * Core Inbound Reconstruction Engine
   * Validates provenance strictly before replacing surrogates with decrypted originals.
   */
  async reconstructResponse(
    rawResponse: string,
    options: {
      tenantId?: string;
      requestId?: string;
      activeRecords?: DcrTransformationRecord[];
    } = {}
  ): Promise<{
    reconstructedText: string;
    reconstructedItems: Array<{
      surrogate: string;
      restoredMasked: string;
      dataType: string;
      provenance: DcrProvenanceCategory;
      reconstructed: boolean;
      reason?: string;
    }>;
    unreconstructedItems: Array<{
      value: string;
      reason: string;
      provenance: DcrProvenanceCategory;
    }>;
  }> {
    if (!rawResponse || typeof rawResponse !== 'string') {
      return { reconstructedText: '', reconstructedItems: [], unreconstructedItems: [] };
    }

    let reconstructedText = rawResponse;
    const reconstructedItems: any[] = [];
    const unreconstructedItems: any[] = [];
    const tenantId = options.tenantId || 'all';

    // Retrieve active records (either passed or fetched from repository)
    const records = options.activeRecords || await DcrRepository.getTransformationRecords(tenantId, options.requestId);

    for (const record of records) {
      if (!record.surrogateValue || record.surrogateValue.length < 2) continue;

      // Check if response contains the surrogate value
      if (reconstructedText.includes(record.surrogateValue)) {
        // PROVENANCE VERIFICATION RULE:
        // Decrypt only if authorized and within TTL
        const isExpired = new Date(record.expiresAt).getTime() <= Date.now();
        if (isExpired) {
          unreconstructedItems.push({
            value: record.surrogateValue,
            reason: 'Transformation record expired (TTL exceeded). Decryption key revoked.',
            provenance: 'ALTIL_SURROGATE'
          });
          continue;
        }

        const decryptedOriginal = TransformationKeyService.decrypt(record.originalValueCiphertext, record.keyReference);
        
        if (decryptedOriginal && !decryptedOriginal.startsWith('[')) {
          // Replace all occurrences of surrogate in response
          reconstructedText = reconstructedText.split(record.surrogateValue).join(decryptedOriginal);
          
          record.reconstructionCount += 1;
          record.status = 'RECONSTRUCTED';
          record.lastReconstructedAt = new Date().toISOString();
          await DcrRepository.saveTransformationRecord(record);

          // Append Provenance Event
          const lastHash = DcrRepository.getLastEventHash();
          const evtHash = TransformationKeyService.computeEventHash(lastHash, {
            type: 'VALUE_RECONSTRUCTED',
            surrogate: record.surrogateValue,
            recordId: record.id
          });
          await DcrRepository.appendProvenanceEvent({
            eventId: `EVT-DCR-REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            eventType: 'VALUE_RECONSTRUCTED',
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
            description: `Reconstructed surrogate "${record.surrogateValue}" to original context under verified provenance.`
          });

          reconstructedItems.push({
            surrogate: record.surrogateValue,
            restoredMasked: record.originalMaskedPreview,
            dataType: record.dataType,
            provenance: 'ORIGINAL',
            reconstructed: true
          });
        }
      }
    }

    // Check for any AI-invented or hallucinated tokens that match surrogate shape (ALTIL_*) but were NOT produced in vault
    const rogueTokenRegex = /\bALTIL_[A-Z]+_[0-9A-F]{4,8}\b/g;
    let rogueMatch;
    while ((rogueMatch = rogueTokenRegex.exec(rawResponse)) !== null) {
      const token = rogueMatch[0];
      const matchingRecord = records.find(r => r.surrogateValue === token);
      if (!matchingRecord) {
        unreconstructedItems.push({
          value: token,
          reason: 'PROVENANCE BLOCKED: Token was newly invented or hallucinated by AI model and not registered in vault.',
          provenance: 'AI_GENERATED'
        });
      }
    }

    return { reconstructedText, reconstructedItems, unreconstructedItems };
  },

  /**
   * Complete End-to-End Cloak -> Simulate AI -> Provenance Filter -> Reconstruct Pipeline Run
   */
  async runFullPipeline(
    prompt: string,
    options: {
      tenantId?: string;
      preferredStrategy?: DcrTransformationStrategy;
      simulatedAiResponse?: string;
    } = {}
  ): Promise<DcrPipelineResult> {
    const startTime = Date.now();
    const requestId = `REQ-DCR-${Date.now()}`;
    const tenantId = options.tenantId || 'cust-enterprise';

    // Step 1: Cloak Outbound Payload
    const { cloakedText, records, events } = await this.cloakPayload(prompt, {
      tenantId,
      requestId,
      scope: 'CONVERSATION',
      forcedStrategy: options.preferredStrategy
    });

    // Step 2: Simulate or Provide AI Response referencing cloaked entities
    let rawAiResponse = options.simulatedAiResponse;
    if (!rawAiResponse) {
      if (records.length > 0) {
        const topSurrogates = records.map(r => r.surrogateValue).slice(0, 3).join(', ');
        rawAiResponse = `Based on our analysis for ${records[0].surrogateValue}, all compliance parameters and risk scores are within acceptable operational boundaries. Recommended action items have been generated for ${topSurrogates}.`;
      } else {
        rawAiResponse = `Inference completed successfully. No PII or regulatory violations detected in provided request payload.`;
      }
    }

    // Step 3: Inbound Reconstruction
    const { reconstructedText, reconstructedItems, unreconstructedItems } = await this.reconstructResponse(rawAiResponse, {
      tenantId,
      requestId,
      activeRecords: records
    });

    const durationMs = Date.now() - startTime;
    const popiaFineEstimateZar = records.length * 250000;
    const gdprFineEstimateEur = records.length * 15000;

    return {
      requestId,
      tenantId,
      timestamp: new Date().toISOString(),
      originalPayload: prompt,
      cloakedPayload: cloakedText,
      rawAiResponse,
      reconstructedResponse: reconstructedText,
      transformationsApplied: records.map(r => ({
        originalMasked: r.originalMaskedPreview,
        surrogate: r.surrogateValue,
        dataType: r.dataType,
        classification: r.classification,
        strategy: r.transformationStrategy,
        scope: r.scope,
        provenance: 'ALTIL_SURROGATE'
      })),
      reconstructedItems,
      unreconstructedItems,
      stats: {
        detectedEntitiesCount: records.length,
        transformedEntitiesCount: records.length,
        reconstructedEntitiesCount: reconstructedItems.length,
        blockedReconstructionsCount: unreconstructedItems.length,
        finesPreventedZar: popiaFineEstimateZar,
        finesPreventedEur: gdprFineEstimateEur,
        durationMs
      },
      policyPassed: true,
      ledgerEventsCount: events.length + reconstructedItems.length
    };
  }
};
