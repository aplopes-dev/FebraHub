'use client';

import { useMemo, useRef, useState } from 'react';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';
import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { PropertyImage } from '@/components/ui/property-image';
import {
  CATALOG_PHOTO_TILE_GAP_PX,
  CATALOG_PHOTO_TILE_SIZE_PX,
  getPublicCatalogGalleryDisplay,
} from '@/features/shared/utils/catalog-gallery-display';
import {
  photoActionIconCircleSx,
  photoActionTileBaseSx,
  photoGalleryGridSx,
  photoOpenButtonSx,
  photoTileSx,
} from '@/features/shared/utils/photo-gallery-styles';
import { useCatalogGalleryColumns } from '@/features/agent-catalog/hooks/use-catalog-gallery-columns';
import { CatalogPhotoViewerDialog } from './catalog-photo-viewer-dialog';

type CatalogListingGalleryProps = {
  listingId: string;
  title: string;
  /**
   * URLs exibidas na grade “Fotos do imóvel”.
   * No detalhe público, costuma ser tudo menos a 1ª (que fica na prévia).
   */
  photoUrls?: readonly string[];
  /**
   * Lista completa do visualizador (setas). Default = `photoUrls`.
   * Use a galeria integral quando a grade omite a 1ª foto.
   */
  viewerPhotos?: readonly string[];
  /**
   * Índice na lista `viewerPhotos` da 1ª foto da grade
   * (ex.: `1` quando a prévia usa a foto 0).
   */
  viewerIndexOffset?: number;
};

/** Tile full-width só quando a grade tem 1 coluna (phone); multi-col = 156px. */
const singleColumnTileOverride = {
  width: '100%',
  maxWidth: '100%',
  height: 'auto',
  aspectRatio: '1 / 1',
} as const;

function publicTileSx(isSingleColumn: boolean): SxProps<Theme> {
  return isSingleColumn
    ? ([photoTileSx, singleColumnTileOverride] as SxProps<Theme>)
    : photoTileSx;
}

function publicActionTileSx(isSingleColumn: boolean): SxProps<Theme> {
  if (!isSingleColumn) {
    return [photoActionTileBaseSx, { cursor: 'pointer' }] as SxProps<Theme>;
  }
  return [
    photoActionTileBaseSx,
    {
      ...singleColumnTileOverride,
      minHeight: CATALOG_PHOTO_TILE_SIZE_PX,
      cursor: 'pointer',
    },
  ] as SxProps<Theme>;
}

function publicGridSx(isSingleColumn: boolean, showMoreBeside: boolean): SxProps<Theme> {
  if (!isSingleColumn) return photoGalleryGridSx;
  return {
    display: 'grid',
    gap: `${CATALOG_PHOTO_TILE_GAP_PX}px`,
    alignItems: 'start',
    gridTemplateColumns: showMoreBeside ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
  };
}

export function CatalogListingGallery({
  listingId,
  title,
  photoUrls,
  viewerPhotos,
  viewerIndexOffset = 0,
}: CatalogListingGalleryProps) {
  const photos = useMemo(
    () => (photoUrls?.length ? [...photoUrls] : []),
    [photoUrls],
  );

  const lightboxPhotos = useMemo(() => {
    if (viewerPhotos?.length) return [...viewerPhotos];
    return photos;
  }, [viewerPhotos, photos]);

  const galleryRef = useRef<HTMLDivElement>(null);
  const columnsPerRow = useCatalogGalleryColumns(galleryRef);
  const isSingleColumn = columnsPerRow <= 1;
  const display = useMemo(
    () => getPublicCatalogGalleryDisplay(photos, columnsPerRow),
    [photos, columnsPerRow],
  );

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  function openViewer(indexInGrid: number) {
    const nextIndex = Math.min(
      Math.max(0, indexInGrid + viewerIndexOffset),
      Math.max(0, lightboxPhotos.length - 1),
    );
    setActiveIndex(nextIndex);
    setViewerOpen(true);
  }

  const tileSx = publicTileSx(isSingleColumn);
  const actionSx = publicActionTileSx(isSingleColumn);
  /** Com 1 foto visível + “Mais fotos”, lado a lado no phone. */
  const showMoreBeside =
    isSingleColumn && display.showMoreTile && display.visiblePhotos.length === 1;

  if (photos.length === 0) {
    return (
      <Panel
        sx={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          gap: { xs: 2, md: 2.75 },
          p: { xs: 2, md: 3 },
          borderRadius: { xs: '16px', md: '20px' },
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
          Fotos do imóvel
        </Typography>
        <Box sx={publicTileSx(true)}>
          <PropertyImage seed={listingId} alt={`Foto de ${title}`} />
        </Box>
      </Panel>
    );
  }

  return (
    <Panel
      sx={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        gap: { xs: 2, md: 2.75 },
        p: { xs: 2, md: 3 },
        borderRadius: { xs: '16px', md: '20px' },
        bgcolor: 'background.paper',
      }}
      aria-label="Galeria de fotos do imóvel"
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
        Fotos do imóvel
      </Typography>

      <Box ref={galleryRef} sx={publicGridSx(isSingleColumn, showMoreBeside)}>
        {display.visiblePhotos.map((src, index) => (
          <Box key={src} sx={tileSx}>
            <Box
              component="button"
              type="button"
              aria-label={`Ver foto ${index + 1}`}
              onClick={() => openViewer(index)}
              sx={photoOpenButtonSx}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Foto ${index + 1} de ${title}`} />
            </Box>
          </Box>
        ))}

        {display.showMoreTile ? (
          <Box
            component="button"
            type="button"
            aria-label={`Ver mais ${display.hiddenCount} fotos`}
            onClick={() => openViewer(display.moreOpensAtIndex)}
            sx={actionSx}
          >
            <Box sx={photoActionIconCircleSx}>
              <CollectionsOutlinedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 500,
                textAlign: 'center',
                lineHeight: 1.3,
                color: 'text.primary',
              }}
            >
              Mais fotos
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                minHeight: '1.25rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.25,
                textAlign: 'center',
              }}
            >
              +{display.hiddenCount}
            </Typography>
          </Box>
        ) : null}
      </Box>

      {lightboxPhotos.length > 0 ? (
        <CatalogPhotoViewerDialog
          open={viewerOpen}
          photos={lightboxPhotos}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onOpenChange={setViewerOpen}
          title={title}
        />
      ) : null}
    </Panel>
  );
}
