/** Interpreta `Property.mapCoordinate` (`"lat, lng"`). */
export type LatLng = { lat: number; lng: number };

const COORD_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

export function parseMapCoordinate(
  value: string | null | undefined,
): LatLng | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(COORD_RE);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function formatMapCoordinate(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** ~1 m at the equator — ignore drag/setView jitter, catch CEP jumps. */
const SAME_POINT_EPSILON = 1e-5;

export function sameLatLng(a: LatLng, b: LatLng): boolean {
  return (
    Math.abs(a.lat - b.lat) < SAME_POINT_EPSILON &&
    Math.abs(a.lng - b.lng) < SAME_POINT_EPSILON
  );
}

const OSM_SPAN = 0.012;

export function osmEmbedUrl(coords: LatLng): string {
  const { lat, lng } = coords;
  const bbox = [
    lng - OSM_SPAN,
    lat - OSM_SPAN,
    lng + OSM_SPAN,
    lat + OSM_SPAN,
  ].join(',');
  const params = new URLSearchParams({
    bbox,
    layer: 'mapnik',
    marker: `${lat},${lng}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}
