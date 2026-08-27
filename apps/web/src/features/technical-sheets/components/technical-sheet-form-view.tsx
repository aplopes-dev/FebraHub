"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import { Divider, ScrollArea } from "@/ui";
import { CostPricingSection } from "@/features/technical-sheets/components/cost-pricing-section";
import { ProductCompositionSection } from "@/features/technical-sheets/components/product-composition-section";
import { ProductionTypeSelector } from "@/features/technical-sheets/components/production-type-selector";
import { TechnicalSheetFormFooter } from "@/features/technical-sheets/components/technical-sheet-form-footer";
import { TechnicalSheetFormHeader } from "@/features/technical-sheets/components/technical-sheet-form-header";
import { TechnicalSheetTabs } from "@/features/technical-sheets/components/technical-sheet-tabs";
import { VariationsCompositionSection } from "@/features/technical-sheets/components/variations-composition-section";
import { useTechnicalSheetForm } from "@/features/technical-sheets/hooks/use-technical-sheet-form";
import { computeTotalCost } from "@/features/technical-sheets/lib/technical-sheet-cost";
import type { CompositionComponentOption } from "@/features/technical-sheets/types/composition-component-option";
import type {
  TechnicalSheetFormTab,
  TechnicalSheetFormValues,
} from "@/features/technical-sheets/types/technical-sheet";

type TechnicalSheetFormViewProps = {
  productName: string;
  initialValues?: TechnicalSheetFormValues;
  formKey?: string;
  componentOptions: CompositionComponentOption[];
  onSave: (values: TechnicalSheetFormValues) => Promise<void> | void;
  isSaving?: boolean;
};

export function TechnicalSheetFormView({
  productName,
  initialValues,
  formKey,
  componentOptions,
  onSave,
  isSaving = false,
}: TechnicalSheetFormViewProps) {
  return (
    <TechnicalSheetFormViewInner
      key={formKey ?? "default"}
      productName={productName}
      initialValues={initialValues}
      componentOptions={componentOptions}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}

function TechnicalSheetFormViewInner({
  productName,
  initialValues,
  componentOptions,
  onSave,
  isSaving,
}: {
  productName: string;
  initialValues?: TechnicalSheetFormValues;
  componentOptions: CompositionComponentOption[];
  onSave: (values: TechnicalSheetFormValues) => Promise<void> | void;
  isSaving: boolean;
}) {
  const { values, setField, isDirty, hasSavedOnce, discard, save } =
    useTechnicalSheetForm({ initialValues, onSave });
  const [tab, setTab] = useState<TechnicalSheetFormTab>("product");

  const showVariations = values.productionType === "automatic";
  const activeTab: TechnicalSheetFormTab = showVariations ? tab : "product";
  const totalCost = computeTotalCost(values.components);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
        m: -3,
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
      }}
    >
      <ScrollArea sx={{ minHeight: 0, flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            px: 3,
            pt: 3,
            pb: 4,
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <TechnicalSheetFormHeader productName={productName} />

          <Box sx={{ display: "flex", justifyContent: "flex-start", mt: -1 }}>
            <ProductionTypeSelector
              value={values.productionType}
              onChange={(productionType) =>
                setField("productionType", productionType)
              }
            />
          </Box>

          <TechnicalSheetTabs
            value={activeTab}
            onValueChange={setTab}
            showVariations={showVariations}
            productContent={
              <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <ProductCompositionSection
                  components={values.components}
                  maxRemovableComponents={values.maxRemovableComponents}
                  componentOptions={componentOptions}
                  onComponentsChange={(components) =>
                    setField("components", components)
                  }
                  onMaxRemovableChange={(max) =>
                    setField("maxRemovableComponents", max)
                  }
                />
                <Divider />
                <CostPricingSection
                  totalCost={totalCost}
                  value={values.cost}
                  onChange={(cost) => setField("cost", cost)}
                />
              </Box>
            }
            variationsContent={
              <VariationsCompositionSection
                variations={values.variations}
                componentOptions={componentOptions}
                onChange={(variations) => setField("variations", variations)}
              />
            }
          />
        </Box>
      </ScrollArea>
      <TechnicalSheetFormFooter
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
