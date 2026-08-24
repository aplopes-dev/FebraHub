"use client";

import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { PageHeader } from "@citybox/mui";
import { BackButton } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { TechnicalSheetDetailSkeleton } from "@/features/technical-sheets/components/technical-sheet-detail-skeleton";
import { TechnicalSheetFormView } from "@/features/technical-sheets/components/technical-sheet-form-view";
import { detailToFormValues } from "@/features/technical-sheets/api/technical-sheets.service";
import { useTechnicalSheetDetailQuery } from "@/features/technical-sheets/hooks/use-technical-sheet-queries";
import { useUpsertTechnicalSheetMutation } from "@/features/technical-sheets/hooks/use-technical-sheet-mutations";
import { useSupplyComponentOptionsQuery } from "@/features/technical-sheets/hooks/use-technical-sheet-queries";
import { buildVariationCompositionsForProduct } from "@/features/technical-sheets/lib/product-variation-compositions";
import { createEmptyTechnicalSheetFormValues } from "@/features/technical-sheets/lib/technical-sheet-form-values";
import type { TechnicalSheetFormValues } from "@/features/technical-sheets/types/technical-sheet";
import { useProductQuery } from "@/features/products/hooks/use-product-queries";
import { useAllVariationsQuery } from "@/features/variations/hooks/use-variation-queries";
import {
  createAttachedVariation,
  type ProductAttachedVariation,
} from "@/features/products/types/product-create";
import type { ProductDto } from "@/features/products/api/product.dto";

type TechnicalSheetDetailPageProps = { productId: string };

function mapProductVariations(
  dto: ProductDto | undefined,
): ProductAttachedVariation[] {
  if (!dto?.variations?.length) return [];
  return dto.variations.map((link) =>
    createAttachedVariation(link.variationId, link.optionIds, {
      minChoices: link.minChoices,
      maxChoices: link.maxChoices,
      optionOverrides: link.optionOverrides.map((override) => ({
        optionId: override.optionId,
        extraPrice: (override.priceCents ?? 0) / 100,
        barcode: override.barcode ?? "",
      })),
    }),
  );
}

export function TechnicalSheetDetailPage({
  productId,
}: TechnicalSheetDetailPageProps) {
  const detailQuery = useTechnicalSheetDetailQuery(productId);
  const productQuery = useProductQuery(productId);
  const variationsQuery = useAllVariationsQuery();
  const suppliesQuery = useSupplyComponentOptionsQuery();
  const upsertMutation = useUpsertTechnicalSheetMutation(productId);

  const isLoading =
    detailQuery.isLoading ||
    productQuery.isLoading ||
    variationsQuery.isLoading ||
    suppliesQuery.isLoading;

  const isError =
    detailQuery.isError ||
    productQuery.isError ||
    variationsQuery.isError ||
    suppliesQuery.isError;

  const attached = mapProductVariations(productQuery.data);
  const catalog = variationsQuery.data ?? [];
  const variationStructure = buildVariationCompositionsForProduct(productId, {
    attached,
    catalog,
  });

  const detail = detailQuery.data;
  const productBasePriceReais =
    productQuery.data !== undefined
      ? productQuery.data.basePriceCents / 100
      : undefined;

  const initialValues: TechnicalSheetFormValues | undefined = detail
    ? (() => {
        const values = detailToFormValues(detail, variationStructure);
        if (productBasePriceReais === undefined) return values;
        return {
          ...values,
          cost: {
            ...values.cost,
            // Fonte de verdade: preço atual do produto (não cache da ficha).
            currentPrice: productBasePriceReais,
          },
        };
      })()
    : undefined;

  if (isLoading) {
    return <TechnicalSheetDetailSkeleton />;
  }

  if (isError) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <PageHeader sx={{ flexShrink: 0, mb: 0 }} title="Ficha técnica" />
        <ListLoadErrorAlert
          title="Não foi possível carregar a ficha técnica"
          onRetry={() => {
            void detailQuery.refetch();
            void productQuery.refetch();
            void variationsQuery.refetch();
            void suppliesQuery.refetch();
          }}
        />
      </Box>
    );
  }

  if (!detail || !initialValues) {
    return (
      <>
        <PageHeader sx={{ flexShrink: 0, mb: 0 }} title="Ficha técnica" />
        <Box
          sx={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
            bgcolor: "background.paper",
            p: 4,
          }}
        >
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
            <HelpOutlineOutlined sx={{ fontSize: 48, color: "text.secondary" }} />
            <Box component="h2" sx={{ typography: "h6", m: 0 }}>
              Ficha técnica não encontrada
            </Box>
            <Box
              component="p"
              sx={{ typography: "body2", color: "text.secondary", m: 0 }}
            >
              O produto informado não existe ou não pode ter ficha técnica.
            </Box>
            <BackButton
              href="/catalogo/fichas-tecnicas"
              label="Voltar para fichas técnicas"
            />
          </Stack>
        </Box>
      </>
    );
  }

  async function handleSave(values: TechnicalSheetFormValues) {
    const baselinePrice = initialValues!.cost.currentPrice;
    const applyBasePriceCents =
      Math.round(values.cost.currentPrice * 100) !==
      Math.round(baselinePrice * 100)
        ? Math.round(values.cost.currentPrice * 100)
        : undefined;
    await upsertMutation.mutateAsync({ values, applyBasePriceCents });
  }

  return (
    <TechnicalSheetFormView
      formKey={`${productId}-${detail.dto.hasSheet}-${attached.length}-${catalog.length}-${productQuery.data?.basePriceCents ?? 0}`}
      productName={detail.item.name}
      initialValues={initialValues ?? createEmptyTechnicalSheetFormValues()}
      componentOptions={suppliesQuery.data ?? []}
      onSave={handleSave}
      isSaving={upsertMutation.isPending}
    />
  );
}
