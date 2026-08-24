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
import { formSectionBoxSx } from "@/components/ui/form/form-section-styles";
import { ProductPickerDrawer } from "@/components/ui/picker/product-picker-drawer";
import { StockMovementProductsTable } from "@/features/stock-movements/components/stock-movement-products-table";
import type { StockMovementLine } from "@/features/stock-movements/types/stock-movement";
import type { WarehouseOption } from "@/lib/option-types";
import type { Product } from "@/features/products/types/product";

type StockMovementProductsPanelProps = {
  warehouseId: string;
  warehouses: WarehouseOption[];
  onWarehouseChange: (warehouseId: string) => void;
  includedProducts: Product[];
  includedIds: Set<string>;
  allProducts: Product[];
  getLine: (productId: string) => StockMovementLine | undefined;
  onQuantityChange: (productId: string, quantity: number) => void;
  onCostPriceChange: (productId: string, costPrice: number) => void;
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

export function StockMovementProductsPanel({
  warehouseId,
  warehouses,
  onWarehouseChange,
  includedProducts,
  includedIds,
  allProducts,
  getLine,
  onQuantityChange,
  onCostPriceChange,
  onRemove,
  onAddProducts,
}: StockMovementProductsPanelProps) {
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
    <Box sx={formSectionBoxSx}>
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
          <FormControl sx={{ width: { xs: "100%", sm: 224 } }}>
            <InputLabel id="movement-warehouse-label">Estoque</InputLabel>
            <Select
              labelId="movement-warehouse-label"
              id="movement-warehouse"
              label="Estoque"
              value={warehouseId || ""}
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

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar"
            sx={{ flex: 1, minWidth: 0 }}
          />
          <Button
            type="button"
            size="large"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddOpen(true)}
          >
            Adicionar
          </Button>
        </Stack>

        {includedProducts.length > 0 ? (
          <StockMovementProductsTable
            products={visibleProducts}
            getLine={getLine}
            onQuantityChange={onQuantityChange}
            onCostPriceChange={onCostPriceChange}
            onRemove={onRemove}
            emptyMessage="Nenhum produto corresponde à busca."
          />
        ) : (
          <EmptyState
            title="Nenhum produto adicionado"
            description="Pesquise e adicione os produtos que serão movimentados."
            action={
              <Button
                type="button"
                variant="contained"
                onClick={() => setAddOpen(true)}
              >
                Adicionar produtos
              </Button>
            }
          />
        )}

        <ProductPickerDrawer
          open={addOpen}
          onOpenChange={setAddOpen}
          availableProducts={availableProducts}
          onConfirm={onAddProducts}
          title="Adicionar produtos"
          description="Selecione os produtos que farão parte desta movimentação."
        />
      </Stack>
    </Box>
  );
}
