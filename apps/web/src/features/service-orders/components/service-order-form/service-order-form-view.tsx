"use client";

import { useState } from "react";
import { Page } from "@/components/ui/page";
import { useRouter } from "next/navigation";
import Stack from "@mui/material/Stack";
import { toast } from "@/ui";
import { ProductFormHeader } from "@/features/products/components/product-form-header";
import { ServiceOrderInfoSection } from "@/features/service-orders/components/service-order-form/service-order-info-section";
import { ServiceOrderEquipmentsSection } from "@/features/service-orders/components/service-order-form/service-order-equipments-section";
import { ServiceOrderLinesSection } from "@/features/service-orders/components/service-order-form/service-order-lines-section";
import { ServiceOrderBudgetSection } from "@/features/service-orders/components/service-order-form/service-order-budget-section";
import { ServiceOrderFormFooter } from "@/features/service-orders/components/service-order-form/service-order-form-footer";
import { ServiceOrderPaymentDialog } from "@/features/service-orders/components/service-order-payment-dialog";
import { useServiceOrderForm } from "@/features/service-orders/hooks/use-service-order-form";
import { useServiceOrderMutations } from "@/features/service-orders/hooks/use-service-order-mutations";
import { useServiceOrderStatusesQuery } from "@/features/service-orders/hooks/use-service-order-queries";
import { serviceOrderToFormValues } from "@/features/service-orders/lib/service-order-form-values";
import { computeServiceOrderTotal } from "@/features/service-orders/lib/service-order-totals";
import { listActiveServiceOrderStatuses } from "@/features/service-orders/services/service-order-status.service";
import type { ServiceOrder } from "@/features/service-orders/types/service-order";

const LIST_PATH = "/vendas/ordem-de-servicos";

type ServiceOrderFormViewProps = {
  /** OS existente = modo edição; ausente = nova OS. */
  order?: ServiceOrder;
};

export function ServiceOrderFormView({ order }: ServiceOrderFormViewProps) {
  const router = useRouter();
  const isEdit = order != null;
  useServiceOrderStatusesQuery();
  const mutations = useServiceOrderMutations();

  const defaultStatusId =
    listActiveServiceOrderStatuses().find((status) => status.baseType === "open")
      ?.id ??
    listActiveServiceOrderStatuses()[0]?.id ??
    "";

  const {
    values,
    setField,
    setBudgetField,
    updateEquipment,
    addEquipment,
    removeEquipment,
    updateLine,
    addLine,
    removeLine,
  } = useServiceOrderForm({
    initialValues: order ? serviceOrderToFormValues(order) : undefined,
    defaultStatusId,
  });

  const [saleTarget, setSaleTarget] = useState<ServiceOrder | null>(null);
  const isSaving =
    mutations.create.isPending || mutations.update.isPending;

  const total = computeServiceOrderTotal(values.lines);

  function validate(): boolean {
    if (!values.statusId) {
      toast.error("Selecione o status da OS.");
      return false;
    }
    if (!values.customerName.trim()) {
      toast.error("Selecione o cliente da OS.");
      return false;
    }
    if (
      values.equipments.length === 0 ||
      values.equipments.every((equipment) => !equipment.name.trim())
    ) {
      toast.error("Adicione ao menos um equipamento com nome.");
      return false;
    }
    return true;
  }

  function handleSave() {
    if (!validate() || isSaving) return;

    if (isEdit && order) {
      mutations.update.mutate(
        { id: order.id, values },
        { onSuccess: () => router.push(LIST_PATH) },
      );
      return;
    }

    mutations.create.mutate(values, {
      onSuccess: () => router.push(LIST_PATH),
    });
  }

  function handleSaveAndGenerateSale() {
    if (!validate() || isSaving) return;
    if (total <= 0) {
      toast.error("Lance ao menos um serviço ou produto para gerar a venda.");
      return;
    }

    const onSaved = (saved: ServiceOrder) => {
      setSaleTarget(saved);
    };

    if (isEdit && order) {
      mutations.update.mutate(
        { id: order.id, values },
        { onSuccess: onSaved },
      );
      return;
    }

    mutations.create.mutate(values, { onSuccess: onSaved });
  }

  return (
    <Page
      footer={
        <>
        <ServiceOrderFormFooter
          code={order?.code ?? "nova OS"}
          total={total}
          canGenerateSale={total > 0 && !isSaving}
          onSave={handleSave}
          onSaveAndGenerateSale={handleSaveAndGenerateSale}
        />
        <ServiceOrderPaymentDialog
          order={saleTarget}
          onOpenChange={(open) => {
            if (!open) setSaleTarget(null);
          }}
          onCompleted={() => {
            router.push(LIST_PATH);
          }}
        />
        </>
      }
    >
      <Stack spacing={3} sx={{ pb: 2 }}>
        <ProductFormHeader
          title={isEdit ? `Editar ${order.code}` : "Nova ordem de serviço"}
          subtitle="Ordem de serviço"
          backHref={LIST_PATH}
        />

        <ServiceOrderInfoSection
          code={order?.code ?? "Gerado ao salvar"}
          values={values}
          onFieldChange={setField}
        />

        <ServiceOrderEquipmentsSection
          equipments={values.equipments}
          onUpdate={updateEquipment}
          onAdd={addEquipment}
          onRemove={removeEquipment}
        />

        <ServiceOrderLinesSection
          lines={values.lines}
          onUpdate={updateLine}
          onAdd={addLine}
          onRemove={removeLine}
        />

        <ServiceOrderBudgetSection
          budget={values.budget}
          onBudgetChange={setBudgetField}
        />
      </Stack>
    </Page>
  );
}
