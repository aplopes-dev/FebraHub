export function readChargeMetadata(charge: { metadataJson?: unknown }): Record<string, unknown> | undefined {
  const raw = charge.metadataJson;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return raw as Record<string, unknown>;
}
