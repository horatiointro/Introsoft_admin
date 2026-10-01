import express, { Response } from 'express';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { IamRepository } from '../db/iamRepository';
import { executeQuery, isDatabaseConnected, withMariaDbTransaction } from '../db/mariadb';
import {
  requireAuthentication,
  requireRole,
  requireTenantAccess,
  requirePermission,
  extractSessionToken,
  AuthenticatedRequest
} from '../middleware/authMiddleware';
import { authorizeInContext } from '../security/authorizationContext';
import { isSuperAdminQuickAccessEnabled } from '../security/superAdminQuickAccess';
import { verifyMfaCode } from '../security/mfaVerification';

export const authRouter = express.Router();

/**
 * Helper to set secure session cookie
 */
function setSessionCookie(res: Response, token: string) {
  // 7 days expiration
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  res.cookie('altil_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge,
    // The console calls many API groups outside /auth; a root-scoped cookie
    // lets the browser attach this session to every same-origin API request.
    path: '/'
  });
}

/** Enabled only by explicit deployment configuration; keep the flag unset in production. */
authRouter.get('/super-admin-access/availability', (_req, res) => {
  res.json({ available: isSuperAdminQuickAccessEnabled() });
});

authRouter.post('/super-admin-access', async (req, res) => {
  if (!isSuperAdminQuickAccessEnabled()) return res.status(404).json({ error: 'Not found' });

  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!email) return res.status(400).json({ error: 'Enter the Super Admin account email.' });

  try {
    const user = await IamRepository.prepareSuperAdminQuickAccess(email);
    if (!user) {
      return res.status(403).json({ error: 'That account is not an active Super Admin account.' });
    }

    // Do not trust client-supplied X-Forwarded-For for quick-access session/audit metadata.
    const ipAddress = req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'ALTIL Control Console';
    const token = IamRepository.generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await IamRepository.createSession(user.id, token, ipAddress, userAgent, expiresAt);
    setSessionCookie(res, token);
    await IamRepository.logLoginEvent(email, 'SUCCESS', user.id, user.tenant_id, ipAddress, userAgent, 'Super Admin quick access session issued while explicitly enabled by deployment configuration.');

    const { roles, permissions, tenantId } = await IamRepository.getUserRolesAndPermissions(user.id);
    return res.json({
      status: 'authenticated',
      token,
      sessionId: session.id,
      expiresAt: session.expires_at,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        firstName: user.first_name,
        lastName: user.last_name,
        title: user.title,
        status: user.status,
        tenantId: tenantId || user.tenant_id,
        tenant: 'Total Company Scope',
        roles,
        role: roles[0] || 'SUPER_ADMIN',
        permissions,
        mfaEnabled: user.mfa_enabled
      }
    });
  } catch (err: any) {
    console.error('[Super Admin Quick Access Error]:', err);
    return res.status(500).json({ error: 'Could not create the Super Admin session.' });
  }
});

/**
 * POST /api/v1/auth/login
 * Standard corporate login with email, password, optional MFA and optional tenant scope
 */
authRouter.post('/login', async (req, res) => {
  const { email, password, mfaCode, selectedTenant } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'ALTIL Control Console';

  if (!email || !password) {
    return res.status(400).json({
      error: 'Bad Request',
      code: 'MISSING_CREDENTIALS',
      message: 'Corporate email address and security password are required.'
    });
  }

  try {
    const authResult = await IamRepository.authenticate(email, password, {
      ipAddress,
      userAgent,
      mfaCode
    });

    if (!authResult.success || !authResult.user || !authResult.session) {
      const statusCode = authResult.lockoutRemainingMinutes ? 423 : 401;
      return res.status(statusCode).json({
        error: 'Authentication Failed',
        code: authResult.error || 'INVALID_CREDENTIALS',
        message: authResult.lockoutRemainingMinutes
          ? `Account locked due to excessive failed attempts. Please try again in ${authResult.lockoutRemainingMinutes} minutes.`
          : 'Invalid email address or security password.'
      });
    }

    const { user, session } = authResult;
    const { roles, permissions, tenantId } = await IamRepository.getUserRolesAndPermissions(user.id);

    // Set cookie
    setSessionCookie(res, session.session_token);

    // Return authenticated profile and bearer token
    return res.json({
      status: 'authenticated',
      token: session.session_token,
      sessionId: session.id,
      expiresAt: session.expires_at,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        firstName: user.first_name,
        lastName: user.last_name,
        title: user.title,
        status: user.status,
        tenantId: tenantId || user.tenant_id,
        tenant: selectedTenant && selectedTenant !== 'all' ? selectedTenant : 'Total Company Scope',
        roles,
        role: roles[0] || 'User',
        permissions,
        mfaEnabled: user.mfa_enabled
      }
    });
  } catch (err: any) {
    console.error('[Auth Login API Error]:', err);
    return res.status(500).json({
      error: 'Internal Authentication Error',
      message: err.message
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Revokes current active session
 */
authRouter.post('/logout', async (req: AuthenticatedRequest, res) => {
  const token = extractSessionToken(req);
  if (token) {
    await IamRepository.revokeSession(token);
  }
  res.clearCookie('altil_session', { path: '/' });
  res.json({ status: 'logged_out', message: 'Session successfully revoked and purged.' });
});

/**
 * GET /api/v1/auth/me
 * Returns current authenticated user and session validity
 */
authRouter.get('/me', requireAuthentication, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
  }

  try {
    const user = await IamRepository.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User record not found' });
    }

    return res.json({
      status: 'active',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        firstName: user.first_name,
        lastName: user.last_name,
        title: user.title,
        status: user.status,
        tenantId: req.user.tenantId,
        roles: req.user.roles,
        role: req.user.roles[0] || 'User',
        permissions: req.user.permissions,
        authorization: req.user.authorization ? {
          organizationId: req.user.authorization.organizationId,
          permissions: [...req.user.authorization.permissions],
          visibleOrganizationIds: [...req.user.authorization.visibleOrganizationIds],
          scopes: req.user.authorization.grants.map(grant => ({
            role: grant.role,
            organizationId: grant.organizationId,
            visibility: grant.visibility,
            permissions: [...grant.permissions],
          })),
        } : null,
        mfaEnabled: user.mfa_enabled,
        lastLoginAt: user.last_login_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve profile', details: err.message });
  }
});

/**
 * GET /api/v1/auth/sessions
 * List active sessions for the current user
 */
authRouter.get('/sessions', requireAuthentication, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sessions = await IamRepository.getUserSessions(req.user.id);
    return res.json(sessions);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve sessions', details: err.message });
  }
});

/**
 * DELETE /api/v1/auth/sessions/:id & POST /api/v1/auth/sessions/:id/revoke
 * Revokes a specific session (by session ID)
 */
const revokeSessionHandler = async (req: AuthenticatedRequest, res: express.Response) => {
  const sessionId = req.params.id;
  try {
    await IamRepository.revokeSessionById(sessionId, req.user!.id);
    return res.json({ status: 'revoked', sessionId });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to revoke session', details: err.message });
  }
};

authRouter.delete('/sessions/:id', requireAuthentication, revokeSessionHandler);
authRouter.post('/sessions/:id/revoke', requireAuthentication, revokeSessionHandler);

/**
 * POST /api/v1/auth/mfa/verify
 * Validates hardware / software TOTP token
 */
authRouter.post('/mfa/verify', requireAuthentication, async (req: AuthenticatedRequest, res) => {
  const { code } = req.body;
  const result = await verifyMfaCode(req.user!.id, typeof code === 'string' ? code : undefined);
  if (result === 'DISABLED') return res.json({ status: 'disabled', mfaEnabled: false });
  if (result === 'UNAVAILABLE') return res.status(503).json({ error: 'MFA verification is unavailable.' });
  if (result !== 'VERIFIED') return res.status(401).json({ error: 'MFA verification failed.' });
  return res.json({ status: 'verified' });
});

/**
 * POST /api/v1/auth/reauthenticate
 * Elevates session / verifies credentials for administrative or high-risk operations
 */
authRouter.post('/reauthenticate', requireAuthentication, async (req: AuthenticatedRequest, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required for re-authentication.' });
  }

  try {
    const user = await IamRepository.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    const bcrypt = await import('bcryptjs');
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid security credentials.' });
    }

    const crypto = await import('crypto');
    return res.json({
      status: 'verified',
      message: 'Administrative session successfully elevated and authorized.',
      elevatedToken: `elevated-${crypto.randomBytes(16).toString('hex')}`
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Re-authentication failed.', details: err.message });
  }
});

/**
 * Administrative IAM User & Role Management APIs
 */

/**
 * GET /api/v1/iam/users
 * Returns list of enterprise IAM users (requires User Admin or Super Admin)
 */
authRouter.get('/users', requireAuthentication, requireRole(['SUPER_ADMIN', 'SECURITY_ADMIN', 'TENANT_ADMIN']), requirePermission('user.read'), async (req: AuthenticatedRequest, res) => {
  try {
    const requestedOrganization = String(req.query.tenantId || req.query.organizationId || '').trim();
    const globalGrant = req.user?.authorization?.grants.some(grant => grant.visibility === 'GLOBAL') === true;
    const visibleIds = requestedOrganization
      ? (req.user?.authorization?.visibleOrganizationIds.has(requestedOrganization) ? [requestedOrganization] : [])
      : [...(req.user?.authorization?.visibleOrganizationIds || [])];
    if (requestedOrganization && !visibleIds.length) return res.status(404).json({ error: 'Organization not found.' });
    const users = await IamRepository.getUsersInScope(visibleIds, globalGrant && !requestedOrganization);
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch IAM users', details: err.message });
  }
});

/** Return database-backed roles the actor may assign inside the target tenant. */
authRouter.get('/users/assignable-roles', requireAuthentication, requirePermission('user.create'), async (req: AuthenticatedRequest, res) => {
  const tenantId = String(req.query.tenantId || '').trim();
  if (!tenantId || !req.user?.authorization?.visibleOrganizationIds.has(tenantId)) return res.status(404).json({ error: 'Organization not found.' });
  const actorGrant = req.user.authorization.grants.find(grant => grant.visibleOrganizationIds.has(tenantId) && grant.permissions.includes('user.create'));
  if (!actorGrant) return res.status(403).json({ error: 'User creation is not authorized in this organization.' });
  if (!isDatabaseConnected()) return res.status(503).json({ error: 'Assignable roles require the durable IAM database.' });
  try {
    const rows = await executeQuery<any>(`SELECT r.id,r.role_code,r.name,r.tenant_id,p.permission_code
      FROM iam_roles r LEFT JOIN iam_role_permissions rp ON rp.role_id=r.id
      LEFT JOIN iam_permissions p ON p.id=rp.permission_id
      WHERE r.tenant_id IS NULL OR r.tenant_id=? ORDER BY r.name`, [tenantId]);
    const grouped = new Map<string, any>();
    for (const row of rows) {
      if (row.role_code === 'SUPER_ADMIN') continue;
      let role = grouped.get(row.id);
      if (!role) { role = { id: row.id, code: row.role_code, name: row.name, tenantId: row.tenant_id, permissions: [] as string[] }; grouped.set(row.id, role); }
      if (row.permission_code) role.permissions.push(row.permission_code);
    }
    const allowed = [...grouped.values()].filter(role =>
      (!role.tenantId || role.tenantId === tenantId)
      && role.permissions.length > 0
      && role.permissions.every((permission: string) => actorGrant.permissions.includes('*') || actorGrant.permissions.includes(permission))
    ).map(({ id, code, name }: any) => ({ id, code, name }));
    return res.json({ roles: allowed });
  } catch {
    return res.status(503).json({ error: 'Assignable roles are unavailable.' });
  }
});

/** Create an inactive account and role assignment atomically; activation is one-time. */
authRouter.post('/users', requireAuthentication, requireTenantAccess('tenantId'), async (req: AuthenticatedRequest, res) => {
  const tenantId = String(req.body?.tenantId || req.body?.tenant_id || '').trim();
  const existingId = String(req.body?.id || '').trim();
  if (existingId) {
    if (!authorizeInContext(req.user?.authorization, tenantId, 'user.update')) return res.status(403).json({ error: 'User updates are not authorized in this organization.' });
    const email = String(req.body?.email || '').trim().toLowerCase();
    const firstName = String(req.body?.first_name || '').trim();
    const lastName = String(req.body?.last_name || '').trim();
    const status = String(req.body?.status || 'ACTIVE').toUpperCase();
    if (!isDatabaseConnected()) return res.status(503).json({ error: 'User updates require the durable IAM database.' });
    if (!/^\S+@\S+\.\S+$/.test(email) || !firstName || !lastName || !['ACTIVE','INACTIVE','LOCKED','SUSPENDED','OFFBOARDED'].includes(status)) return res.status(400).json({ error: 'Provide valid user details and status.' });
    try {
      const updated = await withMariaDbTransaction(async connection => {
        const [rows] = await connection.execute<any[]>('SELECT id FROM iam_users WHERE id=? AND tenant_id=? FOR UPDATE', [existingId, tenantId]);
        if (!rows.length) return false;
        await connection.execute('UPDATE iam_users SET email=?,first_name=?,last_name=?,title=?,department=?,status=?,mfa_enabled=?,updated_at=NOW() WHERE id=? AND tenant_id=?', [email, firstName, lastName, req.body?.title || null, req.body?.department || null, status, req.body?.mfa_enabled ? 1 : 0, existingId, tenantId]);
        await connection.execute('INSERT INTO audit_logs (id,timestamp,tenant_id,user_email,action_type,category,severity,request_payload) VALUES (?,?,?,?,?,?,?,?)', [`audit-${randomUUID()}`, new Date(), tenantId, req.user!.email, 'IAM_USER_UPDATED', 'IAM', 'INFO', JSON.stringify({ userId: existingId, tenantId, status })]);
        return true;
      });
      if (!updated) return res.status(404).json({ error: 'User not found in this organization.' });
      return res.json({ status: 'updated', id: existingId, email, first_name: firstName, last_name: lastName, tenant_id: tenantId });
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Another account already uses this email.' });
      return res.status(503).json({ error: 'The user could not be updated.' });
    }
  }
  if (!authorizeInContext(req.user?.authorization, tenantId, 'user.create')) return res.status(403).json({ error: 'User creation is not authorized in this organization.' });
  const roleId = String(req.body?.roleId || '').trim();
  const firstName = String(req.body?.firstName || req.body?.first_name || '').trim();
  const lastName = String(req.body?.lastName || req.body?.last_name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const department = String(req.body?.department || '').trim().slice(0, 128) || null;
  const title = String(req.body?.title || '').trim().slice(0, 128) || null;
  if (!tenantId || !roleId || firstName.length < 1 || firstName.length > 128 || lastName.length < 1 || lastName.length > 128 || email.length > 255 || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Provide first name, last name, valid email, tenant scope, and an assignable role.' });
  }
  const actor = req.user;
  const actorGrant = actor?.authorization?.grants.find(grant => grant.visibleOrganizationIds.has(tenantId) && grant.permissions.includes('user.create'));
  if (!actor || !actorGrant) return res.status(403).json({ error: 'User creation is not authorized in this organization.' });
  if (!isDatabaseConnected()) return res.status(503).json({ error: 'User invitations require the durable IAM database.' });

  const userId = `user-${randomUUID()}`;
  const invitationId = `invite-${randomUUID()}`;
  const invitationToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(invitationToken).digest('hex');
  const unusedPassword = randomBytes(48).toString('base64url');
  const passwordHash = await IamRepository.hashPassword(unusedPassword);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 86400000);
  try {
    let assignedRole: { id: string; role_code: string; name: string } | undefined;
    await withMariaDbTransaction(async connection => {
      const [roles] = await connection.execute<any[]>(`SELECT r.id,r.role_code,r.name,r.tenant_id,p.permission_code
        FROM iam_roles r LEFT JOIN iam_role_permissions rp ON rp.role_id=r.id
        LEFT JOIN iam_permissions p ON p.id=rp.permission_id
        WHERE r.id=? AND (r.tenant_id IS NULL OR r.tenant_id=?) FOR UPDATE`, [roleId, tenantId]);
      if (!roles.length) throw new Error('ROLE_NOT_ASSIGNABLE');
      const requested = new Set(roles.map(row => row.permission_code).filter(Boolean));
      if (roles[0].role_code === 'SUPER_ADMIN' || roles[0].role_code === 'CUSTOMER_ACCOUNT_USER' || requested.size === 0 || [...requested].some(permission => !actorGrant.permissions.includes('*') && !actorGrant.permissions.includes(permission))) throw new Error('ROLE_NOT_ASSIGNABLE');
      assignedRole = { id: roles[0].id, role_code: roles[0].role_code, name: roles[0].name };
      const [existing] = await connection.execute<any[]>('SELECT id FROM iam_users WHERE LOWER(email)=? LIMIT 1 FOR UPDATE', [email]);
      if (existing.length) throw new Error('EMAIL_EXISTS');
      await connection.execute(`INSERT INTO iam_users
        (id,tenant_id,email,password_hash,first_name,last_name,title,department,status,mfa_enabled,mfa_enforced,force_password_change,created_by)
        VALUES (?,?,?,?,?,?,?,?, 'INACTIVE',0,0,1,?)`, [userId, tenantId, email, passwordHash, firstName, lastName, title, department, actor.id]);
      await connection.execute(`INSERT INTO iam_user_roles (id,user_id,role_id,tenant_id,assigned_by,access_scope)
        VALUES (?,?,?, ?,?,'ORGANISATION')`, [`ur-${randomUUID()}`, userId, roleId, tenantId, actor.id]);
      await connection.execute('INSERT INTO iam_user_invitations (id,user_id,token_hash,expires_at,created_by) VALUES (?,?,?,?,?)', [invitationId, userId, tokenHash, expiresAt, actor.id]);
      await connection.execute('INSERT INTO audit_logs (id,timestamp,tenant_id,user_email,action_type,category,severity,request_payload) VALUES (?,?,?,?,?,?,?,?)', [`audit-${randomUUID()}`, now, tenantId, actor.email, 'IAM_USER_INVITED', 'IAM', 'INFO', JSON.stringify({ userId, email, roleCode: assignedRole.role_code, tenantId, invitationId })]);
    });
    return res.status(201).json({ status: 'invited', user: { id: userId, email, firstName, lastName, department, title, tenantId, role: assignedRole?.role_code, roleName: assignedRole?.name, status: 'INACTIVE' }, activationPath: `/activate-account#${invitationToken}`, expiresAt: expiresAt.toISOString(), delivery: 'No email was sent. Share this one-time activation link through an approved channel.' });
  } catch (error: any) {
    if (error?.message === 'EMAIL_EXISTS' || error?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account already exists for this email.' });
    if (error?.message === 'ROLE_NOT_ASSIGNABLE') return res.status(403).json({ error: 'That role is outside your authority or tenant scope.' });
    console.error('[IAM invitation] Creation failed:', { code: error?.code || 'UNKNOWN' });
    return res.status(503).json({ error: 'The user invitation could not be created. The transaction was rolled back.' });
  }
});

/** Public one-time activation; the URL token is supplied in the fragment and posted in the body. */
authRouter.post('/users/activate', async (req, res) => {
  const token = String(req.body?.token || '');
  const password = String(req.body?.password || '');
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return res.status(400).json({ error: 'A valid activation token is required.' });
  const policy = IamRepository.validatePasswordPolicy(password);
  if (!policy.valid) return res.status(400).json({ error: policy.error || 'Password does not meet policy.' });
  if (!isDatabaseConnected()) return res.status(503).json({ error: 'Account activation requires the durable IAM database.' });
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const passwordHash = await IamRepository.hashPassword(password);
  try {
    await withMariaDbTransaction(async connection => {
      const [rows] = await connection.execute<any[]>(`SELECT i.id,i.user_id,u.tenant_id,u.email FROM iam_user_invitations i
        JOIN iam_users u ON u.id=i.user_id WHERE i.token_hash=? AND i.accepted_at IS NULL AND i.expires_at>NOW(3) AND u.status='INACTIVE' FOR UPDATE`, [tokenHash]);
      const invitation = rows[0];
      if (!invitation) throw new Error('INVITATION_INVALID');
      await connection.execute("UPDATE iam_users SET password_hash=?,status='ACTIVE',password_changed_at=NOW(),force_password_change=0,updated_at=NOW() WHERE id=? AND status='INACTIVE'", [passwordHash, invitation.user_id]);
      await connection.execute('UPDATE iam_user_invitations SET accepted_at=NOW(3) WHERE id=? AND accepted_at IS NULL', [invitation.id]);
      await connection.execute('INSERT INTO audit_logs (id,timestamp,tenant_id,user_email,action_type,category,severity,request_payload) VALUES (?,?,?,?,?,?,?,?)', [`audit-${randomUUID()}`, new Date(), invitation.tenant_id, invitation.email, 'IAM_USER_ACTIVATED', 'IAM', 'INFO', JSON.stringify({ userId: invitation.user_id, invitationId: invitation.id })]);
    });
    return res.json({ status: 'activated', message: 'Your account is active. You can now sign in.' });
  } catch (error: any) {
    if (error?.message === 'INVITATION_INVALID') return res.status(400).json({ error: 'Activation link is invalid, expired, or already used.' });
    console.error('[IAM activation] Request failed:', { code: error?.code || 'UNKNOWN' });
    return res.status(503).json({ error: 'Account activation could not be completed.' });
  }
});

/**
 * POST /api/v1/iam/users/:id/reset-password
 * Resets a user's password administratively
 */
authRouter.post('/users/:id/reset-password', requireAuthentication, requirePermission('user.update'), async (req: AuthenticatedRequest, res) => {
  const userId = req.params.id;
  const { newPassword, forceReset } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required.' });
  }

  try {
    const targetUser = await IamRepository.getUserById(userId);
    if (!targetUser || !targetUser.tenant_id || !authorizeInContext(req.user?.authorization, targetUser.tenant_id, 'user.update')) {
      return res.status(404).json({ error: 'User not found.' });
    }
    await IamRepository.administrativelyResetPassword(userId, newPassword, forceReset ?? true);
    return res.json({ status: 'reset', message: 'User password reset successfully and force-password-change policy enacted.' });
  } catch (err: any) {
    return res.status(400).json({ error: 'Password policy validation failed.', message: err.message });
  }
});

/**
 * POST /api/v1/auth/change-password
 * Securely changes the current user's password
 */
authRouter.post('/change-password', async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Corporate email, current password, and new password are required.' });
  }

  try {
    const authResult = await IamRepository.authenticate(email, oldPassword, {
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'ALTIL Control Console'
    });

    // We bypass force_password_change check during changing password (since they are resetting it!)
    // So let's check authResult: if they fail authentication because of something OTHER than FORCE_PASSWORD_CHANGE_REQUIRED, reject!
    if (!authResult.success && authResult.error !== 'FORCE_PASSWORD_CHANGE_REQUIRED') {
      return res.status(401).json({ error: 'Invalid current credentials.', message: authResult.message });
    }

    const user = await IamRepository.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await IamRepository.changePassword(user.id, newPassword);
    return res.json({ status: 'changed', message: 'Password successfully rotated and compliance logs updated.' });
  } catch (err: any) {
    return res.status(400).json({ error: 'Failed to update security password.', message: err.message });
  }
});

/**
 * GET /api/v1/iam/roles
 * Returns all system roles and their assigned permissions
 */
authRouter.get('/roles', requireAuthentication, async (req: AuthenticatedRequest, res) => {
  try {
    const roles = await IamRepository.getRoles();
    return res.json(roles);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch roles', details: err.message });
  }
});
