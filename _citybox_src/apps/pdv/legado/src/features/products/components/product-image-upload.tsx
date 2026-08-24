'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2Icon, UploadIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@citybox/ui';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png']);
const MAX_BYTES = 2 * 1024 * 1024;

type UploadedImageMeta = {
  previewUrl: string;
  fileName: string;
  fileSizeBytes: number;
};

type ProductImageUploadProps = {
  imageUrl: string | null;
  onChange: (imageUrl: string | null) => void;
  onReject: (message: string) => void;
  error?: boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ProductImageUpload({
  imageUrl,
  onChange,
  onReject,
  error = false,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState<UploadedImageMeta | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setMeta((current) => {
        if (current?.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(current.previewUrl);
        }
        return null;
      });
    }
  }, [imageUrl]);

  const handleFile = (file: File) => {
    if (!ACCEPTED_TYPES.has(file.type)) {
      onReject('Use apenas imagens JPG ou PNG.');
      return;
    }
    if (file.size > MAX_BYTES) {
      onReject('A imagem deve ter no máximo 2 MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setMeta((current) => {
      if (current?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return {
        previewUrl: objectUrl,
        fileName: file.name,
        fileSizeBytes: file.size,
      };
    });
    onChange(objectUrl);
  };

  const handleRemove = () => {
    setMeta((current) => {
      if (current?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return null;
    });
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-[#171717]">
        Imagem do produto <span className="text-[#ef4444]">*</span>
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {meta ? (
        <div
          className={cn(
            'flex w-full items-center gap-3 rounded-[var(--pdv-control-radius)] border border-[#e5e5e5] bg-white p-3',
            error && 'border-[#ef4444]',
          )}
        >
          <div className="relative size-20 shrink-0 overflow-hidden rounded-[var(--pdv-control-radius)] bg-[#f5f5f5]">
            <Image
              src={meta.previewUrl}
              alt={meta.fileName}
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#171717]" title={meta.fileName}>
              {meta.fileName}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[#a3a3a3]">
              {formatFileSize(meta.fileSizeBytes)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="flex size-9 shrink-0 items-center justify-center rounded-[var(--pdv-control-radius)] text-[#737373] transition-colors hover:bg-[#f5f5f5] hover:text-[#ef4444] cursor-pointer"
            aria-label="Remover imagem"
          >
            <Trash2Icon className="size-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-[var(--pdv-control-radius)] border-2 border-dashed bg-white px-4 py-8 transition-colors hover:border-primary/40 hover:bg-primary/[0.02] cursor-pointer',
            error ? 'border-[#ef4444]' : 'border-[#d4d4d4]',
          )}
        >
          <UploadIcon className="size-6 text-[#a3a3a3]" strokeWidth={1.75} />
          <p className="text-sm font-medium text-[#525252]">
            Clique para enviar{' '}
            <span className="font-normal text-[#a3a3a3]">JPG, PNG (máx. 2 MB)</span>
          </p>
        </button>
      )}
    </div>
  );
}
