'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@citybox/mui/atoms';
import { parseMapCoordinate } from '../utils/map-coordinate';

const MAP_HEIGHT = 224;

const PropertyLeafletMap = dynamic(
  () =>
    import('./property-leaflet-map').then((mod) => mod.PropertyLeafletMap),
  {
    ssr: false,
    loading: () => (
      <Skeleton
        variant="rounded"
        height={MAP_HEIGHT}
        sx={{ borderRadius: '20px', width: '100%' }}
      />
    ),
  },
);

type PropertyMapEmbedProps = {
  mapCoordinate?: string | null;
  title?: string;
};

/** Catálogo público / `/p/:id` — mesmo Leaflet do cadastro, só leitura. */
export function PropertyMapEmbed({
  mapCoordinate,
  title = 'Mapa do imóvel',
}: PropertyMapEmbedProps) {
  const coords = parseMapCoordinate(mapCoordinate);
  if (!coords) return null;

  return <PropertyLeafletMap coords={coords} title={title} />;
}
