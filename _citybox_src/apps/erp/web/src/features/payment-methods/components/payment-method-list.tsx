"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { PaymentMethod } from "@/features/payment-methods/types/payment-method";

export type PaymentMethodListProps = {
  methods: PaymentMethod[];
  /** Slot à direita da linha. Ausente = linha só de leitura (formas da plataforma). */
  renderActions?: (method: PaymentMethod) => ReactNode;
};

/**
 * Lista em caixa: linhas divididas por borda, nome à esquerda e ações opcionais
 * à direita. Não é `DataTable` — a tela não tem colunas, busca nem paginação.
 */
export function PaymentMethodList({
  methods,
  renderActions,
}: PaymentMethodListProps) {
  return (
    <Box
      component="ul"
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      {methods.map((method) => (
        <Box
          key={method.id}
          component="li"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            minHeight: 48,
            px: 2,
            py: 1,
            "& + &": { borderTop: 1, borderColor: "divider" },
          }}
        >
          <Typography variant="body2" sx={{ minWidth: 0 }}>
            {method.name}
          </Typography>
          {renderActions ? renderActions(method) : null}
        </Box>
      ))}
    </Box>
  );
}
