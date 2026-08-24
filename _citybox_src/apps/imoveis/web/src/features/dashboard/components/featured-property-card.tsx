'use client';

import Link from 'next/link';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { PropertyImage } from '@/components/ui/property-image';
import { AuthPropertyPhoto } from '@/features/properties/components/auth-property-photo';
import {
  useRotatingFeaturedProperty,
  type RotatingFeaturedProperty,
} from '@/features/shared/hooks/use-rotating-featured-property';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { primaryVerticalGradient } from '@/theme/accent-styles';

type FeaturedPropertyCardProps = {
  property?: RotatingFeaturedProperty | null;
};

export function FeaturedPropertyCard({ property: fallback }: FeaturedPropertyCardProps) {
  const { property: rotating, goNext, goPrev, total } = useRotatingFeaturedProperty();
  const property = rotating ?? fallback;

  if (!property) {
    return (
      <Panel
        sx={{
          display: 'flex',
          height: '100%',
          minHeight: 164,
          alignItems: 'center',
          justifyContent: 'center',
          p: 1.5,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Carregando recomendações…
        </Typography>
      </Panel>
    );
  }

  const highlights = property.highlights;

  return (
    <Panel
      sx={{
        display: 'flex',
        height: '100%',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 1.25,
        p: 1.25,
        minHeight: { xs: 'auto', lg: 320 },
        overflow: 'hidden',
      }}
    >
      {highlights.length > 0 ? (
        <Stack
          direction={{ xs: 'row', lg: 'column' }}
          spacing={0.75}
          sx={{
            flex: { lg: '0 0 104px' },
            width: { lg: 104 },
            minWidth: 0,
            alignItems: { xs: 'stretch', lg: 'flex-start' },
            alignSelf: 'stretch',
          }}
        >
          {highlights.map((highlight, index) => (
            <Box
              key={`${index}-${highlight}`}
              sx={{
                flex: { xs: '1 1 0', lg: '1 1 0' },
                width: { xs: 'auto', lg: 96 },
                minWidth: 0,
                minHeight: { xs: 52, lg: 0 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                borderRadius: '12px',
                bgcolor: 'secondary.main',
                px: { xs: 0.75, lg: 1 },
                py: 0.75,
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '0.6875rem', lg: '0.75rem' },
                  fontWeight: 500,
                  lineHeight: 1.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  whiteSpace: 'normal',
                }}
              >
                {highlight}
              </Typography>
            </Box>
          ))}
        </Stack>
      ) : null}

      <Stack
        sx={{
          flex: 1,
          minWidth: 0,
          gap: 1,
          alignSelf: 'stretch',
        }}
      >
        <Typography
          component="h2"
          noWrap
          sx={{
            fontSize: '1.125rem',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
            px: 0.25,
          }}
        >
          {property.name}
        </Typography>

        <Box
          sx={{
            position: 'relative',
            flex: { xs: '0 0 auto', lg: 1 },
            height: { xs: 200, lg: 'auto' },
            minWidth: 0,
            minHeight: { lg: 0 },
            alignSelf: 'stretch',
            overflow: 'hidden',
            borderRadius: '12px',
            bgcolor: 'success.light',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              '& img, & svg, & div': {
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              },
            }}
          >
            {property.photoUrl ? (
              <AuthPropertyPhoto
                key={property.id}
                src={property.photoUrl}
                alt={`Foto do imóvel ${property.name}`}
              />
            ) : (
              <PropertyImage
                key={property.id}
                seed={property.id}
                alt={`Foto do imóvel ${property.name}`}
                fit="cover"
              />
            )}
          </Box>

          <Box
            sx={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              boxShadow: 'inset 0 -64px 13px rgba(0,0,0,0.38)',
            }}
          />

          <Box
            component={Link}
            href={`/properties/${property.id}`}
            aria-label={`Abrir ${property.name}`}
            sx={{
              position: 'absolute',
              top: 6,
              right: 5,
              display: 'inline-flex',
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              bgcolor: (theme) => listifyElevatedSurface(theme),
              color: 'text.primary',
              boxShadow: '0 1px 2px rgba(16,24,40,0.1)',
              textDecoration: 'none',
              zIndex: 1,
              '&:hover': { bgcolor: 'secondary.main' },
            }}
          >
            <NorthEastIcon sx={{ fontSize: 14 }} />
          </Box>

          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              position: 'absolute',
              left: 10,
              bottom: 12,
              alignItems: 'center',
              borderRadius: '999px',
              border: '0.75px solid rgba(255,255,255,0.29)',
              bgcolor: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(6.6px)',
              px: 0.5,
              py: 0.5,
              zIndex: 1,
              maxWidth: 'calc(100% - 72px)',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                width: 20,
                height: 20,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '999px',
                background: (theme) => primaryVerticalGradient(theme),
                color: '#fff',
                boxShadow: '0 1px 1px rgba(16,24,40,0.1)',
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 10 }} />
            </Box>
            <Typography
              noWrap
              sx={{
                pr: 0.75,
                fontSize: '0.75rem',
                fontWeight: 300,
                color: '#fff',
              }}
            >
              Recomendado a {property.recommendedToLeads} leads
            </Typography>
          </Stack>

          {total > 1 ? (
            <Stack
              direction="row"
              spacing={0.25}
              sx={{
                position: 'absolute',
                bottom: 10,
                right: 8,
                alignItems: 'center',
                borderRadius: '999px',
                bgcolor: 'rgba(255,255,255,0.9)',
                p: 0.25,
                zIndex: 1,
              }}
            >
              <IconButton
                type="button"
                aria-label="Imóvel anterior"
                onClick={goPrev}
                size="small"
                sx={{ width: 24, height: 24, color: 'text.secondary' }}
              >
                <ChevronLeftIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <IconButton
                type="button"
                aria-label="Próximo imóvel"
                onClick={goNext}
                size="small"
                sx={{ width: 24, height: 24, color: 'text.secondary' }}
              >
                <ChevronRightIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Stack>
          ) : null}
        </Box>
      </Stack>
    </Panel>
  );
}
