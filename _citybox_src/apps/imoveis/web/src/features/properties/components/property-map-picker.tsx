'use client';

import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
import {
  type LatLng,
  formatMapCoordinate,
  parseMapCoordinate,
  sameLatLng,
} from '../utils/map-coordinate';
import { resolveDisplayedPin } from '../utils/map-pin-session';
import { PropertyLeafletMap } from './property-leaflet-map';

const mapButtonSx = {
  textTransform: 'none',
  borderRadius: '12px',
  fontWeight: 500,
} as const;

type PropertyMapPickerProps = {
  mapCoordinate: string;
  onChange: (value: string) => void;
  title?: string;
};

export function PropertyMapPicker({
  mapCoordinate,
  onChange,
  title = 'Localização do imóvel',
}: PropertyMapPickerProps) {
  const saved = parseMapCoordinate(mapCoordinate);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LatLng | null>(null);

  const display = saved
    ? resolveDisplayedPin({ saved, editing, draft })
    : null;

  function handleMove(next: LatLng) {
    if (!editing) return;
    setDraft(next);
  }

  function handleEdit() {
    if (!saved) return;
    setDraft(saved);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(null);
    setEditing(false);
  }

  function handleSave() {
    if (!saved) return;
    const next = draft ?? saved;
    if (!sameLatLng(saved, next)) {
      onChange(formatMapCoordinate(next.lat, next.lng));
    }
    setDraft(null);
    setEditing(false);
  }

  if (!saved || !display) return null;

  return (
    <Box>
      <PropertyLeafletMap
        coords={display}
        title={title}
        editing={editing}
        onMove={handleMove}
      />
      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 1.25, flexWrap: 'wrap', alignItems: 'center' }}
      >
        {editing ? (
          <>
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={handleCancel}
              sx={mapButtonSx}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="contained"
              size="small"
              onClick={handleSave}
              sx={{ ...mapButtonSx, boxShadow: 'none' }}
            >
              Salvar
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outlined"
            size="small"
            onClick={handleEdit}
            sx={mapButtonSx}
          >
            Editar
          </Button>
        )}
      </Stack>
      <Typography
        color="text.secondary"
        sx={{ mt: 1, fontSize: '0.8125rem', fontWeight: 300 }}
      >
        {editing
          ? 'Clique no mapa ou arraste o pin. Salvar trava de novo.'
          : 'O pin está travado. Editar para ajustar; no catálogo o cliente só vê a posição salva.'}
      </Typography>
    </Box>
  );
}
