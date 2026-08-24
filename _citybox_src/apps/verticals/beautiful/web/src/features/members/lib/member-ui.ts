import type { StoreMember } from '../types/member.types';

export function memberRole(member: StoreMember): string {
  return member.stores[0]?.role ?? '';
}

export function memberRoleLabel(member: StoreMember): string {
  return member.stores[0]?.roleLabel ?? (memberRole(member) || '—');
}

export function memberPermissions(member: StoreMember): string[] {
  return member.stores[0]?.permissions ?? [];
}

export function getMemberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function filterMembersByStatus(
  members: StoreMember[],
  statusFilter: 'all' | 'active' | 'disabled',
): StoreMember[] {
  if (statusFilter === 'all') {
    return members;
  }

  return members.filter((member) => member.status === statusFilter);
}

export function normalizeUsernamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '')
    .replace(/^[._-]+|[._-]+$/g, '');
}

export function isOrganizationOwnerMember(member: StoreMember): boolean {
  return member.isOrganizationOwner === true;
}

export function suggestUsernameFromName(firstName: string, lastName: string): string {
  const first = normalizeUsernamePart(firstName);
  const last = normalizeUsernamePart(lastName);
  if (first && last) return `${first}.${last}`;
  return first || last;
}
