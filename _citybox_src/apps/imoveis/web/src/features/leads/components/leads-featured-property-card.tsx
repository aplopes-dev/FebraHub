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
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import {
  useRotatingFeaturedProperty,
  type RotatingFeaturedProperty,
} from '@/features/shared/hooks/use-rotating-featured-property';
import { primaryVerticalGradient } from '@/theme/accent-styles';

type LeadsFeaturedPropertyCardProps = {
  property?: RotatingFeaturedProperty | null;
  className?: string;
};

/**
 * Recomendação na sidebar de leads — mesmo padrão do painel:
 * diferenciais na lateral + título acima da foto.
 */
export function LeadsFeaturedPropertyCard({
  property: fallback,
  className,
}: LeadsFeaturedPropertyCardProps) {
  const { property: rotating, goNext, goPrev, total } = useRotatingFeaturedProperty();
  const property = rotating ?? fallback;

  if (!property) {
    return (
      <Panel
        className={className}
        sx={{
          display: 'flex',
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
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        p: { xs: 1, lg: 1.5 },
        overflow: 'hidden',
      }}
    >
      {highlights.length > 0 ? (
        <Stack
          spacing={0.75}
          sx={{
            flex: '0 0 72px',
            width: 72,
            minWidth: 0,
            alignSelf: 'stretch',
          }}
        >
          {highlights.map((highlight, index) => (
            <Box
              key={`${index}-${highlight}`}
              sx={{
                flex: '1 1 0',
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                borderRadius: '12px',
                bgcolor: 'secondary.main',
                px: 0.75,
                py: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.625rem',
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

      <Stack sx={{ flex: 1, minWidth: 0, gap: 0.75, alignSelf: 'stretch' }}>
        <Typography
          component="h2"
          noWrap
          sx={{
            fontSize: { xs: '0.9375rem', lg: '1.125rem' },
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
            flex: 1,
            minHeight: { xs: 96, lg: 140 },
            overflow: 'hidden',
            borderRadius: '12px',
            bgcolor: 'success.light',
          }}
        >
          {property.photoUrl ? (
            <AuthPropertyPhoto
              key={property.id}
              src={property.photoUrl}
              alt={`Foto do imóvel ${property.name}`}
              className="size-full object-cover"
            />
          ) : (
            <PropertyImage
              key={property.id}
              seed={property.id}
              alt={`Foto do imóvel ${property.name}`}
              fit="cover"
            />
          )}

          <Box
            sx={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              boxShadow: 'inset 0 -48px 12px rgba(0,0,0,0.35)',
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
              width: 28,
              height: 28,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              bgcolor: 'secondary.main',
              color: 'text.primary',
              boxShadow: '0 1px 2px rgba(16,24,40,0.1)',
              textDecoration: 'none',
              zIndex: 1,
              '&:hover': { bgcolor: (theme) => listifyElevatedSurface(theme) },
            }}
          >
            <NorthEastIcon sx={{ fontSize: 14 }} />
          </Box>

          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              position: 'absolute',
              left: 8,
              bottom: 8,
              alignItems: 'center',
              borderRadius: '999px',
              border: '0.75px solid rgba(255,255,255,0.29)',
              bgcolor: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(6.6px)',
              px: 0.5,
              py: 0.5,
              zIndex: 1,
              maxWidth: 'calc(100% - 64px)',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                width: 18,
                height: 18,
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
                pr: 0.5,
                fontSize: '0.6875rem',
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
                bottom: 6,
                right: 6,
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
                sx={{ width: 22, height: 22, color: 'text.secondary' }}
              >
                <ChevronLeftIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <IconButton
                type="button"
                aria-label="Próximo imóvel"
                onClick={goNext}
                size="small"
                sx={{ width: 22, height: 22, color: 'text.secondary' }}
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
