'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { PropertyImage } from '@/components/ui/property-image';
import { getAgentCatalogPath } from '@/features/shared/data/navigation';
import type { CatalogListing } from '../types';
import { CatalogListingShareButton } from './catalog-listing-share-button';
import { CatalogPhotoViewerDialog } from './catalog-photo-viewer-dialog';

/** Miniaturas visíveis na faixa flutuante sobre o hero. */
const THUMB_VISIBLE = 5;
const THUMB_SIZE = { xs: 56, sm: 64 };

type PropertyDetailHeaderProps = {
  listing: CatalogListing;
  agentSlug: string;
  photos: readonly string[];
};

/**
 * Hero full-bleed (cantos retos, colado nas laterais) + faixa de miniaturas
 * com fundo glassmorphism sobreposta na base da foto.
 */
export function PropertyDetailHeader({
  listing,
  agentSlug,
  photos,
}: PropertyDetailHeaderProps) {
  const thumbGroupId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const hasPhotos = photos.length > 0;
  const activePhoto = hasPhotos ? photos[Math.min(activeIndex, photos.length - 1)] : undefined;
  const showThumbs = photos.length > 1;
  const thumbs = photos.slice(0, THUMB_VISIBLE);
  const overflow = Math.max(0, photos.length - THUMB_VISIBLE);

  function openViewer(index: number) {
    if (!hasPhotos) return;
    setActiveIndex(index);
    setViewerOpen(true);
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minWidth: 0,
        // No mobile: cancela o padding do `<main>` (px-4 / py-5) para colar nas
        // laterais. Valores em px porque `theme.spacing(1)` aqui é 4px.
        mx: { xs: '-16px', md: 0 },
        mt: { xs: '-20px', md: 0 },
        width: { xs: 'calc(100% + 32px)', md: '100%' },
        // Reserva o espaço da faixa de miniaturas, que avança metade da própria
        // altura para fora do hero, para não cobrir o título.
        mb: showThumbs ? { xs: '32px', sm: '36px' } : 0,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: { xs: '4 / 3', md: '16 / 10' },
          borderRadius: 0,
          overflow: 'hidden',
          bgcolor: 'secondary.main',
        }}
      >
        {activePhoto ? (
          <Box
            component="button"
            type="button"
            onClick={() => openViewer(activeIndex)}
            aria-label="Ver fotos em tamanho grande"
            sx={{
              display: 'block',
              width: '100%',
              height: '100%',
              border: 0,
              p: 0,
              cursor: 'zoom-in',
              bgcolor: 'transparent',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto}
              alt={`Foto ${activeIndex + 1} de ${listing.title}`}
              className="size-full object-cover"
            />
          </Box>
        ) : (
          <PropertyImage seed={listing.id} alt={`Ilustração de ${listing.title}`} />
        )}

        <Stack
          direction="row"
          sx={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            justifyContent: 'space-between',
            gap: 1,
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' },
          }}
        >
          <Link
            href={getAgentCatalogPath(agentSlug)}
            aria-label="Voltar para o catálogo"
            className="inline-flex size-11 items-center justify-center rounded-full text-white"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.42)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ArrowBackOutlinedIcon sx={{ fontSize: 20 }} aria-hidden />
          </Link>

          <CatalogListingShareButton
            agentSlug={agentSlug}
            listingId={listing.id}
            listingTitle={listing.title}
            onMedia
          />
        </Stack>
      </Box>

      {showThumbs ? (
        <Box
          role="group"
          aria-labelledby={thumbGroupId}
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: 0,
            transform: 'translate(-50%, 50%)',
            zIndex: 2,
            width: 'max-content',
            maxWidth: 'calc(100% - 32px)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            px: '8px',
            py: '8px',
            borderRadius: '20px',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(15, 23, 42, 0.28)'
                : 'rgba(255, 255, 255, 0.35)',
            border: '1px solid',
            borderColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(255, 255, 255, 0.45)',
            boxShadow: '0 8px 28px rgba(16, 24, 40, 0.12)',
            backdropFilter: 'blur(18px) saturate(1.35)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.35)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            '@media (prefers-reduced-motion: reduce)': {
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              bgcolor: 'background.paper',
              borderColor: 'divider',
            },
          }}
        >
          <Typography id={thumbGroupId} component="span" className="sr-only">
            Miniaturas das fotos
          </Typography>
          {thumbs.map((url, index) => {
            const isActive = index === activeIndex;
            const isOverflowThumb = index === THUMB_VISIBLE - 1 && overflow > 0;
            return (
              <Box
                key={`${url}-${index}`}
                component="button"
                type="button"
                aria-label={
                  isOverflowThumb
                    ? `Mais ${overflow} fotos`
                    : `Mostrar foto ${index + 1}`
                }
                aria-pressed={isActive}
                onClick={() => {
                  setActiveIndex(index);
                  if (isOverflowThumb) openViewer(index);
                }}
                sx={{
                  position: 'relative',
                  flexShrink: 0,
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: isActive ? 'primary.main' : 'transparent',
                  p: 0,
                  cursor: 'pointer',
                  bgcolor: 'secondary.main',
                  outlineOffset: 2,
                  transition: 'border-color 0.15s ease',
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                  },
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                  },
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                {isOverflowThumb ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'rgba(15, 23, 42, 0.55)',
                      color: 'common.white',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                    }}
                  >
                    {overflow}+
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
      ) : null}

      {hasPhotos ? (
        <CatalogPhotoViewerDialog
          open={viewerOpen}
          photos={photos}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onOpenChange={setViewerOpen}
          title={listing.title}
        />
      ) : null}
    </Box>
  );
}
