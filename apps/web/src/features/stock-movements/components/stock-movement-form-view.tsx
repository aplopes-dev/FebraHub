"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ScrollArea } from "@/ui";
import { formSplitLayoutGridSx } from "@/components/ui/form/form-section-styles";
import { useCatalogScope } from "@/lib/organization-context";
import { listAllProducts } from "@/features/products/api/products.service";
import { useAllStocksQuery } from "@/features/stock/hooks/use-stock-queries";
import { StockMovementFormFooter } from "@/features/stock-movements/components/stock-movement-form-footer";
import { StockMovementFormHeader } from "@/features/stock-movements/components/stock-movement-form-header";
import { StockMovementInfoPanel } from "@/features/stock-movements/components/stock-movement-info-panel";
import { StockMovementProductsPanel } from "@/features/stock-movements/components/stock-movement-products-panel";
import { useStockMovementForm } from "@/features/stock-movements/hooks/use-stock-movement-form";
import {
  useMovementCategoryOptionsQuery,
  useFullStockBalanceQuery,
} from "@/features/stock-movements/hooks/use-stock-movement-queries";
import type { StockMovementType } from "@/features/stock-movements/types/stock-movement";

type StockMovementFormViewProps = {
  /** Tipo pré-selecionado ao chegar de um atalho (Registrar entrada/saída). */
  initialType?: StockMovementType;
  /** Estoque pré-selecionado ao chegar de um atalho. */
  initialWarehouseId?: string;
};

export function StockMovementFormView({
  initialType,
  initialWarehouseId,
}: StockMovementFormViewProps = {}) {
  const router = useRouter();
  const { scope, ready } = useCatalogScope();

  const stocksQuery = useAllStocksQuery();

  const productsQuery = useQuery({
    queryKey: ["api", "products", "trackable", scope],
    queryFn: () => listAllProducts({ trackStock: true }),
    enabled: ready,
  });

  const warehouses = useMemo(
    () =>
      (stocksQuery.data ?? []).map((stock) => ({
        id: stock.id,
        name: stock.name,
      })),
    [stocksQuery.data],
  );

  const products = productsQuery.data ?? [];

  const safeInitialWarehouseId = useMemo(
    () =>
      warehouses.some((warehouse) => warehouse.id === initialWarehouseId)
        ? initialWarehouseId
        : undefined,
    [warehouses, initialWarehouseId],
  );

  const {
    values,
    isDirty,
    hasSavedOnce,
    isSaving,
    includedIds,
    includedProducts,
    getLine,
    setField,
    setType,
    setQuantity,
    setCostPrice,
    addProducts,
    removeProduct,
    discard,
    save,
  } = useStockMovementForm({
    products,
    initialType,
    initialWarehouseId: safeInitialWarehouseId,
    onSaved: () => {
      router.push("/estoque/movimentacoes");
    },
  });

  const categoriesQuery = useMovementCategoryOptionsQuery(values.type);
  const categories = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
      })),
    [categoriesQuery.data],
  );

  // Balanço COMPLETO: com uma página de 100, todo produto fora dela aparecia
  // com "Saldo 0" — indistinguível de saldo real zero. O operador ou deixava
  // de registrar a saída achando o item zerado, ou duplicava a entrada.
  const balanceQuery = useFullStockBalanceQuery(values.warehouseId);

  const balanceByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of balanceQuery.data ?? []) {
      map.set(item.productId, item.quantity);
    }
    return map;
  }, [balanceQuery.data]);

  const productsWithBalance = useMemo(
    () =>
      includedProducts.map((product) => ({
        ...product,
        stock: balanceByProductId.get(product.id) ?? 0,
      })),
    [includedProducts, balanceByProductId],
  );

  const availableProducts = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        stock: balanceByProductId.get(product.id) ?? 0,
      })),
    [products, balanceByProductId],
  );

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: "column",
        overflow: "hidden",
        m: -3,
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
      }}
    >
      <ScrollArea sx={{ minHeight: 0, flex: 1, minWidth: 0 }}>
        <Stack spacing={3} sx={{ px: 3, pt: 3, pb: 2, minWidth: 0, maxWidth: "100%" }}>
          <StockMovementFormHeader />
          <Box sx={formSplitLayoutGridSx}>
            <StockMovementProductsPanel
              warehouseId={values.warehouseId}
              warehouses={warehouses}
              onWarehouseChange={(warehouseId) =>
                setField("warehouseId", warehouseId)
              }
              includedProducts={productsWithBalance}
              includedIds={includedIds}
              allProducts={availableProducts}
              getLine={getLine}
              onQuantityChange={setQuantity}
              onCostPriceChange={setCostPrice}
              onRemove={removeProduct}
              onAddProducts={addProducts}
            />
            <StockMovementInfoPanel
              values={values}
              categories={categories}
              onTypeChange={setType}
              onCategoryChange={(categoryId) =>
                setField("categoryId", categoryId)
              }
              onOperatedAtChange={(operatedAt) =>
                setField("operatedAt", operatedAt)
              }
            />
          </Box>
        </Stack>
      </ScrollArea>

      <StockMovementFormFooter
        isDirty={isDirty}
        hasSavedOnce={hasSavedOnce}
        isSaving={isSaving}
        onDiscard={discard}
        onSave={() => {
          void save();
        }}
      />
    </Box>
  );
}
