export function splitName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function usernameFromEmail(email: string): string {
  const local = email.trim().toLowerCase().split('@')[0] ?? '';
  const cleaned = local.replace(/[^a-z0-9._-]/g, '').slice(0, 40);
  return cleaned || 'owner';
}
