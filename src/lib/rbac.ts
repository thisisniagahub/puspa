// ============================================================
// RBAC Middleware — Protect API routes with role-based access
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth";
import { ROLES, type UserRole, type Permission } from "@/lib/auth";
import { getAuthSession, AuthError } from "@/lib/session";
import { apiUnauthorized, apiForbidden } from "@/lib/api-response";

// ============================================================
// Route-level permission configuration
// ============================================================

interface RoutePermission {
  method: string;
  permission: Permission;
}

interface RouteRoleRequirement {
  method: string;
  roles: UserRole[];
}

// ============================================================
// Middleware function for API routes
// ============================================================

/**
 * Check authentication for a request
 * Returns the session or throws an error response
 */
export function authenticateRequest(request: NextRequest) {
  const session = getAuthSession(request);
  if (!session) {
    return { error: apiUnauthorized("Sesi tidak sah atau telah tamat. Sila log masuk semula.") };
  }
  return { session };
}

/**
 * Check if a session has a specific permission
 */
export function checkPermission(session: { role: UserRole }, permission: Permission): boolean {
  return hasPermission(session.role, permission);
}

/**
 * Create a protected route handler wrapper
 * Usage: withAuth(handler, { permission: "cases:create" })
 */
export function withAuth<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options?: {
    permission?: Permission;
    roles?: UserRole[];
    optional?: boolean;
  }
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      // The first arg in a Next.js route handler is always the request
      const request = args[0] as NextRequest;

      // If auth is optional, try to get session but don't require it
      if (options?.optional) {
        return handler(...args);
      }

      const auth = authenticateRequest(request);
      if (auth.error) return auth.error;

      // Check permission if specified
      if (options?.permission) {
        if (!checkPermission(auth.session, options.permission)) {
          return apiForbidden("Tiada kebenaran untuk tindakan ini");
        }
      }

      // Check roles if specified
      if (options?.roles) {
        if (!options.roles.includes(auth.session.role)) {
          return apiForbidden("Peran tidak dibenarkan untuk tindakan ini");
        }
      }

      return handler(...args);
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.statusCode === 401) return apiUnauthorized(error.message);
        return apiForbidden(error.message);
      }
      throw error;
    }
  };
}

// ============================================================
// Permission map for common CRUD operations
// ============================================================

export const ROUTE_PERMISSIONS: Record<string, Record<string, Permission>> = {
  "/api/v1/cases": {
    GET: "cases:read",
    POST: "cases:create",
  },
  "/api/v1/donations": {
    GET: "donations:read",
    POST: "donations:create",
  },
  "/api/v1/programmes": {
    GET: "programmes:read",
    POST: "programmes:create",
  },
  "/api/v1/disbursements": {
    GET: "disbursements:read",
    POST: "disbursements:create",
  },
  "/api/v1/users": {
    GET: "users:read",
    POST: "users:create",
  },
  "/api/v1/reports": {
    GET: "reports:read",
  },
  "/api/v1/audit": {
    GET: "audit:read",
  },
};

/**
 * Get required permission for a route + method
 */
export function getRequiredPermission(path: string, method: string): Permission | null {
  // Check exact match
  if (ROUTE_PERMISSIONS[path]?.[method]) {
    return ROUTE_PERMISSIONS[path][method];
  }

  // Check prefix match for dynamic routes
  for (const [routePath, methods] of Object.entries(ROUTE_PERMISSIONS)) {
    if (path.startsWith(routePath) && methods[method]) {
      return methods[method];
    }
  }

  return null;
}
