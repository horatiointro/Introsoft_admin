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
});

export function expandLegacyPermissionCodes(permissionCodes: readonly string[]): string[] {
  const expanded = new Set(permissionCodes);
  for (const permission of permissionCodes) {
    for (const implied of LEGACY_PERMISSION_IMPLICATIONS[permission] || []) expanded.add(implied);
  }
  return [...expanded];
}
