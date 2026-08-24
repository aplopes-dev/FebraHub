"use client";

import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  EmptyState,
  MenuItem,
  SearchInput,
  Select,
} from "@citybox/mui";
import { formSectionBoxSx } from "@/components/ui/form";
import { StockMovementAddProductsDrawer } from "@/features/stock-movements/components/stock-movement-add-products-drawer";
import { SaleOrderProductsTable } from "@/features/sales-orders/components/sale-order-products-table";
import type { SaleOrderLine } from "@/features/sales-orders/types/sale-order-form";
import type { WarehouseOption } from "@/lib/option-types";
import type { Product } from "@/features/products/types/product";

type SaleOrderProductsPanelProps = {
  warehouseId: string;
  warehouses: WarehouseOption[];
  disabled?: boolean;
  onWarehouseChange: (warehouseId: string) => void;
  includedProducts: Product[];
  includedIds: Set<string>;
  allProducts: Product[];
  getLine: (productId: string) => SaleOrderLine | undefined;
  onQuantityChange: (productId: string, quantity: number) => void;
  onUnitPriceChange: (productId: string, unitPrice: number) => void;
  onRemove: (productId: string) => void;
  onAddProducts: (productIds: string[]) => void;
};

function matchesSearch(product: Product, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    product.name.toLowerCase().includes(q) ||
    product.sku.toLowerCase().includes(q)
  );
}

export function SaleOrderProductsPanel({
  warehouseId,
  warehouses,
  disabled = false,
  onWarehouseChange,
  includedProducts,
  includedIds,
  allProducts,
  getLine,
  onQuantityChange,
  onUnitPriceChange,
  onRemove,
  onAddProducts,
}: SaleOrderProductsPanelProps) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const visibleProducts = useMemo(
    () => includedProducts.filter((product) => matchesSearch(product, search)),
    [includedProducts, search],
  );

  const availableProducts = useMemo(
    () => allProducts.filter((product) => !includedIds.has(product.id)),
    [allProducts, includedIds],
  );

  return (
    <Box sx={{ ...formSectionBoxSx }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { sm: "flex-end" },
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Produtos
          </Typography>
          <FormControl
            disabled={disabled}
            sx={{ minWidth: 224, width: { xs: "100%", sm: "auto" } }}
          >
            <InputLabel id="sale-order-warehouse-label">Estoque</InputLabel>
            <Select
              labelId="sale-order-warehouse-label"
              id="sale-order-warehouse"
              label="Estoque"
              value={warehouseId}
              disabled={disabled}
              onChange={(event) =>
                onWarehouseChange(String(event.target.value))
              }
            >
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { sm: "center" } }}
        >
          <SearchInput
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar"
            sx={{ flex: 1, minWidth: 0 }}
          />
          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon fontSize="small" />}
            disabled={disabled}
            onClick={() => setAddOpen(true)}
          >
            Adicionar
          </Button>
        </Stack>

        {includedProducts.length > 0 ? (
          <SaleOrderProductsTable
            products={visibleProducts}
            getLine={getLine}
            disabled={disabled}
            onQuantityChange={onQuantityChange}
            onUnitPriceChange={onUnitPriceChange}
            onRemove={onRemove}
            emptyMessage="Nenhum produto corresponde à busca."
          />
        ) : (
          <EmptyState
            title="Nenhum produto adicionado"
            description="Busque por produtos para adicioná-los ao pedido."
            action={
              <Button
                type="button"
                variant="contained"
                disabled={disabled}
                onClick={() => setAddOpen(true)}
              >
                Adicionar produtos
              </Button>
            }
          />
        )}
      </Stack>

      <StockMovementAddProductsDrawer
        open={!disabled && addOpen}
        onOpenChange={setAddOpen}
        availableProducts={availableProducts}
        onConfirm={onAddProducts}
      />
    </Box>
  );
}
