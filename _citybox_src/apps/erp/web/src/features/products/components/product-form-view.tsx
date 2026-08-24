"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Divider, ScrollArea } from "@citybox/mui";
import { ProductBasicsSection } from "@/features/products/components/product-basics-section";
import { ProductAddonsSection } from "@/features/products/components/product-addons-section";
import { ProductFormFooter } from "@/features/products/components/product-form-footer";
import { ProductFormHeader } from "@/features/products/components/product-form-header";
import { ProductFormTabs } from "@/features/products/components/product-form-tabs";
import { ProductUnitsSection } from "@/features/products/components/product-units-section";
import { ProductAvailabilitySection } from "@/features/products/components/product-availability-section";
import { ProductSuppliersSection } from "@/features/products/components/product-suppliers-section";
import { ProductSuggestionsSection } from "@/features/products/components/product-suggestions-section";
import { ProductVariantsSection } from "@/features/products/components/product-variants-section";
import { useProductForm } from "@/features/products/hooks/use-product-form";
import type {
  ProductCreateFormValues,
  ProductFormTab,
} from "@/features/products/types/product-create";

type ProductFormViewProps = {
  title: string;
  initialValues?: ProductCreateFormValues;
  /** Remonta o form ao trocar de produto (edição). */
  formKey?: string;
  /** Presente = edição (PUT); ausente = criação (POST). */
  productId?: string;
};

export function ProductFormView({
  title,
  initialValues,
  formKey,
  productId,
}: ProductFormViewProps) {
  return (
    <ProductFormViewInner
      key={formKey ?? "create"}
      title={title}
      initialValues={initialValues}
      productId={productId}
    />
  );
}

function ProductFormViewInner({
  title,
  initialValues,
  productId,
}: {
  title: string;
  initialValues?: ProductCreateFormValues;
  productId?: string;
}) {
  const {
    values,
    setField,
    setImage,
    isDirty,
    hasSavedOnce,
    isSaving,
    discard,
    save,
  } = useProductForm({ initialValues, productId });
  const [tab, setTab] = useState<ProductFormTab>("basics");

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
        // Cancela o `p: 3` do <main> — footer cola na base e nas laterais.
        m: -3,
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
      }}
    >
      <ScrollArea sx={{ minHeight: 0, flex: 1, minWidth: 0 }}>
        <Stack
          spacing={2}
          sx={{ px: 3, pt: 3, pb: 2, minWidth: 0, maxWidth: "100%" }}
        >
          <ProductFormHeader title={title} subtitle="Produto" />

          <ProductFormTabs
            value={tab}
            onValueChange={setTab}
            basicsContent={
              <Stack spacing={5}>
                <ProductBasicsSection
                  values={values}
                  onFieldChange={setField}
                  onImageChange={setImage}
                />
                <Divider />
                <ProductUnitsSection
                  selectedUnitIds={values.selectedUnitIds}
                  onSelectedUnitIdsChange={(unitIds) =>
                    setField("selectedUnitIds", unitIds)
                  }
                />
                <Divider />
                <ProductAvailabilitySection
                  value={values.availability}
                  onChange={(availability) =>
                    setField("availability", availability)
                  }
                />
                <Divider />
                <ProductSuppliersSection
                  value={values.suppliers}
                  onChange={(suppliers) => setField("suppliers", suppliers)}
                />
              </Stack>
            }
            variantsContent={
              <ProductVariantsSection
                variationFormat={values.variationFormat}
                productVariations={values.productVariations}
                onChange={({ variationFormat, productVariations }) => {
                  setField("variationFormat", variationFormat);
                  setField("productVariations", productVariations);
                }}
              />
            }
            addonsContent={
              <ProductAddonsSection
                value={values.addons}
                onChange={(addons) => setField("addons", addons)}
              />
            }
            suggestionsContent={
              <ProductSuggestionsSection
                value={values.suggestions}
                currentProductId={productId}
                onChange={(suggestions) => setField("suggestions", suggestions)}
              />
            }
          />
        </Stack>
      </ScrollArea>

      <ProductFormFooter
        isDirty={isDirty}
        hasSavedOnce={hasSavedOnce}
        isSaving={isSaving}
        onDiscard={discard}
        onSave={save}
      />
    </Box>
  );
}
