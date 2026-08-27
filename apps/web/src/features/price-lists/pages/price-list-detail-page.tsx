"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Tune from "@mui/icons-material/Tune";

import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  EmptyState,
  PageHeader,
  ScrollArea,
  SearchInput,
  Stack,
  Typography,
} from "@/ui";
import { BackButton } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { PriceListAddProductsDrawer } from "@/features/price-lists/components/price-list-add-products-drawer";
import { PriceListBulkEditDialog } from "@/features/price-lists/components/price-list-bulk-edit-dialog";
import { PriceListDetailFooter } from "@/features/price-lists/components/price-list-detail-footer";
import { PriceListDetailHeader } from "@/features/price-lists/components/price-list-detail-header";
import { PriceListDetailSkeleton } from "@/features/price-lists/components/price-list-detail-skeleton";
import { PriceListInfoCards } from "@/features/price-lists/components/price-list-info-cards";
import { PriceListPricesTable } from "@/features/price-lists/components/price-list-prices-table";
import { usePriceListPricesForm } from "@/features/price-lists/hooks/use-price-list-prices-form";
import {
  usePriceListItemsQuery,
  usePriceListQuery,
} from "@/features/price-lists/hooks/use-price-list-queries";
import { listActiveCatalogProducts } from "@/features/products/lib/catalog-products";
import { useCatalogProductsQuery } from "@/features/products/hooks/use-product-queries";
import { surfaceBorderRadius } from "@/theme/surface-styles";
import type {
  PriceList,
  PriceListItemPrice,
} from "@/features/price-lists/types/price-list";
import type { Product } from "@/features/products/types/product";

type PriceListDetailPageProps = {
  priceListId: string;
};

export function PriceListDetailPage({ priceListId }: PriceListDetailPageProps) {
  const priceListQuery = usePriceListQuery(priceListId);

  if (priceListQuery.isLoading) {
    return <PriceListDetailSkeleton />;
  }

  if (priceListQuery.isError) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 3 }}>
        <PageHeader sx={{ flexShrink: 0, mb: 0 }} title="Lista de preços" />
        <ListLoadErrorAlert
          title="Não foi possível carregar a lista de preços"
          onRetry={() => void priceListQuery.refetch()}
        />
      </Box>
    );
  }

  const priceList = priceListQuery.data;
  if (!priceList) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          gap: 2,
        }}
      >
        <PageHeader sx={{ flexShrink: 0, mb: 0 }} title="Lista de preços" />
        <EmptyState
          icon={<InfoOutlined sx={{ fontSize: 24 }} />}
          title="Lista de preços não encontrada"
          description="A lista informada não existe ou foi removida."
          action={
            <BackButton
              href="/catalogo/lista-de-precos"
              label="Voltar para lista de preços"
            />
          }
        />
      </Box>
    );
  }

  return <PriceListDetailView key={priceList.id} priceList={priceList} />;
}

function PriceListDetailView({ priceList }: { priceList: PriceList }) {
  const productsQuery = useCatalogProductsQuery();
  const itemsQuery = usePriceListItemsQuery(priceList.id);
  const products = useMemo(
    () => listActiveCatalogProducts(productsQuery.data ?? []),
    [productsQuery.data],
  );

  if (itemsQuery.isLoading || productsQuery.isLoading) {
    return <PriceListDetailSkeleton />;
  }

  if (itemsQuery.isError) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 3 }}>
        <ListLoadErrorAlert
          title="Não foi possível carregar os produtos da lista"
          onRetry={() => void itemsQuery.refetch()}
        />
      </Box>
    );
  }

  return (
    <PriceListDetailContent
      key={priceList.id}
      priceList={priceList}
      products={products}
      initialItems={itemsQuery.data ?? []}
    />
  );
}

function matchesSearch(
  product: { name: string; sku: string },
  search: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    product.name.toLowerCase().includes(q) ||
    product.sku.toLowerCase().includes(q)
  );
}

function PriceListDetailContent({
  priceList,
  products,
  initialItems,
}: {
  priceList: PriceList;
  products: Product[];
  initialItems: PriceListItemPrice[];
}) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const {
    includedProducts,
    includedIds,
    getPrice,
    setPrice,
    addProducts,
    removeProducts,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    applyBulk,
    isDirty,
    hasSavedOnce,
    discard,
    save,
    isSaving,
  } = usePriceListPricesForm({
    list: priceList,
    products,
    initialItems,
  });

  const availableProducts = useMemo(
    () => products.filter((product) => !includedIds.has(product.id)),
    [products, includedIds],
  );

  const visibleProducts = useMemo(
    () => includedProducts.filter((product) => matchesSearch(product, search)),
    [includedProducts, search],
  );

  const allSelected =
    includedProducts.length > 0 &&
    includedProducts.every((product) => selectedIds.has(product.id));
  const someSelected = selectedIds.size > 0 && !allSelected;
  const hasProducts = includedProducts.length > 0;

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        m: -3,
        width: "calc(100% + 48px)",
      }}
    >
      <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3, pb: 2 }}>
          <PriceListDetailHeader priceListName={priceList.name} />
          <PriceListInfoCards
            priceList={priceList}
            productCount={includedProducts.length}
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: surfaceBorderRadius,
              bgcolor: "background.paper",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{
                alignItems: { sm: "center" },
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Produtos da lista
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Selecione os produtos que fazem parte desta lista e ajuste os
                  preços — individualmente ou em lote.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {hasProducts ? (
                  <SearchInput
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar produto…"
                    sx={{ width: { xs: 180, sm: 240 } }}
                  />
                ) : null}
                <Button
                  type="button"
                  variant="contained"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => setAddOpen(true)}
                >
                  Gerenciar produtos
                </Button>
              </Stack>
            </Stack>

            {selectedIds.size > 0 ? (
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: surfaceBorderRadius,
                  bgcolor: "action.hover",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedIds.size} selecionado
                  {selectedIds.size === 1 ? "" : "s"}
                </Typography>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<Tune sx={{ fontSize: 16 }} />}
                  onClick={() => setBulkOpen(true)}
                >
                  Editar valor
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlined sx={{ fontSize: 16 }} />}
                  onClick={() => removeProducts([...selectedIds])}
                >
                  Remover
                </Button>
                <Button type="button" variant="text" onClick={clearSelection}>
                  Limpar seleção
                </Button>
              </Stack>
            ) : null}

            {hasProducts ? (
              <PriceListPricesTable
                products={visibleProducts}
                getPrice={getPrice}
                onPriceChange={setPrice}
                onRemove={(id) => removeProducts([id])}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                allSelected={allSelected}
                someSelected={someSelected}
                onToggleSelectAll={toggleSelectAll}
                emptyMessage="Nenhum produto corresponde à busca."
              />
            ) : (
              <EmptyState
                icon={<AddIcon />}
                title="Nenhum produto nesta lista"
                description='Clique em “Gerenciar produtos” para selecionar quais produtos farão parte desta lista de preços.'
                action={
                  <Button
                    type="button"
                    variant="contained"
                    onClick={() => setAddOpen(true)}
                  >
                    Gerenciar produtos
                  </Button>
                }
              />
            )}
          </Box>
        </Box>
      </ScrollArea>

      <PriceListDetailFooter
        isDirty={isDirty}
        hasSavedOnce={hasSavedOnce}
        onDiscard={discard}
        onSave={() => void save()}
        isSaving={isSaving}
      />

      <PriceListAddProductsDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        availableProducts={availableProducts}
        onConfirm={addProducts}
      />

      <PriceListBulkEditDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        selectedCount={selectedIds.size}
        onApply={applyBulk}
      />
    </Box>
  );
}
