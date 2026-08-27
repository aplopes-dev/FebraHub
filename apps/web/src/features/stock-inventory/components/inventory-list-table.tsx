"use client";

import { useMemo } from "react";
import { Badge, Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import type { InventoryListItem } from "@/features/stock-inventory/types/inventory";

type InventoryListTableProps = {
  inventories: InventoryListItem[];
  onRowClick: (inventory: InventoryListItem) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function InventoryListTable({
  inventories,
  onRowClick,
}: InventoryListTableProps) {
  const columns = useMemo<DataTableColumn<InventoryListItem>[]>(
    () => [
      {
        id: "name",
        header: "Inventário",
        render: (inventory) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {inventory.name}
          </Typography>
        ),
      },
      {
        id: "date",
        header: "Data",
        render: (inventory) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {formatDate(inventory.completedAt ?? inventory.createdAt)}
          </Typography>
        ),
      },
      {
        id: "items",
        header: "Produtos",
        render: (inventory) => (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {inventory.itemsCount}
          </Typography>
        ),
      },
      {
        id: "divergences",
        header: "Divergências",
        render: (inventory) => {
          const count = inventory.divergentCount;
          if (count === 0) {
            return (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                —
              </Typography>
            );
          }
          return (
            <Badge
              label={`${count} ${count === 1 ? "item" : "itens"}`}
              variant="outlined"
              color="warning"
              sx={{ fontWeight: 500 }}
            />
          );
        },
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      rows={inventories}
      getRowId={(inventory) => inventory.id}
      onRowClick={onRowClick}
      emptyMessage="Nenhum inventário registrado para este estoque."
    />
  );
}
