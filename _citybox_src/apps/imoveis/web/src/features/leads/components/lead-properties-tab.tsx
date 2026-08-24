'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SearchIcon from '@mui/icons-material/Search';
import { Box, IconButton, Input, Stack, Typography } from '@citybox/mui/atoms';
import { PropertyImage } from '@/components/ui/property-image';
import { AuthPropertyPhoto } from '@/features/properties/components/auth-property-photo';
import { PROPERTY_TYPE_LABEL, type PropertyType } from '@/features/shared/types';
import { usePropertiesQuery } from '@/features/properties/hooks/use-properties-queries';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import type { MatchedProperty } from '../types';
import { MatchedPropertyThumb } from './matched-property-thumb';
import { primarySoftSurface } from '@/theme/accent-styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import {
  leadTabFieldSx,
  listifyError,
} from './lead-form-tab-styles';

type LeadPropertiesTabProps = {
  matchedProperties: readonly MatchedProperty[];
  /** Tipo de imóvel de interesse — restringe a busca de candidatos ao catálogo. */
  interestedPropertyType: PropertyType;
  onChange: (next: MatchedProperty[]) => void;
  onActivity?: (message: string) => void;
};

export function LeadPropertiesTab({
  matchedProperties,
  interestedPropertyType,
  onChange,
  onActivity,
}: LeadPropertiesTabProps) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 400);

  const linkedIds = useMemo(
    () => new Set(matchedProperties.map((item) => item.id)),
    [matchedProperties],
  );

  const { data: searchResult, isLoading } = usePropertiesQuery({
    search: debounced,
    page: 1,
    perPage: 20,
    /** Esgotado / ocupado / em espera não entram no vínculo. */
    status: ['available'],
    type: [interestedPropertyType],
  });

  const candidates = useMemo(() => {
    return (searchResult?.data ?? []).filter(
      (property) => !linkedIds.has(property.id),
    );
  }, [searchResult?.data, linkedIds]);

  function addProperty(entry: MatchedProperty) {
    if (linkedIds.has(entry.id)) return;
    onChange([...matchedProperties, entry]);
    onActivity?.(`Imóvel vinculado: ${entry.name}`);
  }

  function removeProperty(id: string) {
    const removed = matchedProperties.find((item) => item.id === id);
    onChange(matchedProperties.filter((item) => item.id !== id));
    if (removed) onActivity?.(`Imóvel removido: ${removed.name}`);
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={1.5}>
        <Typography
          sx={{ fontSize: '1.125rem', fontWeight: 500, letterSpacing: '-0.02em' }}
        >
          Imóveis vinculados
        </Typography>

        {matchedProperties.length === 0 ? (
          <EmptyState
            icon={<HomeOutlinedIcon sx={{ fontSize: 28, color: 'text.secondary' }} />}
            title="Nenhum imóvel vinculado"
            description={`Busque abaixo imóveis disponíveis do tipo ${PROPERTY_TYPE_LABEL[interestedPropertyType]}.`}
          />
        ) : (
          <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {matchedProperties.map((property) => (
              <Box
                component="li"
                key={property.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderRadius: '16px',
                  bgcolor: 'secondary.light',
                  px: 1.5,
                  py: 1.25,
                }}
              >
                <MatchedPropertyThumb property={property} />
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
                    {property.name}
                  </Typography>
                  <Box
                    component="a"
                    href={`/properties/${property.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.25,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Abrir imóvel
                    <NorthEastIcon sx={{ fontSize: 12 }} />
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  aria-label={`Remover ${property.name}`}
                  onClick={() => removeProperty(property.id)}
                  sx={{
                    width: 36,
                    height: 36,
                    color: 'text.secondary',
                    bgcolor: (theme) => listifyElevatedSurface(theme),
                    '&:hover': { color: listifyError[100], bgcolor: listifyError[0] },
                  }}
                >
                  <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>

      <Stack spacing={1.5}>
        <Typography
          sx={{ fontSize: '1.125rem', fontWeight: 500, letterSpacing: '-0.02em' }}
        >
          Adicionar imóvel
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ fontSize: '0.8125rem', fontWeight: 300 }}
        >
          Mostrando apenas imóveis do tipo{' '}
          <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>
            {PROPERTY_TYPE_LABEL[interestedPropertyType]}
          </Box>
          .
        </Typography>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, cidade…"
          aria-label="Buscar imóvel"
          fullWidth
          sx={leadTabFieldSx}
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
              ),
            },
          }}
        />

        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            maxHeight: 280,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          }}
        >
          {isLoading ? (
            <Typography
              color="text.secondary"
              sx={{ px: 1.5, py: 4, textAlign: 'center', fontSize: '0.875rem' }}
            >
              Buscando imóveis…
            </Typography>
          ) : null}

          {candidates.map((property) => (
            <Box component="li" key={property.id}>
              <Box
                component="button"
                type="button"
                onClick={() =>
                  addProperty({
                    id: property.id,
                    name: property.name,
                    coverPhotoUrl: property.photoUrls[0],
                  })
                }
                sx={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: 1.5,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: '16px',
                  bgcolor: 'transparent',
                  px: 1.25,
                  py: 1,
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: 'secondary.light' },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    overflow: 'hidden',
                    borderRadius: '12px',
                  }}
                >
                  {property.photoUrls[0] ? (
                    <AuthPropertyPhoto
                      src={property.photoUrls[0]}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <PropertyImage seed={property.id} alt="" />
                  )}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {property.name}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {property.city}, {property.state} · {PROPERTY_TYPE_LABEL[property.type]}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'inline-flex',
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                    bgcolor: (theme) => primarySoftSurface(theme),
                    color: 'primary.main',
                  }}
                >
                  <AddIcon sx={{ fontSize: 18 }} />
                </Box>
              </Box>
            </Box>
          ))}

          {!isLoading && candidates.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ px: 1.5, py: 4, textAlign: 'center', fontSize: '0.875rem' }}
            >
              {debounced.trim()
                ? `Nenhum imóvel do tipo ${PROPERTY_TYPE_LABEL[interestedPropertyType]} disponível para vincular.`
                : 'Digite para buscar imóveis disponíveis no catálogo.'}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Stack>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Stack
      spacing={1}
      sx={{
        alignItems: 'center',
        borderRadius: '16px',
        bgcolor: 'secondary.light',
        px: 3,
        py: 5,
        textAlign: 'center',
      }}
    >
      {icon}
      <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', fontWeight: 300, maxWidth: 320 }}>
        {description}
      </Typography>
    </Stack>
  );
}
