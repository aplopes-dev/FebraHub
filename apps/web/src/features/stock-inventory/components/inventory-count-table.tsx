"use client";

import { useMemo } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { Box, NumberInput, Stack, Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { RowActionsMenu } from "@/components/ui/list-page";
import { InventoryDivergenceBadge } from "@/features/stock-inventory/components/inventory-divergence-badge";
import { resolveInventoryProduct } from "@/features/stock-inventory/lib/inventory-product";
import {
  lineDivergence,
  type InventoryLine,
} from "@/features/stock-inventory/types/inventory";

type InventoryCountTableProps = {
  lines: InventoryLine[];
  onCountedChange: (productId: string, counted: number) => void;
  onRemove: (productId: string) => void;
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
          <Inventory2OutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
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

export function InventoryCountTable({
  lines,
  onCountedChange,
  onRemove,
}: InventoryCountTableProps) {
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
        header: "Contagem",
        render: (line) => (
          <NumberInput
            value={line.countedQuantity}
            minValue={0}
            step={1}
            onValueChange={(value) => onCountedChange(line.productId, value)}
            aria-label={`Contagem de ${resolveInventoryProduct(line).name}`}
            sx={{ width: 144 }}
          />
        ),
      },
      {
        id: "divergence",
        header: "Divergência",
        render: (line) => (
          <InventoryDivergenceBadge divergence={lineDivergence(line)} />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (line) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <RowActionsMenu
              ariaLabel="Ações do produto"
              items={[
                {
                  id: "remove",
                  label: "Remover",
                  destructive: true,
                  icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
                  onClick: () => onRemove(line.productId),
                },
              ]}
            />
          </Box>
        ),
      },
    ],
    [onCountedChange, onRemove],
  );

  return (
    <DataTable
      columns={columns}
      rows={lines}
      getRowId={(line) => line.productId}
      emptyMessage="Nenhum produto adicionado à contagem."
    />
  );
}
