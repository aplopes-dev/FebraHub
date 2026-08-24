"use client";

import AddOutlined from "@mui/icons-material/AddOutlined";
import VerifiedUserOutlined from "@mui/icons-material/VerifiedUserOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@citybox/mui";

type CertificateEmptyStateProps = {
  onInsert: () => void;
};

/** Estado vazio: nenhum certificado enviado ainda (FR-004). */
export function CertificateEmptyState({ onInsert }: CertificateEmptyStateProps) {
  return (
    <Box
      sx={{
        p: 4,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
        textAlign: "center",
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <VerifiedUserOutlined sx={{ fontSize: 40, color: "text.secondary" }} />
        <Stack spacing={0.5} sx={{ alignItems: "center" }}>
          <Typography variant="h6" component="h2">
            Nenhum certificado digital
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440 }}>
            Envie o certificado digital A1 (.pfx/.p12) da empresa para habilitar a
            emissão de notas fiscais.
          </Typography>
        </Stack>
        <Button
          startIcon={<AddOutlined sx={{ fontSize: 18 }} />}
          onClick={onInsert}
        >
          Inserir certificado
        </Button>
      </Stack>
    </Box>
  );
}
