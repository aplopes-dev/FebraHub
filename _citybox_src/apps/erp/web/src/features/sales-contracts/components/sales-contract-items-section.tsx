"use client";

import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Stack from "@mui/material/Stack";
import { Button, EmptyState, SearchInput } from "@citybox/mui";
import { SalesContractSection } from "@/features/sales-contracts/components/sales-contract-section";
import { StockMovementAddProductsDrawer } from "@/features/stock-movements/components/stock-movement-add-products-drawer";
import { SaleOrderProductsTable } from "@/features/sales-orders/components/sale-order-products-table";
import type { SalesContractItem } from "@/features/sales-contracts/types/sales-contract";
import type { Product } from "@/features/products/types/product";
import type { SaleOrderLine } from "@/features/sales-orders/types/sale-order-form";

type SalesContractItemsSectionProps = {
  includedProducts: Product[];
  includedIds: Set<string>;
  allProducts: Product[];
  getLine: (productId: string) => SalesContractItem | undefined;
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

export function SalesContractItemsSection({
  includedProducts,
  includedIds,
  allProducts,
  getLine,
  onQuantityChange,
  onUnitPriceChange,
  onRemove,
  onAddProducts,
}: SalesContractItemsSectionProps) {
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
    <>
      <SalesContractSection
        title="Produtos ou serviços"
        description="Inclua o que está sendo vendido neste contrato e defina quantidade e valor de cada item."
      >
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => setAddOpen(true)}
            >
              Adicionar item
            </Button>
          </Stack>

          {includedProducts.length > 0 ? (
            <>
              <SearchInput
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar itens do contrato…"
                sx={{ width: "100%", maxWidth: 360 }}
                slotProps={{
                  htmlInput: { "aria-label": "Pesquisar itens do contrato" },
                }}
              />
              <SaleOrderProductsTable
                products={visibleProducts}
                getLine={(productId) => {
                  const line = getLine(productId);
                  if (!line) return undefined;
                  const mapped: SaleOrderLine = {
                    productId: line.productId,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                  };
                  return mapped;
                }}
                onQuantityChange={onQuantityChange}
                onUnitPriceChange={onUnitPriceChange}
                onRemove={onRemove}
                emptyMessage="Nenhum item corresponde à busca."
              />
            </>
          ) : (
            <EmptyState
              title="Nenhum item adicionado"
              description="Adicione produtos ou serviços que farão parte deste contrato."
              action={
                <Button
                  type="button"
                  variant="contained"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => setAddOpen(true)}
                >
                  Adicionar item
                </Button>
              }
            />
          )}
        </Stack>
      </SalesContractSection>

      <StockMovementAddProductsDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        availableProducts={availableProducts}
        onConfirm={onAddProducts}
      />
    </>
  );
}
