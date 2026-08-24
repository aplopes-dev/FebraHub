"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/kanban";
import { ProductionOrderCard } from "@/features/production/components/production-order-card";
import { PRODUCTION_STATUS_DOT_COLOR } from "@/features/production/components/production-status-badge";
import type { ProductionOrder } from "@/features/production/types/production";
import type { ProductionStatus } from "@/features/production/types/production";

type KanbanOrderItem = {
  id: string;
  column: string;
  order: ProductionOrder;
};

const COLUMNS = [
  { id: "pending", name: "Pendente" },
  { id: "in_progress", name: "Em andamento" },
  { id: "completed", name: "Concluído" },
  { id: "cancelled", name: "Cancelado" },
];

type ProductionKanbanProps = {
  orders: ProductionOrder[];
  onStart: (order: ProductionOrder) => void;
  onCardClick: (order: ProductionOrder) => void;
  onRequestFinalize: (order: ProductionOrder) => void;
};

export function ProductionKanban({
  orders,
  onStart,
  onCardClick,
  onRequestFinalize,
}: ProductionKanbanProps) {
  const theme = useTheme();

  const initialData = useMemo<KanbanOrderItem[]>(
    () =>
      orders.map((order) => ({ id: order.id, column: order.status, order })),
    [orders],
  );

  const [data, setData] = useState<KanbanOrderItem[]>(initialData);

  function revert(cardId: string, toColumn: string) {
    setData((prev) =>
      prev.map((entry) =>
        entry.id === cardId ? { ...entry, column: toColumn } : entry,
      ),
    );
  }

  function handleColumnChange(
    cardId: string,
    toColumn: string,
    fromColumn: string,
  ) {
    const item = data.find((entry) => entry.id === cardId);
    if (fromColumn === "pending" && toColumn === "in_progress" && item) {
      onStart(item.order);
      return;
    }
    if (fromColumn === "in_progress" && toColumn === "completed" && item) {
      revert(cardId, fromColumn);
      onRequestFinalize(item.order);
      return;
    }
    revert(cardId, fromColumn);
  }

  function resolveDotColor(columnId: string): string {
    const token =
      PRODUCTION_STATUS_DOT_COLOR[columnId as ProductionStatus] ??
      "text.disabled";
    if (token === "text.disabled") {
      return theme.palette.text.disabled;
    }
    const [paletteKey, shade] = token.split(".") as [
      "warning" | "info" | "success",
      "main",
    ];
    return theme.palette[paletteKey][shade];
  }

  return (
    <KanbanProvider
      columns={COLUMNS}
      data={data}
      onDataChange={setData}
      onColumnChange={handleColumnChange}
      className="h-full"
      renderOverlay={(item) => (
        <ProductionOrderCard order={(item as KanbanOrderItem).order} />
      )}
    >
      {(column) => (
        <KanbanBoard key={column.id} id={column.id} className="w-[22.5rem] shrink-0">
          <KanbanHeader>
            <Box
              component="span"
              aria-hidden
              sx={{
                width: 8,
                height: 8,
                flexShrink: 0,
                borderRadius: "50%",
                bgcolor: resolveDotColor(column.id),
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {column.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                ml: "auto",
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                bgcolor: "action.hover",
                fontWeight: 500,
                color: "text.secondary",
              }}
            >
              {data.filter((item) => item.column === column.id).length}
            </Typography>
          </KanbanHeader>
          <KanbanCards<KanbanOrderItem>
            id={column.id}
            emptyState={
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ px: 1.5, py: 4, textAlign: "center", display: "block" }}
              >
                Nenhum pedido nesta etapa.
              </Typography>
            }
          >
            {(item) => (
              <KanbanCard key={item.id} id={item.id}>
                <ProductionOrderCard
                  order={item.order}
                  onClick={() => onCardClick(item.order)}
                />
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
}
