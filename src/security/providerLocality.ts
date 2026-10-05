/**
 * Metadata-driven processing locality for AI providers.
 *
 * Processing location is a property of the deployment, not of the vendor name.
 * A self-hosted gateway speaking the OpenAI protocol and a hosted OpenAI endpoint
 * are the same provider type and different jurisdictions, so locality is resolved
 * from operator-declared metadata plus endpoint classification and fails closed
 * when neither establishes where inference actually happens.
 */

export type ProviderLocality = 'ON_PREM' | 'SOVEREIGN_CLOUD' | 'PUBLIC_CLOUD' | 'UNDECLARED';

export interface ProviderLocalityInput {
  providerId?: string;
  providerType?: string;
  endpoint?: string;
  /** Operator attestation that the endpoint is on-premises or otherwise ALTIL-controlled. */
  onPremAttested?: boolean;
  /** Jurisdictions the operator declares the inference to run in. */
  processingJurisdictions?: readonly string[];
}

export interface ProviderLocalityFacts {
  locality: ProviderLocality;
  /** True only when the endpoint provably runs inside a customer-controlled boundary. */
  isLocalExecution: boolean;
  /** True unless the endpoint provably runs locally. Undeclared deployments are treated as external. */
  isExternalCloud: boolean;
  declaredRegions: string[];
  /** True only when every declared jurisdiction is covered by a transfer basis ALTIL recognises. */
  jurisdictionAdequate: boolean;
  endpointHost: string;
  basis: string;
}

const PRIVATE_HOST_SUFFIXES = ['.internal', '.local', '.lan', '.intranet', '.corp', '.onprem', '.private'];

/** Jurisdictions covered by an adequacy decision or a recognised transfer mechanism. */
const ADEQUATE_JURISDICTIONS = new Set([
  'ZA',
  'EU', 'EEA', 'GB', 'UK', 'CH', 'IS', 'NO', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
]);

const REGION_LABELS: ReadonlyArray<{ readonly match: RegExp; readonly codes: readonly string[] }> = [
  { match: /south\s*africa|\bza\b/i, codes: ['ZA'] },
  { match: /united\s*states|\bus\b|\busa\b|america/i, codes: ['US'] },
  { match: /united\s*kingdom|\buk\b|\bgb\b/i, codes: ['GB'] },
  { match: /european\s*union|\beu\b|europe|european|eea/i, codes: ['EU'] },
  { match: /canada|\bca\b/i, codes: ['CA'] },
  { match: /india|\bin\b/i, codes: ['IN'] },
  { match: /china|\bcn\b/i, codes: ['CN'] },
  { match: /japan|\bjp\b/i, codes: ['JP'] },
  { match: /australia|\bau\b/i, codes: ['AU'] },
  { match: /singapore|\bsg\b/i, codes: ['SG'] },
  { match: /switzerland|\bch\b/i, codes: ['CH'] },
];

function endpointHost(endpoint?: string): string {
  const raw = String(endpoint || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
  } catch {
    return '';
  }
}

function isPrivateHost(host: string): boolean {
  if (!host) return false;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') return true;
  if (host.startsWith('fe80:') || /^(fc|fd)[0-9a-f]{2}:/.test(host)) return true;
  if (PRIVATE_HOST_SUFFIXES.some(suffix => host.endsWith(suffix))) return true;
  const octets = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!octets) return false;
  const first = Number(octets[1]);
  const second = Number(octets[2]);
  if (first === 0 || first === 10 || first === 127) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 169 && second === 254) return true;
  return false;
}

/** Normalise a residency label or ISO code into the jurisdiction codes it denotes. */
export function residencyCodes(label: string): string[] {
  const value = String(label || '').trim();
  if (!value) return [];
  const direct = value.toUpperCase();
  if (ADEQUATE_JURISDICTIONS.has(direct)) return [direct];
  const matched = REGION_LABELS.find(entry => entry.match.test(value));
  return matched ? [...matched.codes] : [direct];
}

/** A declared region satisfies a residency requirement when the two overlap, or the requirement names the EU/EEA. */
export function residencySatisfied(required: readonly string[], declared: readonly string[]): boolean {
  const declaredCodes = declared.flatMap(residencyCodes);
  if (!declaredCodes.length) return false;
  return required.some(label => {
    const requiredCodes = residencyCodes(label);
    if (!requiredCodes.length) return false;
    if (requiredCodes.includes('EU') || requiredCodes.includes('EEA')) {
      return declaredCodes.some(code => ADEQUATE_JURISDICTIONS.has(code));
    }
    return requiredCodes.some(code => declaredCodes.includes(code));
  });
}

export function resolveProviderLocality(input: ProviderLocalityInput = {}): ProviderLocalityFacts {
  const host = endpointHost(input.endpoint);
  const declaredRegions = (input.processingJurisdictions || [])
    .map(region => String(region || '').trim())
    .filter(Boolean);
  const adequate = declaredRegions.length > 0 && declaredRegions.every(region => residencyCodes(region).some(code => ADEQUATE_JURISDICTIONS.has(code)));

  if (input.onPremAttested === true) {
    return {
      locality: 'ON_PREM',
      isLocalExecution: true,
      isExternalCloud: false,
      declaredRegions,
      jurisdictionAdequate: true,
      endpointHost: host,
      basis: 'Operator attested this provider as on-premises or otherwise ALTIL-controlled.'
    };
  }

  if (host && isPrivateHost(host)) {
    return {
      locality: 'ON_PREM',
      isLocalExecution: true,
      isExternalCloud: false,
      declaredRegions,
      jurisdictionAdequate: true,
      endpointHost: host,
      basis: `Endpoint ${host} resolves to a private or internal network address.`
    };
  }

  if (!host) {
    return {
      locality: 'UNDECLARED',
      isLocalExecution: false,
      isExternalCloud: true,
      declaredRegions,
      jurisdictionAdequate: false,
      endpointHost: '',
      basis: 'Provider metadata does not establish where inference runs; treated as an external cloud destination.'
    };
  }

  if (adequate) {
    return {
      locality: 'SOVEREIGN_CLOUD',
      isLocalExecution: false,
      isExternalCloud: true,
      declaredRegions,
      jurisdictionAdequate: true,
      endpointHost: host,
      basis: `Endpoint ${host} is public but every declared jurisdiction (${declaredRegions.join(', ')}) has a recognised transfer basis.`
    };
  }

  return {
    locality: 'PUBLIC_CLOUD',
    isLocalExecution: false,
    isExternalCloud: true,
    declaredRegions,
    jurisdictionAdequate: false,
    endpointHost: host,
    basis: declaredRegions.length
      ? `Endpoint ${host} is public and declares non-adequate jurisdiction(s) ${declaredRegions.join(', ')}.`
      : `Endpoint ${host} is a public host with no declared processing jurisdiction.`
  };
}