'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button } from '@citybox/ui/atoms';
import { validateClinicLogoFile } from '../lib/validate-clinic-logo-file';

const ACCEPTED_LOGO_EXTENSIONS = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

type ClinicLogoUploadProps = {
  previewUrl?: string;
  disabled?: boolean;
  className?: string;
  onFileChange: (file: File | null) => void;
  onRemoveExisting?: () => void;
};

export function ClinicLogoUpload({
  previewUrl,
  disabled = false,
  className,
  onFileChange,
  onRemoveExisting,
}: ClinicLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const displayPreview = localPreview ?? previewUrl;

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const handleFileSelect = (file: File | undefined) => {
    if (!file || disabled) return;

    const validationError = validateClinicLogoFile(file);
    if (validationError) {
      setError(validationError);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }

    setError(undefined);

    if (localPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    onFileChange(file);
  };

  const handleRemove = () => {
    if (localPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(undefined);
    setError(undefined);
    onFileChange(null);
    onRemoveExisting?.();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_LOGO_EXTENSIONS}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleFileSelect(event.target.files?.[0])}
      />

      <div className="relative flex h-full min-h-[6.5rem] w-full flex-1">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Escolher logo da clínica"
          aria-disabled={disabled}
          onClick={() => {
            if (disabled) return;
            inputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            'group flex size-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/60 bg-muted/30 transition-colors',
            !disabled && 'cursor-pointer hover:border-primary/40 hover:bg-muted/50',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {displayPreview ? (
            <img
              src={displayPreview}
              alt="Pré-visualização da logo da clínica"
              className="absolute inset-0 size-full object-contain object-center p-1"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 px-3 text-center text-muted-foreground">
              <ImagePlus className="size-6" aria-hidden />
              <span className="text-[11px] leading-tight">JPG, PNG ou WebP · máx. 4 MB</span>
            </div>
          )}
        </div>

        {displayPreview && !disabled ? (
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-2 right-2 z-10 size-7 shadow-sm"
            onClick={handleRemove}
            aria-label="Remover logo"
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
