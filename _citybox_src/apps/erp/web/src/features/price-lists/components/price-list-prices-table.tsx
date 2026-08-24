"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";

import { useMemo } from "react";
import { Box, Button, Checkbox, CurrencyInput, Stack, Typography } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { formatProductPrice } from "@/features/products/services/product-list.service";
import type { Product } from "@/features/products/types/product";

type PriceListPricesTableProps = {
  products: Product[];
  getPrice: (productId: string) => number;
  onPriceChange: (productId: string, price: number) => void;
  onRemove: (productId: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (productId: string) => void;
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelectAll: () => void;
  emptyMessage?: string;
};

export function PriceListPricesTable({
  products,
  getPrice,
  onPriceChange,
  onRemove,
  selectedIds,
  onToggleSelect,
  allSelected,
  someSelected,
  onToggleSelectAll,
  emptyMessage = "Nenhum produto encontrado.",
}: PriceListPricesTableProps) {
  const columns = useMemo<DataTableColumn<Product>[]>(
    () => [
      {
        id: "select",
        width: 48,
        header: (
          <Checkbox
            slotProps={{ input: { "aria-label": "Selecionar todos" } }}
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={() => onToggleSelectAll()}
          />
        ),
        render: (product) => (
          <Checkbox
            slotProps={{
              input: { "aria-label": `Selecionar ${product.name}` },
            }}
            checked={selectedIds.has(product.id)}
            onChange={() => onToggleSelect(product.id)}
          />
        ),
      },
      {
        id: "name",
        header: "Produto",
        render: (product) => (
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
                <img
                  src={product.imageUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Inventory2Outlined sx={{ fontSize: 16, color: "text.secondary" }} />
              )}
            </Box>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {product.name}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "sku",
        header: "SKU",
        render: (product) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {product.sku}
          </Typography>
        ),
      },
      {
        id: "basePrice",
        header: "Preço base",
        render: (product) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {formatProductPrice(product.basePrice)}
          </Typography>
        ),
      },
      {
        id: "listPrice",
        header: "Preço na lista",
        render: (product) => (
          <CurrencyInput
            value={getPrice(product.id)}
            onValueChange={(value) => onPriceChange(product.id, value)}
            aria-label={`Preço de ${product.name} na lista`}
            sx={{ maxWidth: 160 }}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (product) => (
          <Button
            type="button"
            variant="text"
            aria-label={`Remover ${product.name} da lista`}
            onClick={() => onRemove(product.id)}
            sx={{ minWidth: 32, px: 0.5 }}
          >
            <DeleteOutlined sx={{ fontSize: 16 }} />
          </Button>
        ),
      },
    ],
    [
      allSelected,
      someSelected,
      selectedIds,
      getPrice,
      onPriceChange,
      onRemove,
      onToggleSelect,
      onToggleSelectAll,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={products}
      getRowId={(product) => product.id}
      emptyMessage={emptyMessage}
    />
  );
}
