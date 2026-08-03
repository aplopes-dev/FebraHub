export type LngLatBounds = [[number, number], [number, number]];

export function boundsOfPoints(points: { position: [number, number] }[]): LngLatBounds | null {
  if (points.length === 0) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const p of points) {
    const [lng, lat] = p.position;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function padBounds(b: LngLatBounds, pad = 0.35): LngLatBounds {
  const w = Math.max(b[1][0] - b[0][0], 0.5);
  const h = Math.max(b[1][1] - b[0][1], 0.5);
  return [
    [b[0][0] - w * pad, b[0][1] - h * pad],
    [b[1][0] + w * pad, b[1][1] + h * pad],
  ];
}
