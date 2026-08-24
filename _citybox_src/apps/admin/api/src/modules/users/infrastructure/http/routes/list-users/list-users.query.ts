export function parseRolesParam(raw?: string | string[]): string[] | undefined {
  if (!raw) return undefined;
  const values = Array.isArray(raw) ? raw : raw.split(',');
  const roles = values.map((role) => role.trim()).filter(Boolean);
  return roles.length ? roles : undefined;
}
