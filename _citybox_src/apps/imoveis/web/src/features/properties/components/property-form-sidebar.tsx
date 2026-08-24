'use client';

import type { ChangeEvent, RefObject } from 'react';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CropFreeOutlinedIcon from '@mui/icons-material/CropFreeOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Box, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { PropertyImage } from '@/components/ui/property-image';
import { PropertyStatusBadge } from '@/components/ui/status-badge';
import { getAgentDisplayName } from '@/features/shared/constants/agents';
import { PROPERTY_TYPE_LABEL, type PropertyStatus, type PropertyType } from '@/features/shared/types';
import type { PropertyDocumentDraft, PropertyPhotoDraft } from '../services/properties-service';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { listifyError } from './property-form-styles';
import { AuthPropertyPhoto } from './auth-property-photo';

type PropertyPreviewProps = {
  seedId: string;
  name: string;
  city: string;
  state: string;
  costDisplay: string;
  sizeSqm: string;
  type: PropertyType;
  units: string;
  status: PropertyStatus;
  occupiedUnits: string;
  agentId?: string;
  cover: PropertyPhotoDraft | undefined;
  onCoverClick?: () => void;
};

type PropertyDocumentsProps = {
  documents: readonly PropertyDocumentDraft[];
  docInputRef: RefObject<HTMLInputElement | null>;
  onDocSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveDoc: (key: string) => void;
  onOpenDoc: (doc: PropertyDocumentDraft) => void;
};

function photoPreviewSrc(photo: PropertyPhotoDraft): string | undefined {
  return photo.localPreview ?? photo.path;
}

export function PropertyFormPreview({
  seedId,
  name,
  city,
  state,
  costDisplay,
  sizeSqm,
  type,
  units,
  status,
  occupiedUnits,
  agentId,
  cover,
  onCoverClick,
}: PropertyPreviewProps) {
  const location =
    [city, state].filter(Boolean).join(', ') || 'Localização';
  const unitsLabel =
    !units || units === '0'
      ? '—'
      : Number(units) === 1
        ? '1 unidade'
        : `${units} unidades`;
  const agentLabel = getAgentDisplayName(agentId);

  return (
    <Panel
      sx={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        gap: 2.75,
        p: 3,
        borderRadius: '20px',
        bgcolor: 'background.paper',
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: '1.125rem',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
        }}
      >
        Prévia do imóvel
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          p: 2.5,
          borderRadius: '20px',
          bgcolor: 'secondary.light',
          boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        }}
      >
        <Box
          component={onCoverClick ? 'button' : 'div'}
          type={onCoverClick ? 'button' : undefined}
          onClick={onCoverClick}
          aria-label={onCoverClick ? 'Ver fotos do imóvel' : undefined}
          sx={{
            height: 190,
            width: '100%',
            flexShrink: 0,
            overflow: 'hidden',
            borderRadius: '12px',
            bgcolor: 'secondary.main',
            border: 0,
            p: 0,
            display: 'block',
            cursor: onCoverClick ? 'zoom-in' : 'default',
          }}
        >
          {cover ? (
            <AuthPropertyPhoto
              src={photoPreviewSrc(cover)}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <PropertyImage
              seed={seedId || name || 'new'}
              alt="Prévia do imóvel"
            />
          )}
        </Box>

        <Stack spacing={0.5}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name.trim() || 'Novo imóvel'}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {location}
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexShrink: 0,
                py: 0.5,
              }}
            >
              <CropFreeOutlinedIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography
                color="text.secondary"
                sx={{ fontSize: '0.75rem', fontWeight: 300 }}
              >
                {sizeSqm ? `${sizeSqm} m²` : '—'}
              </Typography>
            </Stack>
          </Stack>

          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
          >
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
              }}
            >
              {costDisplay.trim() || 'R$ 0'}
            </Typography>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                borderRadius: '12px',
                bgcolor: 'secondary.main',
                px: 1,
                py: 0.5,
              }}
            >
              <Typography
                color="text.secondary"
                sx={{ fontSize: '0.75rem', fontWeight: 500 }}
              >
                {PROPERTY_TYPE_LABEL[type]}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Stack spacing={0.5}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
          >
            <Typography
              color="text.secondary"
              sx={{ fontSize: '0.75rem', fontWeight: 500 }}
            >
              {unitsLabel}
            </Typography>
            <PropertyStatusBadge
              status={status}
              occupiedUnits={
                status === 'occupied' && occupiedUnits
                  ? Number(occupiedUnits)
                  : undefined
              }
              units={units ? Number(units) : undefined}
            />
          </Stack>
          <Typography
            color="primary.main"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={agentLabel}
          >
            Corretor: {agentLabel}
          </Typography>
        </Stack>
      </Box>
    </Panel>
  );
}

export function PropertyFormDocuments({
  documents,
  docInputRef,
  onDocSelected,
  onRemoveDoc,
  onOpenDoc,
}: PropertyDocumentsProps) {
  return (
    <Panel
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        p: 3,
        borderRadius: '20px',
        bgcolor: 'background.paper',
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: '1.125rem',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
        }}
      >
        Documentos necessários
      </Typography>

      <Box
        component="button"
        type="button"
        onClick={() => docInputRef.current?.click()}
        sx={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.75,
          border: '1.5px dashed',
          borderColor: 'divider',
          borderRadius: '20px',
          bgcolor: 'transparent',
          px: 2.5,
          py: 3.75,
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'border-color 0.15s, background-color 0.15s',
          '&:hover': {
            borderColor: 'divider',
            bgcolor: 'secondary.light',
          },
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            width: 56,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            bgcolor: 'secondary.main',
            color: 'text.primary',
          }}
        >
          <CloudUploadOutlinedIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>
            Envie o documento aqui
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: '0.75rem', fontWeight: 300, mt: 0.25 }}
          >
            PDF, DOCX (máx. 15 MB)
          </Typography>
        </Box>
      </Box>

      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf"
        className="sr-only"
        onChange={onDocSelected}
      />

      <Stack spacing={1.25} sx={{ width: '100%' }}>
        {documents.map((doc) => (
          <Box
            key={doc.key}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              borderRadius: '12px',
              bgcolor: 'secondary.main',
              pr: 0.5,
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => onOpenDoc(doc)}
              sx={{
                display: 'flex',
                minWidth: 0,
                flex: 1,
                alignItems: 'flex-start',
                gap: 1.5,
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                px: 1.5,
                py: 1.75,
                borderRadius: '12px',
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  bgcolor: (theme) => listifyElevatedSurface(theme),
                  color: listifyError[100],
                }}
              >
                <DescriptionOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {doc.name}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', fontWeight: 300 }}
                >
                  {docExtLabel(doc.name)} · {doc.sizeLabel}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              aria-label={`Remover ${doc.name}`}
              onClick={() => onRemoveDoc(doc.key)}
              sx={{
                width: 32,
                height: 32,
                color: 'text.secondary',
                '&:hover': { color: listifyError[100], bgcolor: listifyError[0] },
              }}
            >
              <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
      </Stack>
    </Panel>
  );
}

function docExtLabel(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase();
  return ext === 'PDF' || ext === 'DOC' || ext === 'DOCX' ? ext : 'DOC';
}
