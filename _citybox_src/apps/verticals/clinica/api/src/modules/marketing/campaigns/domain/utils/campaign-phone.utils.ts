export function normalizePhoneKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits;
}

export function extractPhoneFromPayload(
  payload: Record<string, unknown>,
): string | null {
  return (
    normalizePhoneKey(payload['field-phone']) ??
    normalizePhoneKey(payload.phone) ??
    null
  );
}
