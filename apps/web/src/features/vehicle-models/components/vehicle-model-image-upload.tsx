"use client";

import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";

import { useRef } from "react";
import Box from "@mui/material/Box";
import { Button, Typography } from "@/ui";

type VehicleModelImageUploadProps = {
  previewUrl: string | null;
  onChange: (next: { previewUrl: string | null; file: File | null }) => void;
  disabled?: boolean;
};

export function VehicleModelImageUpload({
  previewUrl,
  onChange,
  disabled = false,
}: VehicleModelImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File | undefined) {
    if (!file || disabled) return;
    onChange({ previewUrl: URL.createObjectURL(file), file });
  }

  function handleRemove() {
    onChange({ previewUrl: null, file: null });
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
        Imagem do modelo
      </Typography>
      <Box
        component="input"
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={disabled}
        onChange={(event) => {
          handleFileSelect(event.target.files?.[0]);
          event.target.value = "";
        }}
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />
      <Box
        component="button"
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        sx={{
          position: "relative",
          display: "block",
          width: "100%",
          aspectRatio: "2 / 1",
          overflow: "hidden",
          borderRadius: 1,
          border: 1,
          borderStyle: previewUrl ? "solid" : "dashed",
          borderColor: "divider",
          bgcolor: "action.hover",
          p: 0,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "border-color 0.2s, background-color 0.2s, opacity 0.2s",
          "&:hover": disabled
            ? undefined
            : previewUrl
              ? { opacity: 0.95 }
              : {
                  borderColor: "primary.main",
                  bgcolor: "action.selected",
                },
        }}
      >
        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt="Pré-visualização da imagem do modelo"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
            }}
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              px: 2,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <CloudUploadOutlined sx={{ fontSize: 32 }} />
            <Typography variant="caption">
              Clique para enviar uma imagem
            </Typography>
            <Typography variant="caption" color="text.disabled">
              PNG, JPEG ou WebP
            </Typography>
          </Box>
        )}
      </Box>
      {previewUrl && !disabled ? (
        <Button
          type="button"
          variant="text"
          onClick={handleRemove}
          startIcon={<DeleteOutlined sx={{ fontSize: 16 }} />}
          sx={{ mt: 1 }}
        >
          Remover
        </Button>
      ) : null}
    </Box>
  );
}
