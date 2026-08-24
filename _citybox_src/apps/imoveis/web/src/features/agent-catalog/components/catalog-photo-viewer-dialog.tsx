'use client';

import { useCallback, useEffect } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { alpha, type Theme } from '@mui/material/styles';
import { Box, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import {
  Modal,
  ModalContent,
  ModalDescription,
} from '@/components/ui/modal';

type CatalogPhotoViewerDialogProps = {
  open: boolean;
  photos: readonly string[];
  index: number;
  onIndexChange: (index: number) => void;
  onOpenChange: (open: boolean) => void;
  title?: string;
};

const navButtonSx = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 3,
  width: 44,
  height: 44,
  bgcolor: (theme: Theme) => alpha(theme.palette.common.black, 0.55),
  color: 'common.white',
  '&:hover': {
    bgcolor: (theme: Theme) => alpha(theme.palette.common.black, 0.75),
  },
  '&.Mui-disabled': {
    opacity: 0.25,
    color: 'common.white',
  },
} as const;

export function CatalogPhotoViewerDialog({
  open,
  photos,
  index,
  onIndexChange,
  onOpenChange,
  title = 'Fotos do imóvel',
}: CatalogPhotoViewerDialogProps) {
  const total = photos.length;
  const safeIndex = total === 0 ? 0 : Math.min(Math.max(0, index), total - 1);
  const hasMultiple = total > 1;
  const canGoPrev = hasMultiple && safeIndex > 0;
  const canGoNext = hasMultiple && safeIndex < total - 1;

  const goPrev = useCallback(() => {
    if (canGoPrev) onIndexChange(safeIndex - 1);
  }, [canGoPrev, onIndexChange, safeIndex]);

  const goNext = useCallback(() => {
    if (canGoNext) onIndexChange(safeIndex + 1);
  }, [canGoNext, onIndexChange, safeIndex]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, goPrev, goNext, onOpenChange]);

  const current = photos[safeIndex];

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="lg"
      fullWidth
      aria-labelledby="catalog-photo-viewer-title"
      slotProps={{
        paper: {
          sx: {
            maxHeight: '96vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            p: 0,
            gap: 0,
            borderRadius: { xs: '20px', sm: '28px' },
          },
        },
        backdrop: {
          sx: {
            bgcolor: 'rgba(13, 13, 18, 0.72)',
          },
        },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box sx={{ minWidth: 0, pr: 2 }}>
          <Typography
            component="h2"
            id="catalog-photo-viewer-title"
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>
          {total > 0 ? (
            <ModalDescription sx={{ mt: 0.25, mb: 0 }}>
              Foto {safeIndex + 1} de {total} · deslize para trocar · pinça ou botões para zoom
            </ModalDescription>
          ) : null}
        </Box>
        <IconButton
          type="button"
          aria-label="Fechar visualizador"
          onClick={() => onOpenChange(false)}
          sx={{ flexShrink: 0 }}
        >
          <CloseOutlinedIcon />
        </IconButton>
      </Stack>

      <ModalContent
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          bgcolor: 'common.black',
          p: 0,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            height: { xs: 'min(58vh, 520px)', sm: 'min(68vh, 640px)' },
            minHeight: 280,
          }}
        >
          {current ? (
            <ZoomableImage
              key={current}
              src={current}
              alt={`${title} — foto ${safeIndex + 1}`}
              resetKey={safeIndex}
              onSwipeLeft={hasMultiple ? goNext : undefined}
              onSwipeRight={hasMultiple ? goPrev : undefined}
            />
          ) : null}

          {hasMultiple ? (
            <>
              <IconButton
                type="button"
                aria-label="Foto anterior"
                onClick={goPrev}
                disabled={!canGoPrev}
                sx={{ ...navButtonSx, left: { xs: 8, sm: 16 } }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                type="button"
                aria-label="Próxima foto"
                onClick={goNext}
                disabled={!canGoNext}
                sx={{ ...navButtonSx, right: { xs: 8, sm: 16 } }}
              >
                <ChevronRightIcon />
              </IconButton>
            </>
          ) : null}
        </Box>

        {hasMultiple ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              px: 2,
              py: 1.5,
              overflowX: 'auto',
              bgcolor: 'grey.900',
              borderTop: '1px solid',
              borderColor: 'grey.800',
            }}
          >
            {photos.map((src, photoIndex) => (
              <button
                key={src}
                type="button"
                onClick={() => onIndexChange(photoIndex)}
                aria-label={`Ver foto ${photoIndex + 1}`}
                aria-pressed={photoIndex === safeIndex}
                className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-opacity motion-reduce:transition-none ${
                  photoIndex === safeIndex
                    ? 'border-primary opacity-100'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </Stack>
        ) : null}
      </ModalContent>
    </Modal>
  );
}
