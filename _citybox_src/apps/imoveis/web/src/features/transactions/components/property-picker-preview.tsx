'use client';

import { Box, Typography } from '@citybox/mui/atoms';
import { PropertyImage } from '@/components/ui/property-image';
import { AuthPropertyPhoto } from '@/features/properties/components/auth-property-photo';
import type { PropertyListing } from '@/features/properties/types';
import { getAgentShortName } from '@/features/shared/constants/agents';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';

function propertyDescription(property: PropertyListing): string {
  const address = property.address.trim();
  if (address) return address;

  const location = [property.city, property.state].filter(Boolean).join(', ');
  const typeLabel = PROPERTY_TYPE_LABEL[property.type];
  const size = property.sizeSqm > 0 ? `${property.sizeSqm} m²` : null;

  return [typeLabel, location, size].filter(Boolean).join(' · ');
}

type PropertyPickerPreviewProps = {
  property?: PropertyListing | null;
  fallbackName?: string;
  fallbackCoverUrl?: string;
  selected?: boolean;
  onSelect?: () => void;
};

export function PropertyPickerPreview({
  property,
  fallbackName,
  fallbackCoverUrl,
  selected = false,
  onSelect,
}: PropertyPickerPreviewProps) {
  const name = property?.name ?? fallbackName ?? 'Imóvel';
  const cover = property?.photoUrls[0] ?? fallbackCoverUrl;
  const description = property
    ? propertyDescription(property)
    : 'Imóvel vinculado ao lead';
  const agentLine = property
    ? `Captador: ${getAgentShortName(property.agentId)}`
    : null;

  const content = (
    <>
      <Box
        sx={{
          width: 64,
          height: 64,
          flexShrink: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          bgcolor: 'action.hover',
        }}
      >
        {cover ? (
          <AuthPropertyPhoto
            src={cover}
            alt={`Foto de ${name}`}
            className="size-full object-cover"
          />
        ) : (
          <PropertyImage
            seed={property?.id ?? name}
            alt={name}
            className="size-full"
          />
        )}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 500, color: 'text.primary' }}>
          {name}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{
            mt: 0.25,
            fontSize: '0.75rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </Typography>
        {agentLine ? (
          <Typography
            color="text.secondary"
            sx={{ mt: 0.25, fontSize: '0.75rem' }}
          >
            {agentLine}
          </Typography>
        ) : null}
      </Box>
    </>
  );

  if (!onSelect) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '16px',
          bgcolor: 'background.paper',
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        p: 2,
        m: 0,
        textAlign: 'left',
        cursor: 'pointer',
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: '16px',
        bgcolor: selected ? 'action.selected' : 'background.paper',
        boxShadow: selected ? (theme) => `inset 0 0 0 1px ${theme.palette.primary.main}` : 'none',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        '&:hover': {
          borderColor: selected ? 'primary.main' : 'action.active',
          bgcolor: selected ? 'action.selected' : 'action.hover',
        },
      }}
    >
      {content}
    </Box>
  );
}
