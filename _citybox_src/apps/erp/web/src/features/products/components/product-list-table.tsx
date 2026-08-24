"use client";

import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Checkbox, Typography } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { stopRowNavigation } from "@/components/ui/data-table/stop-row-navigation";
import { ProductChannelsCell } from "@/features/products/components/product-channels-cell";
import { ProductRowActions } from "@/features/products/components/product-row-actions";
import { formatProductPrice } from "@/features/products/services/product-list.service";
import type { Product } from "@/features/products/types/product";

type ProductListTableProps = {
  products: Product[];
  /** Página 1-based (API / Zustand). */
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  selectedIds: Set<string>;
  allPageSelected: boolean;
  somePageSelected: boolean;
  onToggleSelectAllPage: () => void;
  onToggleSelectOne: (id: string) => void;
  isLoading?: boolean;
};

export function ProductListTable({
  products,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  allPageSelected,
  somePageSelected,
  onToggleSelectAllPage,
  onToggleSelectOne,
  isLoading = false,
}: ProductListTableProps) {
  const columns = useMemo<DataTableColumn<Product>[]>(
    () => [
      {
        id: "select",
        width: 48,
        header: (
          <Checkbox
            slotProps={{ input: { "aria-label": "Selecionar todos desta página" } }}
            checked={allPageSelected}
            indeterminate={somePageSelected && !allPageSelected}
            // `preventDefault` (via stopRowNavigation) cancela o toggle nativo
            // do input — então a seleção tem de ser aplicada no próprio click.
            onClick={(event) => {
              stopRowNavigation(event);
              onToggleSelectAllPage();
            }}
          />
        ),
        render: (product) => (
          <Checkbox
            slotProps={{ input: { "aria-label": `Selecionar ${product.name}` } }}
            checked={selectedIds.has(product.id)}
            onClick={(event) => {
              stopRowNavigation(event);
              onToggleSelectOne(product.id);
            }}
          />
        ),
      },
      {
        id: "name",
        header: "Nome",
        render: (product) => (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              minWidth: 0,
            }}
          >
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
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {product.name}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: "text.secondary" }}
              >
                {product.sku}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: "category",
        header: "Categoria",
        render: (product) => product.category,
      },
      {
        id: "basePrice",
        header: "Preço base",
        render: (product) => formatProductPrice(product.basePrice),
      },
      {
        id: "stock",
        header: "Estoque",
        render: (product) =>
          product.trackStock ? String(product.stock) : "—",
      },
      {
        id: "variants",
        header: "Variações",
        render: (product) =>
          product.variantsCount > 0 ? String(product.variantsCount) : "—",
      },
      {
        id: "priceLists",
        header: "Lista de preço",
        render: (product) => {
          const lists = product.priceLists;
          if (lists.length === 0) return "—";
          if (lists.length === 1) return lists[0];
          return `${lists[0]} +${lists.length - 1}`;
        },
      },
      {
        id: "channels",
        header: "Canais",
        render: (product) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <ProductChannelsCell product={product} />
          </Box>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (product) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <ProductRowActions product={product} />
          </Box>
        ),
      },
    ],
    [
      allPageSelected,
      somePageSelected,
      selectedIds,
      onToggleSelectAllPage,
      onToggleSelectOne,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={products}
      getRowId={(product) => product.id}
      getRowHref={(product) => `/catalogo/produtos/${product.id}`}
      emptyMessage="Nenhum produto encontrado."
      isLoading={isLoading}
      pagination={{
        page,
        perPage: pageSize,
        total,
        onPageChange,
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
