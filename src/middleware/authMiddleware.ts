import { Request, Response, NextFunction } from 'express';
import { IamRepository, IamUserRecord } from '../db/iamRepository';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    tenantId: string | null;
    roles: string[];
    permissions: string[];
    sessionId: string;
  };
}

/**
 * Extracts session token from HTTP Authorization header or Cookie
 */
export function extractSessionToken(req: Request): string | null {
  // 1. Check Bearer Authorization Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Check altil_session Cookie
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('altil_session=')) {
        return decodeURIComponent(cookie.substring('altil_session='.length));
      }
    }
  }

  return null;
}

/**
 * Middleware: Requires a valid active server session
 */
export async function requireAuthentication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractSessionToken(req);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
      message: 'Authentication required. Missing session token or bearer credential.'
    });
    return;
  }

  try {
    const session = await IamRepository.getSession(token);
    if (!session) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'SESSION_EXPIRED',
        message: 'Session has expired, was revoked, or is invalid. Please log in again.'
      });
      return;
    }

    const user = await IamRepository.getUserById(session.user_id);
    if (!user || user.status !== 'ACTIVE') {
      res.status(403).json({
        error: 'Forbidden',
        code: 'USER_ACCOUNT_LOCKED',
        message: 'User account is not active or has been suspended.'
      });
      return;
    }

    const { roles, permissions, tenantId } = await IamRepository.getUserRolesAndPermissions(user.id);

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      status: user.status,
      tenantId: tenantId || user.tenant_id,
      roles,
      permissions,
      sessionId: session.id,
    };

    next();
  } catch (err: any) {
    console.error('[Auth Middleware Error]:', err);
    res.status(500).json({ error: 'Internal Authentication Error', details: err.message });
  }
}

/**
 * Middleware: Requires at least one of the specified roles (or SUPER_ADMIN)
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
      return;
    }

    const userRoles = req.user.roles || [];
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN') || userRoles.includes('Super Admin');

    if (isSuperAdmin) {
      return next();
    }

    const hasRole = allowedRoles.some(r => userRoles.includes(r));
    if (!hasRole) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'INSUFFICIENT_ROLE',
        message: `Action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Requires a specific granular permission
 */
export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
      return;
    }

    const userRoles = req.user.roles || [];
    if (userRoles.includes('SUPER_ADMIN') || userRoles.includes('Super Admin')) {
      return next();
    }

    const permissions = req.user.permissions || [];
    if (!permissions.includes(permissionCode)) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'PERMISSION_DENIED',
        message: `Missing required permission: ${permissionCode}`
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Enforces strict multi-tenant isolation
 * Verifies that the requested tenantId parameter/body matches the authenticated user's tenant
 */
export function requireTenantAccess(paramName: string = 'id') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
      return;
    }

    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN') || req.user.roles.includes('Super Admin');
    if (isSuperAdmin) {
      return next();
    }

    const targetTenantId = req.params[paramName] || req.query[paramName] || req.body[paramName] || req.body.tenantId;

    if (!targetTenantId) {
      return next();
    }

    if (req.user.tenantId && req.user.tenantId !== targetTenantId) {
      console.warn(`[Security Alert] Cross-tenant access attempt by user ${req.user.email} (Tenant: ${req.user.tenantId}) to Tenant: ${targetTenantId}`);
      res.status(403).json({
        error: 'Forbidden',
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: 'Security Boundary Enforced: You are not authorized to view or modify resources outside your assigned tenant domain.'
      });
      return;
    }

    next();
  };
}
