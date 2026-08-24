"use client";

import { useState } from "react";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, Menu, MenuItem, toast } from "@citybox/mui";
import { formatCurrencyBRL } from "@/features/service-orders/lib/service-order-totals";

type ServiceOrderFormFooterProps = {
  code: string;
  total: number;
  canGenerateSale: boolean;
  onSave: () => void;
  onSaveAndGenerateSale: () => void;
};

export function ServiceOrderFormFooter({
  code,
  total,
  canGenerateSale,
  onSave,
  onSaveAndGenerateSale,
}: ServiceOrderFormFooterProps) {
  const [printAnchor, setPrintAnchor] = useState<null | HTMLElement>(null);

  function notifyPrint(label: string) {
    toast.message(`${label} de ${code} em breve`);
  }

  return (
    <Box
      component="footer"
      role="toolbar"
      aria-label="Ações da ordem de serviço"
      sx={{
        zIndex: 20,
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        px: 3,
        pt: 1.5,
        pb: "max(0.75rem, env(safe-area-inset-bottom))",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "text.secondary",
          }}
        >
          Total da OS
        </Typography>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
        >
          {formatCurrencyBRL(total)}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
        <Button
          type="button"
          variant="outlined"
          size="large"
          startIcon={<PrintOutlinedIcon fontSize="small" />}
          onClick={(event) => setPrintAnchor(event.currentTarget)}
        >
          Imprimir
        </Button>
        <Menu
          anchorEl={printAnchor}
          open={Boolean(printAnchor)}
          onClose={() => setPrintAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <MenuItem
            onClick={() => {
              setPrintAnchor(null);
              notifyPrint("Impressão da OS");
            }}
          >
            Ordem de serviço
          </MenuItem>
          <MenuItem
            onClick={() => {
              setPrintAnchor(null);
              notifyPrint("Termo de entrada");
            }}
          >
            Termo de entrada
          </MenuItem>
          <MenuItem
            onClick={() => {
              setPrintAnchor(null);
              notifyPrint("Termo de retirada");
            }}
          >
            Termo de retirada
          </MenuItem>
        </Menu>

        <Button
          type="button"
          variant="outlined"
          size="large"
          startIcon={<SaveOutlinedIcon fontSize="small" />}
          onClick={onSave}
        >
          Salvar
        </Button>

        <Button
          type="button"
          variant="contained"
          size="large"
          disabled={!canGenerateSale}
          startIcon={<PaymentsOutlinedIcon fontSize="small" />}
          onClick={onSaveAndGenerateSale}
        >
          Salvar e gerar venda
        </Button>
      </Stack>
    </Box>
  );
}
