"use client";

import AutorenewOutlined from "@mui/icons-material/AutorenewOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@citybox/mui";
import { SemanticBadge } from "@/components/ui/status";
import { formatCnpj } from "@/lib/br-format";
import { CertificateStatusBadge } from "./certificate-status-badge";
import type { CertificateView } from "../types/certificate";

type CurrentCertificateCardProps = {
  certificate: CertificateView;
  onReplace: () => void;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("pt-BR");
}

function LabeledValue({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}

/** Card do certificado vigente (FR-015/FR-016). */
export function CurrentCertificateCard({
  certificate,
  onReplace,
}: CurrentCertificateCardProps) {
  const days = certificate.daysUntilExpiration;

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: certificate.isExpired
          ? "error.main"
          : certificate.expiresSoon
            ? "warning.main"
            : "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
              Certificado vigente
            </Typography>
            <CertificateStatusBadge status={certificate.status} />
            {certificate.isExpired ? (
              <SemanticBadge label="Vencido" tone="error" />
            ) : certificate.expiresSoon ? (
              <SemanticBadge label="Vence em breve" tone="warning" />
            ) : null}
          </Stack>
          <Button
            variant="outlined"
            startIcon={<AutorenewOutlined sx={{ fontSize: 18 }} />}
            onClick={onReplace}
          >
            Enviar novo certificado
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
          }}
        >
          <LabeledValue
            label="CNPJ do titular"
            value={formatCnpj(certificate.subjectCnpj)}
          />
          <LabeledValue
            label="Válido de"
            value={formatDate(certificate.validFrom)}
          />
          <LabeledValue
            label="Válido até"
            value={formatDate(certificate.validUntil)}
          />
          <LabeledValue
            label="Dias restantes"
            value={days === null ? "—" : String(days)}
          />
        </Box>

        {certificate.name ? (
          <Typography variant="caption" color="text.secondary">
            {certificate.name}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
