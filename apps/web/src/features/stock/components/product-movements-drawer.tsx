"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, Drawer } from "@/ui";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { StockMovementTypeBadge } from "@/features/stock-movements/components/stock-movement-type-badge";
import { resolveStockMovementReasonLabel } from "@/features/stock-movements/types/stock-movement-reason";
import {
  formatCurrencyBRL,
  formatOperatedAt,
} from "@/features/stock-movements/lib/stock-movement-form-values";
import { useProductStockMovementsQuery } from "@/features/stock-movements/hooks/use-stock-movement-queries";

type ProductMovementsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockId: string;
  product: { id: string; name: string; sku: string } | null;
};

export function ProductMovementsDrawer({
  open,
  onOpenChange,
  stockId,
  product,
}: ProductMovementsDrawerProps) {
  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Movimentações do produto"
      width={480}
      footer={
        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="outlined" onClick={handleClose}>
            Fechar
          </Button>
        </Stack>
      }
    >
      {open && product ? (
        <ProductMovementsDrawerBody stockId={stockId} product={product} />
      ) : null}
    </Drawer>
  );
}

function ProductMovementsDrawerBody({
  stockId,
  product,
}: {
  stockId: string;
  product: { id: string; name: string; sku: string };
}) {
  const {
    data: lines = [],
    isLoading,
    isError,
    refetch,
  } = useProductStockMovementsQuery(stockId, product.id, true);

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {product.name} · {product.sku}
      </Typography>

      {isError ? (
        <ListLoadErrorAlert
          title="Não foi possível carregar o histórico deste produto"
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 5, textAlign: "center" }}>
          Carregando…
        </Typography>
      ) : lines.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 5, textAlign: "center" }}
        >
          Nenhuma movimentação registrada para este produto neste estoque.
        </Typography>
      ) : (
        lines.map((line, index) => (
          <Box
            key={`${line.movementId}-${index}`}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
              <StockMovementTypeBadge type={line.type} />
              <Typography variant="body2" color="text.secondary">
                {resolveStockMovementReasonLabel(line)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatOperatedAt(line.operatedAt)}
              </Typography>
            </Stack>
            <Box sx={{ flexShrink: 0, textAlign: "right" }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  color: line.type === "entrada" ? "success.main" : "error.main",
                }}
              >
                {line.type === "entrada" ? "+" : "−"}
                {line.quantity}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatCurrencyBRL(line.costPrice)}
              </Typography>
            </Box>
          </Box>
        ))
      )}
    </Stack>
  );
}
