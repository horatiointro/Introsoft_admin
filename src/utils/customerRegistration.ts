import type { CustomerType } from '../types';

export interface CustomerRegistrationValues {
  readonly type: CustomerType;
  readonly name: string;
  readonly legalName: string;
  readonly registrationNumber: string;
  readonly taxVatNumber: string;
  readonly industry: string;
  readonly country: string;
  readonly tier: string;
  readonly monthlyBudgetUsd: number;
  readonly rateLimitRpm: number;
  readonly notes: string;
  readonly contactName: string;
  readonly contactEmail: string;
  readonly contactPhone: string;
  readonly contactRole: string;
  readonly statutoryOfficers: Record<string, unknown>;
  readonly initialApplicationName?: string;
  readonly initialApplicationIdentifier?: string;
}

export interface CustomerRegistrationVariant {
  readonly identityHeading: string;
  readonly nameLabel: string;
  readonly namePlaceholder: string;
  readonly contactHeading: string;
  readonly companyDetails: boolean;
  readonly industryField: boolean;
  readonly statutoryOfficers: boolean;
}

export function customerRegistrationVariant(type: CustomerType): CustomerRegistrationVariant {
  return Object.freeze(type === 'company' ? {
    identityHeading: 'Organization & company details',
    nameLabel: 'Customer / Trading Name',
    namePlaceholder: 'e.g. Acme Financial Group',
    contactHeading: 'Primary business contact',
    companyDetails: true,
    industryField: true,
    statutoryOfficers: true,
  } : {
    identityHeading: 'Individual account details',
    nameLabel: 'Individual full name',
    namePlaceholder: 'e.g. Sam Rivera',
    contactHeading: 'Account contact',
    companyDetails: false,
    industryField: false,
    statutoryOfficers: false,
  });
}

/** Required values are limited to the customer identity and contact fields consumed by the model. */
export function validateCustomerRegistration(values: Pick<CustomerRegistrationValues, 'type' | 'name' | 'contactEmail'>): string[] {
  const errors: string[] = [];
  if (!values.name.trim()) errors.push(values.type === 'individual' ? 'Enter the individual’s full name.' : 'Enter the customer or trading name.');
  const email = values.contactEmail.trim();
  if (!email) errors.push('Enter a primary contact email address.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid primary contact email address.');
  return errors;
}

/** Preserve the existing Customer discriminator; never turn an individual into an organization. */
export function buildCustomerRegistrationPayload(values: CustomerRegistrationValues): Record<string, unknown> {
  const individual = values.type === 'individual';
  const payload: Record<string, unknown> = {
    type: values.type,
    name: values.name.trim(),
    industry: individual ? 'Individual / Solo Developer' : values.industry,
    country: values.country,
    tier: values.tier,
    monthlyBudgetUsd: Number(values.monthlyBudgetUsd) || 2500,
    rateLimitRpm: Number(values.rateLimitRpm) || 240,
    notes: values.notes,
    primaryContact: {
      name: individual ? values.name.trim() : values.contactName.trim() || values.name.trim(),
      email: values.contactEmail.trim(),
      phone: values.contactPhone.trim(),
      role: individual ? 'Account Owner' : values.contactRole,
    },
  };

  if (!individual) {
    payload.legalName = values.legalName.trim() || values.name.trim();
    payload.registrationNumber = values.registrationNumber.trim();
    payload.taxVatNumber = values.taxVatNumber.trim();
    payload.statutoryOfficers = values.statutoryOfficers;
  }
  if (values.initialApplicationName) payload.initialApplicationName = values.initialApplicationName;
  if (values.initialApplicationIdentifier) payload.initialApplicationIdentifier = values.initialApplicationIdentifier;
  return payload;
}
