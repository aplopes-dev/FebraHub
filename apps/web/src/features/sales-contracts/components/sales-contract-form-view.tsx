"use client";

import { useMemo } from "react";
import { Page } from "@/components/ui/page";
import { useRouter } from "next/navigation";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { SalesContractFormFooter } from "@/features/sales-contracts/components/sales-contract-form-footer";
import { SalesContractFormHeader } from "@/features/sales-contracts/components/sales-contract-form-header";
import { SalesContractGeneralSection } from "@/features/sales-contracts/components/sales-contract-general-section";
import { SalesContractItemsSection } from "@/features/sales-contracts/components/sales-contract-items-section";
import { SalesContractPaymentSection } from "@/features/sales-contracts/components/sales-contract-payment-section";
import { useSalesContractForm } from "@/features/sales-contracts/hooks/use-sales-contract-form";
import {
  listAvailableProducts,
  listPaymentMethods,
  listSalesContractSellers,
} from "@/features/sales-contracts/services/sales-contract.service";
import { useSelectableCustomersQuery } from "@/features/customers/hooks/use-customer-queries";
import type { SalesContractFormValues } from "@/features/sales-contracts/types/sales-contract-form";

type SalesContractFormViewProps = {
  contractId?: string;
  title?: string;
  subtitle?: string;
  initialValues?: SalesContractFormValues;
  formKey?: string;
};

export function SalesContractFormView({
  contractId,
  title = "Novo contrato",
  subtitle = "Contrato de venda",
  initialValues,
  formKey = "create",
}: SalesContractFormViewProps) {
  const router = useRouter();
  const products = useMemo(() => listAvailableProducts(), []);
  const paymentMethods = useMemo(() => listPaymentMethods(), []);
  const sellers = useMemo(() => listSalesContractSellers(), []);
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
    addProducts,
    removeProduct,
    setQuantity,
    setUnitPrice,
    discard,
    save,
  } = useSalesContractForm({
    contractId,
    initialValues,
    products,
    customers,
    onSaved: () => {
      router.push("/vendas/contratos-de-vendas");
    },
  });

  return (
    <Page
      key={formKey}
      footer={
        <SalesContractFormFooter
          isDirty={isDirty}
          hasSavedOnce={hasSavedOnce}
          onDiscard={discard}
          onSave={save}
        />
      }
    >
      <Stack spacing={3} sx={{ pb: 2 }}>
        <SalesContractFormHeader title={title} subtitle={subtitle} />

        <Stack spacing={4} divider={<Divider flexItem />}>
          <SalesContractGeneralSection
            values={values}
            customers={customers}
            sellers={sellers}
            onFieldChange={setField}
            onCustomerCreated={() => {}}
          />
          <SalesContractItemsSection
            includedProducts={includedProducts}
            includedIds={includedIds}
            allProducts={products}
            getLine={getLine}
            onQuantityChange={setQuantity}
            onUnitPriceChange={setUnitPrice}
            onRemove={removeProduct}
            onAddProducts={addProducts}
          />
          <SalesContractPaymentSection
            values={values}
            paymentMethods={paymentMethods}
            onFieldChange={setField}
          />
        </Stack>
      </Stack>
    </Page>
  );
}
