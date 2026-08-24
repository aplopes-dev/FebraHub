import { bodyRegionLabel } from './body-regions';

export const BODY_REGION_LOCATION_PREFIX = 'body:';

export function formatBodyRegionLocationLabel(regionId: string): string {
  return `${BODY_REGION_LOCATION_PREFIX}${regionId}`;
}

export function parseBodyRegionIdFromLabel(
  locationLabel: string | undefined,
): string | null {
  if (!locationLabel?.startsWith(BODY_REGION_LOCATION_PREFIX)) {
    return null;
  }
  const regionId = locationLabel.slice(BODY_REGION_LOCATION_PREFIX.length).trim();
  return regionId || null;
}

/** Resolve label humano para exibição (orçamento, tabela, evolução). */
export function formatBodyRegionDisplayLabel(locationLabel: string | undefined): string {
  if (!locationLabel?.trim()) {
    return '—';
  }
  const regionId = parseBodyRegionIdFromLabel(locationLabel);
  if (regionId) {
    return bodyRegionLabel(regionId);
  }
  return locationLabel.trim();
}

export function isBodyRegionLocationLabel(locationLabel: string | undefined): boolean {
  return Boolean(parseBodyRegionIdFromLabel(locationLabel));
}
