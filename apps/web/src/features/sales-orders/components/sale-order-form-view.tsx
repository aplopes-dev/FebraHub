"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ScrollArea } from "@/ui";
import { formSplitLayoutGridSx } from "@/components/ui/form";
import { SaleOrderCustomerPanel } from "@/features/sales-orders/components/sale-order-customer-panel";
import { SaleOrderFormFooter } from "@/features/sales-orders/components/sale-order-form-footer";
import { SaleOrderFormHeader } from "@/features/sales-orders/components/sale-order-form-header";
import { SaleOrderInfoPanel } from "@/features/sales-orders/components/sale-order-info-panel";
import { SaleOrderNotesPanel } from "@/features/sales-orders/components/sale-order-notes-panel";
import { SaleOrderPaymentsPanel } from "@/features/sales-orders/components/sale-order-payments-panel";
import { SaleOrderProductsPanel } from "@/features/sales-orders/components/sale-order-products-panel";
import { useSaleOrderForm } from "@/features/sales-orders/hooks/use-sale-order-form";
import { createEmptySaleOrderFormValues } from "@/features/sales-orders/lib/sale-order-form-values";
import { listPaymentMethods } from "@/features/sales-orders/services/sale-order-list.service";
import { useSaleOrderSellersQuery } from "@/features/sales-orders/hooks/use-sale-order-sellers-query";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import { useSelectableCustomersQuery } from "@/features/customers/hooks/use-customer-queries";
import { useCatalogProductsQuery } from "@/features/products/hooks/use-product-queries";
import { useAllStocksQuery } from "@/features/stock/hooks/use-stock-queries";
import type { SaleOrderFormValues } from "@/features/sales-orders/types/sale-order-form";
import type {
  SaleOrderChannelId,
  SaleOrderStatus,
} from "@/features/sales-orders/types/sale-order";

type SaleOrderFormViewProps = {
  headerTitle?: string;
  headerSubtitle?: string;
  backHref?: string;
  /** Status inicial do formulário (default: "open", o mesmo de Pedidos de venda). */
  initialStatus?: SaleOrderStatus;
  /** Trava o campo Status na opção inicial (ex.: tela de Vendas, sempre "Fechado"). */
  statusLocked?: boolean;
  /**
   * Só visualização (cancelado ou estoque já movimentado).
   * Esconde o rodapé de salvar e bloqueia interação nos campos.
   */
  readOnly?: boolean;
  /** Motivo exibido no Alert quando `readOnly` (default genérico). */
  readOnlyReason?: string;
  /** Rota de redirecionamento após salvar (default: lista de Pedidos de venda). */
  redirectPath?: string;
  /** Presente em modo de edição — id do pedido carregado, dispara `updateSaleOrder`. */
  orderId?: string;
  /** Valores iniciais do formulário (edição, a partir de um pedido existente). */
  initialValues?: SaleOrderFormValues;
  /** Canal de origem (exibição read-only no painel de informações). */
  channelId?: SaleOrderChannelId;
  /** Número do pedido operacional de delivery vinculado. */
  posDeliveryOrderNumber?: number | null;
  /** Entrega vs retirada do pedido operacional. */
  posDeliveryFulfillment?: "delivery" | "pickup" | null;
  /** `key` do formulário — força reset ao trocar de pedido. */
  formKey?: string;
};

export function SaleOrderFormView({
  headerTitle,
  headerSubtitle,
  backHref,
  initialStatus,
  statusLocked = false,
  readOnly = false,
  readOnlyReason,
  redirectPath = "/vendas/pedidos-de-venda",
  orderId,
  initialValues,
  channelId,
  posDeliveryOrderNumber,
  posDeliveryFulfillment,
  formKey = "create",
}: SaleOrderFormViewProps = {}) {
  const router = useRouter();

  const productsQuery = useCatalogProductsQuery();
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

  const paymentMethods = useMemo(() => listPaymentMethods(), []);
  const bankAccountsQuery = useBankAccountOptionsQuery();
  const bankAccounts = bankAccountsQuery.data ?? [];
  const sellersQuery = useSaleOrderSellersQuery();
  const sellers = sellersQuery.data ?? [];
  const customersQuery = useSelectableCustomersQuery();
  const customers = customersQuery.data ?? [];

  const {
    values,
    isDirty,
    hasSavedOnce,
    includedIds,
    includedProducts,
    getLine,
    setField,
    setStatus,
    setDeliveryFee,
    setDiscounts,
    setQuantity,
    setUnitPrice,
    addProducts,
    removeProduct,
    addPayment,
    removePayment,
    updatePayment,
    discard,
    save,
    isSaving,
  } = useSaleOrderForm({
    products,
    customers,
    sellers,
    orderId: readOnly ? undefined : orderId,
    initialValues:
      initialValues ??
      (initialStatus
        ? { ...createEmptySaleOrderFormValues(), status: initialStatus }
        : undefined),
    onSaved: () => {
      router.push(redirectPath);
    },
  });

  // Preenche o estoque padrão assim que a lista carrega, se o pedido ainda não tem um definido.
  useEffect(() => {
    if (readOnly || values.warehouseId) return;
    const firstWarehouse = warehouses[0];
    if (firstWarehouse) setField("warehouseId", firstWarehouse.id);
  }, [readOnly, values.warehouseId, warehouses, setField]);

  const alertMessage =
    readOnlyReason ??
    "Este registro não pode mais ser editado. Os dados estão disponíveis apenas para visualização.";

  return (
    <Box
      key={formKey}
      component="section"
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: "column",
        overflow: "hidden",
        m: -3,
        width: "calc(100% + 48px)",
      }}
    >
      <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
        <Stack spacing={3} sx={{ px: 3, pt: 3, pb: 2 }}>
          <SaleOrderFormHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            backHref={backHref}
          />
          {readOnly ? <Alert severity="info">{alertMessage}</Alert> : null}
          <Box
            component="fieldset"
            disabled={readOnly}
            aria-label={readOnly ? "Dados somente para visualização" : undefined}
            sx={{
              ...formSplitLayoutGridSx,
              border: 0,
              m: 0,
              p: 0,
              minWidth: 0,
              ...(readOnly
                ? {
                    cursor: "not-allowed",
                    // Cinza bem claro — `action.disabledBackground` fica escuro
                    // demais no tema do ERP e parece “campo sujo”, não só leitura.
                    // Inclui `MuiPickers*` (DatePicker MUI X usa root próprio,
                    // não `MuiInputBase`).
                    "& .MuiInputBase-root, & .MuiPickersOutlinedInput-root, & .MuiPickersFilledInput-root, & .MuiPickersInputBase-root":
                      {
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "action.hover"
                            : "grey.50",
                      },
                    "& .MuiInputBase-input, & .MuiPickersSectionList-root, & .MuiPickersInputBase-sectionsContainer, & .MuiPickersOutlinedInput-sectionsContainer":
                      {
                        WebkitTextFillColor: (theme) =>
                          theme.palette.text.secondary,
                        color: "text.secondary",
                      },
                    "& .MuiFormLabel-root, & .MuiSvgIcon-root, & .MuiPickersInputBase-root .MuiSvgIcon-root":
                      {
                        color: "text.secondary",
                      },
                    "& .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-notchedOutline":
                      {
                        borderColor: "divider",
                      },
                    "& button:disabled": {
                      color: "text.secondary",
                      opacity: 0.7,
                    },
                  }
                : {}),
            }}
          >
            <Stack spacing={3}>
              <SaleOrderProductsPanel
                warehouseId={values.warehouseId}
                warehouses={warehouses}
                disabled={readOnly}
                onWarehouseChange={(warehouseId) =>
                  setField("warehouseId", warehouseId)
                }
                includedProducts={includedProducts}
                includedIds={includedIds}
                allProducts={products}
                getLine={getLine}
                onQuantityChange={setQuantity}
                onUnitPriceChange={setUnitPrice}
                onRemove={removeProduct}
                onAddProducts={addProducts}
              />
              <SaleOrderPaymentsPanel
                values={values}
                paymentMethods={paymentMethods}
                bankAccounts={bankAccounts}
                disabled={readOnly}
                onAddPayment={addPayment}
                onRemovePayment={removePayment}
                onUpdatePayment={updatePayment}
                onDeliveryFeeChange={setDeliveryFee}
                onDiscountsChange={setDiscounts}
              />
            </Stack>

            <Stack
              spacing={3}
              sx={{
                position: { lg: "sticky" },
                top: { lg: 0 },
              }}
            >
              <SaleOrderCustomerPanel
                customerId={values.customerId}
                customers={customers}
                disabled={readOnly}
                onCustomerChange={(customerId) =>
                  setField("customerId", customerId)
                }
                onCustomerCreated={() => {}}
              />
              <SaleOrderInfoPanel
                soldAt={values.soldAt}
                status={values.status}
                sellerId={values.sellerId}
                sellers={sellers}
                channelId={channelId}
                posDeliveryOrderNumber={posDeliveryOrderNumber}
                posDeliveryFulfillment={posDeliveryFulfillment}
                onSoldAtChange={(soldAt) => setField("soldAt", soldAt)}
                onStatusChange={setStatus}
                onSellerChange={(sellerId) => setField("sellerId", sellerId)}
                statusLocked={statusLocked || readOnly}
                disabled={readOnly}
              />
              <SaleOrderNotesPanel
                notes={values.notes}
                disabled={readOnly}
                onNotesChange={(notes) => setField("notes", notes)}
              />
            </Stack>
          </Box>
        </Stack>
      </ScrollArea>

      {readOnly ? null : (
        <SaleOrderFormFooter
          isDirty={isDirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={isSaving}
          onDiscard={discard}
          onSave={save}
        />
      )}
    </Box>
  );
}
