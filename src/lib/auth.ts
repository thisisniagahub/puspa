// Auth helper constants and types
export const ROLES = {
  ADMIN: "admin",
  OPS: "ops",
  FINANCE: "finance",
  VOLUNTEER: "volunteer",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Pentadbir",
  ops: "Operasi",
  finance: "Kewangan",
  volunteer: "Sukarelawan",
};

// Permission matrix: which roles can access what
export const PERMISSIONS = {
  // Cases
  "cases:create": [ROLES.ADMIN, ROLES.OPS, ROLES.VOLUNTEER] as UserRole[],
  "cases:read": [ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE, ROLES.VOLUNTEER] as UserRole[],
  "cases:update": [ROLES.ADMIN, ROLES.OPS] as UserRole[],
  "cases:delete": [ROLES.ADMIN] as UserRole[],
  "cases:verify": [ROLES.ADMIN, ROLES.OPS] as UserRole[],
  "cases:approve": [ROLES.ADMIN, ROLES.FINANCE] as UserRole[],
  "cases:disburse": [ROLES.ADMIN, ROLES.FINANCE] as UserRole[],

  // Donations
  "donations:create": [ROLES.ADMIN, ROLES.FINANCE, ROLES.VOLUNTEER] as UserRole[],
  "donations:read": [ROLES.ADMIN, ROLES.FINANCE, ROLES.OPS] as UserRole[],
  "donations:update": [ROLES.ADMIN, ROLES.FINANCE] as UserRole[],
  "donations:delete": [ROLES.ADMIN] as UserRole[],

  // Disbursements
  "disbursements:create": [ROLES.ADMIN, ROLES.FINANCE] as UserRole[],
  "disbursements:read": [ROLES.ADMIN, ROLES.FINANCE, ROLES.OPS] as UserRole[],
  "disbursements:update": [ROLES.ADMIN, ROLES.FINANCE] as UserRole[],
  "disbursements:approve": [ROLES.ADMIN] as UserRole[],

  // Programmes
  "programmes:create": [ROLES.ADMIN, ROLES.OPS] as UserRole[],
  "programmes:read": [ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE, ROLES.VOLUNTEER] as UserRole[],
  "programmes:update": [ROLES.ADMIN, ROLES.OPS] as UserRole[],
  "programmes:delete": [ROLES.ADMIN] as UserRole[],

  // Users
  "users:create": [ROLES.ADMIN] as UserRole[],
  "users:read": [ROLES.ADMIN] as UserRole[],
  "users:update": [ROLES.ADMIN] as UserRole[],
  "users:delete": [ROLES.ADMIN] as UserRole[],

  // Reports
  "reports:read": [ROLES.ADMIN, ROLES.FINANCE, ROLES.OPS] as UserRole[],
  "reports:export": [ROLES.ADMIN, ROLES.FINANCE] as UserRole[],

  // Audit
  "audit:read": [ROLES.ADMIN] as UserRole[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[permission]?.includes(role) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

// Case status transition rules
export const CASE_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted", "rejected"],
  submitted: ["verifying", "rejected"],
  verifying: ["verified", "rejected"],
  verified: ["scoring", "rejected"],
  scoring: ["scored", "rejected"],
  scored: ["approved", "rejected"],
  approved: ["disbursing", "rejected"],
  disbursing: ["disbursed", "failed"],
  disbursed: ["follow_up", "closed"],
  follow_up: ["closed", "disbursing"],
  closed: [],
  rejected: ["draft"], // can resubmit
};

export function canTransitionCase(fromStatus: string, toStatus: string): boolean {
  return CASE_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}
