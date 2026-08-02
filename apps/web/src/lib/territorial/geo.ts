import Supercluster from "supercluster";
import type { MapPoint } from "./tipos";

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

export interface ClusterFeature {
  id: string;
  isCluster: boolean;
  count: number;
  position: [number, number];
  /** Presente apenas em folhas. */
  point?: MapPoint;
  /** id numérico interno do supercluster (para expansão). */
  clusterId?: number;
}

export interface ClusterIndex {
  getClusters(bounds: [number, number, number, number], zoom: number): ClusterFeature[];
  getExpansionZoom(clusterId: number): number;
}

/** Índice de agrupamento GPU-friendly (supercluster) sobre os pontos filtrados. */
export function buildClusterIndex(points: MapPoint[]): ClusterIndex {
  const index = new Supercluster<{ point: MapPoint }, { count: number }>({
    radius: 58,
    maxZoom: 9,
    minPoints: 4,
  });
  index.load(
    points.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: p.position },
      properties: { point: p },
    })),
  );
  return {
    getClusters(bounds, zoom) {
      const clusters = index.getClusters(bounds, Math.round(zoom));
      return clusters.map((f): ClusterFeature => {
        const coords = f.geometry.coordinates as [number, number];
        if ((f.properties as { cluster?: boolean }).cluster) {
          const props = f.properties as unknown as { point_count: number };
          return {
            id: `cluster-${f.id}`,
            isCluster: true,
            count: props.point_count,
            position: coords,
            clusterId: Number(f.id),
          };
        }
        const point = (f.properties as { point: MapPoint }).point;
        return {
          id: point.id,
          isCluster: false,
          count: 1,
          position: coords,
          point,
        };
      });
    },
    getExpansionZoom(clusterId) {
      return Math.min(index.getClusterExpansionZoom(clusterId), 12);
    },
  };
}
