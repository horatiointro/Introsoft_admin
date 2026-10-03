import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { executeQuery, isDatabaseConnected } from './mariadb';
import { isMissingAuthorizationScopeColumn, normalizeLegacyIamAssignments } from '../security/legacyIamAssignments';
import type { AuthorizationAssignment } from '../security/authorizationContext';
import { expandLegacyPermissionCodes } from '../security/permissionImplications';
import { emitAltilEvent } from '../logging/eventLogger';
import { allowsInMemoryIamFallback, persistAuthenticationSession, resolveAuthenticationRecord, resolveAuthenticationSession } from '../security/authenticationBoundary';
import { verifyMfaRequirement } from '../security/mfaVerification';

export interface IamUserRecord {
  id: string;
  tenant_id: string | null;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  title?: string;
  department: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED' | 'OFFBOARDED';
  failed_login_attempts: number;
  lockout_until: Date | null;
  mfa_enabled: boolean;
  mfa_enforced: boolean;
  last_login_at: Date | null;
  last_login_ip: string | null;
  password_changed_at: Date;
  force_password_change?: boolean;
  password_history?: string[] | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IamRoleRecord {
  id: string;
  tenant_id: string | null;
  role_code: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  is_immutable: boolean;
  permissions?: string[];
}

export interface IamPermissionRecord {
  id: string;
  permission_code: string;
  category: string;
  name: string;
  description: string | null;
}

export interface IamAuthorizationAssignment extends AuthorizationAssignment {}

export interface IamSessionRecord {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  expires_at: Date;
  last_activity_at: Date;
  created_at: Date;
}

export interface AuthResult {
  success: boolean;
  user?: IamUserRecord;
  session?: IamSessionRecord;
  error?: string;
  message?: string;
  lockoutRemainingMinutes?: number;
  failedAttempts?: number;
}

// In-Memory Fallback Store
const inMemoryUsers: IamUserRecord[] = [
  {
    id: 'user_super_admin_001',
    tenant_id: null,
    email: 'horatio.huxham@gmail.com',
    password_hash: bcrypt.hashSync('AltilSuperAdmin2026!', 10),
    first_name: 'Horatio',
    last_name: 'Huxham',
    title: 'Chief Security & AI Architect',
    department: 'Executive AI Governance & Architecture',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: new Date(),
    last_login_ip: '127.0.0.1',
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_super_admin_000',
    tenant_id: null,
    email: 'admin@altil.security',
    password_hash: bcrypt.hashSync('AdminPassword123!', 10),
    first_name: 'Super',
    last_name: 'Administrator',
    title: 'Principal Security Officer',
    department: 'ALTIL SecOps Core',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: new Date(),
    last_login_ip: '127.0.0.1',
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_tenant_admin_002',
    tenant_id: 'cust-acme-fintech',
    email: 'sarah.j@acme-corp.co.za',
    password_hash: bcrypt.hashSync('TenantAdmin2026!', 10),
    first_name: 'Sarah',
    last_name: 'Jenkins',
    title: 'Enterprise Platform Lead',
    department: 'Financial Platform Engineering',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: new Date(),
    last_login_ip: '127.0.0.1',
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_tenant_b_admin_004',
    tenant_id: 'cust-safecircle',
    email: 'tenant_b_admin@global-bank.com',
    password_hash: bcrypt.hashSync('TenantAdmin2026!', 10),
    first_name: 'David',
    last_name: 'Khumalo',
    title: 'VP Technology',
    department: 'Core Banking Infrastructure',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: new Date(),
    last_login_ip: '127.0.0.1',
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_tenant_b_admin_008',
    tenant_id: 'cust-cashcreators',
    email: 'tenant.admin@capitec.bank',
    password_hash: bcrypt.hashSync('TenantPassword123!', 10),
    first_name: 'Capitec',
    last_name: 'Tenant Admin',
    title: 'Enterprise Admin',
    department: 'Digital Platform',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: new Date(),
    last_login_ip: '127.0.0.1',
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_auditor_003',
    tenant_id: null,
    email: 'audit@statutory.gov.za',
    password_hash: bcrypt.hashSync('Auditor2026!', 10),
    first_name: 'Statutory',
    last_name: 'Auditor',
    title: 'Statutory Compliance Officer',
    department: 'Information Regulator Compliance',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: false,
    mfa_enforced: false,
    last_login_at: new Date(),
    last_login_ip: '127.0.0.1',
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_auditor_009',
    tenant_id: null,
    email: 'auditor@altil.security',
    password_hash: bcrypt.hashSync('AuditorPassword123!', 10),
    first_name: 'Lead',
    last_name: 'Auditor',
    title: 'Compliance & Audit Lead',
    department: 'Statutory Compliance',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: false,
    mfa_enforced: false,
    last_login_at: new Date(),
    last_login_ip: '127.0.0.1',
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_engineer_010',
    tenant_id: 'cust-acme-fintech',
    email: 'engineer@altil.security',
    password_hash: bcrypt.hashSync('EngineerPassword123!', 10),
    first_name: 'AI',
    last_name: 'Engineer',
    title: 'Machine Learning Infrastructure Engineer',
    department: 'AI Operations',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: false,
    last_login_at: new Date(),
    last_login_ip: '127.0.0.1',
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_locked_005',
    tenant_id: 'cust-acme-fintech',
    email: 'locked.user@acme-corp.co.za',
    password_hash: bcrypt.hashSync('Password123!', 10),
    first_name: 'Locked',
    last_name: 'User',
    title: 'Security Locked Account',
    department: 'Operations',
    status: 'LOCKED',
    failed_login_attempts: 5,
    lockout_until: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in future
    mfa_enabled: false,
    mfa_enforced: false,
    last_login_at: null,
    last_login_ip: null,
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_disabled_006',
    tenant_id: 'cust-acme-fintech',
    email: 'disabled.user@acme-corp.co.za',
    password_hash: bcrypt.hashSync('Password123!', 10),
    first_name: 'Disabled',
    last_name: 'Account',
    title: 'Suspended Account',
    department: 'Risk Management',
    status: 'SUSPENDED',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: false,
    mfa_enforced: false,
    last_login_at: null,
    last_login_ip: null,
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_no_role_007',
    tenant_id: 'cust-acme-fintech',
    email: 'norole.user@acme-corp.co.za',
    password_hash: bcrypt.hashSync('Password123!', 10),
    first_name: 'Guest',
    last_name: 'Viewer',
    title: 'No Elevated Role',
    department: 'Guest',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: false,
    mfa_enforced: false,
    last_login_at: null,
    last_login_ip: null,
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'user_security_officer_005',
    tenant_id: null,
    email: 'security@altil.security',
    password_hash: bcrypt.hashSync('SecurityOfficer2026!', 10),
    first_name: 'Security',
    last_name: 'Officer',
    title: 'Enterprise Security Director',
    department: 'Risk & Governance',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: new Date(),
    last_login_ip: '127.0.0.1',
    password_changed_at: new Date(),
    created_by: 'SYSTEM_BOOTSTRAP',
    created_at: new Date(),
    updated_at: new Date(),
  }
];

const inMemorySessions = new Map<string, IamSessionRecord>();
const inMemoryLoginAuditLogs: Array<{
  id: string;
  user_id: string | null;
  email_attempted: string;
  tenant_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  outcome: string;
  failure_reason: string | null;
  created_at: Date;
}> = [];

export class IamRepository {
  /** Returns permissions and scope bound to each persisted role assignment. */
  public static async getAuthorizationAssignments(userId: string): Promise<IamAuthorizationAssignment[]> {
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery<{
          assignment_id: string;
          role_code: string;
          tenant_id: string | null;
          access_scope: IamAuthorizationAssignment['visibility'];
          permission_code: string | null;
        }>(
          `SELECT ur.id AS assignment_id, r.role_code, ur.tenant_id, ur.access_scope, p.permission_code
           FROM iam_user_roles ur
           JOIN iam_roles r ON r.id = ur.role_id
           LEFT JOIN iam_role_permissions rp ON rp.role_id = r.id
           LEFT JOIN iam_permissions p ON p.id = rp.permission_id
           WHERE ur.user_id = ?
           ORDER BY ur.assigned_at, ur.id`,
          [userId]
        );
        const assignments = new Map<string, Omit<IamAuthorizationAssignment, 'permissions'> & { permissions: string[] }>();
        for (const row of rows) {
          let assignment = assignments.get(row.assignment_id);
          if (!assignment) {
            assignment = {
              assignmentId: row.assignment_id,
              role: row.role_code,
              organizationId: row.tenant_id,
              visibility: row.access_scope,
              permissions: [],
            };
            assignments.set(row.assignment_id, assignment);
          }
          if (row.permission_code && !assignment.permissions.includes(row.permission_code)) assignment.permissions.push(row.permission_code);
        }
        return [...assignments.values()].map(assignment => ({ ...assignment, permissions: expandLegacyPermissionCodes(assignment.permissions) }));
      } catch (error) {
        // A pre-scope schema can safely preserve tenant-bound access, but cannot prove
        // global access. Do not use this fallback for connectivity or unrelated SQL errors.
        if (isMissingAuthorizationScopeColumn(error)) {
          try {
            const legacyRows = await executeQuery<{
              assignment_id: string;
              role_code: string;
              tenant_id: string | null;
              permission_code: string | null;
            }>(
              `SELECT ur.id AS assignment_id, r.role_code, ur.tenant_id, p.permission_code
               FROM iam_user_roles ur
               JOIN iam_roles r ON r.id = ur.role_id
               LEFT JOIN iam_role_permissions rp ON rp.role_id = r.id
               LEFT JOIN iam_permissions p ON p.id = rp.permission_id
               WHERE ur.user_id = ?
               ORDER BY ur.assigned_at, ur.id`,
              [userId]
            );
            return normalizeLegacyIamAssignments(legacyRows).map(assignment => ({ ...assignment, permissions: expandLegacyPermissionCodes(assignment.permissions) }));
          } catch (legacyError) {
            console.error('[IAM Repository] Legacy authorization assignments unavailable; access will fail closed.', legacyError);
            return [];
          }
        }
        // Other schema/query errors must not fall back to memory identities or wider access.
        console.error('[IAM Repository] Authorization assignments unavailable; access will fail closed.', error);
        return [];
      }
    }

    if (!allowsInMemoryIamFallback()) return [];
    const identity = inMemoryUsers.find(user => user.id === userId);
    if (!identity || identity.status !== 'ACTIVE') return [];
    const { roles, permissions, tenantId } = await this.getUserRolesAndPermissions(userId);
    return roles.map(role => ({
      assignmentId: `${userId}:${role}`,
      role,
      organizationId: role === 'SUPER_ADMIN' ? null : (identity.tenant_id || tenantId),
      visibility: role === 'SUPER_ADMIN' && identity.tenant_id === null ? 'GLOBAL' : identity.tenant_id ? 'ORGANISATION' : 'SELF',
      permissions: [...permissions],
    }));
  }

  /**
   * Hashes plaintext password with bcrypt (cost factor 10)
   */
  public static async hashPassword(plainText: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainText, salt);
  }

  /**
   * Verifies plaintext password against stored bcrypt hash
   */
  public static async verifyPassword(plainText: string, hash: string): Promise<boolean> {
    if (!plainText || !hash) return false;
    try {
      return await bcrypt.compare(plainText, hash);
    } catch {
      return false;
    }
  }

  /**
   * Generates secure random session token (hex)
   */
  public static generateSessionToken(): string {
    return 'altil_sess_' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Retrieves a user by their corporate email address
   */
  public static async getUserByEmail(email: string): Promise<IamUserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return resolveAuthenticationRecord({
      databaseAvailable: isDatabaseConnected(),
      databaseLookup: async () => {
        const rows = await executeQuery<IamUserRecord>(
          'SELECT * FROM iam_users WHERE LOWER(email) = ? LIMIT 1',
          [normalizedEmail]
        );
        return rows[0] || null;
      },
      memoryLookup: () => inMemoryUsers.find(u => u.email.toLowerCase() === normalizedEmail) || null,
    });
  }

  /**
   * Retrieves a user by their unique ID
   */
  public static async getUserById(id: string): Promise<IamUserRecord | null> {
    return resolveAuthenticationRecord({
      databaseAvailable: isDatabaseConnected(),
      databaseLookup: async () => {
        const rows = await executeQuery<IamUserRecord>(
          'SELECT * FROM iam_users WHERE id = ? LIMIT 1',
          [id]
        );
        return rows[0] || null;
      },
      memoryLookup: () => inMemoryUsers.find(u => u.id === id) || null,
    });
  }

  /**
   * Quick-access path for an already-active Super Admin identity.
   * It never unlocks or otherwise changes an inactive identity.
   */
  public static async prepareSuperAdminQuickAccess(email: string): Promise<IamUserRecord | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const { roles } = await this.getUserRolesAndPermissions(user.id);
    if (!roles.some(role => role.toUpperCase() === 'SUPER_ADMIN')) return null;
    if (user.status !== 'ACTIVE') return null;
    return user;
  }

  /**
   * Fetches roles and aggregated permissions for a given user ID
   */
  public static async getUserRolesAndPermissions(userId: string): Promise<{
    roles: string[];
    permissions: string[];
    tenantId: string | null;
  }> {
    if (isDatabaseConnected()) {
      try {
        const roleRows = await executeQuery<{ role_code: string; tenant_id: string | null }>(
          `SELECT r.role_code, ur.tenant_id 
           FROM iam_user_roles ur 
           JOIN iam_roles r ON ur.role_id = r.id 
           WHERE ur.user_id = ?`,
          [userId]
        );

        const permRows = await executeQuery<{ permission_code: string }>(
          `SELECT DISTINCT p.permission_code 
           FROM iam_user_roles ur 
           JOIN iam_role_permissions rp ON ur.role_id = rp.role_id 
           JOIN iam_permissions p ON rp.permission_id = p.id 
           WHERE ur.user_id = ?`,
          [userId]
        );

        if (roleRows.length > 0) {
          return {
            roles: roleRows.map(r => r.role_code),
            permissions: expandLegacyPermissionCodes(permRows.map(p => p.permission_code)),
            tenantId: roleRows[0]?.tenant_id || null,
          };
        }
        // A completed database miss is authoritative even in development/test.
        return { roles: [], permissions: [], tenantId: null };
      } catch (err) {
        console.warn('[IAM Repository] Error fetching user roles/permissions from DB:', err);
        if (!allowsInMemoryIamFallback()) return { roles: [], permissions: [], tenantId: null };
      }
    } else if (!allowsInMemoryIamFallback()) {
      return { roles: [], permissions: [], tenantId: null };
    }

    // In-memory fallback roles
    if (userId === 'user_super_admin_001' || userId === 'user_super_admin_000') {
      return {
        roles: ['SUPER_ADMIN'],
        permissions: [
          'tenant.read', 'tenant.create', 'tenant.update', 'tenant.delete', 'tenant.write',
          'user.read', 'user.create', 'user.update', 'user.disable',
          'role.read', 'role.assign', 'role.modify',
          'provider.read', 'provider.configure', 'provider.disable',
          'model.read', 'model.configure',
          'routing.read', 'routing.modify',
          'policy.read', 'policy.create', 'policy.modify', 'policy.disable',
          'incident.read', 'incident.create', 'incident.update', 'incident.close',
          'dsar.read', 'dsar.create', 'dsar.update', 'dsar.erase',
          'billing.read', 'billing.modify',
          'audit.read', 'audit.export',
          'system.migrate', 'system.configure',
          'secret.read', 'secret.rotate'
        ],
        tenantId: null,
      };
    } else if (userId === 'user_security_officer_005') {
      return {
        roles: ['SECURITY_OFFICER'],
        permissions: [
          'policy.read', 'policy.create', 'policy.modify', 'policy.disable',
          'user.read', 'user.update', 'user.disable',
          'role.read',
          'audit.read',
          'provider.read', 'model.read', 'routing.read'
        ],
        tenantId: null,
      };
    } else if (userId === 'user_tenant_admin_002') {
      return {
        roles: ['TENANT_ADMIN'],
        permissions: [
          'tenant.read', 'tenant.update', 'apikeys.create', 'apikeys.revoke', 'iam.users.write',
          'user.read', 'user.create', 'user.update', 'user.disable',
          'incident.read', 'incident.create', 'incident.update',
          'dsar.read', 'dsar.create', 'dsar.update'
        ],
        tenantId: 'cust-acme-fintech',
      };
    } else if (userId === 'user_tenant_b_admin_004' || userId === 'user_tenant_b_admin_008') {
      return {
        roles: ['TENANT_ADMIN'],
        permissions: [
          'tenant.read', 'tenant.update', 'apikeys.create', 'apikeys.revoke', 'iam.users.write',
          'user.read', 'user.create', 'user.update', 'user.disable',
          'incident.read', 'incident.create', 'incident.update',
          'dsar.read', 'dsar.create', 'dsar.update'
        ],
        tenantId: userId === 'user_tenant_b_admin_004' ? 'cust-safecircle' : 'cust-cashcreators',
      };
    } else if (userId === 'user_auditor_003' || userId === 'user_auditor_009') {
      return {
        roles: ['AUDITOR'],
        permissions: [
          'audit.read', 'audit.export',
          'dsar.read', 'policy.read', 'tenant.read'
        ],
        tenantId: null,
      };
    } else if (userId === 'user_engineer_010') {
      return {
        roles: ['AI_ENGINEER'],
        permissions: [
          'provider.read', 'provider.configure',
          'model.read', 'model.configure',
          'routing.read', 'routing.modify'
        ],
        tenantId: 'cust-acme-fintech',
      };
    }

    return {
      roles: [],
      permissions: [],
      tenantId: null,
    };
  }

  /**
   * Authenticates user credentials, handles lockouts, session issuance, and audit logs
   */
  public static async authenticate(
    email: string,
    plainTextPassword: string,
    meta: { ipAddress?: string; userAgent?: string; mfaCode?: string } = {}
  ): Promise<AuthResult> {
    const ip = meta.ipAddress || '127.0.0.1';
    const ua = meta.userAgent || 'ALTIL Control Console';

    const user = await this.getUserByEmail(email);

    if (!user) {
      await this.logLoginEvent(email, 'INVALID_PASSWORD', null, null, ip, ua, 'User account does not exist.');
      return {
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email address or security password.'
      };
    }

    // 1. Check if user is currently locked
    if (user.status === 'LOCKED' || (user.lockout_until && new Date(user.lockout_until) > new Date())) {
      const remainingMs = user.lockout_until ? new Date(user.lockout_until).getTime() - Date.now() : 15 * 60 * 1000;
      const remainingMins = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));

      await this.logLoginEvent(email, 'LOCKED', user.id, user.tenant_id, ip, ua, `Account locked. Lockout remaining: ${remainingMins}m`);
      return {
        success: false,
        error: 'ACCOUNT_LOCKED',
        lockoutRemainingMinutes: remainingMins,
        message: `Account is temporarily locked due to excessive failed attempts. Try again in ${remainingMins} minutes.`
      };
    }

    // 2. Check if user is suspended, disabled, or offboarded
    if (user.status !== 'ACTIVE') {
      await this.logLoginEvent(email, 'SUSPENDED', user.id, user.tenant_id, ip, ua, `Account is in ${user.status} state.`);
      return {
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: 'User account has been suspended or deactivated. Contact your Enterprise Security Administrator.'
      };
    }

    // 3. Verify password hash
    const isValid = await this.verifyPassword(plainTextPassword, user.password_hash);

    if (!isValid) {
      await this.recordFailedLogin(user);
      await this.logLoginEvent(email, 'INVALID_PASSWORD', user.id, user.tenant_id, ip, ua, `Failed password attempt ${user.failed_login_attempts}/5.`);

      if ((user.status as string) === 'LOCKED') {
        return {
          success: false,
          error: 'ACCOUNT_LOCKED',
          lockoutRemainingMinutes: 15,
          failedAttempts: user.failed_login_attempts,
          message: 'Account locked due to 5 consecutive failed attempts. Security cooldown active for 15 minutes.'
        };
      }

      return {
        success: false,
        error: 'INVALID_CREDENTIALS',
        failedAttempts: user.failed_login_attempts,
        message: `Invalid email address or security password. (${5 - user.failed_login_attempts} attempts remaining before lockout).`
      };
    }

    const authorization = await this.getUserRolesAndPermissions(user.id);
    if (authorization.roles.length === 0) {
      await this.logLoginEvent(email, 'MFA_FAILED', user.id, user.tenant_id, ip, ua, 'Authentication authorization profile unavailable.');
      return {
        success: false,
        error: 'AUTHORIZATION_PROFILE_UNAVAILABLE',
        message: 'Authentication could not be completed. Please try again later.'
      };
    }

  const mfaValid = await verifyMfaRequirement({
      userId: user.id,
      mfaEnabled: user.mfa_enabled,
      mfaEnforced: user.mfa_enforced,
      roles: authorization.roles,
    }, meta.mfaCode);
    if (!mfaValid) {
      await this.logLoginEvent(email, 'MFA_FAILED', user.id, user.tenant_id, ip, ua, 'MFA verification failed.');
      return {
        success: false,
        error: 'MFA_REQUIRED_OR_INVALID',
        message: 'A valid multi-factor authentication code is required.'
      };
    }

    // 4. Successful credentials verification: check password age and force-reset requirements
    const passwordAgeDays = (Date.now() - new Date(user.password_changed_at).getTime()) / (1000 * 60 * 60 * 24);
    const MAX_PASSWORD_AGE_DAYS = 90;
    if (passwordAgeDays > MAX_PASSWORD_AGE_DAYS) {
      user.force_password_change = true;
      if (isDatabaseConnected()) {
        try {
          await executeQuery('UPDATE iam_users SET force_password_change = 1 WHERE id = ?', [user.id]);
        } catch (_) {}
      }
    }

    if (user.force_password_change) {
      await this.logLoginEvent(email, 'INVALID_PASSWORD', user.id, user.tenant_id, ip, ua, 'Forced password reset required.');
      return {
        success: false,
        error: 'FORCE_PASSWORD_CHANGE_REQUIRED',
        message: 'Your corporate security password has expired or was reset by an administrator. You must configure a new security password before logging in.'
      };
    }

    // 5. Successful credentials verification: reset failure counters
    await this.recordSuccessfulLogin(user, ip);

    // 5. Issue session
    const token = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await this.createSession(user.id, token, ip, ua, expiresAt);

    await this.logLoginEvent(email, 'SUCCESS', user.id, user.tenant_id, ip, ua, 'Authentication successful.');

    return {
      success: true,
      user,
      session
    };
  }

  /** Creates an active session in MariaDB, or memory only in explicitly permitted non-production modes. */
  public static async createSession(
    userId: string,
    token: string,
    ipAddress: string | null,
    userAgent: string | null,
    expiresAt: Date
  ): Promise<IamSessionRecord> {
    const session: IamSessionRecord = {
      id: 'sess_' + crypto.randomUUID(),
      user_id: userId,
      session_token: token,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_active: true,
      expires_at: expiresAt,
      last_activity_at: new Date(),
      created_at: new Date(),
    };

    await persistAuthenticationSession({
      databaseAvailable: isDatabaseConnected(),
      persist: async () => {
        await executeQuery(
          `INSERT INTO iam_user_sessions 
           (id, user_id, session_token, ip_address, user_agent, is_active, expires_at, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            session.id,
            session.user_id,
            session.session_token,
            session.ip_address,
            session.user_agent,
            session.is_active ? 1 : 0,
            session.expires_at,
            session.created_at,
          ]
        );
      },
      memoryPersist: () => {
        inMemorySessions.set(token, session);
        return session;
      },
    });
    return session;
  }

  /**
   * Retrieves and validates an active session token
   */
  public static async getSession(token: string): Promise<IamSessionRecord | null> {
    if (!token) return null;

    return resolveAuthenticationSession({
      databaseAvailable: isDatabaseConnected(),
      databaseLookup: async () => {
        const rows = await executeQuery<IamSessionRecord>(
          'SELECT * FROM iam_user_sessions WHERE session_token = ? AND is_active = 1 AND expires_at > NOW() LIMIT 1',
          [token]
        );
        return rows[0] || null;
      },
      memoryLookup: () => {
        const memSession = inMemorySessions.get(token);
        return memSession && memSession.is_active && new Date(memSession.expires_at) > new Date() ? memSession : null;
      },
    });
  }

  /**
   * Revokes a session token
   */
  public static async revokeSession(token: string, reason: string = 'LOGOUT'): Promise<void> {
    const production = process.env.NODE_ENV?.trim().toLowerCase() === 'production';
    if (production && !isDatabaseConnected()) throw new Error('Authentication session storage is unavailable.');
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          'UPDATE iam_user_sessions SET is_active = 0, revoked_at = NOW(), revoked_reason = ? WHERE session_token = ?',
          [reason, token]
        );
      } catch (err) {
        if (production) throw new Error('Authentication session storage is unavailable.', { cause: err });
        console.warn('[IAM Repository] Error revoking session in DB:', err);
      }
    }

    if (production) return;
    const sess = inMemorySessions.get(token);
    if (sess) {
      sess.is_active = false;
    }
  }

  /**
   * Revokes a session by session ID
   */
  public static async revokeSessionById(sessionId: string, ownerUserId: string): Promise<void> {
    const production = process.env.NODE_ENV?.trim().toLowerCase() === 'production';
    if (production && !isDatabaseConnected()) throw new Error('Authentication session storage is unavailable.');
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          'UPDATE iam_user_sessions SET is_active = 0, revoked_at = NOW(), revoked_reason = ? WHERE (id = ? OR session_token = ?) AND user_id = ?',
          ['USER_REVOKED', sessionId, sessionId, ownerUserId]
        );
      } catch (err) {
        if (production) throw new Error('Authentication session storage is unavailable.', { cause: err });
        console.warn('[IAM Repository] Error revoking session in DB:', err);
      }
    }

    if (production) return;
    for (const [, sess] of inMemorySessions.entries()) {
      if (sess.user_id === ownerUserId && (sess.id === sessionId || sess.session_token === sessionId)) {
        sess.is_active = false;
      }
    }
  }

  /**
   * Retrieves active sessions for a user
   */
  public static async getUserSessions(userId: string): Promise<IamSessionRecord[]> {
    const production = process.env.NODE_ENV?.trim().toLowerCase() === 'production';
    if (production && !isDatabaseConnected()) throw new Error('Authentication session storage is unavailable.');
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery<IamSessionRecord>(
          'SELECT * FROM iam_user_sessions WHERE user_id = ? AND is_active = 1 AND expires_at > NOW() ORDER BY created_at DESC',
          [userId]
        );
        return rows;
      } catch (err) {
        if (production) throw new Error('Authentication session storage is unavailable.', { cause: err });
        console.warn('[IAM Repository] Error fetching user sessions:', err);
      }
    }

    if (production) return [];
    return Array.from(inMemorySessions.values()).filter(
      s => s.user_id === userId && s.is_active && new Date(s.expires_at) > new Date()
    );
  }

  /**
   * Records an audit login event (NEVER logs plaintext secrets)
   */
  public static async logLoginEvent(
    email: string,
    outcome: 'SUCCESS' | 'INVALID_PASSWORD' | 'LOCKED' | 'MFA_FAILED' | 'SUSPENDED',
    userId: string | null = null,
    tenantId: string | null = null,
    ipAddress: string | null = null,
    userAgent: string | null = null,
    failureReason: string | null = null
  ): Promise<void> {
    const id = 'log_evt_' + crypto.randomUUID();
    const event = {
      id,
      user_id: userId,
      email_attempted: email,
      tenant_id: tenantId,
      ip_address: ipAddress,
      user_agent: userAgent,
      outcome,
      failure_reason: failureReason,
      created_at: new Date()
    };

    inMemoryLoginAuditLogs.unshift(event);

    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          `INSERT INTO iam_login_events 
           (id, user_id, email_attempted, tenant_id, ip_address, user_agent, outcome, failure_reason) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, userId, email, tenantId, ipAddress, userAgent, outcome, failureReason]
        );
      } catch (err) {
        console.warn('[IAM Repository] Error logging login event to DB:', err);
      }
    }
    try {
      await emitAltilEvent({
        category: 'SECURITY_EVENT', action: 'auth.login', actorId: userId || undefined, actorEmail: email,
        clientIp: ipAddress,
        tenantId: tenantId || undefined, organizationId: tenantId || undefined,
        outcome: outcome === 'SUCCESS' ? 'SUCCESS' : 'DENIED', statusCode: outcome === 'SUCCESS' ? 200 : 401,
        reason: outcome === 'SUCCESS' ? undefined : outcome,
      });
    } catch { /* The existing IAM login ledger remains authoritative if the shared event sink is unavailable. */ }
  }

  /**
   * Increments failed login count and triggers account lockout if >= 5 attempts
   */
  public static async recordFailedLogin(user: IamUserRecord): Promise<void> {
    const newCount = user.failed_login_attempts + 1;
    let lockoutUntil: Date | null = null;
    let newStatus = user.status;

    if (newCount >= 5) {
      lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute security lockout
      newStatus = 'LOCKED';
      console.warn(`[IAM Security] Account ${user.email} is LOCKED until ${lockoutUntil.toISOString()} due to excessive failed attempts.`);
    }

    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          'UPDATE iam_users SET failed_login_attempts = ?, lockout_until = ?, status = ? WHERE id = ?',
          [newCount, lockoutUntil, newStatus, user.id]
        );
      } catch (err) {
        console.warn('[IAM Repository] Error updating failed attempts:', err);
      }
    }

    user.failed_login_attempts = newCount;
    user.lockout_until = lockoutUntil;
    user.status = newStatus;
  }

  /**
   * Resets failed login count upon successful authentication
   */
  public static async recordSuccessfulLogin(user: IamUserRecord, ipAddress: string | null): Promise<void> {
    const now = new Date();
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          'UPDATE iam_users SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = ?, last_login_ip = ? WHERE id = ?',
          [now, ipAddress, user.id]
        );
      } catch (err) {
        console.warn('[IAM Repository] Error recording successful login:', err);
      }
    }
    user.failed_login_attempts = 0;
    user.lockout_until = null;
    user.last_login_at = now;
    user.last_login_ip = ipAddress;
  }

  /**
   * Retrieves enterprise users with optional tenant filter
   */
  public static async getUsers(tenantFilter?: string): Promise<Partial<IamUserRecord>[]> {
    if (isDatabaseConnected()) {
      try {
        let sql = 'SELECT id, tenant_id, email, first_name, last_name, title, department, status, failed_login_attempts, lockout_until, mfa_enabled, last_login_at, created_at, password_changed_at, force_password_change FROM iam_users';
        const params: any[] = [];
        if (tenantFilter && tenantFilter !== 'all') {
          sql += ' WHERE tenant_id = ? OR tenant_id IS NULL';
          params.push(tenantFilter);
        }
        const rows = await executeQuery<any>(sql, params);
        return rows.map(r => ({
          id: r.id,
          tenant_id: r.tenant_id,
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          title: r.title,
          department: r.department,
          status: r.status,
          failed_login_attempts: r.failed_login_attempts,
          lockout_until: r.lockout_until ? new Date(r.lockout_until) : null,
          mfa_enabled: Boolean(r.mfa_enabled),
          last_login_at: r.last_login_at ? new Date(r.last_login_at) : null,
          created_at: new Date(r.created_at),
          password_changed_at: r.password_changed_at ? new Date(r.password_changed_at) : new Date(),
          force_password_change: Boolean(r.force_password_change)
        }));
      } catch (err) {
        console.warn('[IAM Repository] Error fetching users from DB, falling back to memory:', err);
      }
    }

    let list = inMemoryUsers;
    if (tenantFilter && tenantFilter !== 'all') {
      list = list.filter(u => u.tenant_id === tenantFilter || u.tenant_id === null);
    }
    // Return sanitized records (strip password hashes)
    return list.map(u => ({
      id: u.id,
      tenant_id: u.tenant_id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      title: u.title,
      department: u.department,
      status: u.status,
      failed_login_attempts: u.failed_login_attempts,
      lockout_until: u.lockout_until,
      mfa_enabled: u.mfa_enabled,
      last_login_at: u.last_login_at,
      created_at: u.created_at,
      password_changed_at: u.password_changed_at,
      force_password_change: u.force_password_change || false
    }));
  }

  /** List users only from the organization IDs already resolved by authorization middleware. */
  public static async getUsersInScope(organizationIds: readonly string[], includePlatformUsers = false): Promise<Partial<IamUserRecord>[]> {
    const ids = [...new Set(organizationIds.filter(Boolean))];
    if (!ids.length && !includePlatformUsers) return [];
    const placeholders = ids.map(() => '?').join(',');
    const where: string[] = [];
    const params: string[] = [];
    if (ids.length) {
      where.push(`tenant_id IN (${placeholders})`);
      params.push(...ids);
    }
    if (includePlatformUsers) where.push('tenant_id IS NULL');
    const sqlWhere = where.length ? ` WHERE (${where.join(' OR ')})` : '';

    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery<any>(
          `SELECT id, tenant_id, email, first_name, last_name, title, department, status, failed_login_attempts, lockout_until, mfa_enabled, last_login_at, created_at, password_changed_at, force_password_change FROM iam_users${sqlWhere}`,
          params
        );
        return rows.map(row => ({
          id: row.id, tenant_id: row.tenant_id, email: row.email, first_name: row.first_name, last_name: row.last_name,
          title: row.title, department: row.department, status: row.status, failed_login_attempts: row.failed_login_attempts,
          lockout_until: row.lockout_until ? new Date(row.lockout_until) : null, mfa_enabled: Boolean(row.mfa_enabled),
          last_login_at: row.last_login_at ? new Date(row.last_login_at) : null, created_at: new Date(row.created_at),
          password_changed_at: row.password_changed_at ? new Date(row.password_changed_at) : new Date(),
          force_password_change: Boolean(row.force_password_change),
        }));
      } catch (error) {
        console.error('[IAM Repository] Scoped user list failed; refusing unscoped fallback.', error);
        throw new Error('Scoped user directory is unavailable.');
      }
    }

    return inMemoryUsers
      .filter(user => (user.tenant_id !== null && ids.includes(user.tenant_id)) || (includePlatformUsers && user.tenant_id === null))
      .map(user => ({
        id: user.id, tenant_id: user.tenant_id, email: user.email, first_name: user.first_name, last_name: user.last_name,
        title: user.title, department: user.department, status: user.status, failed_login_attempts: user.failed_login_attempts,
        lockout_until: user.lockout_until, mfa_enabled: user.mfa_enabled, last_login_at: user.last_login_at,
        created_at: user.created_at, password_changed_at: user.password_changed_at,
        force_password_change: user.force_password_change || false,
      }));
  }

  /**
   * Upserts user record
   */
  public static async upsertUser(user: Partial<IamUserRecord> & { password?: string; name?: string }): Promise<IamUserRecord> {
    const existingIdx = inMemoryUsers.findIndex(u => u.id === user.id || u.email === user.email);
    let hash = existingIdx >= 0 ? inMemoryUsers[existingIdx].password_hash : '';
    if (user.password) {
      hash = await this.hashPassword(user.password);
    } else if (!hash) {
      hash = await this.hashPassword('AltilDefault2026!');
    }

    let firstName = user.first_name || '';
    let lastName = user.last_name || '';
    if (!firstName && !lastName && user.name) {
      const parts = user.name.trim().split(/\s+/);
      firstName = parts[0] || 'Enterprise';
      lastName = parts.slice(1).join(' ') || 'User';
    }
    if (!firstName) firstName = 'Enterprise';
    if (!lastName) lastName = 'User';

    const fullRecord: IamUserRecord = {
      id: user.id || `user_${Date.now().toString(36)}`,
      tenant_id: user.tenant_id || null,
      email: user.email || 'user@altil.com',
      password_hash: hash,
      first_name: firstName,
      last_name: lastName,
      title: user.title || 'Team Member',
      department: user.department || 'Operations',
      status: user.status || 'ACTIVE',
      failed_login_attempts: existingIdx >= 0 ? inMemoryUsers[existingIdx].failed_login_attempts : 0,
      lockout_until: existingIdx >= 0 ? inMemoryUsers[existingIdx].lockout_until : null,
      mfa_enabled: user.mfa_enabled ?? true,
      mfa_enforced: user.mfa_enforced ?? false,
      last_login_at: existingIdx >= 0 ? inMemoryUsers[existingIdx].last_login_at : null,
      last_login_ip: existingIdx >= 0 ? inMemoryUsers[existingIdx].last_login_ip : null,
      password_changed_at: user.password ? new Date() : (existingIdx >= 0 ? inMemoryUsers[existingIdx].password_changed_at : new Date()),
      force_password_change: user.force_password_change ?? (existingIdx >= 0 ? inMemoryUsers[existingIdx].force_password_change : false),
      password_history: existingIdx >= 0 ? (inMemoryUsers[existingIdx].password_history || []) : [],
      created_by: 'ADMIN',
      created_at: existingIdx >= 0 ? inMemoryUsers[existingIdx].created_at : new Date(),
      updated_at: new Date()
    };

    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          `INSERT INTO iam_users (
            id, tenant_id, email, password_hash, first_name, last_name, title, department, status,
            failed_login_attempts, lockout_until, mfa_enabled, mfa_enforced, last_login_at, last_login_ip,
            password_changed_at, force_password_change, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            tenant_id = VALUES(tenant_id),
            email = VALUES(email),
            password_hash = VALUES(password_hash),
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            title = VALUES(title),
            department = VALUES(department),
            status = VALUES(status),
            mfa_enabled = VALUES(mfa_enabled),
            mfa_enforced = VALUES(mfa_enforced),
            password_changed_at = VALUES(password_changed_at),
            force_password_change = VALUES(force_password_change),
            updated_at = NOW()`,
          [
            fullRecord.id,
            fullRecord.tenant_id,
            fullRecord.email,
            fullRecord.password_hash,
            fullRecord.first_name,
            fullRecord.last_name,
            fullRecord.title,
            fullRecord.department,
            fullRecord.status,
            fullRecord.failed_login_attempts,
            fullRecord.lockout_until,
            fullRecord.mfa_enabled ? 1 : 0,
            fullRecord.mfa_enforced ? 1 : 0,
            fullRecord.last_login_at,
            fullRecord.last_login_ip,
            fullRecord.password_changed_at,
            fullRecord.force_password_change ? 1 : 0,
            fullRecord.created_by,
            fullRecord.created_at,
            fullRecord.updated_at
          ]
        );
      } catch (err) {
        console.warn('[IAM Repository] Failed to persist upserted user in DB, using memory fallback:', err);
      }
    }

    if (existingIdx >= 0) {
      inMemoryUsers[existingIdx] = fullRecord;
    } else {
      inMemoryUsers.push(fullRecord);
    }

    return fullRecord;
  }

  /**
   * Retrieves system roles
   */
  public static async getRoles(): Promise<IamRoleRecord[]> {
    return [
      {
        id: 'role-super-admin',
        tenant_id: null,
        role_code: 'SUPER_ADMIN',
        name: 'Global Super Admin',
        description: 'Unrestricted control over multi-tenant clusters, HSM secrets, and routing.',
        is_system_role: true,
        is_immutable: true,
        permissions: ['*']
      },
      {
        id: 'role-tenant-admin',
        tenant_id: null,
        role_code: 'TENANT_ADMIN',
        name: 'Enterprise Tenant Admin',
        description: 'Scoped administrative authority for assigned customer tenant.',
        is_system_role: true,
        is_immutable: true,
        permissions: ['tenant.read', 'apikeys.create', 'apikeys.revoke', 'incidents.write', 'iam.users.write']
      },
      {
        id: 'role-auditor',
        tenant_id: null,
        role_code: 'AUDITOR',
        name: 'Statutory Governance Auditor',
        description: 'Read-only access to POPIA/GDPR audit records and DSAR telemetry.',
        is_system_role: true,
        is_immutable: true,
        permissions: ['tenant.read', 'audit.export']
      }
    ];
  }

  /**
   * Validates a password against the ALTIL password policy.
   */
  public static validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long.' };
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",\./<>?]/.test(password);

    if (!hasUpper || !hasSpecial) {
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter and one special character.'
      };
    }

    const sequentialPatterns = ['123456', 'abcdef', 'password', 'admin', 'qwerty'];
    const lowerPass = password.toLowerCase();
    for (const pattern of sequentialPatterns) {
      if (lowerPass.includes(pattern)) {
        return { valid: false, error: 'Password contains easily guessable sequential patterns.' };
      }
    }

    return { valid: true };
  }

  /**
   * Checks if password has been used in previous history
   */
  public static async isPasswordInHistory(userId: string, newPlainTextPassword: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    // Check current active password first
    const matchCurrent = await this.verifyPassword(newPlainTextPassword, user.password_hash);
    if (matchCurrent) return true;

    // Check historical passwords
    const history = user.password_history || [];
    for (const hash of history) {
      const match = await this.verifyPassword(newPlainTextPassword, hash);
      if (match) return true;
    }

    return false;
  }

  /**
   * Changes a user's password securely
   */
  public static async changePassword(userId: string, newPlainTextPassword: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    const validation = this.validatePasswordPolicy(newPlainTextPassword);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const inHistory = await this.isPasswordInHistory(userId, newPlainTextPassword);
    if (inHistory) {
      throw new Error('Password cannot be reuse of recently used security passwords (enterprise reuse policy limit: 5).');
    }

    // Keep last 5 password hashes in history
    const history = user.password_history || [];
    history.push(user.password_hash);
    if (history.length > 5) {
      history.shift();
    }

    const newHash = await this.hashPassword(newPlainTextPassword);
    const now = new Date();

    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          'UPDATE iam_users SET password_hash = ?, password_history = ?, password_changed_at = ?, force_password_change = 0 WHERE id = ?',
          [newHash, JSON.stringify(history), now, userId]
        );
      } catch (err) {
        console.warn('[IAM Repository] Error persisting password update in DB:', err);
      }
    }

    user.password_hash = newHash;
    user.password_history = history;
    user.password_changed_at = now;
    user.force_password_change = false;

    return true;
  }

  /**
   * Resets a user's password administratively
   */
  public static async administrativelyResetPassword(userId: string, newPlainTextPassword: string, forceReset: boolean = true): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User record not found.');

    const validation = this.validatePasswordPolicy(newPlainTextPassword);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const newHash = await this.hashPassword(newPlainTextPassword);
    const now = new Date();

    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          'UPDATE iam_users SET password_hash = ?, password_changed_at = ?, force_password_change = ? WHERE id = ?',
          [newHash, now, forceReset ? 1 : 0, userId]
        );
      } catch (err) {
        console.warn('[IAM Repository] Error resetting password in DB:', err);
      }
    }

    user.password_hash = newHash;
    user.password_changed_at = now;
    user.force_password_change = forceReset;
  }
}
