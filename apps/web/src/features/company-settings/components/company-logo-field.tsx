"use client";

import { useRef } from "react";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@/ui";

const LOGO_HINT = "Formatos: JPG, JPEG, PNG e WebP. Tamanho máximo: 4 MB";

type CompanyLogoFieldProps = {
  previewUrl: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function CompanyLogoField({
  previewUrl,
  onSelect,
  onRemove,
  disabled = false,
}: CompanyLogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file || disabled) return;
    onSelect(file);
  }

  return (
    <Stack spacing={1} sx={{ width: "100%", maxWidth: 240 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Logotipo
        </Typography>
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 10,
            bgcolor: "info.light",
            color: "info.dark",
            fontSize: "0.6875rem",
            fontWeight: 600,
          }}
        >
          Recomendado
        </Box>
      </Stack>

      <input
        type="file"
        ref={inputRef}
        style={{ display: "none" }}
        accept="image/png,image/jpeg,image/webp"
        disabled={disabled}
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Escolher arquivo do logotipo"
        aria-disabled={disabled}
        onClick={() => {
          if (disabled) return;
          inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        sx={{
          minHeight: 168,
          p: 2,
          borderRadius: 1,
          border: "1px dashed",
          borderColor: "divider",
          bgcolor: "action.hover",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 1,
          overflow: "hidden",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color 120ms, background-color 120ms",
          "&:hover": disabled
            ? undefined
            : { borderColor: "primary.main", bgcolor: "action.selected" },
        }}
      >
        {previewUrl ? (
          // Preview local (blob:) ou proxy — next/image não se aplica
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Logotipo da empresa"
            style={{ maxWidth: "100%", maxHeight: 136, objectFit: "contain" }}
          />
        ) : (
          <>
            <ImageOutlined sx={{ fontSize: 28, color: "text.secondary" }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Escolher arquivo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {LOGO_HINT}
            </Typography>
          </>
        )}
      </Box>

      {previewUrl && !disabled ? (
        <Button
          type="button"
          variant="text"
          size="small"
          color="error"
          startIcon={<DeleteOutlined sx={{ fontSize: 16 }} />}
          onClick={onRemove}
          sx={{ alignSelf: "flex-start" }}
        >
          Remover logotipo
        </Button>
      ) : null}
    </Stack>
  );
}
