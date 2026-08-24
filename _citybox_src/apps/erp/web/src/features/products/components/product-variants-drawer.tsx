"use client";

import ArrowBack from "@mui/icons-material/ArrowBack";

import { useMemo, useState, type ReactNode } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, Drawer, Tab, Tabs } from "@citybox/mui";
import { ProductVariationGridConfig } from "@/features/products/components/product-variation-grid-config";
import { ProductVariationOptionsBlock } from "@/features/products/components/product-variation-options-block";
import { VariationNameMultiSelect } from "@/features/products/components/variation-name-multi-select";
import {
  createAttachedVariation,
  type ProductAttachedVariation,
  type ProductVariationFormat,
} from "@/features/products/types/product-create";
import { VariationForm } from "@/features/variations/components/variation-form";
import { VariationOptionForm } from "@/features/variations/components/variation-option-form";
import { createEmptyVariationFormValues } from "@/features/variations/api/variations.service";
import { useAllVariationsQuery } from "@/features/variations/hooks/use-variation-queries";
import {
  useAddOptionToVariationMutation,
  useCreateVariationMutation,
} from "@/features/variations/hooks/use-variation-mutations";
import type {
  Variation,
  VariationFormValues,
  VariationOption,
} from "@/features/variations/types/variation";

const CREATE_VARIATION_FORM_ID = "product-create-variation-form";
const CREATE_OPTION_FORM_ID = "product-create-option-form";

type DrawerStep = "selection" | "create-variation" | "create-option";
type SelectionTab = "selection" | "grid-config";

type ProductVariantsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: ProductVariationFormat;
  initialProductVariations: ProductAttachedVariation[];
  onSave: (productVariations: ProductAttachedVariation[]) => void;
};

function formatTitle(format: ProductVariationFormat): string {
  return format === "grid"
    ? "Variação em grade"
    : "Variação de valor composto";
}

function syncAttachedFromSelection(
  selectedVariationIds: string[],
  previous: ProductAttachedVariation[],
  catalog: Variation[],
): ProductAttachedVariation[] {
  return selectedVariationIds.map((variationId) => {
    const existing = previous.find((item) => item.variationId === variationId);
    if (existing) return existing;
    const variation = catalog.find((item) => item.id === variationId);
    return createAttachedVariation(variationId, [], {
      minChoices: variation?.calculation.chooseFrom ?? 1,
      maxChoices: variation?.calculation.chooseTo ?? 1,
    });
  });
}

export function ProductVariantsDrawer({
  open,
  onOpenChange,
  format,
  initialProductVariations,
  onSave,
}: ProductVariantsDrawerProps) {
  if (!open) return null;
  return (
    <ProductVariantsDrawerSession
      format={format}
      initialProductVariations={initialProductVariations}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  );
}

type SessionProps = {
  format: ProductVariationFormat;
  initialProductVariations: ProductAttachedVariation[];
  onOpenChange: (open: boolean) => void;
  onSave: (productVariations: ProductAttachedVariation[]) => void;
};

function ProductVariantsDrawerSession({
  format,
  initialProductVariations,
  onOpenChange,
  onSave,
}: SessionProps) {
  const [productVariations, setProductVariations] = useState(
    () => initialProductVariations,
  );
  const [selectedVariationIds, setSelectedVariationIds] = useState(() =>
    initialProductVariations.map((item) => item.variationId),
  );
  const [requestedStep, setRequestedStep] = useState<DrawerStep>("selection");
  const [selectionTab, setSelectionTab] =
    useState<SelectionTab>("selection");
  const [optionTargetVariationId, setOptionTargetVariationId] = useState<
    string | null
  >(null);

  const variationsQuery = useAllVariationsQuery();
  const createVariationMutation = useCreateVariationMutation();
  const addOptionMutation = useAddOptionToVariationMutation();

  const catalog = useMemo(
    () => variationsQuery.data ?? [],
    [variationsQuery.data],
  );
  const selectedVariations = catalog.filter((item) =>
    selectedVariationIds.includes(item.id),
  );
  const optionTarget =
    catalog.find((item) => item.id === optionTargetVariationId) ?? null;
  const activeStep: DrawerStep =
    requestedStep === "create-option" && !optionTarget
      ? "selection"
      : requestedStep;

  const handleSelectedIdsChange = (ids: string[]) => {
    setSelectedVariationIds(ids);
    setProductVariations((previous) =>
      syncAttachedFromSelection(ids, previous, catalog),
    );
  };

  const handleCreateVariation = async (values: VariationFormValues) => {
    const created = await createVariationMutation.mutateAsync(values);
    const nextIds = [...selectedVariationIds, created.id];
    setSelectedVariationIds(nextIds);
    setProductVariations((previous) =>
      syncAttachedFromSelection(nextIds, previous, [...catalog, created]),
    );
    setRequestedStep("selection");
  };

  const handleCreateOption = async (option: VariationOption) => {
    if (!optionTarget) return;
    await addOptionMutation.mutateAsync({
      variationId: optionTarget.id,
      option,
    });
    setRequestedStep("selection");
    setOptionTargetVariationId(null);
  };

  const handleConfirm = () => {
    onSave(productVariations);
    onOpenChange(false);
  };

  const footer = buildFooter({
    activeStep,
    selectionTab,
    createPending: createVariationMutation.isPending,
    optionPending: addOptionMutation.isPending,
    onBackToSelection: () => {
      setRequestedStep("selection");
      setOptionTargetVariationId(null);
    },
    onCancel: () => onOpenChange(false),
    onConfirm: handleConfirm,
  });

  return (
    <Drawer
      open
      onClose={() => onOpenChange(false)}
      title={formatTitle(format)}
      width={576}
      footer={footer}
    >
      {activeStep === "selection" ? (
        <Stack spacing={1.5}>
          <Tabs
            value={selectionTab}
            onChange={(_, value) => setSelectionTab(value as SelectionTab)}
            variant="scrollable"
            aria-label="Abas de variação do produto"
            sx={{
              minHeight: 40,
              mt: -0.5,
              "& .MuiTab-root": {
                minHeight: 40,
                py: 1,
                px: 1.5,
                textTransform: "none",
              },
            }}
          >
            <Tab value="selection" label="Seleção" />
            <Tab value="grid-config" label="Configuração da grade" />
          </Tabs>

          {selectionTab === "selection" ? (
            <Stack spacing={1.5}>
              <VariationNameMultiSelect
                variations={catalog}
                selectedIds={selectedVariationIds}
                onChange={handleSelectedIdsChange}
                onCreateNew={() => {
                  setRequestedStep("create-variation");
                }}
              />
              {selectedVariations.map((variation) => {
                const attached =
                  productVariations.find(
                    (item) => item.variationId === variation.id,
                  ) ?? createAttachedVariation(variation.id, []);
                return (
                  <ProductVariationOptionsBlock
                    key={variation.id}
                    variationName={variation.name}
                    options={variation.options ?? []}
                    selectedOptionIds={attached.optionIds}
                    onChange={(optionIds) => {
                      setProductVariations((previous) => {
                        const exists = previous.some(
                          (item) => item.variationId === variation.id,
                        );
                        if (!exists) {
                          return [...previous, { ...attached, optionIds }];
                        }
                        return previous.map((item) =>
                          item.variationId === variation.id
                            ? { ...item, optionIds }
                            : item,
                        );
                      });
                    }}
                    onCreateOption={() => {
                      setOptionTargetVariationId(variation.id);
                      setRequestedStep("create-option");
                    }}
                  />
                );
              })}
            </Stack>
          ) : (
            <ProductVariationGridConfig
              attached={productVariations}
              catalog={selectedVariations}
              onChange={setProductVariations}
            />
          )}
        </Stack>
      ) : null}

      {activeStep === "create-variation" ? (
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Cadastre a variação no catálogo e vincule ao produto.
          </Typography>
          <VariationForm
            formId={CREATE_VARIATION_FORM_ID}
            initialValues={createEmptyVariationFormValues()}
            onSubmit={handleCreateVariation}
          />
        </Stack>
      ) : null}

      {activeStep === "create-option" && optionTarget ? (
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Nova opção para {optionTarget.name}.
          </Typography>
          <VariationOptionForm
            formId={CREATE_OPTION_FORM_ID}
            onSubmit={handleCreateOption}
          />
        </Stack>
      ) : null}
    </Drawer>
  );
}

function buildFooter(args: {
  activeStep: DrawerStep;
  selectionTab: SelectionTab;
  createPending: boolean;
  optionPending: boolean;
  onBackToSelection: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}): ReactNode {
  const {
    activeStep,
    selectionTab,
    createPending,
    optionPending,
    onBackToSelection,
    onCancel,
    onConfirm,
  } = args;

  if (activeStep === "create-variation") {
    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: "space-between" }}
      >
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={onBackToSelection}
        >
          Voltar
        </Button>
        <Button
          type="submit"
          form={CREATE_VARIATION_FORM_ID}
          variant="contained"
          disabled={createPending}
        >
          {createPending ? "Salvando..." : "Salvar variação"}
        </Button>
      </Stack>
    );
  }

  if (activeStep === "create-option") {
    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: "space-between" }}
      >
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={onBackToSelection}
        >
          Voltar
        </Button>
        <Button
          type="submit"
          form={CREATE_OPTION_FORM_ID}
          variant="contained"
          disabled={optionPending}
        >
          {optionPending ? "Salvando..." : "Salvar opção"}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
      <Button variant="outlined" onClick={onCancel}>
        Cancelar
      </Button>
      <Button variant="contained" onClick={onConfirm}>
        {selectionTab === "grid-config"
          ? "Salvar configuração"
          : "Salvar seleção"}
      </Button>
    </Stack>
  );
}
