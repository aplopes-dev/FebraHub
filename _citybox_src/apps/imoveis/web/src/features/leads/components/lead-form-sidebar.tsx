'use client';

import type { ChangeEvent, RefObject } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import {
  Avatar,
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { PropertyImage } from '@/components/ui/property-image';
import { PROPERTY_TYPE_LABEL, type PropertyType } from '@/features/shared/types';
import { MatchedPropertyThumb } from './matched-property-thumb';
import {
  listifyGlassPanelSx,
  primaryGlowShadow,
  primarySoftSurface,
  primaryVerticalGradient,
} from '@/theme/accent-styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import {
  LEAD_STATUS_LABEL,
  type ActiveDeal,
  type LeadStatus,
  type MatchedProperty,
} from '../types';
import { LeadStatusBadge } from './lead-status-badge';
import { LeadFormTimeline } from './lead-form-timeline';

const STATUS_SELECT_SX = {
  height: 48,
  borderRadius: '12px',
  bgcolor: 'secondary.light',
  fontSize: '0.875rem',
  fontWeight: 500,
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    py: 1.25,
    px: 1.5,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'secondary.light',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'divider',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'primary.main',
  },
} as const;

type LeadFormSidebarProps = {
  mode: 'create' | 'edit';
  title: string;
  leadName: string;
  photoUrl: string;
  initials: string;
  photoBusy: boolean;
  photoInputRef: RefObject<HTMLInputElement | null>;
  status: LeadStatus;
  interestedPropertyType: PropertyType;
  matchedProperties: readonly MatchedProperty[];
  activeDeal?: ActiveDeal | null;
  hasMatchedPropertyForPipeline?: boolean;
  latestFollowUpDisplay: string;
  nextFollowUpDisplay: string;
  onStatusChange: (status: LeadStatus) => void;
  onUploadPhoto: () => void;
  onRemovePhoto: () => void;
  onPhotoSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onLinkProperties?: () => void;
  onSendContract?: () => void;
  onCreateTransaction?: () => void;
};

export function LeadFormSidebar({
  mode,
  title,
  leadName,
  photoUrl,
  initials,
  photoBusy,
  photoInputRef,
  status,
  interestedPropertyType,
  matchedProperties,
  activeDeal,
  hasMatchedPropertyForPipeline,
  latestFollowUpDisplay,
  nextFollowUpDisplay,
  onStatusChange,
  onUploadPhoto,
  onRemovePhoto,
  onPhotoSelected,
  onLinkProperties,
  onSendContract,
  onCreateTransaction,
}: LeadFormSidebarProps) {
  const featured = matchedProperties[0];
  const showMatchCard = mode === 'create';

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      {/* Título fora do card — Figma 18095:13323 */}
      <Typography
        component="h1"
        sx={{
          fontSize: '2rem',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
          px: 0.5,
        }}
      >
        {title}
      </Typography>

      <Panel
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          px: 1.5,
          py: 2.5,
        }}
      >
        {/* Profile Photo */}
        <Stack spacing={1.5} sx={{ alignItems: 'center', width: '100%' }}>
          <Typography
            sx={{
              alignSelf: 'stretch',
              fontSize: '0.875rem',
              fontWeight: 500,
              lineHeight: 1.55,
              color: 'text.primary',
            }}
          >
            Foto de perfil
          </Typography>

          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 100,
              height: 100,
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: -8,
                borderRadius: 999,
                background: (theme) =>
                  `radial-gradient(circle, ${primarySoftSurface(theme, 0.2)} 0%, transparent 70%)`,
              }}
            />
            <Avatar
              src={photoUrl || undefined}
              sx={{
                position: 'relative',
                width: 100,
                height: 100,
                fontSize: 28,
                bgcolor: 'secondary.dark',
                color: 'text.secondary',
              }}
            >
              {initials}
            </Avatar>
          </Box>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={onPhotoSelected}
          />

          <Button
            type="button"
            fullWidth
            disabled={photoBusy}
            startIcon={<UploadOutlinedIcon sx={{ fontSize: 18 }} />}
            onClick={onUploadPhoto}
            sx={{
              height: 42,
              borderRadius: '12px',
              border: 'none',
              bgcolor: 'secondary.main',
              color: 'text.primary',
              px: 2,
              py: 1.25,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: 'secondary.dark',
                boxShadow: 'none',
              },
            }}
          >
            {photoBusy ? 'Processando…' : photoUrl ? 'Trocar foto' : 'Enviar foto'}
          </Button>
          {photoUrl ? (
            <Button
              type="button"
              variant="text"
              fullWidth
              onClick={onRemovePhoto}
              sx={{
                mt: -1,
                textTransform: 'none',
                color: 'text.secondary',
                fontSize: '0.8125rem',
              }}
            >
              Remover foto
            </Button>
          ) : null}
        </Stack>

        {/* Imóvel em destaque — só edição */}
        {mode === 'edit' && featured ? (
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              borderRadius: '16px',
              bgcolor: 'secondary.light',
              p: 1.25,
            }}
          >
            <MatchedPropertyThumb
              property={featured}
              size={72}
              alt={`Foto de ${featured.name}`}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {featured.name}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 300 }}>
                {PROPERTY_TYPE_LABEL[interestedPropertyType]}
              </Typography>
              <Box
                component="a"
                href={`/properties/${featured.id}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'inline-block',
                  mt: 0.5,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Ver imóvel
              </Box>
            </Box>
          </Box>
        ) : null}

        {/* Status — Select MUI */}
        <Stack spacing={0.5} sx={{ width: '100%' }}>
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              lineHeight: 1.55,
              color: 'text.primary',
            }}
          >
            Status
          </Typography>
          <FormControl fullWidth>
            <Select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as LeadStatus)}
              displayEmpty
              renderValue={(value) => (
                <LeadStatusBadge status={value as LeadStatus} />
              )}
              sx={STATUS_SELECT_SX}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      borderRadius: '12px',
                      mt: 0.5,
                      boxShadow: '0 4px 16px rgba(16, 24, 40, 0.1)',
                    },
                  },
                },
              }}
            >
              {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((item) => (
                <MenuItem key={item} value={item} sx={{ py: 1.25 }}>
                  <LeadStatusBadge status={item} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {mode === 'edit' ? (
          <Stack spacing={1.5}>
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 500,
                letterSpacing: '-0.02em',
              }}
            >
              Progresso
            </Typography>
            <LeadFormTimeline
              status={status}
              hasMatchedProperty={
                hasMatchedPropertyForPipeline ?? matchedProperties.length > 0
              }
              activeDeal={activeDeal}
              latestFollowUp={latestFollowUpDisplay}
              nextFollowUp={nextFollowUpDisplay}
              onLinkProperty={onLinkProperties}
              onSendContract={onSendContract}
              onCreateTransaction={onCreateTransaction}
            />
          </Stack>
        ) : null}

        {/* Match card — Figma recommendation */}
        {showMatchCard ? (
          <Box
            sx={{
              borderRadius: '20px',
              p: 1.5,
              background: (theme) =>
                `linear-gradient(150deg, ${theme.palette.background.default} 0%, ${primarySoftSurface(theme, 0.15)} 100%)`,
            }}
          >
            <Box
              sx={(theme) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2.5,
                borderRadius: '20px',
                pt: 2.5,
                pb: 1.5,
                px: 1,
                ...listifyGlassPanelSx(theme),
              })}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  width: 56,
                  height: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  background: (theme) => primaryVerticalGradient(theme),
                  color: '#fff',
                  boxShadow: (theme) => primaryGlowShadow(theme),
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 24 }} />
              </Box>

              <Box sx={{ px: 1, textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    lineHeight: 1.43,
                    color: 'text.primary',
                  }}
                >
                  {matchedProperties.length > 0
                    ? `${matchedProperties.length} ${
                        matchedProperties.length === 1
                          ? 'imóvel vinculado'
                          : 'imóveis vinculados'
                      }${leadName ? ` a ${leadName}` : ''}`
                    : 'Nenhum imóvel vinculado ainda'}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', fontWeight: 300, lineHeight: 1.55, mt: 0.5 }}
                >
                  {matchedProperties.length > 0
                    ? 'Veja as opções e ajude a encontrar o imóvel ideal.'
                    : 'Vincule imóveis na aba Imóveis para gerar recomendações.'}
                </Typography>
              </Box>

              {matchedProperties.length > 0 ? (
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ width: '100%', justifyContent: 'center', px: 1.5 }}
                >
                  {matchedProperties.slice(0, 2).map((property) => (
                    <Box
                      key={property.id}
                      sx={{
                        position: 'relative',
                        width: 92,
                        height: 120,
                        overflow: 'hidden',
                        borderRadius: '12px',
                        bgcolor: (theme) => listifyElevatedSurface(theme),
                      }}
                    >
                      <MatchedPropertyThumb
                        property={property}
                        fill
                        borderRadius="12px"
                        alt={`Foto de ${property.name}`}
                      />
                      <Box
                        component="a"
                        href={`/properties/${property.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir ${property.name}`}
                        sx={{
                          position: 'absolute',
                          left: 6,
                          bottom: 6,
                          display: 'inline-flex',
                          width: 32,
                          height: 32,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 999,
                          border: '0.76px solid',
                          borderColor: 'primary.main',
                          background: (theme) => primaryVerticalGradient(theme),
                          color: '#fff',
                        }}
                      >
                        <NorthEastIcon sx={{ fontSize: 14 }} />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </Panel>
    </Stack>
  );
}
