export function canAccessWithAnyOf(permissions: string[], required: string[]): boolean {
  if (required.length === 0) return true;
  return required.some((key) => permissions.includes(key));
}
