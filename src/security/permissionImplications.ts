/**
 * Bridges historic persisted permission names to the current route vocabulary.
 * These are only implied reads or equivalent legacy write names; no read permission
 * is promoted to a write permission.
 */
const LEGACY_PERMISSION_IMPLICATIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  'routing.edit': ['routing.read', 'routing.modify'],
  'models.configure': ['model.read', 'model.configure'],
  'providers.write': ['provider.read', 'provider.configure'],
  'policies.write': ['policy.read', 'policy.create', 'policy.modify', 'policy.disable'],
  'audit.export': ['audit.read'],
  'billing.write': ['billing.read', 'billing.modify'],
  'iam.users.write': ['user.read', 'user.create', 'user.update', 'user.disable'],
  // Route-level read gates use singular codes while role grants use the plural
  // operation names. Bridge both so a role granted incidents.write or
  // compliance.dsr can reach the routes that check incident.read and dsar.read.
  'incidents.write': ['incident.read', 'incident.create', 'incident.update'],
  'incidents.create': ['incident.read', 'incident.create'],
  'incidents.update': ['incident.read', 'incident.update'],
  'compliance.dsr': ['dsar.read', 'dsar.create', 'dsar.update'],
  'compliance.dsr.erase': ['dsar.read', 'dsar.erase'],
  // Platform administration is gated on system.configure; expose the
  // migration code as a read so configuration views remain reachable.
  'system.migrate': ['system.configure'],
});

export function expandLegacyPermissionCodes(permissionCodes: readonly string[]): string[] {
  const expanded = new Set(permissionCodes);
  for (const permission of permissionCodes) {
    for (const implied of LEGACY_PERMISSION_IMPLICATIONS[permission] || []) expanded.add(implied);
  }
  return [...expanded];
}
