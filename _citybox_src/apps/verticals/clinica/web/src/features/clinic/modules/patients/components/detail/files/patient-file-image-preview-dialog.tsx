'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, Pencil, Trash2, X } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@citybox/ui/atoms';
import { useCan } from '@/features/clinic/permissions';
import type { PatientFile } from '../../../types/patient-file';

type PatientFileImagePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: PatientFile[];
  activeImageId: string | null;
  onActiveImageChange: (imageId: string) => void;
  onDownload: (file: PatientFile) => void;
  onEdit: (file: PatientFile) => void;
  onDelete: (file: PatientFile) => void;
};

const TOOLBAR_BUTTON_CLASS =
  'inline-flex size-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40';

const NAV_BUTTON_CLASS =
  'absolute top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/90 transition-colors hover:bg-black/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40';

export function PatientFileImagePreviewDialog({
  open,
  onOpenChange,
  images,
  activeImageId,
  onActiveImageChange,
  onDownload,
  onEdit,
  onDelete,
}: PatientFileImagePreviewDialogProps) {
  const canUpdate = useCan('update', 'PatientFile');
  const canDelete = useCan('delete', 'PatientFile');

  const activeIndex = useMemo(
    () => images.findIndex((image) => image.id === activeImageId),
    [activeImageId, images],
  );

  const activeImage = activeIndex >= 0 ? images[activeIndex] : null;
  const hasMultipleImages = images.length > 1;
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < images.length - 1;

  const goToPrevious = useCallback(() => {
    if (!canGoPrevious) return;
    const previousImage = images[activeIndex - 1];
    if (previousImage) onActiveImageChange(previousImage.id);
  }, [activeIndex, canGoPrevious, images, onActiveImageChange]);

  const goToNext = useCallback(() => {
    if (!canGoNext) return;
    const nextImage = images[activeIndex + 1];
    if (nextImage) onActiveImageChange(nextImage.id);
  }, [activeIndex, canGoNext, images, onActiveImageChange]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, open]);

  if (!activeImage?.previewUrl) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 z-50 flex h-dvh w-dvw max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 rounded-none border-0 bg-black p-0 shadow-none ring-0 sm:max-w-none data-open:zoom-in-100"
      >
        <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between gap-4">
          <DialogTitle className="min-w-0 flex-1 truncate pr-4 text-left text-sm font-medium text-white">
            {activeImage.name}
          </DialogTitle>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className={TOOLBAR_BUTTON_CLASS}
              aria-label={`Baixar ${activeImage.name}`}
              onClick={() => onDownload(activeImage)}
            >
              <Download className="size-4" aria-hidden />
            </button>
            {canUpdate ? (
              <button
                type="button"
                className={TOOLBAR_BUTTON_CLASS}
                aria-label={`Editar ${activeImage.name}`}
                onClick={() => onEdit(activeImage)}
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                className={TOOLBAR_BUTTON_CLASS}
                aria-label={`Excluir ${activeImage.name}`}
                onClick={() => onDelete(activeImage)}
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            ) : null}
            <DialogClose className={TOOLBAR_BUTTON_CLASS} aria-label="Fechar preview">
              <X className="size-4" aria-hidden />
            </DialogClose>
          </div>
        </div>

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              className={`${NAV_BUTTON_CLASS} left-4 disabled:cursor-not-allowed disabled:opacity-30`}
              aria-label="Imagem anterior"
              disabled={!canGoPrevious}
              onClick={goToPrevious}
            >
              <ChevronLeft className="size-6" aria-hidden />
            </button>
            <button
              type="button"
              className={`${NAV_BUTTON_CLASS} right-4 disabled:cursor-not-allowed disabled:opacity-30`}
              aria-label="Próxima imagem"
              disabled={!canGoNext}
              onClick={goToNext}
            >
              <ChevronRight className="size-6" aria-hidden />
            </button>
          </>
        ) : null}

        <img
          src={activeImage.previewUrl}
          alt={activeImage.name}
          className="h-full w-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
