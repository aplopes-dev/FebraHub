import type { OrganizationType, UserRole } from '../types';

export const PERMISSION_TRANSACTIONS_EDIT_SPLIT = 'transactions:edit_split';

export function canEditSplit(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function canViewFullSplit(role: UserRole, orgType: OrganizationType): boolean {
  if (orgType === 'SINGLE_AGENT') return true;
  return role === 'ADMIN' || role === 'MANAGER';
}

export function canViewOwnCommission(role: UserRole): boolean {
  return role === 'AGENT' || role === 'AUTONOMOUS';
}

export function hasPermission(
  role: UserRole,
  permission: typeof PERMISSION_TRANSACTIONS_EDIT_SPLIT,
): boolean {
  if (permission === PERMISSION_TRANSACTIONS_EDIT_SPLIT) {
    return canEditSplit(role);
  }
  return false;
}
