"use client";

import { useRef, useState } from "react";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, toast } from "@citybox/mui";

const LOGO_HINT =
  "Formatos: JPG, JPEG, PNG e HEIC, resolução mínima: 900x900px, tamanho máximo: 5MB";

type CompanyLogoFieldProps = {
  logoUrl: string | null;
  onChange: (logoUrl: string | null) => void;
  /** Sem API de logo — campo fica bloqueado com aviso "Em breve". */
  disabled?: boolean;
};

/** Upload do logotipo da empresa (progresso simulado enquanto não há API). */
export function CompanyLogoField({
  logoUrl,
  onChange,
  disabled = false,
}: CompanyLogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) return prev + 25;

        clearInterval(interval);
        onChange(URL.createObjectURL(file));
        setUploading(false);
        toast.success("Logotipo atualizado", {
          description: `O arquivo ${file.name} foi carregado (mock).`,
        });
        return 100;
      });
    }, 180);

    event.target.value = "";
  }

  return (
    <Stack spacing={1}>
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
        accept="image/png,image/jpeg,image/heic"
        onChange={handleUpload}
      />

      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Escolher arquivo do logotipo"
        aria-disabled={disabled}
        onClick={() => {
          if (disabled || uploading) return;
          inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (disabled || uploading) return;
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
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
          cursor: disabled ? "not-allowed" : uploading ? "progress" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color 120ms, background-color 120ms",
          "&:hover": disabled
            ? undefined
            : { borderColor: "primary.main", bgcolor: "action.selected" },
        }}
      >
        {uploading ? (
          <>
            <CircularProgress size={24} variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary">
              Carregando logotipo ({progress}%)
            </Typography>
          </>
        ) : logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logotipo da empresa"
            style={{ maxWidth: "100%", maxHeight: 136, objectFit: "contain" }}
          />
        ) : (
          <>
            <ImageOutlined sx={{ fontSize: 28, color: "text.secondary" }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {disabled ? "Em breve" : "Escolher arquivo"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {disabled
                ? "Upload de logotipo ainda não está disponível."
                : LOGO_HINT}
            </Typography>
          </>
        )}
      </Box>

      {logoUrl && !uploading && !disabled ? (
        <Button
          type="button"
          variant="text"
          size="small"
          color="error"
          startIcon={<DeleteOutlined sx={{ fontSize: 16 }} />}
          onClick={() => onChange(null)}
          sx={{ alignSelf: "flex-start" }}
        >
          Remover logotipo
        </Button>
      ) : null}
    </Stack>
  );
}
