import {
  PopiaComplianceRules,
  GdprComplianceRules,
  ComplianceScanResult,
  RegulatoryViolation,
  AIProvider
} from '../types';

/**
 * Validates 13-digit South African ID number using the Luhn checksum algorithm
 */
export function validateSouthAfricanID(idNumber: string): boolean {
  const cleanId = idNumber.replace(/\D/g, '');
  if (cleanId.length !== 13) return false;

  // Validate date part (YYMMDD)
  const month = parseInt(cleanId.substring(2, 4), 10);
  const day = parseInt(cleanId.substring(4, 6), 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  // Luhn algorithm check
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(cleanId.charAt(i), 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * Validates IBAN format checksum (Mod 97-10)
 */
export function validateIBAN(iban: string): boolean {
  const clean = iban.replace(/[\s-]/g, '').toUpperCase();
  if (clean.length < 15 || clean.length > 34) return false;

  // Rearrange: move country code + check digits to the end
  const rearranged = clean.slice(4) + clean.slice(0, 4);

  // Convert letters to numbers (A=10, B=11, etc.)
  let numericString = '';
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numericString += (code - 55).toString();
    } else if (code >= 48 && code <= 57) {
      numericString += rearranged.charAt(i);
    } else {
      return false;
    }
  }

  // Calculate mod 97 on large numbers piecewise
  let remainder = 0;
  for (let i = 0; i < numericString.length; i += 7) {
    const block = remainder.toString() + numericString.slice(i, i + 7);
    remainder = parseInt(block, 10) % 97;
  }
  return remainder === 1;
}

export interface ScanOptions {
  popiaRules?: PopiaComplianceRules;
  gdprRules?: GdprComplianceRules;
  targetProvider?: AIProvider;
}

/**
 * Comprehensive POPIA & GDPR Regulatory Compliance Pre-flight & Sanitization Engine
 */
export function scanAndSanitizePrompt(
  prompt: string,
  options: ScanOptions = {}
): ComplianceScanResult {
  const popia = options.popiaRules || {
    enabled: true,
    enforcementMode: 'redact_mask',
    maskSaIdNumbers: true,
    maskSaTaxNumbers: true,
    maskSaPhoneNumbers: true,
    maskSaBankingDetails: true,
    blockSpecialPersonalInfo: true,
    enforceSection72CrossBorder: true,
    logInformationOfficerAudit: true,
    requireConsentProofHeader: false
  };

  const gdpr = options.gdprRules || {
    enabled: true,
    enforcementMode: 'redact_mask',
    enforceArticle9SpecialCategories: true,
    enforceEuSovereignResidencyOnly: false,
    enforceArticle17ZeroRetention: true,
    enforceArticle22AutomatedDecisionFlag: true,
    maskEuropeanIbans: true,
    maskEuPassportsAndNationalIds: true,
    maskEmailsAndIps: true,
    dataRetentionTtlDays: 30
  };

  let sanitized = prompt;
  const popiaViolations: RegulatoryViolation[] = [];
  const gdprViolations: RegulatoryViolation[] = [];
  const detectedCategories: Set<string> = new Set();
  let redactedTokensCount = 0;

  // ----------------------------------------------------
  // 1. POPIA EVALUATION & MASKING (South Africa Act 4 of 2013)
  // ----------------------------------------------------
  if (popia.enabled) {
    // 1.1 South African 13-digit ID Number detection (with Luhn check)
    if (popia.maskSaIdNumbers) {
      const saIdRegex = /\b\d{13}\b/g;
      sanitized = sanitized.replace(saIdRegex, match => {
        if (validateSouthAfricanID(match)) {
          popiaViolations.push({
            framework: 'POPIA',
            rule: 'SA_CITIZEN_NATIONAL_ID',
            clause: 'POPIA Section 1 & Section 14 (Processing of Unique Identifiers)',
            severity: 'critical',
            detectedValueMasked: `${match.slice(0, 6)}*****${match.slice(-2)}`,
            description: `13-digit South African National ID number detected with valid Luhn checksum (DOB: ${match.slice(0, 2)}/${match.slice(2, 4)}/${match.slice(4, 6)}).`
          });
          detectedCategories.add('SA National ID (POPIA Section 14)');
          redactedTokensCount++;
          return `[POPIA_MASKED_SA_ID:${match.slice(0, 6)}*****]`;
        }
        return match;
      });
    }

    // 1.2 South African Tax Reference Numbers (SARS 10-digit format)
    if (popia.maskSaTaxNumbers) {
      const sarsRegex = /\b(?:SARS|tax\s*(?:ref|number|no|#)?:?)\s*([01239]\d{9})\b/gi;
      sanitized = sanitized.replace(sarsRegex, (match, taxNo) => {
        popiaViolations.push({
          framework: 'POPIA',
          rule: 'SARS_TAX_REFERENCE',
          clause: 'POPIA Section 14 & Tax Administration Act 2011',
          severity: 'high',
          detectedValueMasked: `SARS: ${taxNo.slice(0, 3)}****${taxNo.slice(-2)}`,
          description: '10-digit South African Revenue Service (SARS) Tax Reference number identified.'
        });
        detectedCategories.add('SARS Tax Identifier');
        redactedTokensCount++;
        return `[POPIA_MASKED_SARS_TAX:${taxNo.slice(0, 3)}****]`;
      });
    }

    // 1.3 South African Banking Details (Capitec, Standard Bank, FNB, ABSA, Nedbank)
    if (popia.maskSaBankingDetails) {
      const saBankRegex = /\b(?:Capitec|Standard\s*Bank|FNB|First\s*National\s*Bank|ABSA|Nedbank|Investec|Discovery\s*Bank)\s*(?:account|acc|a\/c|no|number)?:?\s*(\d{9,11})\b/gi;
      sanitized = sanitized.replace(saBankRegex, (match, accNo) => {
        popiaViolations.push({
          framework: 'POPIA',
          rule: 'SA_FINANCIAL_ACCOUNT',
          clause: 'POPIA Section 19 (Security Safeguards for Personal Banking Information)',
          severity: 'high',
          detectedValueMasked: `SA Banking Account: ****${accNo.slice(-4)}`,
          description: 'South African domestic banking institution account number detected.'
        });
        detectedCategories.add('SA Banking Information');
        redactedTokensCount++;
        return `[POPIA_MASKED_BANK_ACCOUNT:****${accNo.slice(-4)}]`;
      });
    }

    // 1.4 South African Phone Numbers (+27, 082, 071, 083, 084, 060...)
    if (popia.maskSaPhoneNumbers) {
      const saPhoneRegex = /(?:\+27|0)(?:6\d|7\d|8\d|1\d|2\d|3\d|4\d|5\d)\s*\d{3}\s*\d{4}\b/g;
      sanitized = sanitized.replace(saPhoneRegex, match => {
        popiaViolations.push({
          framework: 'POPIA',
          rule: 'SA_MOBILE_TELEPHONY',
          clause: 'POPIA Section 1 (Personal Contact Details)',
          severity: 'medium',
          detectedValueMasked: match.slice(0, 4) + '***' + match.slice(-2),
          description: 'South African cellular / fixed-line telephone number pattern detected.'
        });
        detectedCategories.add('SA Phone Number');
        redactedTokensCount++;
        return `[POPIA_MASKED_PHONE:${match.slice(0, 4)}***]`;
      });
    }

    // 1.5 POPIA Part B: Special Personal Information (Race, Biometrics, Health, Union, Criminal)
    if (popia.blockSpecialPersonalInfo) {
      const specialTerms = [
        { term: 'hiv positive', desc: 'Medical diagnostic / HIV health status record' },
        { term: 'biometric template', desc: 'Biometric identification vector payload' },
        { term: 'criminal record', desc: 'Alleged or historical criminal offense record' },
        { term: 'trade union member', desc: 'Trade union affiliation record' },
        { term: 'ethnic origin', desc: 'Racial or ethnic group profiling' }
      ];

      for (const st of specialTerms) {
        if (sanitized.toLowerCase().includes(st.term)) {
          popiaViolations.push({
            framework: 'POPIA',
            rule: 'POPIA_SPECIAL_PERSONAL_INFO_PART_B',
            clause: 'POPIA Part B (Sections 26 to 33) Prohibition on Processing Special Personal Information',
            severity: 'critical',
            detectedValueMasked: `Special Personal Category: [${st.term}]`,
            description: st.desc
          });
          detectedCategories.add('POPIA Special Personal Information (Part B)');
          sanitized = sanitized.replace(new RegExp(st.term, 'gi'), `[POPIA_SPECIAL_INFO_REDACTED]`);
          redactedTokensCount++;
        }
      }
    }
  }

  // ----------------------------------------------------
  // 2. GDPR EVALUATION & MASKING (EU Regulation 2016/679)
  // ----------------------------------------------------
  if (gdpr.enabled) {
    // 2.1 European IBANs
    if (gdpr.maskEuropeanIbans) {
      const ibanRegex = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g;
      sanitized = sanitized.replace(ibanRegex, match => {
        if (validateIBAN(match)) {
          gdprViolations.push({
            framework: 'GDPR',
            rule: 'EU_FINANCIAL_IBAN',
            clause: 'GDPR Article 5(1)(f) & Article 32 (Integrity and Confidentiality)',
            severity: 'critical',
            detectedValueMasked: `${match.slice(0, 4)}****${match.slice(-4)}`,
            description: `Valid European International Bank Account Number (Country: ${match.slice(0, 2)}).`
          });
          detectedCategories.add('European IBAN Account');
          redactedTokensCount++;
          return `[GDPR_MASKED_IBAN:${match.slice(0, 4)}****${match.slice(-4)}]`;
        }
        return match;
      });
    }

    // 2.2 Standard PII: Emails & IP Addresses
    if (gdpr.maskEmailsAndIps) {
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
      sanitized = sanitized.replace(emailRegex, match => {
        gdprViolations.push({
          framework: 'GDPR',
          rule: 'PII_EMAIL_ADDRESS',
          clause: 'GDPR Article 4(1) & Article 6 (Lawful Identifiers)',
          severity: 'medium',
          detectedValueMasked: match.replace(/(?<=.{2}).(?=.*@)/g, '*'),
          description: 'Directly identifiable electronic mail address.'
        });
        detectedCategories.add('Electronic Mail (PII)');
        redactedTokensCount++;
        return `[GDPR_MASKED_EMAIL]`;
      });

      const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
      sanitized = sanitized.replace(ipRegex, match => {
        // Exclude common local ips like 127.0.0.1 if needed, but flag external
        gdprViolations.push({
          framework: 'GDPR',
          rule: 'PII_IP_ADDRESS',
          clause: 'GDPR Recital 30 (Online Identifiers)',
          severity: 'low',
          detectedValueMasked: match.slice(0, 7) + '.***.***',
          description: 'IPv4 network location identifier.'
        });
        detectedCategories.add('IP Address Identifier');
        redactedTokensCount++;
        return `[GDPR_MASKED_IP]`;
      });
    }

    // 2.3 GDPR Article 9 Special Categories of Personal Data
    if (gdpr.enforceArticle9SpecialCategories) {
      const specialGdprTerms = [
        { term: 'medical diagnosis', desc: 'Protected health & clinical diagnostic record' },
        { term: 'patient condition', desc: 'Health status identifier' },
        { term: 'biometric face vector', desc: 'Biometric authentication data' },
        { term: 'religious affiliation', desc: 'Religious or philosophical beliefs' },
        { term: 'political opinion', desc: 'Political opinions or political party membership' },
        { term: 'sexual orientation', desc: 'Data concerning health or sexual orientation' },
        { term: 'genetic profile', desc: 'Genetic biometric data' }
      ];

      for (const sgt of specialGdprTerms) {
        if (sanitized.toLowerCase().includes(sgt.term)) {
          gdprViolations.push({
            framework: 'GDPR',
            rule: 'GDPR_ARTICLE_9_SPECIAL_CATEGORIES',
            clause: 'GDPR Article 9(1) Prohibition of Processing Special Categories',
            severity: 'critical',
            detectedValueMasked: `Article 9 Category: [${sgt.term}]`,
            description: sgt.desc
          });
          detectedCategories.add('GDPR Article 9 Special Category');
          sanitized = sanitized.replace(new RegExp(sgt.term, 'gi'), `[GDPR_ARTICLE_9_REDACTED]`);
          redactedTokensCount++;
        }
      }
    }

    // 2.4 GDPR Article 22 Automated Decision-Making & Profiling
    if (gdpr.enforceArticle22AutomatedDecisionFlag) {
      const profilingKeywords = ['terminate employee based on score', 'auto-reject loan application', 'automated credit underwriting decision'];
      for (const pk of profilingKeywords) {
        if (sanitized.toLowerCase().includes(pk)) {
          gdprViolations.push({
            framework: 'GDPR',
            rule: 'GDPR_ARTICLE_22_AUTOMATED_DECISION',
            clause: 'GDPR Article 22 (Automated Individual Decision-Making, Including Profiling)',
            severity: 'high',
            detectedValueMasked: `Automated Profiling Trigger: [${pk}]`,
            description: 'Automated decision-making prompt detected. Requires Human-in-the-Loop review.'
          });
          detectedCategories.add('Article 22 Automated Profiling');
        }
      }
    }
  }

  // ----------------------------------------------------
  // 3. CROSS-BORDER DATA SOVEREIGNTY & SECTION 72 CHECKS
  // ----------------------------------------------------
  let crossBorderTransferFlag: ComplianceScanResult['crossBorderTransferFlag'];

  if (options.targetProvider) {
    const isLocalOrOnPrem = options.targetProvider.type === 'ollama' || options.targetProvider.endpoint.includes('192.168.') || options.targetProvider.endpoint.includes('internal');
    const isAdequate = isLocalOrOnPrem || options.targetProvider.type === 'gemini'; // Local is sovereign

    if (popia.enforceSection72CrossBorder && detectedCategories.size > 0 && !isLocalOrOnPrem) {
      crossBorderTransferFlag = {
        sourceJurisdiction: 'South Africa (POPIA Scope)',
        destinationProvider: options.targetProvider.name,
        destinationJurisdiction: 'United States / Offshore Cloud Node',
        isAdequate,
        warning: 'Trans-border transfer of personal information requires POPIA Section 72(1) compliance (adequate protection or consent).'
      };
    }
  }

  // ----------------------------------------------------
  // 4. RISK SCORING & FINAL ACTION DETERMINATION
  // ----------------------------------------------------
  let riskScore = 0;
  const criticalCount = [...popiaViolations, ...gdprViolations].filter(v => v.severity === 'critical').length;
  const highCount = [...popiaViolations, ...gdprViolations].filter(v => v.severity === 'high').length;
  const mediumCount = [...popiaViolations, ...gdprViolations].filter(v => v.severity === 'medium').length;

  riskScore = Math.min(100, criticalCount * 40 + highCount * 25 + mediumCount * 10);

  let actionTaken: ComplianceScanResult['actionTaken'] = 'PASSED';
  let passed = true;

  if (criticalCount > 0) {
    if (popia.enforcementMode === 'strict_block' || gdpr.enforcementMode === 'strict_block') {
      actionTaken = 'BLOCKED';
      passed = false;
    } else {
      actionTaken = 'REDACTED_FORWARDED';
      passed = true;
    }
  } else if (redactedTokensCount > 0) {
    actionTaken = 'REDACTED_FORWARDED';
    passed = true;
  }

  return {
    passed,
    riskScore,
    actionTaken,
    popiaViolations,
    gdprViolations,
    originalPromptSnippet: prompt.slice(0, 160) + (prompt.length > 160 ? '...' : ''),
    sanitizedPrompt: sanitized,
    redactedTokensCount,
    detectedCategories: Array.from(detectedCategories),
    crossBorderTransferFlag,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };
}
