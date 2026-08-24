"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { Paper, Typography } from "@citybox/mui";
import {
  formatCurrencyBRL,
  formatDateTimeOrOpen,
} from "@/features/pos-cash-sessions/lib/pos-cash-session-format";
import type { PosCashClosingReport } from "@/features/pos-cash-sessions/types/pos-cash-session";

type PosCashClosingReportViewProps = {
  report: PosCashClosingReport;
};

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 2,
        py: 0.75,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: emphasize ? 700 : 500,
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export function PosCashClosingReportView({
  report,
}: PosCashClosingReportViewProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        maxWidth: 480,
        mx: "auto",
        borderStyle: "dashed",
      }}
    >
      <Stack spacing={0.5} sx={{ mb: 2, textAlign: "center" }}>
        <Typography variant="overline" color="text.secondary">
          Relatório gerencial
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Valores de fechamento
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Comprovante da sessão de caixa
        </Typography>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      <Row label="PDV" value={report.posRegisterName} />
      <Row label="Caixa" value={report.cashBoxLabel} />
      <Row label="Abertura" value={formatDateTimeOrOpen(report.openedAt)} />
      <Row
        label="Fechamento"
        value={formatDateTimeOrOpen(report.closedAt)}
      />

      <Divider sx={{ my: 1.5 }} />

      <Row
        label="Valor de abertura"
        value={formatCurrencyBRL(report.openingBalanceCents)}
      />
      <Row
        label="Valor ao fechar"
        value={
          report.closingBalanceCents != null
            ? formatCurrencyBRL(report.closingBalanceCents)
            : "—"
        }
        emphasize
      />
      <Row
        label="Vendas / canceladas"
        value={`${report.salesCount} / ${report.canceledSalesCount}`}
      />
      <Row
        label="Valores informados"
        value={formatCurrencyBRL(report.informedTotalCents)}
        emphasize
      />

      <Divider sx={{ my: 1.5 }} />

      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, mb: 1 }}
      >
        Métodos
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr",
          gap: 1,
          mb: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Método
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: "right" }}
        >
          Informado
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: "right" }}
        >
          Registrado
        </Typography>
      </Box>
      {report.methods.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum método informado.
        </Typography>
      ) : (
        report.methods.map((row) => (
          <Box
            key={row.method}
            sx={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: 1,
              py: 0.5,
            }}
          >
            <Typography variant="body2">{row.method}</Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
            >
              {formatCurrencyBRL(row.informedCents)}
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
            >
              {formatCurrencyBRL(row.registeredCents)}
            </Typography>
          </Box>
        ))
      )}
    </Paper>
  );
}
