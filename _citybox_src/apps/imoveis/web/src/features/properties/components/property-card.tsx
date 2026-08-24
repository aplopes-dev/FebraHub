'use client';

import Link from 'next/link';
import CropFreeOutlinedIcon from '@mui/icons-material/CropFreeOutlined';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { PropertyImage } from '@/components/ui/property-image';
import { PropertyStatusBadge } from '@/components/ui/status-badge';
import { getAgentDisplayName } from '@/features/shared/constants/agents';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';
import { formatCostDisplay } from '../utils/field-masks';
import type { PropertyListing } from '../types';
import { AuthPropertyPhoto } from './auth-property-photo';
import {
  isPropertyFullyUnavailable,
  propertyUnavailableOverlayLabel,
} from '../utils/property-availability';

/**
 * Card de imóvel — Figma Property Grid (node 18098:13393).
 * Altura ~386 · padding/gap 20 · radius 20 · capa 190×radius 12.
 */
export function PropertyCard({ property }: { property: PropertyListing }) {
  const cover = property.photoUrls[0];
  const unavailable = isPropertyFullyUnavailable(property);
  const overlayLabel = propertyUnavailableOverlayLabel(property);
  const unitsLabel =
    property.units === 1 ? '1 unidade' : `${property.units} unidades`;
  const agentLabel = getAgentDisplayName(property.agentId);

  return (
    <Link
      href={`/properties/${property.id}`}
      aria-label={`Abrir ${property.name}`}
      style={{ display: 'block', minWidth: 0, maxWidth: '100%', outline: 'none' }}
    >
      <Box
        sx={{
          overflow: 'hidden',
          borderRadius: '20px',
          minWidth: 0,
          width: '100%',
          maxWidth: '100%',
        }}
      >
      <Panel
        sx={{
          display: 'flex',
          height: 404,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          flexDirection: 'column',
          gap: 2.5,
          overflow: 'hidden',
          p: 2.5,
          borderRadius: '20px',
          transition: 'box-shadow 0.15s',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(16, 24, 40, 0.08)',
          },
          ...(unavailable
            ? { opacity: 0.72, filter: 'saturate(0.55)' }
            : {}),
        }}
      >
        <Box
          sx={{
            position: 'relative',
            height: 190,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            flexShrink: 0,
            overflow: 'hidden',
            isolation: 'isolate',
            borderRadius: '12px',
            bgcolor: 'secondary.main',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              '& img': {
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                objectFit: 'cover',
              },
            }}
          >
            {cover ? (
              <AuthPropertyPhoto
                src={cover}
                alt={`Foto de ${property.name}`}
                className="size-full object-cover"
              />
            ) : (
              <PropertyImage seed={property.id} alt={`Ilustração de ${property.name}`} />
            )}
          </Box>
          {unavailable && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(16, 24, 40, 0.45)',
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 999,
                  bgcolor: 'background.paper',
                  px: 2,
                  py: 0.75,
                  boxShadow: '0 2px 8px rgba(16, 24, 40, 0.18)',
                }}
              >
                <Typography
                  sx={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 }}
                >
                  {overlayLabel}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
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
                  ...(unavailable ? { color: 'text.secondary' } : {}),
                }}
              >
                {property.name}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 300,
                  lineHeight: 1.55,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {property.city}, {property.state}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 0, flex: 1, textAlign: 'right' }}>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 300,
                  lineHeight: 1.55,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {property.typeCode || '—'}
              </Typography>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  py: 0.5,
                }}
              >
                <CropFreeOutlinedIcon
                  sx={{ fontSize: 12, color: 'text.secondary' }}
                />
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', fontWeight: 300, lineHeight: 1.55 }}
                >
                  {property.sizeSqm > 0 ? `${property.sizeSqm} m²` : '—'}
                </Typography>
              </Stack>
            </Box>
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {formatCostDisplay(property.cost)}
            </Typography>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                flexShrink: 0,
                alignItems: 'center',
                borderRadius: '12px',
                bgcolor: 'secondary.main',
                px: 1,
                py: 0.5,
              }}
            >
              <Typography
                color="text.secondary"
                sx={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.55 }}
              >
                {PROPERTY_TYPE_LABEL[property.type]}
              </Typography>
            </Box>
          </Stack>

          <Stack
            spacing={0.25}
            sx={{
              mt: 'auto',
              minHeight: 44,
              justifyContent: 'flex-end',
            }}
          >
            <Stack
              direction="row"
              sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                minHeight: 28,
              }}
            >
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  lineHeight: 1.55,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {unitsLabel}
              </Typography>
              <PropertyStatusBadge
                status={property.status}
                occupiedUnits={property.occupiedUnits}
                units={property.units}
                sx={{ maxWidth: '60%' }}
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
              {agentLabel}
            </Typography>
          </Stack>
        </Stack>
      </Panel>
      </Box>
    </Link>
  );
}
