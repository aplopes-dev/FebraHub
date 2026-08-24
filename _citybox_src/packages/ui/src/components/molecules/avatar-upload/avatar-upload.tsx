"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../atoms/avatar";
import { cn } from "../../../lib/utils";

const SIZE_CLASSES = {
  sm: "h-12 w-12 rounded-lg text-xs",
  md: "h-16 w-16 rounded-xl text-sm",
  lg: "h-20 w-20 rounded-xl text-base",
  xl: "h-24 w-24 rounded-xl text-lg",
} as const;

export interface AvatarUploadProps {
  src?: string;
  fallback: string;
  onFileSelect?: (file: File) => void;
  size?: keyof typeof SIZE_CLASSES;
  disabled?: boolean;
  className?: string;
  alt?: string;
}

export function AvatarUpload({
  src,
  fallback,
  onFileSelect,
  size = "xl",
  disabled = false,
  className,
  alt = "Avatar",
}: AvatarUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | undefined>(src);

  React.useEffect(() => {
    setPreview(src);
  }, [src]);

  React.useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleClick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onFileSelect?.(file);
    event.target.value = "";
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label="Alterar imagem"
        className={cn(
          "group relative shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <Avatar className={cn(SIZE_CLASSES[size], "border border-border")}>
          {preview && <AvatarImage src={preview} alt={alt} />}
          <AvatarFallback className="bg-muted font-semibold text-muted-foreground">
            {fallback}
          </AvatarFallback>
        </Avatar>
        {!disabled && (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-foreground/0 transition-colors group-hover:bg-foreground/10">
            <Camera className="h-5 w-5 text-foreground opacity-0 transition-opacity group-hover:opacity-80" />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </>
  );
}
