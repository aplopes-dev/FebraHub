"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";

interface ProductPhotoUploadProps {
  existingPhotoUrl?: string | null;
  photoFile: File | null;
  photoRemoved: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  error?: boolean;
  disabled?: boolean;
}

export function ProductPhotoUpload({
  existingPhotoUrl,
  photoFile,
  photoRemoved,
  onSelectFile,
  onRemove,
  error,
  disabled,
}: ProductPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (photoFile) {
      const objectUrl = URL.createObjectURL(photoFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    if (photoRemoved) {
      setPreview(undefined);
      return;
    }

    setPreview(existingPhotoUrl ?? undefined);
    return;
  }, [photoFile, photoRemoved, existingPhotoUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onSelectFile(file);
  };

  return (
    <div className="relative aspect-square w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "relative flex size-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70",
          error ? "border-destructive" : "border-muted-foreground/25",
          preview && "border-solid border-muted",
        )}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Foto do produto"
            fill
            className="rounded-lg object-cover p-1"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-3 text-muted-foreground sm:gap-3 sm:p-4">
            <ImagePlus className="size-8 sm:size-10" />
            <span className="text-center text-xs sm:text-sm">
              Clique para adicionar foto
            </span>
          </div>
        )}
      </button>

      {preview && !disabled && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={onRemove}
          className="absolute -right-2 -top-2 size-7 rounded-full shadow-md"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
