import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { executeQuery, isDatabaseConnected } from './mariadb';

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
    tenant_id: 'cust-1', // ACME Financial Holdings (TENANT_A)
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
    tenant_id: 'cust-2', // Global FinTech Nexus (TENANT_B)
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
    tenant_id: 'cust-2', // Capitec Bank (cust-2)
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
    tenant_id: 'cust-1',
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
    tenant_id: 'cust-1',
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
    tenant_id: 'cust-1',
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
    tenant_id: 'cust-1',
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
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery<IamUserRecord>(
          'SELECT * FROM iam_users WHERE LOWER(email) = ? LIMIT 1',
          [normalizedEmail]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[IAM Repository] Database query failed, falling back to memory store:', err);
      }
    }
    const found = inMemoryUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    return found || null;
  }

  /**
   * Retrieves a user by their unique ID
   */
  public static async getUserById(id: string): Promise<IamUserRecord | null> {
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery<IamUserRecord>(
          'SELECT * FROM iam_users WHERE id = ? LIMIT 1',
          [id]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[IAM Repository] Database query failed, falling back to memory store:', err);
      }
    }
    return inMemoryUsers.find(u => u.id === id) || null;
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
            permissions: permRows.map(p => p.permission_code),
            tenantId: roleRows[0]?.tenant_id || null,
          };
        }
      } catch (err) {
        console.warn('[IAM Repository] Error fetching user roles/permissions from DB:', err);
      }
    }

    // In-memory fallback roles
    if (userId === 'user_super_admin_001' || userId === 'user_super_admin_000') {
      return {
        roles: ['SUPER_ADMIN'],
        permissions: [
          'tenant.read', 'tenant.write', 'tenant.delete', 'routing.edit',
          'models.configure', 'providers.write', 'apikeys.create', 'apikeys.revoke',
          'policies.write', 'security.write', 'compliance.dsr', 'compliance.write', 'audit.export',
          'billing.write', 'incidents.write', 'cmdb.write', 'sla.write',
          'iam.users.write', 'iam.roles.write'
        ],
        tenantId: null,
      };
    } else if (userId === 'user_tenant_admin_002') {
      return {
        roles: ['TENANT_ADMIN'],
        permissions: ['tenant.read', 'apikeys.create', 'apikeys.revoke', 'incidents.write', 'iam.users.write'],
        tenantId: 'cust-1',
      };
    } else if (userId === 'user_tenant_b_admin_004' || userId === 'user_tenant_b_admin_008') {
      return {
        roles: ['TENANT_ADMIN'],
        permissions: ['tenant.read', 'apikeys.create', 'apikeys.revoke', 'incidents.write', 'iam.users.write'],
        tenantId: 'cust-2',
      };
    } else if (userId === 'user_auditor_003' || userId === 'user_auditor_009') {
      return {
        roles: ['AUDITOR'],
        permissions: ['tenant.read', 'audit.export'],
        tenantId: null,
      };
    } else if (userId === 'user_engineer_010') {
      return {
        roles: ['AI_ENGINEER'],
        permissions: ['models.configure', 'providers.write', 'routing.edit'],
        tenantId: 'cust-1',
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

    // 4. Successful credentials verification: reset failure counters
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

  /**
   * Creates an active session in MariaDB / Memory
   */
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

    if (isDatabaseConnected()) {
      try {
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
      } catch (err) {
        console.warn('[IAM Repository] Failed to persist session to DB, using in-memory store:', err);
      }
    }

    inMemorySessions.set(token, session);
    return session;
  }

  /**
   * Retrieves and validates an active session token
   */
  public static async getSession(token: string): Promise<IamSessionRecord | null> {
    if (!token) return null;

    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery<IamSessionRecord>(
          'SELECT * FROM iam_user_sessions WHERE session_token = ? AND is_active = 1 AND expires_at > NOW() LIMIT 1',
          [token]
        );
        if (rows[0]) return rows[0];
      } catch (err) {
        console.warn('[IAM Repository] Error retrieving session from DB:', err);
      }
    }

    const memSession = inMemorySessions.get(token);
    if (memSession && memSession.is_active && new Date(memSession.expires_at) > new Date()) {
      return memSession;
    }
    return null;
  }

  /**
   * Revokes a session token
   */
  public static async revokeSession(token: string, reason: string = 'LOGOUT'): Promise<void> {
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          'UPDATE iam_user_sessions SET is_active = 0, revoked_at = NOW(), revoked_reason = ? WHERE session_token = ?',
          [reason, token]
        );
      } catch (err) {
        console.warn('[IAM Repository] Error revoking session in DB:', err);
      }
    }

    const sess = inMemorySessions.get(token);
    if (sess) {
      sess.is_active = false;
    }
  }

  /**
   * Revokes a session by session ID
   */
  public static async revokeSessionById(sessionId: string): Promise<void> {
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          'UPDATE iam_user_sessions SET is_active = 0, revoked_at = NOW(), revoked_reason = ? WHERE id = ? OR session_token = ?',
          ['ADMIN_REVOKED', sessionId, sessionId]
        );
      } catch (err) {
        console.warn('[IAM Repository] Error revoking session in DB:', err);
      }
    }

    for (const [, sess] of inMemorySessions.entries()) {
      if (sess.id === sessionId || sess.session_token === sessionId) {
        sess.is_active = false;
      }
    }
  }

  /**
   * Retrieves active sessions for a user
   */
  public static async getUserSessions(userId: string): Promise<IamSessionRecord[]> {
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery<IamSessionRecord>(
          'SELECT * FROM iam_user_sessions WHERE user_id = ? AND is_active = 1 AND expires_at > NOW() ORDER BY created_at DESC',
          [userId]
        );
        return rows;
      } catch (err) {
        console.warn('[IAM Repository] Error fetching user sessions:', err);
      }
    }

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
      created_at: u.created_at
    }));
  }

  /**
   * Upserts user record
   */
  public static async upsertUser(user: Partial<IamUserRecord> & { password?: string }): Promise<IamUserRecord> {
    const existingIdx = inMemoryUsers.findIndex(u => u.id === user.id || u.email === user.email);
    let hash = existingIdx >= 0 ? inMemoryUsers[existingIdx].password_hash : '';
    if (user.password) {
      hash = await this.hashPassword(user.password);
    } else if (!hash) {
      hash = await this.hashPassword('AltilDefault2026!');
    }

    const fullRecord: IamUserRecord = {
      id: user.id || `user_${Date.now().toString(36)}`,
      tenant_id: user.tenant_id || null,
      email: user.email || 'user@altil.com',
      password_hash: hash,
      first_name: user.first_name || 'Enterprise',
      last_name: user.last_name || 'User',
      title: user.title || 'Team Member',
      department: user.department || 'Operations',
      status: user.status || 'ACTIVE',
      failed_login_attempts: 0,
      lockout_until: null,
      mfa_enabled: user.mfa_enabled ?? true,
      mfa_enforced: user.mfa_enforced ?? false,
      last_login_at: null,
      last_login_ip: null,
      password_changed_at: new Date(),
      created_by: 'ADMIN',
      created_at: new Date(),
      updated_at: new Date()
    };

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
}
