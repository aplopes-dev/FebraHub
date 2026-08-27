"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { toast } from "@/ui";
import { Divider, ScrollArea } from "@/ui";
import { EntityFormFooter } from "@/components/ui/form/entity-form-footer";
import { EntityFormHeader } from "@/components/ui/form/entity-form-header";
import { StockGeneralSection } from "@/features/stock/components/stock-general-section";
import { StockUnitsSection } from "@/features/stock/components/stock-units-section";
import {
  createEmptyStockFormValues,
  toSaveStockPayload,
} from "@/features/stock/api/stock.mapper";
import {
  useCreateStockMutation,
  useUpdateStockMutation,
} from "@/features/stock/hooks/use-stock-mutations";
import type { StockFormValues } from "@/features/stock/types/stock";

type StockFormViewProps = {
  title: string;
  /** Id do estoque em edição; ausente para criação. */
  stockId?: string;
  initialValues?: StockFormValues;
};

export function StockFormView({
  title,
  stockId,
  initialValues,
}: StockFormViewProps) {
  const router = useRouter();
  const [values, setValues] = useState<StockFormValues>(
    initialValues ?? createEmptyStockFormValues(),
  );
  const createMutation = useCreateStockMutation();
  const updateMutation = useUpdateStockMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function setField<K extends keyof StockFormValues>(
    key: K,
    value: StockFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!values.name.trim()) {
      toast.error("Informe o nome do estoque.");
      return;
    }

    const payload = toSaveStockPayload(values);
    const onSuccess = () => {
      router.push("/estoque");
    };

    if (stockId) {
      updateMutation.mutate({ id: stockId, payload }, { onSuccess });
    } else {
      createMutation.mutate(payload, { onSuccess });
    }
  }

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
        width: "calc(100% + 48px)",
      }}
    >
      <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
        <Stack spacing={4} sx={{ px: 3, pt: 3, pb: 2 }}>
          <EntityFormHeader
            title={title}
            subtitle="Estoque"
            backHref="/estoque"
          />

          <StockGeneralSection
            name={values.name}
            location={values.location}
            property={values.property}
            onNameChange={(name) => setField("name", name)}
            onLocationChange={(location) => setField("location", location)}
            onPropertyChange={(property) => setField("property", property)}
          />

          <Divider />

          <StockUnitsSection
            selectedUnitIds={values.unitIds}
            onSelectedUnitIdsChange={(unitIds) => setField("unitIds", unitIds)}
          />
        </Stack>
      </ScrollArea>

      <EntityFormFooter
        mode="simple"
        ariaLabel="Ações do formulário de estoque"
        isSaving={isSaving}
        onCancel={() => router.push("/estoque")}
        onSave={handleSave}
      />
    </Box>
  );
}
