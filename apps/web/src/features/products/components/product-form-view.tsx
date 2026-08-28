"use client";

import { useState } from "react";
import { Page } from "@/components/ui/page";
import Stack from "@mui/material/Stack";
import { Divider } from "@/ui";
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
    <Page
      footer={
        <ProductFormFooter
          isDirty={isDirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={isSaving}
          onDiscard={discard}
          onSave={save}
        />
      }
    >
      <Stack
        spacing={2}
        sx={{ minWidth: 0, maxWidth: "100%" }}
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
                productType={values.type}
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
              currentProductId={productId}
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
    </Page>
  );
}
