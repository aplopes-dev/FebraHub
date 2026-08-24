"use client";

import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, SearchInput, toast } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { EntityFormHeader } from "@/components/ui/form";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { ProductPickerDrawer } from "@/components/ui/picker/product-picker-drawer";
import { KdsProductsTable } from "@/features/kds/components/kds-products-table";
import { useKdsStore } from "@/features/kds/hooks/use-kds-store";
import {
  addKdsProducts,
  removeKdsProduct,
  selectKdsById,
} from "@/features/kds/services/kds.service";
import { useCatalogProductsQuery } from "@/features/products/hooks/use-product-queries";
import type { Product } from "@/features/products/types/product";

const LIST_PATH = "/ponto-de-venda/kds";

type KdsProductsPageProps = {
  kdsId: string;
};

function matchesSearch(product: Product, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return (
    product.name.toLowerCase().includes(query) ||
    product.sku.toLowerCase().includes(query)
  );
}

export function KdsProductsPage({ kdsId }: KdsProductsPageProps) {
  const kdsItems = useKdsStore();
  const kds = selectKdsById(kdsItems, kdsId);

  const productsQuery = useCatalogProductsQuery();
  const allProducts = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const linkedProducts = useMemo(() => {
    if (!kds) return [];
    const linked = new Set(kds.productIds);
    return allProducts.filter((product) => linked.has(product.id));
  }, [kds, allProducts]);

  const visibleProducts = useMemo(
    () => linkedProducts.filter((product) => matchesSearch(product, search)),
    [linkedProducts, search],
  );

  const availableProducts = useMemo(() => {
    if (!kds) return [];
    const linked = new Set(kds.productIds);
    return allProducts.filter((product) => !linked.has(product.id));
  }, [kds, allProducts]);

  if (!kds) {
    return (
      <Stack spacing={4}>
        <EntityFormHeader title="KDS não encontrado" backHref={LIST_PATH} />
        <Typography variant="body2" color="text.secondary">
          Este KDS não existe ou foi excluído.
        </Typography>
      </Stack>
    );
  }

  function handleConfirmProducts(productIds: string[]) {
    if (productIds.length === 0) {
      setPickerOpen(false);
      return;
    }

    addKdsProducts(kdsId, productIds);
    setPickerOpen(false);
    toast.success(
      productIds.length === 1
        ? "Produto vinculado ao KDS."
        : `${productIds.length} produtos vinculados ao KDS.`,
    );
  }

  function handleRemove(product: Product) {
    removeKdsProduct(kdsId, product.id);
    toast.success("Produto removido do KDS.", { description: product.name });
  }

  return (
    <ListPageShell>
      <Box
        sx={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <EntityFormHeader title={kds.name} subtitle="KDS" backHref={LIST_PATH} />
        <Button
          type="button"
          variant="contained"
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => setPickerOpen(true)}
        >
          Adicionar produtos
        </Button>
      </Box>

      <ListPagePanel>
        <Box sx={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <SearchInput
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busque por nome ou código…"
            sx={{ width: { xs: "100%", sm: 380 } }}
          />
        </Box>

        {productsQuery.isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar o catálogo"
            message={
              productsQuery.error instanceof Error
                ? productsQuery.error.message
                : "Erro inesperado"
            }
            onRetry={productsQuery.refetch}
          />
        ) : (
          <KdsProductsTable
            products={visibleProducts}
            isLoading={productsQuery.isLoading}
            onRemove={handleRemove}
          />
        )}
      </ListPagePanel>

      <ProductPickerDrawer
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        availableProducts={availableProducts}
        onConfirm={handleConfirmProducts}
        title="Adicionar produtos"
        description={`Selecione os produtos preparados no KDS ${kds.name}.`}
        renderSecondaryMeta={(product) =>
          `${product.sku || "sem SKU"} · ${product.category || "sem categoria"}`
        }
      />
    </ListPageShell>
  );
}
