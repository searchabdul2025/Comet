import { getCurrentUser } from './auth';
import { requirePermission, UserRole } from './permissions';
import { redirect } from 'next/navigation';

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/');
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    redirect('/dashboard');
  }

  return user;
}

export async function requirePermissionCheck(
  permission: keyof import('./permissions').Permissions
) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/');
  }

  const hasPermission = requirePermission(user.role as UserRole, permission);
  
  if (!hasPermission) {
    redirect('/dashboard');
  }

  return user;
}

