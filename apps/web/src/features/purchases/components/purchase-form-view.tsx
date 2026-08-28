"use client";

import { useMemo, useState } from "react";
import { Page } from "@/components/ui/page";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { toast } from "@/ui";
import { formSplitLayoutGridSx } from "@/components/ui/form/form-section-styles";
import { useCatalogScope } from "@/lib/organization-context";
import { listAllProducts } from "@/features/products/api/products.service";
import { useCarrierOptionsQuery } from "@/features/carriers/hooks/use-carrier-queries";
import { useAllStocksQuery } from "@/features/stock/hooks/use-stock-queries";
import { useActiveSuppliersQuery } from "@/features/suppliers/hooks/use-supplier-queries";
import { PurchaseExtrasDialog } from "@/features/purchases/components/purchase-extras-dialog";
import { PurchaseFormFooter } from "@/features/purchases/components/purchase-form-footer";
import { PurchaseFormHeader } from "@/features/purchases/components/purchase-form-header";
import { PurchaseInfoPanel } from "@/features/purchases/components/purchase-info-panel";
import { PurchaseProductsPanel } from "@/features/purchases/components/purchase-products-panel";
import {
  PurchaseReceiveConfirmDialog,
} from "@/features/purchases/components/purchase-receive-confirm-dialog";
import { PurchaseSupplierPanel } from "@/features/purchases/components/purchase-supplier-panel";
import { usePurchaseForm } from "@/features/purchases/hooks/use-purchase-form";
import type {
  PurchaseDeliveryStatus,
  PurchaseFormValues,
  SupplierOption,
} from "@/features/purchases/types/purchase";

type PurchaseFormViewProps = {
  purchaseId?: string;
  title?: string;
  initialValues?: PurchaseFormValues;
  /** Compra já gerou estoque — só visualização. */
  readOnly?: boolean;
};

export function PurchaseFormView({
  purchaseId,
  title = "Nova compra",
  initialValues,
  readOnly = false,
}: PurchaseFormViewProps = {}) {
  const router = useRouter();
  const { scope, ready } = useCatalogScope();
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const isEdit = Boolean(purchaseId);

  const productsQuery = useQuery({
    queryKey: ["api", "products", "trackable", scope],
    queryFn: () => listAllProducts({ trackStock: true }),
    enabled: ready,
  });
  const products = productsQuery.data ?? [];

  const stocksQuery = useAllStocksQuery();
  const warehouses = useMemo(
    () =>
      (stocksQuery.data ?? []).map((stock) => ({
        id: stock.id,
        name: stock.name,
      })),
    [stocksQuery.data],
  );

  const suppliersQuery = useActiveSuppliersQuery();
  const suppliers = useMemo<SupplierOption[]>(
    () =>
      (suppliersQuery.data ?? []).map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        phone:
          supplier.contact.commercialPhone || supplier.contact.mobilePhone,
        email: supplier.contact.email,
      })),
    [suppliersQuery.data],
  );

  const carriersQuery = useCarrierOptionsQuery();
  const carriers = carriersQuery.data ?? [];

  const {
    values,
    isDirty,
    hasSavedOnce,
    isSaving,
    includedIds,
    includedProducts,
    getLine,
    setField,
    setExtras,
    setQuantity,
    setCostPrice,
    setLineStatus,
    applyReceiveConfirmation,
    addProducts,
    removeProduct,
    discard,
    save,
  } = usePurchaseForm({
    products,
    // Sempre o id real: zerá-lo no modo leitura fazia o hook cair no ramo de
    // criação (`if (purchaseId) update... else create`) — qualquer save que
    // escapasse gravaria uma compra DUPLICADA em vez de falhar. O bloqueio de
    // edição é o `readOnly` do formulário, não a ausência do id.
    purchaseId,
    initialValues,
    onSaved: () => {
      router.push("/estoque/compras");
    },
  });

  function handleDeliveryStatusChange(status: PurchaseDeliveryStatus) {
    if (readOnly) return;
    setField("deliveryStatus", status);
  }

  function handleSave() {
    if (readOnly) return;
    if (values.lines.length === 0) {
      toast.error("Adicione ao menos um produto à compra.");
      return;
    }
    if (values.deliveryStatus === "received") {
      setReceiveOpen(true);
      return;
    }
    void save();
  }

  function handleReceiveConfirm(
    drafts: Parameters<typeof applyReceiveConfirmation>[0],
  ) {
    const next = applyReceiveConfirmation(drafts);
    setReceiveOpen(false);
    void save(next);
  }

  return (
    <Page
      footer={
        <>
        {readOnly ? null : (
          <PurchaseFormFooter
            isDirty={isDirty}
            hasSavedOnce={hasSavedOnce}
            isSaving={isSaving}
            savedLabel={isEdit ? "Alterações salvas" : "Compra salva"}
            onDiscard={discard}
            onSave={handleSave}
          />
        )}
        {/*
          Renderizados em portal, fora da subárvore bloqueada — montá-los no modo
          leitura deixava os campos 100% clicáveis e o "Aplicar" mutava o
          formulário de uma compra já recebida.
        */}
        {readOnly ? null : (
          <>
            <PurchaseExtrasDialog
              open={extrasOpen}
              onOpenChange={setExtrasOpen}
              value={values.extras}
              carriers={carriers}
              onApply={setExtras}
            />
            <PurchaseReceiveConfirmDialog
              open={receiveOpen}
              products={products}
              lines={values.lines}
              onClose={() => setReceiveOpen(false)}
              onConfirm={handleReceiveConfirm}
            />
          </>
        )}
        </>
      }
    >
      <Stack spacing={3} sx={{ minWidth: 0, maxWidth: "100%" }}>
        <PurchaseFormHeader title={title} />

        {readOnly ? (
          <Alert severity="info">
            Esta compra já foi recebida e o estoque foi atualizado. Os dados
            estão disponíveis apenas para visualização.
          </Alert>
        ) : null}

        {/*
          `pointerEvents: none` sozinho não bloqueava nada de verdade: o
          teclado o ignora, então dava para chegar em quantidade, custo,
          série, NF, fornecedor e status por Tab e editar uma compra que já
          gerou entrada no estoque. O `fieldset disabled` fecha o caminho do
          teclado (e tira os controles da ordem de tabulação); o
          `pointerEvents` continua cobrindo os controles compostos do
          `@/ui`, que não herdam o estado do fieldset. Os diálogos e o
          picker de produtos, que renderizam em portal — FORA desta subárvore
          —, deixam de ser montados no modo leitura (ver final do arquivo).
        */}
        <Box
          component="fieldset"
          disabled={readOnly}
          sx={{
            ...formSplitLayoutGridSx,
            border: 0,
            p: 0,
            m: 0,
            minInlineSize: 0,
            ...(readOnly
              ? {
                  pointerEvents: "none",
                  opacity: 0.92,
                }
              : {}),
          }}
        >
          <Stack spacing={3}>
            <PurchaseProductsPanel
              warehouseId={values.warehouseId}
              warehouses={warehouses}
              onWarehouseChange={(warehouseId) =>
                setField("warehouseId", warehouseId)
              }
              includedProducts={includedProducts}
              includedIds={includedIds}
              allProducts={products}
              getLine={getLine}
              onQuantityChange={setQuantity}
              onCostPriceChange={setCostPrice}
              onStatusChange={setLineStatus}
              onRemove={removeProduct}
              onAddProducts={addProducts}
            />
          </Stack>

          <Stack spacing={3}>
            <PurchaseSupplierPanel
              supplierId={values.supplierId}
              suppliers={suppliers}
              onSupplierChange={(supplierId) =>
                setField("supplierId", supplierId)
              }
            />
            <PurchaseInfoPanel
              values={values}
              onPurchasedAtChange={(purchasedAt) =>
                setField("purchasedAt", purchasedAt)
              }
              onSeriesChange={(series) => setField("series", series)}
              onInvoiceNumberChange={(invoiceNumber) =>
                setField("invoiceNumber", invoiceNumber)
              }
              onNotesChange={(notes) => setField("notes", notes)}
              onDeliveryStatusChange={handleDeliveryStatusChange}
              onOpenExtras={() => setExtrasOpen(true)}
            />
          </Stack>
        </Box>
      </Stack>
    </Page>
  );
}
