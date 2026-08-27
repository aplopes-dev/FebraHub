"use client";

import Add from "@mui/icons-material/Add";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";

import { useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
type VariationOptionImageBoxProps = {
  previewUrl: string | null;
  onChange: (image: { previewUrl: string; file: File } | null) => void;
};

const BOX_SIZE = 72;

export function VariationOptionImageBox({
  previewUrl,
  onChange,
}: VariationOptionImageBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File | undefined) {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    onChange({ previewUrl: objectUrl, file });
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: BOX_SIZE,
        height: BOX_SIZE,
        flexShrink: 0,
        "&:hover .remove-overlay": previewUrl ? { opacity: 1 } : undefined,
        "&:hover .upload-overlay": previewUrl ? undefined : { opacity: 1 },
      }}
    >
      <Box
        component="input"
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
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
        onClick={() => {
          if (!previewUrl) inputRef.current?.click();
        }}
        aria-label={
          previewUrl ? "Imagem da opção" : "Adicionar imagem da opção"
        }
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          width: BOX_SIZE,
          height: BOX_SIZE,
          overflow: "hidden",
          borderRadius: 1,
          border: 1,
          borderStyle: previewUrl ? "solid" : "dashed",
          borderColor: "divider",
          bgcolor: previewUrl ? "transparent" : "action.hover",
          p: 0.5,
          cursor: previewUrl ? "default" : "pointer",
          transition: "border-color 0.2s, background-color 0.2s",
          "&:hover": previewUrl
            ? undefined
            : {
                borderColor: "primary.main",
                bgcolor: "action.selected",
              },
        }}
      >
        {previewUrl ? (
          // Preview local (blob:) — next/image não se aplica
          <Box
            component="img"
            src={previewUrl}
            alt=""
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        ) : (
          <>
            <CloudUploadOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontSize: "0.65rem",
                lineHeight: 1.1
              }}>
              Imagem
            </Typography>
            <Box
              className="upload-overlay"
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "action.selected",
                opacity: 0,
                transition: "opacity 0.2s",
              }}
            >
              <Add sx={{ fontSize: 18 }} />
            </Box>
          </>
        )}
      </Box>
      {previewUrl ? (
        <Box
          component="button"
          type="button"
          className="remove-overlay"
          aria-label="Remover imagem"
          onClick={() => onChange(null)}
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 1,
            border: 0,
            bgcolor: "rgba(0, 0, 0, 0.5)",
            opacity: 0,
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
        >
          <DeleteOutlined sx={{ fontSize: 16, color: "#fff" }} />
        </Box>
      ) : null}
    </Box>
  );
}
