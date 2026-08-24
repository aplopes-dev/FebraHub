"use client";

import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, EmptyState, SearchInput } from "@citybox/mui";
import { formSectionBoxSx } from "@/components/ui/form/form-section-styles";
import { ProductPickerDrawer } from "@/components/ui/picker/product-picker-drawer";
import { StockTransferProductsTable } from "@/features/stock-transfers/components/stock-transfer-products-table";
import type { StockTransferLine } from "@/features/stock-transfers/types/stock-transfer";
import type { Product } from "@/features/products/types/product";

type StockTransferProductsPanelProps = {
  includedProducts: Product[];
  includedIds: Set<string>;
  allProducts: Product[];
  balanceByProductId: Map<string, number>;
  getLine: (productId: string) => StockTransferLine | undefined;
  onQuantityChange: (productId: string, quantity: number) => void;
  onBatchChange: (productId: string, batch: string) => void;
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

export function StockTransferProductsPanel({
  includedProducts,
  includedIds,
  allProducts,
  balanceByProductId,
  getLine,
  onQuantityChange,
  onBatchChange,
  onRemove,
  onAddProducts,
}: StockTransferProductsPanelProps) {
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
    <Box sx={{ ...formSectionBoxSx, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Produtos
      </Typography>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar"
          sx={{ flex: 1, minWidth: 200 }}
        />
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
        >
          Adicionar
        </Button>
      </Stack>

      {includedProducts.length > 0 ? (
        <StockTransferProductsTable
          products={visibleProducts}
          balanceByProductId={balanceByProductId}
          getLine={getLine}
          onQuantityChange={onQuantityChange}
          onBatchChange={onBatchChange}
          onRemove={onRemove}
          emptyMessage="Nenhum produto corresponde à busca."
        />
      ) : (
        <EmptyState
          title="Nenhum produto adicionado"
          description="Pesquise e adicione os produtos que serão transferidos."
          action={
            <Button type="button" variant="contained" onClick={() => setAddOpen(true)}>
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
        description="Selecione os produtos que serão transferidos entre estoques."
      />
    </Box>
  );
}
