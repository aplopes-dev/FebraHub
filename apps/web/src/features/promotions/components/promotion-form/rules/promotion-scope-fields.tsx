"use client";

import { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Checkbox,
  MultiSelect,
  type MultiSelectOption,
} from "@/ui";
import {
  InfoTooltip,
  PromotionSection,
} from "@/features/promotions/components/promotion-form/promotion-form-primitives";
import {
  useCatalogProductsQuery,
  useProductCategoriesQuery,
} from "@/features/products/hooks/use-product-queries";

const CONSIDER_VARIATIONS_INFO =
  "Quando ativo, os preços e a contagem consideram cada variação do produto (tamanho, cor…) individualmente.";

export function useProductOptions(): MultiSelectOption[] {
  const productsQuery = useCatalogProductsQuery();
  return useMemo(
    () =>
      (productsQuery.data ?? []).map((product) => ({
        value: product.id,
        label: product.name,
      })),
    [productsQuery.data],
  );
}

export function useCategoryOptions(): MultiSelectOption[] {
  const categoriesQuery = useProductCategoriesQuery();
  return useMemo(
    () =>
      (categoriesQuery.data ?? []).map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categoriesQuery.data],
  );
}

export function ProductsMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const options = useProductOptions();
  return (
    <MultiSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Selecionar produtos"
    />
  );
}

export function CategoriesMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const options = useCategoryOptions();
  return (
    <MultiSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Selecionar categorias"
    />
  );
}

/** Sessão "Configuração dos produtos" — quais itens ativam a promoção. */
export function PromotionProductsSection({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <PromotionSection
      title="Configuração dos produtos"
      description="Define quais itens precisam estar no carrinho para ativar a promoção."
    >
      <ProductsMultiSelect value={value} onChange={onChange} />
    </PromotionSection>
  );
}

/** Sessão "Configuração das categorias" — categorias elegíveis. */
export function PromotionCategoriesSection({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <PromotionSection
      title="Configuração das categorias"
      description="Define quais categorias de produto estão elegíveis para ativar a promoção."
    >
      <CategoriesMultiSelect value={value} onChange={onChange} />
    </PromotionSection>
  );
}

export function ConsiderVariationsCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      component="label"
      htmlFor="promotion-consider-variations"
      sx={{ alignItems: "center", cursor: "pointer" }}
    >
      <Checkbox
        id="promotion-consider-variations"
        checked={checked}
        onChange={(_, next) => onChange(next)}
      />
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        Considerar os valores das variações
      </Typography>
      <InfoTooltip text={CONSIDER_VARIATIONS_INFO} />
    </Stack>
  );
}
