"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@citybox/mui";
import { ProductVariantsDrawer } from "@/features/products/components/product-variants-drawer";
import type {
  ProductAttachedVariation,
  ProductVariationFormat,
} from "@/features/products/types/product-create";
import {
  productFormSectionBoxSx,
  productFormSectionGridSx,
  productFormSectionHeaderSx,
} from "@/features/products/lib/product-form-section-styles";
import { useAllVariationsQuery } from "@/features/variations/hooks/use-variation-queries";

type ProductVariantsSectionProps = {
  variationFormat: ProductVariationFormat | null;
  productVariations: ProductAttachedVariation[];
  onChange: (next: {
    variationFormat: ProductVariationFormat;
    productVariations: ProductAttachedVariation[];
  }) => void;
};

const FORMAT_ITEMS: Array<{
  format: ProductVariationFormat;
  title: string;
  description: string;
}> = [
  {
    format: "grid",
    title: "Variação em grade",
    description:
      "Ideal para varejo: combine atributos como tamanho, cor e modelo com estoque estruturado por combinação.",
  },
  {
    format: "composite",
    title: "Variação de valor composto",
    description:
      "Ideal para food: preço a partir das opções escolhidas pelo cliente (ex.: pizza meia a meia).",
  },
];

export function ProductVariantsSection({
  variationFormat,
  productVariations,
  onChange,
}: ProductVariantsSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerFormat, setDrawerFormat] =
    useState<ProductVariationFormat>("grid");
  const catalogQuery = useAllVariationsQuery();

  const catalogById = useMemo(() => {
    const map = new Map(
      (catalogQuery.data ?? []).map((item) => [item.id, item] as const),
    );
    return map;
  }, [catalogQuery.data]);

  const attachedSummary = useMemo(() => {
    return productVariations.map((attached) => {
      const catalog = catalogById.get(attached.variationId);
      const optionNames = attached.optionIds.map((optionId) => {
        const option = catalog?.options.find((item) => item.id === optionId);
        return option?.name ?? optionId.slice(0, 8);
      });
      return {
        variationId: attached.variationId,
        name: catalog?.name ?? "Variação",
        optionNames,
        minChoices: attached.minChoices,
        maxChoices: attached.maxChoices,
      };
    });
  }, [productVariations, catalogById]);

  function openDrawer(format: ProductVariationFormat) {
    setDrawerFormat(format);
    setDrawerOpen(true);
  }

  function handleSave(nextVariations: ProductAttachedVariation[]) {
    onChange({
      variationFormat: drawerFormat,
      productVariations: nextVariations,
    });
  }

  const selectedCount = productVariations.length;
  const formatLabel =
    variationFormat === "grid"
      ? "grade"
      : variationFormat === "composite"
        ? "valor composto"
        : null;

  return (
    <>
      <Box component="section" sx={productFormSectionGridSx}>
        <Box component="header" sx={productFormSectionHeaderSx}>
          <Typography component="h2" variant="subtitle1" sx={{
            fontWeight: 600
          }}>
            Variações
          </Typography>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Configure e gerencie as variações deste produto para personalização
            ou controle de estoque. Um produto usa um único formato (grade ou
            valor composto) — não os dois ao mesmo tempo.
          </Typography>
        </Box>

        <Box sx={{ ...productFormSectionBoxSx, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Selecione o formato de variação que deseja utilizar para este
            produto.
            {formatLabel && selectedCount > 0 ? (
              <>
                {" "}
                Atual: {selectedCount} variação(ões) em formato {formatLabel}.
              </>
            ) : null}
          </Typography>

          <Stack spacing={1.5}>
            {FORMAT_ITEMS.map((item) => {
              const isActive = variationFormat === item.format && selectedCount > 0;
              return (
                <Box
                  key={item.format}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    width: "100%",
                    borderRadius: 1,
                    border: 1,
                    borderColor: isActive ? "primary.main" : "divider",
                    bgcolor: isActive ? "action.selected" : "background.default",
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{
                      fontWeight: 500
                    }}>
                      {item.title}
                      {isActive ? " · em uso" : ""}
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: "text.secondary"
                    }}>
                      {item.description}
                    </Typography>
                  </Box>
                  <Button
                    type="button"
                    variant={isActive ? "contained" : "outlined"}
                    onClick={() => openDrawer(item.format)}
                    sx={{ flexShrink: 0 }}
                  >
                    {isActive
                      ? "Gerenciar"
                      : selectedCount > 0
                        ? "Trocar para este"
                        : "Adicionar"}
                  </Button>
                </Box>
              );
            })}
          </Stack>

          {selectedCount > 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                px: 2,
                py: 1.5,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Variações anexadas
              </Typography>
              <Stack spacing={1.25}>
                {attachedSummary.map((item) => (
                  <Box key={item.variationId} sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.name}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ color: "text.secondary", ml: 1 }}
                      >
                        escolha {item.minChoices}–{item.maxChoices}
                      </Typography>
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                        mt: 0.75,
                      }}
                    >
                      {item.optionNames.length > 0 ? (
                        item.optionNames.map((name) => (
                          <Chip
                            key={`${item.variationId}-${name}`}
                            label={name}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Nenhuma opção marcada
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Box>
      </Box>
      <ProductVariantsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        format={drawerFormat}
        initialProductVariations={productVariations}
        onSave={handleSave}
      />
    </>
  );
}
