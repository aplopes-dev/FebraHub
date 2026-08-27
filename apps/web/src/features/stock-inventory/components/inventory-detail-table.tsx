"use client";

import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";

import { useMemo } from "react";
import { Box, Stack, Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { InventoryDivergenceBadge } from "@/features/stock-inventory/components/inventory-divergence-badge";
import { resolveInventoryProduct } from "@/features/stock-inventory/lib/inventory-product";
import {
  lineDivergence,
  type InventoryLine,
} from "@/features/stock-inventory/types/inventory";

type InventoryDetailTableProps = {
  lines: InventoryLine[];
};

function ProductCell({ line }: { line: InventoryLine }) {
  const product = resolveInventoryProduct(line);

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          bgcolor: "action.hover",
        }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <Box
            component="img"
            src={product.imageUrl}
            alt=""
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Inventory2Outlined sx={{ fontSize: 16, color: "text.secondary" }} />
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {product.name}
        </Typography>
        <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
          {product.sku}
        </Typography>
      </Box>
    </Stack>
  );
}

export function InventoryDetailTable({ lines }: InventoryDetailTableProps) {
  const columns = useMemo<DataTableColumn<InventoryLine>[]>(
    () => [
      {
        id: "product",
        header: "Produto",
        render: (line) => <ProductCell line={line} />,
      },
      {
        id: "system",
        header: "Saldo sistema",
        render: (line) => (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {line.systemQuantity} {line.unit}
          </Typography>
        ),
      },
      {
        id: "counted",
        header: "Contado",
        render: (line) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
          >
            {line.countedQuantity} {line.unit}
          </Typography>
        ),
      },
      {
        id: "divergence",
        header: "Divergência",
        render: (line) => (
          <InventoryDivergenceBadge divergence={lineDivergence(line)} />
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      rows={lines}
      getRowId={(line) => line.productId}
      emptyMessage="Este inventário não tem itens."
    />
  );
}
