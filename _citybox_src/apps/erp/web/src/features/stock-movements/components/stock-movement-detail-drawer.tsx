"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, Drawer, ScrollArea } from "@citybox/mui";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { StockMovementDetailLinesTable } from "@/features/stock-movements/components/stock-movement-detail-lines-table";
import { StockMovementTypeBadge } from "@/features/stock-movements/components/stock-movement-type-badge";
import {
  formatCurrencyBRL,
  formatOperatedAt,
} from "@/features/stock-movements/lib/stock-movement-form-values";
import { useStockMovementQuery } from "@/features/stock-movements/hooks/use-stock-movement-queries";
import type { StockMovementListItem } from "@/features/stock-movements/types/stock-movement";
import { resolveStockMovementReasonLabel } from "@/features/stock-movements/types/stock-movement-reason";

type StockMovementDetailDrawerProps = {
  movement: StockMovementListItem | null;
  onOpenChange: (open: boolean) => void;
};

function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function StockMovementDetailDrawer({
  movement,
  onOpenChange,
}: StockMovementDetailDrawerProps) {
  return (
    <Drawer
      open={movement != null}
      onClose={() => onOpenChange(false)}
      title={
        movement ? (
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                {resolveStockMovementReasonLabel(movement)}
              </Typography>
              <StockMovementTypeBadge type={movement.type} />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {movement.warehouseName} · {formatOperatedAt(movement.operatedAt)}
            </Typography>
          </Stack>
        ) : undefined
      }
      width={720}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="outlined"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </Stack>
      }
    >
      {movement ? (
        <StockMovementDetailDrawerBody movement={movement} />
      ) : null}
    </Drawer>
  );
}

function StockMovementDetailDrawerBody({
  movement,
}: {
  movement: StockMovementListItem;
}) {
  const detailQuery = useStockMovementQuery(movement.id);
  const lines = detailQuery.data?.lines ?? [];
  const detail = detailQuery.data?.item ?? movement;
  const totalCost = detail.totalCost;

  return (
    <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
      <Stack spacing={3} sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <SummaryItem
            label="Motivo"
            value={resolveStockMovementReasonLabel(detail)}
          />
          <SummaryItem label="Estoque" value={detail.warehouseName} />
          <SummaryItem
            label="Data da operação"
            value={formatOperatedAt(detail.operatedAt)}
          />
          <SummaryItem label="Executado por" value={detail.userName} />
          <SummaryItem
            label="Itens"
            value={`${detail.itemsCount} produto(s)`}
          />
          <SummaryItem
            label="Total de custo"
            value={formatCurrencyBRL(totalCost)}
          />
        </Box>

        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Registrada em {formatCreatedAt(detail.createdAt)}
        </Typography>

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Produtos movimentados
          </Typography>
          {detailQuery.isError ? (
            <ListLoadErrorAlert
              title="Não foi possível carregar os produtos desta movimentação"
              onRetry={() => void detailQuery.refetch()}
            />
          ) : detailQuery.isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Carregando produtos…
            </Typography>
          ) : (
            <StockMovementDetailLinesTable
              lines={lines}
              totalCost={totalCost}
            />
          )}
        </Box>
      </Stack>
    </ScrollArea>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 1.5,
      }}
    >
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}
