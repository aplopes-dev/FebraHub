'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';
import { getPatientInitials } from '../lib/patient-utils';
import type { ClinicPatient } from '../types/clinic-patient';

const ACCEPTED_PHOTO_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ACCEPTED_PHOTO_EXTENSIONS = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

type PatientPhotoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: ClinicPatient;
  photoUrl?: string | null;
  isUploading?: boolean;
  isRemoving?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
};

function validatePhotoFile(file: File): string | null {
  const isAccepted =
    ACCEPTED_PHOTO_TYPES.has(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isAccepted) {
    return 'Envie apenas arquivos JPG, PNG ou WebP.';
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return 'A imagem deve ter no máximo 4 MB.';
  }

  return null;
}

export function PatientPhotoDialog({
  open,
  onOpenChange,
  patient,
  photoUrl,
  isUploading = false,
  isRemoving = false,
  onUpload,
  onRemove,
}: PatientPhotoDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBusy = isUploading || isRemoving;
  const displayPreview = localPreview ?? photoUrl ?? null;
  const hasExistingPhoto = Boolean(photoUrl);

  const resetLocalState = useCallback(() => {
    setError(null);
    if (localPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [localPreview]);

  useEffect(() => {
    if (!open) {
      resetLocalState();
    }
  }, [open, resetLocalState]);

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const openFilePicker = useCallback(() => {
    if (!isBusy) {
      inputRef.current?.click();
    }
  }, [isBusy]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validatePhotoFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);

      if (localPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
      setLocalPreview(URL.createObjectURL(file));

      try {
        await onUpload(file);
        onOpenChange(false);
      } catch {
        // feedback handled by parent
      } finally {
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    },
    [localPreview, onOpenChange, onUpload],
  );

  const handleRemove = async () => {
    try {
      await onRemove();
      resetLocalState();
    } catch {
      // feedback handled by parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Foto do {patient.name}</DialogTitle>
        </DialogHeader>

        <div className="flex w-full flex-col items-center gap-3">
          <div className="relative inline-flex">
            <button
              type="button"
              disabled={isBusy}
              onClick={openFilePicker}
              className={cn(
                'group relative flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted/30 transition-colors',
                !isBusy && 'cursor-pointer hover:border-primary/40 hover:bg-muted/50',
                isBusy && 'cursor-not-allowed opacity-60',
              )}
              aria-label="Clique para adicionar foto"
            >
              {isUploading ? (
                <Loader2 className="size-10 animate-spin text-muted-foreground" aria-hidden />
              ) : displayPreview ? (
                <>
                  <Avatar className="size-full rounded-full">
                    <AvatarImage src={displayPreview} alt={patient.name} className="object-cover" />
                    <AvatarFallback className="text-3xl font-medium">
                      {getPatientInitials(patient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="size-8 text-white" aria-hidden />
                  </span>
                </>
              ) : (
                <Camera className="size-10 text-muted-foreground" aria-hidden />
              )}
            </button>

            {hasExistingPhoto ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void handleRemove()}
                className={cn(
                  'absolute right-0 top-1 flex size-8 translate-x-1/3 items-center justify-center rounded-full border border-border bg-background text-destructive shadow-sm transition-colors',
                  !isBusy && 'hover:bg-destructive/10',
                  isBusy && 'cursor-not-allowed opacity-60',
                )}
                aria-label="Remover foto"
              >
                {isRemoving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="size-4" aria-hidden />
                )}
              </button>
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground">
            {isUploading ? 'Enviando foto…' : 'Clique para adicionar foto'}
          </p>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_PHOTO_EXTENSIONS}
            className="sr-only"
            disabled={isBusy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFileSelect(file);
            }}
          />

          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={openFilePicker}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Enviando…
              </>
            ) : (
              <>
                <Camera className="mr-2 size-4" aria-hidden />
                {hasExistingPhoto ? 'Trocar foto' : 'Adicionar foto'}
              </>
            )}
          </Button>

          {error ? (
            <p className="text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
