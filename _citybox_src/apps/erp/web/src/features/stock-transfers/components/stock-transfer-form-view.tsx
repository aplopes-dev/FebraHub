"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ScrollArea } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { listAllProducts } from "@/features/products/api/products.service";
import { useCarrierOptionsQuery } from "@/features/carriers/hooks/use-carrier-queries";
import { useAllStocksQuery } from "@/features/stock/hooks/use-stock-queries";
import { useFullStockBalanceQuery } from "@/features/stock-movements/hooks/use-stock-movement-queries";
import { StockTransferBasicsPanel } from "@/features/stock-transfers/components/stock-transfer-basics-panel";
import { StockTransferDataPanel } from "@/features/stock-transfers/components/stock-transfer-data-panel";
import { StockTransferFormFooter } from "@/features/stock-transfers/components/stock-transfer-form-footer";
import { StockTransferFormHeader } from "@/features/stock-transfers/components/stock-transfer-form-header";
import { StockTransferProductsPanel } from "@/features/stock-transfers/components/stock-transfer-products-panel";
import { useStockTransferForm } from "@/features/stock-transfers/hooks/use-stock-transfer-form";

export function StockTransferFormView() {
  const router = useRouter();
  const { scope, ready } = useCatalogScope();
  const carriersQuery = useCarrierOptionsQuery();
  const carriers = carriersQuery.data ?? [];

  const stocksQuery = useAllStocksQuery();

  const productsQuery = useQuery({
    queryKey: ["comercio", "products", "trackable", scope],
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

  const initialWarehouses = useMemo(() => {
    const first = warehouses[0]?.id ?? "";
    const second = warehouses.find((w) => w.id !== first)?.id ?? "";
    if (!first) return undefined;
    return { fromId: first, toId: second };
  }, [warehouses]);

  const products = productsQuery.data ?? [];

  const {
    values,
    isDirty,
    hasSavedOnce,
    isSaving,
    includedIds,
    includedProducts,
    getLine,
    setField,
    setQuantity,
    setBatch,
    addProducts,
    removeProduct,
    discard,
    save,
  } = useStockTransferForm({
    products,
    initialWarehouses,
    onSaved: () => {
      router.push("/estoque/transferencias");
    },
  });

  // Balanço COMPLETO — ver stock-movement-form-view.
  const balanceQuery = useFullStockBalanceQuery(values.fromWarehouseId);

  const balanceByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of balanceQuery.data ?? []) {
      map.set(item.productId, item.quantity);
    }
    return map;
  }, [balanceQuery.data]);

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
          <StockTransferFormHeader />

          <Box
            sx={{
              display: "grid",
              gap: 3,
              alignItems: "start",
              gridTemplateColumns: {
                lg: "minmax(0, 1fr) minmax(18rem, 24rem)",
              },
            }}
          >
            <StockTransferProductsPanel
              includedProducts={includedProducts}
              includedIds={includedIds}
              allProducts={products}
              balanceByProductId={balanceByProductId}
              getLine={getLine}
              onQuantityChange={setQuantity}
              onBatchChange={setBatch}
              onRemove={removeProduct}
              onAddProducts={addProducts}
            />

            <Stack spacing={3} sx={{ position: { lg: "sticky" }, top: { lg: 0 } }}>
              <StockTransferBasicsPanel
                values={values}
                warehouses={warehouses}
                onFromChange={(fromWarehouseId) =>
                  setField("fromWarehouseId", fromWarehouseId)
                }
                onToChange={(toWarehouseId) =>
                  setField("toWarehouseId", toWarehouseId)
                }
                onOperatedAtChange={(operatedAt) =>
                  setField("operatedAt", operatedAt)
                }
              />
              <StockTransferDataPanel
                values={values}
                carriers={carriers}
                onCarrierChange={(carrierId) => setField("carrierId", carrierId)}
                onResponsibleChange={(responsibleName) =>
                  setField("responsibleName", responsibleName)
                }
                onNotesChange={(notes) => setField("notes", notes)}
              />
            </Stack>
          </Box>
        </Stack>
      </ScrollArea>

      <StockTransferFormFooter
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
