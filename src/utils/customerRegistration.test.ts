import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildCustomerRegistrationPayload, customerRegistrationVariant, validateCustomerRegistration, type CustomerRegistrationValues } from './customerRegistration.ts';

const values = (type: CustomerRegistrationValues['type'], overrides: Partial<CustomerRegistrationValues> = {}): CustomerRegistrationValues => ({
  type, name: 'Sam Rivera', legalName: 'Sam Rivera LLC', registrationNumber: 'REG-1', taxVatNumber: 'VAT-1', industry: 'Software & SaaS',
  country: 'South Africa (ZA)', tier: 'starter', monthlyBudgetUsd: 100, rateLimitRpm: 60, notes: '', contactName: 'Sam Rivera',
  contactEmail: 'sam@example.test', contactPhone: '+27000000000', contactRole: 'Owner', statutoryOfficers: { informationOfficer: { name: 'Example' } },
  initialApplicationName: undefined, initialApplicationIdentifier: undefined, ...overrides,
});

describe('customer registration variants', () => {
  it('shows company-specific identity, industry, and governance fields for companies', () => {
    const variant = customerRegistrationVariant('company');
    assert.equal(variant.companyDetails, true);
    assert.equal(variant.industryField, true);
    assert.equal(variant.statutoryOfficers, true);
  });
  it('selects the individual form variant without company-only sections', () => {
    const variant = customerRegistrationVariant('individual');
    assert.equal(variant.nameLabel, 'Individual full name');
    assert.equal(variant.companyDetails, false);
    assert.equal(variant.industryField, false);
    assert.equal(variant.statutoryOfficers, false);
  });
  it('requires identity and contact email but not company registration or VAT for an individual', () => {
    assert.deepEqual(validateCustomerRegistration({ type: 'individual', name: 'Taylor Jones', contactEmail: 'taylor@example.test' }), []);
    assert.ok(validateCustomerRegistration({ type: 'individual', name: '', contactEmail: 'taylor@example.test' }).some(error => error.includes('full name')));
    assert.ok(validateCustomerRegistration({ type: 'individual', name: 'Taylor Jones', contactEmail: '' }).some(error => error.includes('email')));
  });
  it('requires customer identity and contact email for a company while keeping registration and VAT optional', () => {
    assert.deepEqual(validateCustomerRegistration({ type: 'company', name: 'Acme', contactEmail: 'admin@acme.test' }), []);
    assert.equal(validateCustomerRegistration({ type: 'company', name: '', contactEmail: 'admin@acme.test' }).length, 1);
  });
  it('keeps individual classification and omits company-only fields from create/update payloads', () => {
    const individual = buildCustomerRegistrationPayload(values('individual'));
    assert.equal(individual.type, 'individual');
    assert.equal(individual.name, 'Sam Rivera');
    assert.equal('legalName' in individual, false);
    assert.equal('registrationNumber' in individual, false);
    assert.equal('taxVatNumber' in individual, false);
    assert.equal('statutoryOfficers' in individual, false);
    assert.deepEqual((individual.primaryContact as { name: string }).name, 'Sam Rivera');
  });
  it('retains company legal, registration, tax, and statutory data in company payloads', () => {
    const company = buildCustomerRegistrationPayload(values('company'));
    assert.equal(company.type, 'company');
    assert.equal(company.legalName, 'Sam Rivera LLC');
    assert.equal(company.registrationNumber, 'REG-1');
    assert.equal(company.taxVatNumber, 'VAT-1');
    assert.deepEqual(company.statutoryOfficers, { informationOfficer: { name: 'Example' } });
  });
});
