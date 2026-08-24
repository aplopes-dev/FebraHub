'use client';

import { useCallback, useEffect, useRef } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { alpha, type Theme } from '@mui/material/styles';
import { Box, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import { resolveAuthBlobUrl } from '@/lib/auth-blob-cache';
import { useAuthBlobUrl } from '@/features/settings/hooks/use-auth-blob-url';

export type PropertyPhotoViewerSource = {
  src?: string | null;
  alt?: string;
};

type PropertyPhotoViewerDialogProps = {
  open: boolean;
  photos: readonly PropertyPhotoViewerSource[];
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
  bgcolor: (theme: Theme) => alpha(theme.palette.common.black, 0.45),
  color: 'common.white',
  '&:hover': {
    bgcolor: (theme: Theme) => alpha(theme.palette.common.black, 0.65),
  },
  '&.Mui-disabled': {
    opacity: 0.25,
    color: 'common.white',
  },
} as const;

function ResolvedZoomablePhoto({
  src,
  alt,
  resetKey,
  onSwipeLeft,
  onSwipeRight,
}: {
  src: string;
  alt: string;
  resetKey: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const url = useAuthBlobUrl(src);
  /** Mantém a última URL pronta — evita flash "Carregando" entre trocas. */
  const lastReadyRef = useRef<string | undefined>(undefined);
  if (url) lastReadyRef.current = url;
  const displayUrl = url ?? lastReadyRef.current;

  if (!displayUrl) {
    return (
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'common.white',
          fontSize: '0.875rem',
        }}
      >
        Carregando foto…
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <ZoomableImage
        src={displayUrl}
        alt={alt}
        resetKey={url ? resetKey : undefined}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
      />
      {!url ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </Box>
  );
}

export function PropertyPhotoViewerDialog({
  open,
  photos,
  index,
  onIndexChange,
  onOpenChange,
  title = 'Fotos do imóvel',
}: PropertyPhotoViewerDialogProps) {
  const total = photos.length;
  const safeIndex =
    total === 0 ? 0 : Math.min(Math.max(0, index), total - 1);
  const current = photos[safeIndex];
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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, goPrev, goNext]);

  /** Prefetch vizinhos — troca de foto não espera o download começar. */
  useEffect(() => {
    if (!open || total === 0) return;
    const neighbors = [safeIndex - 1, safeIndex + 1]
      .filter((i) => i >= 0 && i < total)
      .map((i) => photos[i]?.src)
      .filter((s): s is string => typeof s === 'string' && s.startsWith('/v1/'));

    for (const path of neighbors) {
      void resolveAuthBlobUrl(path).catch(() => {
        // best-effort
      });
    }
  }, [open, photos, safeIndex, total]);

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <ModalTitle sx={{ pr: 6 }}>
        <Typography component="span" sx={{ fontWeight: 600, display: 'block' }}>
          {title}
        </Typography>
        {total > 0 ? (
          <ModalDescription sx={{ mt: 0.5, mb: 0 }}>
            Foto {safeIndex + 1} de {total}
            {hasMultiple ? ' · deslize para trocar' : ''}
          </ModalDescription>
        ) : null}
      </ModalTitle>

      <ModalContent
        sx={{
          p: 0,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          bgcolor: 'common.black',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: { xs: 280, sm: 420 },
            height: 'min(72vh, 720px)',
            width: '100%',
            px: 0,
            py: 0,
            touchAction: 'none',
          }}
        >
          {current?.src ? (
            <ResolvedZoomablePhoto
              src={current.src}
              alt={current.alt ?? `Foto ${safeIndex + 1}`}
              resetKey={safeIndex}
              onSwipeLeft={hasMultiple ? goNext : undefined}
              onSwipeRight={hasMultiple ? goPrev : undefined}
            />
          ) : (
            <Typography color="common.white" sx={{ fontSize: '0.875rem' }}>
              Foto indisponível
            </Typography>
          )}

          {hasMultiple ? (
            <>
              <IconButton
                type="button"
                aria-label="Foto anterior"
                onClick={goPrev}
                disabled={!canGoPrev}
                sx={{ ...navButtonSx, left: { xs: 8, sm: 12 } }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                type="button"
                aria-label="Próxima foto"
                onClick={goNext}
                disabled={!canGoNext}
                sx={{ ...navButtonSx, right: { xs: 8, sm: 12 } }}
              >
                <ChevronRightIcon />
              </IconButton>
            </>
          ) : null}
        </Box>
      </ModalContent>

      <ModalActions sx={{ pt: 0 }}>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <ModalCancelButton type="button" onClick={() => onOpenChange(false)}>
            Fechar
          </ModalCancelButton>
        </Stack>
      </ModalActions>
    </Modal>
  );
}

export function photosFromUrls(
  urls: readonly string[],
  name?: string,
): PropertyPhotoViewerSource[] {
  return urls.map((src, index) => ({
    src,
    alt: name ? `${name} — foto ${index + 1}` : `Foto ${index + 1}`,
  }));
}
