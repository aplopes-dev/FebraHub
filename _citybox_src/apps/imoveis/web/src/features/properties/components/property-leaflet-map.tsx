'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Box } from '@citybox/mui/atoms';
import { useTheme } from '@mui/material/styles';
import L, { type Marker as LeafletMarker } from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { type LatLng, sameLatLng } from '../utils/map-coordinate';
import 'leaflet/dist/leaflet.css';
import './property-map-picker.css';

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const MAP_ZOOM = 16;
const MAP_HEIGHT = 224;

type PropertyLeafletMapProps = {
  coords: LatLng;
  title?: string;
  editing?: boolean;
  onMove?: (coords: LatLng) => void;
};

function createPinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'imoveis-map-pin',
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    html: `<span class="imoveis-map-pin__glyph" style="background:${color}"></span>`,
  });
}

function RecenterWhenCoordsJump({ coords }: { coords: LatLng }) {
  const map = useMap();
  const { lat, lng } = coords;

  useEffect(() => {
    const center = map.getCenter();
    if (sameLatLng({ lat: center.lat, lng: center.lng }, { lat, lng })) return;
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);

  return null;
}

function ClickToMovePin({
  enabled,
  onMove,
}: {
  enabled: boolean;
  onMove: (coords: LatLng) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onMove({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function MapPin({
  coords,
  icon,
  draggable,
  onMove,
}: {
  coords: LatLng;
  icon: L.DivIcon;
  draggable: boolean;
  onMove?: (coords: LatLng) => void;
}) {
  const markerRef = useRef<LeafletMarker | null>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const next = markerRef.current?.getLatLng();
        if (!next || !onMove) return;
        onMove({ lat: next.lat, lng: next.lng });
      },
    }),
    [onMove],
  );

  return (
    <Marker
      ref={markerRef}
      draggable={draggable}
      autoPan={draggable}
      position={[coords.lat, coords.lng]}
      icon={icon}
      eventHandlers={eventHandlers}
    />
  );
}

export function PropertyLeafletMap({
  coords,
  title = 'Mapa do imóvel',
  editing = false,
  onMove,
}: PropertyLeafletMapProps) {
  const theme = useTheme();
  const pinIcon = useMemo(
    () => createPinIcon(theme.palette.primary.main),
    [theme.palette.primary.main],
  );

  return (
    <Box
      role="region"
      aria-label={title}
      sx={{
        position: 'relative',
        zIndex: 0,
        height: MAP_HEIGHT,
        overflow: 'hidden',
        borderRadius: '20px',
        '& .leaflet-container': {
          width: '100%',
          height: '100%',
          fontFamily: 'inherit',
          cursor: editing ? 'crosshair' : 'grab',
        },
        '& .leaflet-control-attribution': { fontSize: '0.625rem' },
      }}
    >
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={MAP_ZOOM}
        scrollWheelZoom={false}
        attributionControl
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <RecenterWhenCoordsJump coords={coords} />
        {editing && onMove ? (
          <ClickToMovePin enabled onMove={onMove} />
        ) : null}
        <MapPin
          coords={coords}
          icon={pinIcon}
          draggable={Boolean(editing && onMove)}
          onMove={onMove}
        />
      </MapContainer>
    </Box>
  );
}
