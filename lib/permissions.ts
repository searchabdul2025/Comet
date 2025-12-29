export type UserRole = 'Admin' | 'Supervisor' | 'User';

export interface Permissions {
  canManageUsers: boolean;
  canManageForms: boolean;
  canManageIPs: boolean;
  canViewSubmissions: boolean;
  canManageRequests: boolean;
  canDeleteForms: boolean;
  canEditForms: boolean;
  canCreateForms: boolean;
  canManageSettings: boolean;
  canDeleteSubmissions: boolean;
}

type PartialPermissions = Partial<Permissions>;

export function basePermissions(role: UserRole): Permissions {
  switch (role) {
    case 'Admin':
      return {
        canManageUsers: true,
        canManageForms: true,
        canManageIPs: true,
        canViewSubmissions: true,
        canManageRequests: true,
        canDeleteForms: true,
        canEditForms: true,
        canCreateForms: true,
        canManageSettings: true,
        canDeleteSubmissions: true,
      };
    case 'Supervisor':
      return {
        canManageUsers: false,
        canManageForms: true,
        canManageIPs: false,
        canViewSubmissions: true,
        canManageRequests: true,
        canDeleteForms: false,
        canEditForms: true,
        canCreateForms: true,
        canManageSettings: false,
        canDeleteSubmissions: false,
      };
    case 'User':
    default:
      return {
        canManageUsers: false,
        canManageForms: false,
        canManageIPs: false,
        canViewSubmissions: false,
        canManageRequests: false,
        canDeleteForms: false,
        canEditForms: false,
        canCreateForms: false,
        canManageSettings: false,
        canDeleteSubmissions: false,
      };
  }
}

export function getPermissions(role: UserRole, overrides?: PartialPermissions): Permissions {
  const base = basePermissions(role);
  if (!overrides) return base;
  return { ...base, ...overrides };
}

export function requirePermission(
  userRole: UserRole | undefined,
  permission: keyof Permissions,
  overrides?: PartialPermissions
): boolean {
  if (!userRole) return false;
  const permissions = getPermissions(userRole, overrides);
  return permissions[permission];
}

