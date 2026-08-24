"use client";

import { useRef, useState } from "react";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import Close from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const ACCEPTED_EXTENSIONS = [".pfx", ".p12"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

type CertificateDropzoneProps = {
  file: File | null;
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  onClear: () => void;
  onValidationError: (message: string) => void;
};

/** Valida extensão (.pfx/.p12), arquivo vazio e tamanho ≤10MB no cliente (FR-011/FR-012). */
function validateFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!hasValidExt) {
    return "Arquivo inválido: envie um certificado no formato .pfx ou .p12.";
  }
  if (file.size === 0) {
    return "O arquivo selecionado está vazio.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Arquivo muito grande: o certificado deve ter até 10 MB.";
  }
  return null;
}

/** Seletor de certificado com drag-and-drop e clique. */
export function CertificateDropzone({
  file,
  disabled = false,
  onFileSelected,
  onClear,
  onValidationError,
}: CertificateDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const picked = files?.[0];
    if (!picked) return;
    const error = validateFile(picked);
    if (error) {
      onValidationError(error);
      return;
    }
    onFileSelected(picked);
  }

  if (file) {
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: "action.hover",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ minWidth: 0, alignItems: "center" }}
          >
            <DescriptionOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {file.name}
            </Typography>
          </Stack>
          <IconButton
            size="small"
            color="error"
            aria-label="Remover arquivo"
            disabled={disabled}
            onClick={onClear}
          >
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Selecionar arquivo do certificado"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        handleFiles(event.dataTransfer.files);
      }}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px dashed",
        borderColor: dragging ? "primary.main" : "divider",
        bgcolor: dragging ? "action.hover" : "transparent",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "border-color 120ms, background-color 120ms",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        type="file"
        ref={inputRef}
        style={{ display: "none" }}
        accept=".pfx,.p12"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <Stack spacing={1} sx={{ alignItems: "center" }}>
        <CloudUploadOutlined sx={{ fontSize: 32, color: "text.secondary" }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Arraste o certificado aqui ou clique para selecionar
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Arquivo .pfx ou .p12, até 10 MB
        </Typography>
      </Stack>
    </Box>
  );
}
