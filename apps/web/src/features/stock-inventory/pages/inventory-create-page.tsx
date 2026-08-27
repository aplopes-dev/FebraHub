"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  ConfirmationDialog,
  FormField,
  ScrollArea,
  Stack,
  Typography,
} from "@/ui";
import { EntityFormHeader } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { useCatalogScope } from "@/lib/organization-context";
import { listAllProducts } from "@/features/products/api/products.service";
import { useStockQuery } from "@/features/stock/hooks/use-stock-queries";
import { useFullStockBalanceQuery } from "@/features/stock-movements/hooks/use-stock-movement-queries";
import { InventoryAddProductsDrawer } from "@/features/stock-inventory/components/inventory-add-products-drawer";
import { InventoryCountTable } from "@/features/stock-inventory/components/inventory-count-table";
import { InventoryFormFooter } from "@/features/stock-inventory/components/inventory-form-footer";
import { useInventoryCountForm } from "@/features/stock-inventory/hooks/use-inventory-count-form";
import { useCreateInventoryMutation } from "@/features/stock-inventory/hooks/use-inventory-mutations";
import { countDivergences } from "@/features/stock-inventory/types/inventory";

type InventoryCreatePageProps = {
  stockId: string;
};

export function InventoryCreatePage({ stockId }: InventoryCreatePageProps) {
  const router = useRouter();
  const { scope, ready } = useCatalogScope();
  const stockQuery = useStockQuery(stockId);
  const createMutation = useCreateInventoryMutation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["api", "products", "trackable", scope],
    queryFn: () => listAllProducts({ trackStock: true }),
    enabled: ready,
  });

  // Balanço COMPLETO, não uma página: o servidor recalcula `systemQuantity`
  // do ledger e trata a contagem enviada como verdade. Um produto ausente
  // deste mapa entra com contagem 0 e o ajuste ZERA o saldo real — com a tela
  // exibindo "Sem divergência", porque para ela sistema e contagem batem.
  const balanceQuery = useFullStockBalanceQuery(stockId);
  const balanceReady = balanceQuery.isSuccess;

  const balanceByProduct = useMemo(() => {
    const map = new Map<string, { quantity: number; unit: string }>();
    for (const item of balanceQuery.data ?? []) {
      map.set(item.productId, { quantity: item.quantity, unit: item.unit });
    }
    return map;
  }, [balanceQuery.data]);

  const productsById = useMemo(() => {
    const map = new Map<
      string,
      { name: string; sku: string; imageUrl?: string }
    >();
    for (const product of productsQuery.data ?? []) {
      map.set(product.id, {
        name: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl,
      });
    }
    return map;
  }, [productsQuery.data]);

  const onFinalize = useCallback(
    async (input: {
      stockId: string;
      name: string;
      lines: Parameters<typeof createMutation.mutateAsync>[0]["lines"];
    }) => {
      await createMutation.mutateAsync(input);
      router.push(`/estoque/${stockId}/inventario`);
    },
    [createMutation, router, stockId],
  );

  const {
    name,
    setName,
    lines,
    includedIds,
    addProducts,
    setCounted,
    removeProduct,
    finalize,
  } = useInventoryCountForm({
    stockId,
    balanceByProduct,
    productsById,
    onFinalize,
  });

  const availableProducts = useMemo(
    () =>
      (productsQuery.data ?? []).filter(
        (product) => !includedIds.has(product.id),
      ),
    [productsQuery.data, includedIds],
  );

  const divergentCount = useMemo(() => countDivergences(lines), [lines]);
  const stock = stockQuery.data;

  useEffect(() => {
    if (stockQuery.isError) router.replace("/estoque");
  }, [stockQuery.isError, router]);

  if (stockQuery.isLoading || !stock) return null;

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        mr: -3,
      }}
    >
      <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
        <Stack spacing={3} sx={{ pr: 3, pb: 2 }}>
          <EntityFormHeader
            title="Novo inventário"
            subtitle={`Inventário · ${stock.name}`}
            backHref={`/estoque/${stockId}/inventario`}
          />

          <Box sx={{ maxWidth: 448 }}>
            <FormField
              id="inventory-name"
              label="Nome da contagem"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Inventário Geral Mensal"
              autoComplete="off"
              fullWidth
            />
          </Box>

          {balanceQuery.isError ? (
            <ListLoadErrorAlert
              title="Não foi possível carregar o saldo atual do estoque"
              message="Sem o saldo, a contagem não pode ser finalizada — o ajuste seria calculado sobre um saldo desconhecido."
              onRetry={() => void balanceQuery.refetch()}
            />
          ) : null}

          <Stack
            direction="row"
            spacing={2}
            sx={{
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {lines.length}{" "}
              {lines.length === 1
                ? "produto na contagem"
                : "produtos na contagem"}
              {divergentCount > 0 ? (
                <Box
                  component="span"
                  sx={{ ml: 1, fontWeight: 600, color: "warning.main" }}
                >
                  · {divergentCount} com divergência
                </Box>
              ) : null}
            </Typography>
            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setDrawerOpen(true)}
              disabled={!balanceReady}
              loading={balanceQuery.isLoading}
            >
              Adicionar produtos
            </Button>
          </Stack>

          <InventoryCountTable
            lines={lines}
            onCountedChange={setCounted}
            onRemove={removeProduct}
          />
        </Stack>
      </ScrollArea>

      <InventoryFormFooter
        onCancel={() => router.push(`/estoque/${stockId}/inventario`)}
        onFinalize={() => setConfirmOpen(true)}
        finalizeDisabled={
          lines.length === 0 || createMutation.isPending || !balanceReady
        }
        isSaving={createMutation.isPending}
      />

      <InventoryAddProductsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        availableProducts={availableProducts}
        onConfirm={addProducts}
      />

      <ConfirmationDialog
        open={confirmOpen}
        onCancel={() => {
          if (!createMutation.isPending) setConfirmOpen(false);
        }}
        title="Finalizar inventário"
        description="Ao finalizar, o saldo do estoque será ajustado para as quantidades contadas. Essa ação não pode ser desfeita."
        confirmLabel="Finalizar e ajustar saldo"
        loading={createMutation.isPending}
        onConfirm={async () => {
          // `finalize` já trata o erro (toast pela mutation) e devolve boolean;
          // o diálogo fecha nos dois casos.
          await finalize();
          setConfirmOpen(false);
        }}
      />
    </Box>
  );
}
