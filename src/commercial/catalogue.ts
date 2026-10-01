export const PRODUCT_RELATIONSHIP_TYPES = Object.freeze([
  'REQUIRES', 'RECOMMENDS', 'COMPATIBLE_WITH', 'INCOMPATIBLE_WITH', 'UPGRADE_TO',
  'DOWNGRADE_TO', 'ADD_ON', 'BUNDLE_MEMBER', 'ALTERNATIVE', 'REPLACEMENT', 'FOLLOW_ON',
] as const);

export type ProductRelationshipType = typeof PRODUCT_RELATIONSHIP_TYPES[number];

export interface ProductRelationshipInput {
  sourceProductId: string;
  targetProductId: string;
  relationshipType: ProductRelationshipType;
  quantity: number;
  explanation?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  sourceIsBundle: boolean;
  targetIsBundle: boolean;
}

export interface ResellerPriceInput {
  currency: string;
  resellerCost: number;
  minimumCustomerPrice: number;
  recommendedMarkupPercent: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface ResellerProductGrant {
  resellerOrganizationId: string;
  productId: string;
  status: string;
  effectiveFrom: string | Date;
  effectiveTo?: string | Date | null;
}

const validDate = (value: string) => Number.isFinite(Date.parse(value));

export function validateProductRelationship(input: ProductRelationshipInput): string[] {
  const errors: string[] = [];
  if (!input.sourceProductId || !input.targetProductId || input.sourceProductId === input.targetProductId) errors.push('Choose two different catalogue products.');
  if (!(PRODUCT_RELATIONSHIP_TYPES as readonly string[]).includes(input.relationshipType)) errors.push('Choose a supported product relationship.');
  if (!Number.isFinite(input.quantity) || input.quantity <= 0 || input.quantity > 1_000_000) errors.push('Relationship quantity must be positive and within the supported range.');
  if (Number.isFinite(input.quantity) && Number(input.quantity.toFixed(4)) !== input.quantity) errors.push('Relationship quantity supports up to four decimal places.');
  if (!validDate(input.effectiveFrom) || (input.effectiveTo && !validDate(input.effectiveTo)) || (input.effectiveTo && Date.parse(input.effectiveTo) <= Date.parse(input.effectiveFrom))) errors.push('Provide a valid half-open effective period.');
  if (['RECOMMENDS', 'REQUIRES', 'UPGRADE_TO', 'DOWNGRADE_TO', 'ALTERNATIVE', 'REPLACEMENT', 'FOLLOW_ON'].includes(input.relationshipType) && !String(input.explanation || '').trim()) errors.push('An explanation is required for this product relationship.');
  if (input.relationshipType === 'BUNDLE_MEMBER' && (!input.sourceIsBundle || input.targetIsBundle)) errors.push('A bundle must contain an existing non-bundle catalogue product.');
  if (input.relationshipType !== 'BUNDLE_MEMBER' && input.quantity !== 1) errors.push('Quantity is only configurable for bundle membership.');
  if (input.explanation && input.explanation.trim().length > 500) errors.push('Relationship explanation is too long.');
  return errors;
}

export function validateResellerPrice(input: ResellerPriceInput): string[] {
  const errors: string[] = [];
  if (!/^[A-Z]{3}$/.test(input.currency)) errors.push('Use a three-letter ISO currency code.');
  if (![input.resellerCost, input.minimumCustomerPrice, input.recommendedMarkupPercent].every(Number.isFinite)) errors.push('Pricing values must be finite numbers.');
  if ([input.resellerCost, input.minimumCustomerPrice].some(value => Number.isFinite(value) && (value > 1_000_000_000_000 || Number(value.toFixed(6)) !== value))) errors.push('Prices must be at most 1,000,000,000,000 with up to six decimal places.');
  if (Number.isFinite(input.recommendedMarkupPercent) && Number(input.recommendedMarkupPercent.toFixed(3)) !== input.recommendedMarkupPercent) errors.push('Recommended markup supports up to three decimal places.');
  if (input.resellerCost < 0 || input.minimumCustomerPrice < input.resellerCost) errors.push('Minimum customer price cannot be below reseller cost.');
  if (input.recommendedMarkupPercent < 0 || input.recommendedMarkupPercent > 500) errors.push('Recommended markup must be between 0 and 500 percent.');
  if (Number.isFinite(input.resellerCost) && Number.isFinite(input.recommendedMarkupPercent) && Number.isFinite(input.minimumCustomerPrice) && recommendedCustomerPrice(input.resellerCost, input.recommendedMarkupPercent) < input.minimumCustomerPrice) errors.push('Recommended customer price cannot be below the minimum customer price.');
  if (!validDate(input.effectiveFrom) || (input.effectiveTo && !validDate(input.effectiveTo)) || (input.effectiveTo && Date.parse(input.effectiveTo) <= Date.parse(input.effectiveFrom))) errors.push('Provide a valid half-open effective period.');
  return errors;
}

export function recommendedCustomerPrice(resellerCost: number, markupPercent: number): number {
  return Number((resellerCost * (1 + markupPercent / 100)).toFixed(6));
}

export function isEffectiveAt(from: string | Date, to: string | Date | null | undefined, at = new Date()): boolean {
  const start = from instanceof Date ? from.getTime() : Date.parse(from);
  const end = to instanceof Date ? to.getTime() : to ? Date.parse(to) : Number.POSITIVE_INFINITY;
  const instant = at.getTime();
  return Number.isFinite(start) && start <= instant && instant < end;
}

/** Catalogue visibility never implies resale permission; require an exact active organization/product grant. */
export function hasEffectiveResaleGrant(input: { resellerOrganizationId: string; productId: string; grants: readonly ResellerProductGrant[]; asOf?: Date }): boolean {
  const at = input.asOf || new Date();
  return input.grants.some(grant => grant.resellerOrganizationId === input.resellerOrganizationId && grant.productId === input.productId && grant.status === 'ACTIVE' && isEffectiveAt(grant.effectiveFrom, grant.effectiveTo, at));
}
